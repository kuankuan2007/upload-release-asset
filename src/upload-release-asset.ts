import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import fs from 'fs';
import path from 'path';

export default async function run() {
  const owner = core.getInput('owner', { required: true });
  const repo = core.getInput('repo', { required: true });
  const releaseId = core.getInput('release_id', { required: true });
  core.info(`owner: ${owner}, repo: ${repo}, releaseId: ${releaseId}`);
  core.info(`cwd: ${process.cwd()}`);
  const dirs = await fs.promises.readdir(process.cwd());
  core.info(`dirs: ${dirs.join(', ')}`);

  const files = core
    .getInput('files', { required: true })
    .split('\n')
    .filter(Boolean)
    .map((file) => path.resolve(process.cwd(), file.trim()));
  const contentType =
    core.getInput('content_type', { required: false }) || 'application/octet-stream';

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    core.setFailed('GITHUB_TOKEN is required');
    return;
  }

  for (const file of files) {
    if (
      await fs.promises.access(file, fs.constants.R_OK).then(
        () => false,
        () => true
      )
    ) {
      core.setFailed(`file ${file} is not readable`);
      return;
    }
  }
  const output: string[] = [];
  for (const file of files) {
    const data = await fs.promises.readFile(file, { encoding: 'utf8' });

    const resItem = await upload({
      owner,
      repo,
      release_id: Number(releaseId),
      name: path.basename(file),
      data,
      token,
      contentType,
    });
    output.push(resItem.data.browser_download_url);
  }
  core.setOutput('browser_download_urls', output.join('\n'));
}
export async function upload(options: {
  owner: string;
  repo: string;
  release_id: number;
  name: string;
  data: string;
  token: string;
  contentType: string;
}) {
  const octokit = getOctokit(options.token);

  return await octokit.rest.repos.uploadReleaseAsset({
    owner: options.owner,
    repo: options.repo,
    release_id: options.release_id,
    name: options.name,
    data: options.data,
    headers: {
      'content-type': options.contentType,
    },
  });
}
