import { getChangelogValues, calculateVersion, getVersionType, ChangeLog, createMDstring } from "..";
import { describe, expect, test } from '@jest/globals';


const messagebody = "### Changelog - changelog-power\r\nYou can edit this comment up until the time of merging the PR.\r\nAdd things as (-) lists. And do not use any additional markup.\r\n\r\n#### Version type bold (double asterisk) the one you are doing)\r\n- Major\r\n- Minor\r\n- **Patch**\r\n\r\n#### Collaborators\r\n\r\n#### Added (for new features).\r\n- fixed somethings\r\n#### Changed (for changes in existing functionality).\r\n    \r\n#### Deprecated (for soon to be removed features).\r\n    \r\n#### Removed (for now removed features).\r\n    \r\n#### Fixed (for any bug fixes).\r\n\r\n#### Security (in case of vulnerabilities).\r\n"
const changelogparts = [
    ' Version type bold (double asterisk) the one you are doing)\r\n' +
    '- Major\r\n' +
    '- Minor\r\n' +
    '- **Patch**\r\n' +
    '\r\n',
    ' Collaborators\r\n\r\n',
    ' Added (for new features).\r\n- fixed somethings\r\n',
    ' Changed (for changes in existing functionality).\r\n    \r\n',
    ' Deprecated (for soon to be removed features).\r\n    \r\n',
    ' Removed (for now removed features).\r\n    \r\n',
    ' Fixed (for any bug fixes).\r\n\r\n',
    ' Security (in case of vulnerabilities).\r\n'
]

describe('getChangelogPartLines', () => {
    test('when added says', () => {
        expect(getChangelogValues(changelogparts).added).toContain("fixed somethings")
    })
    test('when fixed says', () => {
        const bb = changelogChange(changelogparts, "Fixed", ["cheese makes hees"])
        expect(getChangelogValues(changelogparts).added).toContain("fixed somethings")
        expect(getChangelogValues(bb).fixed).toContain("cheese makes hees")
    })
})
describe('getVersionType', () => {
    test('when versiontype is patch should return patch', () => {
        expect(getVersionType(changelogparts)).toBe("patch")
    })

    test('when versiontype is major should return major', () => {
        const body = versionChange(changelogparts, "Major", "Patch")
        
        expect(getVersionType(body)).toBe("major")
    })
    test('when versiontype is minor should return minor', () => {
        const body = versionChange(changelogparts, "Minor", "Patch")

        expect(getVersionType(body)).toBe("minor")
    })

    test('when versiontype is unset should return patch', () => {
        expect(getVersionType(changelogparts)).toBe("patch")
    })

})

describe('calculateVersion', () => {
    test('when versiontype is patch should update patch', () => {
        expect(calculateVersion("patch", "v1.2.3")).toBe("1.2.4")
    })
    test('when versiontype is minor should update minor patch 0', () => {
        expect(calculateVersion("minor", "v1.2.3")).toBe("1.3.0")
    })
    test('when versiontype is major should update major minor and patch 0', () => {
        expect(calculateVersion("major", "v1.2.3")).toBe("2.0.0")
    })

})

const examplechangelogobject: ChangeLog= {
    version: "1.2.3",
    created_at: "12.12.2012",
    pr_number: 123,
    versionType: 'patch',
    added: [ 'fixed somethings', "Fixed other things, and so on..." ],
    changed: ['changed something too'],
    deprecated: [],
    removed: [],
    fixed: [],
    security: []
  }
// describe('createMDstring', () => {
//     test('when versiontype is patch should update patch', () => {
//         expect(createMDstring(examplechangelogobject)).toBe("## [1.2.3] - 12.12.2012 - PRnumber:123 \r\n\r\n### added \r\n \r\n- fixed somethings\r\n- Fixed other things, and so on...\r\n\r\n### changed\r\n- changed something too")
//     })

// })

// test('when versiontype is unset should return patch', () => {
//     const body = changelogChange(changelogparts, "Added", ["this", "that is a good idea"])
//     expect(body).toBe("- Version type bold (double asterisk) the one you are doing) - **Major** - Minor- Patch")
// })

function versionChange(parts: string[], to:string, from:string) {
    let body:string[] = JSON.parse(JSON.stringify(parts)); // adh the age old deepcopy issue
    body[0] = body[0].split("-").map(p => {
        const pTrimmed = p.trim()
        if (pTrimmed.includes(from)) {
            return `- ${from}`
        }
        if (pTrimmed.includes(to)) {
            return `- **${to}**`
        }
        return `- ${pTrimmed}`
    }).join("\r\n")

    return body
}

function changelogChange(parts: string[], heading:string, insertions:string[]) {
    let body:string[] = JSON.parse(JSON.stringify(parts)); // adh the age old deepcopy issue
    const newLines = insertions.map(i => {
        return `- ${i}`
    }).join("\r\n")
    const result = body.map(p =>{
        if(p.trimStart().startsWith(heading)){
            p = p + newLines
        }
        return p
    })


    return result
}


