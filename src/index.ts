import * as core from '@actions/core'

import * as github from '@actions/github'
import * as fs from 'node:fs/promises';
import {PullRequestEvent, IssueCommentEvent} from '@octokit/webhooks-types'
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

        const createdAt: string = new Date().toISOString()

        const octokit:Octokit & Api & {
            paginate: PaginateInterface;
        } = github.getOctokit(token)
        
        core.info(`Writing changelog to file ${filelocation}${filename}`)

        let comment:string

        switch(github.context.eventName){
            case 'pull_request':
                    const eventPayloadPr = github.context.payload as PullRequestEvent
                    comment = await handlePullRequestEvent(octokit, eventPayloadPr)
                    break
            
                case 'issue_comment':
                    const eventPayloadIssueComment = github.context.payload as IssueCommentEvent
                    comment = handleIssueCommentEvent(octokit, eventPayloadIssueComment)
                    break

                default:
                    throw Error(`event_name: ${github.context.eventName} isn't handled`)

        }
        
        

        
        core.setOutput('version_type','')
        core.setOutput('json_changelog','')
        core.setOutput('md_changelog','')
        

        core.setOutput('time', new Date().toTimeString())
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

function handleIssueCommentEvent(octokit:Octokit & Api & {
    paginate: PaginateInterface;
}, event:IssueCommentEvent){

    const comment = event.comment.body

    if(!comment.includes("Changelog - changelog-power")){
        throw Error(`comment did not include changelog: ${comment}`)
    }
    
    core.info(JSON.stringify(comment))

    return comment

}

async function handlePullRequestEvent(octokit:Octokit & Api & {
    paginate: PaginateInterface;
}, event:PullRequestEvent){
    const prComments = await getPrComments(octokit, event)
    core.info(JSON.stringify(prComments))
    
    if(prComments == undefined || prComments.length <= 0){
        throw Error("No pr comments found")
    }

    const changelogComment = findChangelogComment(prComments)

    if(changelogComment === undefined){
        throw Error("No changelog comment found in PR comments")
    }
    core.info(JSON.stringify(changelogComment))

    return changelogComment

}

function findChangelogComment(comments:(string|undefined)[]){
    return comments.filter(comment => {
        return comment !== undefined && comment.includes("Changelog - changelog-power")
    }).at(0)

}

async function getPrComments(octokit:Octokit & Api & {
    paginate: PaginateInterface;
}, event:PullRequestEvent){
    
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

async function writeFile(filename:string, filelocation:string, comment:string, value:string): Promise<void>{
    const file:string = filelocation+filename
    const content:string = comment + "\n" + value
    return fs.writeFile(file, content)
}

run()