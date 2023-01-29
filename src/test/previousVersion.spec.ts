import { describe, expect, test } from '@jest/globals';
import { evaluateSemver, findLatestTag, Tag } from '../previousVersion';

const exampleTags:Tag[] = [
    {
        name: "v1.2.3",
        commit: {
            sha: "ssdfsdf",
            url: "https://no.op" 
        },
        zipball_url:"",
        tarball_url:"",
        node_id:""
    },
    {
        name: "v1.2.2",
        commit: {
            sha: "ssdfsdf",
            url: "https://no.op" 
        },
        zipball_url:"",
        tarball_url:"",
        node_id:""
    },
    {
        name: "v2.2.3",
        commit: {
            sha: "ssdfsdf",
            url: "https://no.op" 
        },
        zipball_url:"",
        tarball_url:"",
        node_id:""
    },
    {
        name: "1.2.3",
        commit: {
            sha: "ssdfsdf",
            url: "https://no.op" 
        },
        zipball_url:"",
        tarball_url:"",
        node_id:""
    }
]

describe('findLatestTag', () => {
    test('when added says', () => {
        expect(findLatestTag(exampleTags, "v")).toBe("v2.2.3")
    })
    
})

describe('evaluateSemver', () => {
    test('return the biggest', () => {
        expect(evaluateSemver("v1.2.1", "v1.2.3", "v")).toBe("v1.2.3")
        expect(evaluateSemver("v1.3.1", "v1.2.3", "v")).toBe("v1.3.1")
        expect(evaluateSemver("v19.2.1", "v0.2.3", "v")).toBe("v19.2.1")
        expect(evaluateSemver("v0.0.1", "v0.0.1", "v")).toBe("v0.0.1")
    })
    
})