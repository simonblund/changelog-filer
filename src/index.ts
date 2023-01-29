import * as core from '@actions/core'

import * as github from '@actions/github'
import * as fs from 'node:fs/promises';
import { PullRequestEvent, IssueCommentEvent } from '@octokit/webhooks-types'
import { Context } from '@actions/github/lib/context';
import { Octokit } from '@octokit/core';
import { PaginateInterface } from '@octokit/plugin-paginate-rest/dist-types/types';
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';

async function run(): Promise<void> {
    try {
        const token = core.getInput('token');
        const write: string = core.getInput('write')
        const filename: string = core.getInput('filename')
        const filelocation: string = core.getInput('filelocation')
        const previousVersion: string = core.getInput('previous_version')

        const createdAt: string = new Date().toISOString()

        const octokit: Octokit & Api & {
            paginate: PaginateInterface;
        } = github.getOctokit(token)

        core.info("VERSION 2")
        core.info(`Writing changelog to file ${filelocation}${filename}`)

        let comment: string
        let pr_number: number

        core.info(JSON.stringify(github.context.payload))

        switch (github.context.eventName) {
            case 'pull_request':
                const eventPayloadPr = github.context.payload as PullRequestEvent
                comment = await handlePullRequestEvent(octokit, eventPayloadPr)
                pr_number = eventPayloadPr.pull_request.number
                break

            case 'issue_comment':
                const eventPayloadIssueComment = github.context.payload as IssueCommentEvent
                comment = handleIssueCommentEvent(octokit, eventPayloadIssueComment)
                pr_number = eventPayloadIssueComment.issue.number
                break

            default:
                throw Error(`event_name: ${github.context.eventName} isn't handled`)

        }

        let changelog = handleChangelogComment(comment)
        changelog.created_at = createdAt
        changelog.pr_number = pr_number

        if (!changelog.versionType) {
            throw Error("Not able to determine versiontype")
        }
        changelog.version = calculateVersion(changelog.versionType, previousVersion)

        const changelogMD = createMDstring(changelog)

        updateChangelogFile(filename, filelocation, changelog, changelogMD)

        core.setOutput('new_version', changelog.version)
        core.setOutput('version_type', changelog.versionType)
        core.setOutput('json_changelog', JSON.stringify(changelog))
        core.setOutput('md_changelog', changelogMD)
        core.setOutput('time', new Date().toTimeString())
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

function handleIssueCommentEvent(octokit: Octokit & Api & {
    paginate: PaginateInterface;
}, event: IssueCommentEvent) {

    const comment = event.comment.body

    if (!comment.includes("Changelog - changelog-power")) {
        throw Error(`comment did not include changelog: ${comment}`)
    }

    core.info(JSON.stringify(comment))

    return comment
}

async function handlePullRequestEvent(octokit: Octokit & Api & {
    paginate: PaginateInterface;
}, event: PullRequestEvent) {
    const prComments = await getPrComments(octokit, event)
    core.info(JSON.stringify(prComments))

    if (prComments == undefined || prComments.length <= 0) {
        throw Error("No pr comments found")
    }

    const changelogComment = findChangelogComment(prComments)

    if (changelogComment === undefined) {
        throw Error("No changelog comment found in PR comments")
    }
    core.info(JSON.stringify(changelogComment))

    return changelogComment

}

function findChangelogComment(comments: (string | undefined)[]) {
    return comments.filter(comment => {
        return comment !== undefined && comment.includes("Changelog - changelog-power")
    }).at(0)

}

async function getPrComments(octokit: Octokit & Api & {
    paginate: PaginateInterface;
}, event: PullRequestEvent) {

    const issueComments = await octokit.rest.issues.listComments({
        ...github.context.repo,
        issue_number: event.pull_request.number
    })
    core.info(JSON.stringify(issueComments))

    return issueComments.data.map(comment => {
        core.info(JSON.stringify(comment))
        return comment.body_text
    })

}
export interface ChangeLog {
    version?: string,
    versionType?: string,
    pr_number?: number,
    created_at?: string,
    added?: string[],
    changed?: string[],
    deprecated?: string[],
    removed?: string[],
    fixed?: string[],
    security?: string[],
}

export function calculateVersion(versionType: string, previousVersion: string) {
    const trimmedPV = previousVersion.trim().replace("v", "").split(".")

    if (trimmedPV.length !== 3) {
        throw Error("Previous version is not semver " + previousVersion)
    }
    switch (versionType) {
        case "major":
            const newMajor = Number(trimmedPV[0]) + 1
            return `${newMajor}.0.0`
        case "minor":
            const newMinor = Number(trimmedPV[1]) + 1
            return `${trimmedPV[0]}.${newMinor}.0`
        case "patch":
            const newPatch = Number(trimmedPV[2]) + 1
            return `${trimmedPV[0]}.${trimmedPV[1]}.${newPatch}`
    }
}

export function handleChangelogComment(comment: string) {
    return getChangelogValues(splitCommentToParts(comment))
}
export function splitCommentToParts(comment: string) {
    return comment.split("####").slice(1)
}
export function getChangelogValues(parts: string[]) {

    //console.log(parts)
    let changelog: ChangeLog = {}
    changelog.versionType = getVersionType(parts)
    changelog.added = getChangelogPartLines(parts, "Added")
    changelog.changed = getChangelogPartLines(parts, "Changed")
    changelog.deprecated = getChangelogPartLines(parts, "Deprecated")
    changelog.removed = getChangelogPartLines(parts, "Removed")
    changelog.fixed = getChangelogPartLines(parts, "Fixed")
    changelog.security = getChangelogPartLines(parts, "Security")

    return changelog
}

export function getChangelogPartLines(parts: string[], heading: string) {
    const selected = parts.find(p => {
        return p.trimStart().startsWith(heading)
    })
    return selected?.split("-").slice(1).map(row => row.trim())

}

export function getVersionType(parts: string[]) {
    const versionPart = parts[0]
    const alternatives = versionPart.split("-").slice(1)
    const selected = alternatives.filter(a => {
        return a.includes("*")
    }).at(0)
    const regex = /\*/ig
    const result = selected?.toLowerCase().replace(regex, "").trim()

    const semverOptions = ["patch", "minor", "major"]
    if (result == undefined || !semverOptions.includes(result)) {
        core.warning("Could not read semver from " + alternatives)
        return "patch"
    }
    return result
}

export function createMDstring(changelog: ChangeLog) {
    const title = `## [${changelog.version}] - ${changelog.created_at} - PRnumber:${changelog.pr_number} \r\n\r\n`

    const changeParts = ["added", "changed", "deprecated", "removed", "fixed", "security"]
    const parts = Object.entries(changelog)
        .filter(([key, value]) => changeParts.includes(key))
        .filter(([key, value]) => value.length > 0)
        .map(([key, value]) => {
            const values = value.map((line: any) => {
                return `- ${line}`.trim()
            }).join("\r\n")

            return `### ${key} \r\n\r\n${values}`
        }).join("\n\r\n\r")

    return title + parts
}

async function writeFile(filename: string, filelocation: string, comment: string, value: string): Promise<void> {
    const file: string = filelocation + filename
    const content: string = comment + "\n" + value
    return fs.writeFile(file, content)
}

export async function updateChangelogFile(filename: string, filelocation: string, changelog:ChangeLog, changelogMD:string){
    const file: string = filelocation + filename
    const fileData = fs.readFile(file, { encoding: "utf8" });
}

run()