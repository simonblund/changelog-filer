# Version filer

The ever looming nut cracker has been solved, and the solution is here to benefit everyone.

Allright. You have a github repo, you want the version to be automatically bumped. But the new version needs to be persisted in a file in the repository, the issue is your organization uses branch protection rules and reviewed PRs to merge with main.

You and your team have been fighting this issue for years on end. Prehooks? Github allows apps to pass branch protection rules?
- No, the solution is so simple you will reconsider your career when you see it.

Simply do the file committing on the PR, and have another action create a release (git tag) on merge with main.

- But PRs get outdated?
- Yes they do, but doesn't your organization require PRs to be up to date with main before merging? They do, and github automatically brings PR-branches up to date with the base branch before merging.

- Have this action rerun on all commits to the PR and you should be golden. I hope.

Enjoy!