import * as core from '@actions/core'
import * as fs from 'node:fs/promises';

async function run(): Promise<void> {
    try {
        const prcomment: string = core.getInput('prcomment')
        const write: string = core.getInput('write')
        const filename: string = core.getInput('filename')
        const filelocation: string = core.getInput('filelocation')

        const createdAt: string = new Date().toISOString()
        
        core.info(`Writing changelog to file ${filelocation}${filename}`)
        core.info(prcomment)

        
        
        core.setOutput('version_type','')
        core.setOutput('json_changelog','')
        core.setOutput('md_changelog','')
        

        core.setOutput('time', new Date().toTimeString())
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

async function writeFile(filename:string, filelocation:string, comment:string, value:string): Promise<void>{
    const file:string = filelocation+filename
    const content:string = comment + "\n" + value
    return fs.writeFile(file, content)
}

run()