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
}) {
    const tags = await listTagsInRepo(octokit)
    core.info(JSON.stringify(tags))
    return tags.at(0)?.name
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
function findLatestTag(tags:Tag[], tagPrefix:string){
    const prefixRegex = new RegExp(`^${tagPrefix}`);
    return tags.find(tag=>{
        tag.name.match(prefixRegex)
        tag.commit.sha=="HEAD"
    })
}
