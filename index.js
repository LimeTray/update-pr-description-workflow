const github = require('@actions/github');
const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const prSampleFile = path.join(__dirname, "pr-sample.md")


const run = async () => {
  const githubToken = core.getInput('github_token', { required: true });
  let prTitle = core.getInput('pr_title');
  let prBody = core.getInput('pr_body');
  let baseBranch = core.getInput('destination_branch');
  let sourceBranch = github.context.ref.replace(/^refs\/heads\//, '');
  let prSampleText = fs.readFileSync(prSampleFile, { encoding: 'utf8', flag: 'r' });

  if (!prTitle || prTitle != '') {
    // If title not set then set default
    prTitle = `Pull request for ${sourceBranch}`
  }

  if (!baseBranch || baseBranch != '') {
    baseBranch = "master"
  }

  const credentials = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  };

  const octokit = github.getOctokit(githubToken);
  core.info(`Looking up a pull request with a source branch "${sourceBranch || '<not found>'}" and a base branch "${baseBranch || '<not specified>'}"`);

  const branchHead = `${credentials.owner}:${sourceBranch}`;
  const { data: pulls } = await octokit.rest.pulls.list({
    ...credentials,
    base: baseBranch,
    head: branchHead,
  });

  if (pulls.length === 0) {
    throw new Error(`No pull request found for a source branch "${sourceBranch || '<not found>'}" and a base branch "${baseBranch || '<not specified>'}"`);
  }

  const pullRequest = pulls.find((p) => p.state === 'open');
  if (pullRequest == null) {
    throw new Error(`No open pull requests found for a source branch "${sourceBranch || '<not found>'}" and a base branch "${baseBranch || '<not specified>'}"`);
  }

  const { number: pullNumber, base: { ref: pullRequestTargetBranch },title } = pullRequest;
  core.info(`Pull request #${pullNumber} has been found for  a source branch "${sourceBranch || '<not found>'}" and a base branch "${baseBranch || '<not specified>'}"`);

  if (title.startsWith(prTitle)) {
    core.info(`Pull request #${pullNumber}'s title already set to "${prTitle}" hence not updating`);
    return 'unchanged'
  }

  const params = {
    ...credentials,
    pull_number: pullNumber,
  };

  if (prTitle) {
    core.info(`Pull request #${pullNumber}'s title will be set to "${prTitle}"`);
    params.title = prTitle;
  }

  if (prBody && prBody != '') {
    core.info(`Pull request #${pullNumber}'s body will be set to "${prBody}"`);
    params.body = prBody;
  } else {
    core.info(`Pull request #${pullNumber}'s body will be set to using sample pr file`);
    params.body = prSampleText;
  }

  if (baseBranch && baseBranch !== pullRequestTargetBranch) {
    core.info(`Pull request #${pullNumber}'s base branch will be set to "${baseBranch}"`);
    params.title = prTitle;
  }

  const url = `/repos/${credentials.owner}/${credentials.repo}/pulls/${pullNumber}`;

  core.info(`Making a PATCH request to "${url}" with params "${JSON.stringify(params)}"`);
  await octokit.request(`PATCH ${url}`, params);
  return 'configured'
};

// Github boolean inputs are strings https://github.com/actions/runner/issues/1483
const failOnError = core.getInput('fail_on_error') == 'true';

run()
  .then((action) => {
    core.info('Done : ' + action);
  })
  .catch((e) => {
    core.error('Cannot update the pull request.');
    if (failOnError) {
      core.setFailed(e.stack || e.message);
    } else {
      core.error(e.stack || e.message);
    }
  });
