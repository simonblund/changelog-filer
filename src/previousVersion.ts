import { Octokit } from '@octokit/core';
import { PaginateInterface } from '@octokit/plugin-paginate-rest/dist-types/types';
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import * as github from '@actions/github'
import * as core from '@actions/core'


export type Tag = {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    zipball_url: string;
    tarball_url: string;
    node_id: string;
};
export async function getPreviousVersion(octokit: Octokit & Api & {
    paginate: PaginateInterface;
}, tagPrefix:string) {
    const tags = await listTagsInRepo(octokit)
    core.info(JSON.stringify(tags))
    return findLatestTag(tags, tagPrefix)
}

/*
A special thanks to Github user mathieudutour for the following part.
*/
async function listTagsInRepo(
    octokit: Octokit & Api & { paginate: PaginateInterface },
    fetchAllTags: boolean = false,
    fetchedTags: Tag[] = [],
    page = 1
): Promise<Tag[]> {
    octokit.rest.repos.listTags
    const tags = await octokit.rest.repos.listTags({
        ...github.context.repo,
        per_page: 100,
        page,
    });

    if (tags.data.length < 100 || fetchAllTags === false) {
        return [...fetchedTags, ...tags.data];
    }

    return listTagsInRepo(octokit, fetchAllTags, [...fetchedTags, ...tags.data], page + 1);
}
export function findLatestTag(tags: Tag[], tagPrefix: string) {
    const prefixRegex = new RegExp(`^${tagPrefix}`);
    const compatibleTags = tags.filter(tag => {
        return tag.name.match(prefixRegex)
    }).reduce((prev, curr) => {
        return evaluateSemver(prev, curr.name, tagPrefix)
    }, "")
    return compatibleTags

}

export function evaluateSemver(first: string, second: string, tagPrefix: string = "") {
    const firstArr = first.replace(tagPrefix, "").split(".").map(n => Number(n))
    const secondArr = second.replace(tagPrefix, "").split(".").map(n => Number(n))
    //major
    if (firstArr[0] > secondArr[0]) {
        return first
    }

    if (firstArr[0] < secondArr[0]) {
        return second
    }
    //minor
    if (firstArr[1] > secondArr[1]) {
        return first
    }

    if (firstArr[1] < secondArr[1]) {
        return second
    }
    //pathch
    if (firstArr[2] > secondArr[2]) {
        return first
    }

    if (firstArr[2] < secondArr[2]) {
        return second
    }
    return first

}
