import * as core from '@actions/core'
import * as fs from 'node:fs/promises';

async function run(): Promise<void> {
    try {
        const prepend: string = core.getInput('prepend')
        const value: string = core.getInput('value')
        const append: string = core.getInput('append')
        const filename: string = core.getInput('filename')
        const filelocation: string = core.getInput('filelocation')
        const one_line_comment_sign: string = core.getInput('one_line_comment_sign')

        const createdAt: string = new Date().toISOString()
        
        core.info(`Going to write ${prepend}${value}${append} to file ${filelocation}${filename}`)
        const comment: string = `${one_line_comment_sign} Written by version-filer, manual editing of this file might not cause desired effect. ${createdAt}`
        const valueString:string = `${prepend}${value}${append}`

        await writeFile(filename, filelocation, comment, valueString)

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