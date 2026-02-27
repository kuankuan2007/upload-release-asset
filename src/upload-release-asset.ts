import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import fs from 'fs';
import path from 'path';

export default async function run() {
  const owner = core.getInput('owner', { required: true });
  const repo = core.getInput('repo', { required: true });
  const releaseId = core.getInput('release_id', { required: true });

  const files = core
    .getInput('files', { required: true })
    .split('\n')
    .filter(Boolean)
    .map((file) => path.resolve(process.cwd(), file.trim()));
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    core.setFailed('GITHUB_TOKEN is required');
    return;
  }

  const output: string[] = [];
  for (const file of files) {
    try {
      const data = await fs.promises.readFile(file);

      const resItem = await upload({
        owner,
        repo,
        release_id: Number(releaseId),
        name: path.basename(file),
        // @ts-expect-error This API only accepts strings, but I don't want to encode them to avoid errors caused by incorrect encoding. Therefore, I used Buffer directly.
        data,
        token,
      });
      output.push(resItem.data.browser_download_url);
      core.info(`uploaded ${file} to ${resItem.data.browser_download_url}`);
    } catch (error) {
      core.setFailed(`failed to upload ${file}: ${error}`);
      return;
    }
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
}) {
  const octokit = getOctokit(options.token);

  return await octokit.rest.repos.uploadReleaseAsset({
    owner: options.owner,
    repo: options.repo,
    release_id: options.release_id,
    name: options.name,
    data: options.data,
    headers: {
      'content-type': 'application/octet-stream',
    },
  });
}
