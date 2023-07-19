# Update Pull Request Description on Push

This github action updates the description (and/or title) of the PR by the given source and destination branches.

# Usage

```yaml
name: Creates and Updates PR
on:
  push:
    branches:
    - "*LIM-*"
jobs:
  pull-request:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3    
    - name: Open Pull Request
      continue-on-error: true
      id: open-pr
      env:
        GH_TOKEN: ${{ github.token }}
      run: |
        gh pr create  --title "Automated PR" --body "Automated Body" --base master --head head        
    - name: update-pull-request
      uses: LimeTray/update-pr-description-workflow@master
      with:
        destination_branch: master
        github_token: ${{ secrets.GITHUB_TOKEN }}

```

# Parameters

## Inputs

### `github_token`

The GITHUB_TOKEN secret. This is required.

### `pr_title`

The title of the PR. Optional.

### `pr_body`

The body of the PR

### `destination_branch`

Base branch of the PR. Default is master.

### `fail_on_error`

Option to mark the job as failed in case there are errors during the action execution. Default is 'true'.

## Outputs

This action has no outputs.

# LICENSE

Apache License, Version 2.0

[repo-sync/pull-request]: https://github.com/repo-sync/pull-request
