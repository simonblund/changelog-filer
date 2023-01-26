import * as core from '@actions/core'

import * as github from '@actions/github'
import * as fs from 'node:fs/promises';
import {PullRequestEvent} from '@octokit/webhooks-types'
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
        
        core.info(`Writing changelog to file ${filelocation}${filename}`)
        

        if (github.context.eventName !== 'pull_request') {
            throw Error("Not working on a pull request")
          }
        
        const eventPayload = github.context.payload as PullRequestEvent
        
        const octokit:Octokit & Api & {
            paginate: PaginateInterface;
        } = github.getOctokit(token)

        const prComments = await getPrComments(octokit, eventPayload)
        core.info(JSON.stringify(prComments))

        if(prComments == undefined || prComments.length <= 0){
            throw Error("No pr comments found")
        }

        const changelogComment = findChangelogComment(prComments)
        core.info(JSON.stringify(changelogComment))


        
        core.setOutput('version_type','')
        core.setOutput('json_changelog','')
        core.setOutput('md_changelog','')
        

        core.setOutput('time', new Date().toTimeString())
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

function findChangelogComment(comments:(string|undefined)[]){
    return comments.filter(comment => {
        return comment !== undefined && comment.includes("Changelog - changelog-power")
    })[0]
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