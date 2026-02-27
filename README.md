# Upload Release Asset (maintained fork)

This GitHub Action uploads one or more assets to an **existing GitHub Release**.

This project exists because the original **[actions/upload-release-asset](https://github.com/actions/upload-release-asset)** repository was archived and is no longer maintained. GitHub’s suggested maintained alternative, **[softprops/action-gh-release](https://github.com/softprops/action-gh-release)**, is primarily focused on creating releases (and its workflow/inputs are not a low-cost 1:1 replacement when you only want to upload assets).

So this repo is a **minimal-cost, equivalent migration** of the original logic and behavior, updated to modern tooling.

## What changed vs [actions/upload-release-asset](https://github.com/actions/upload-release-asset)

- **Modern runtime & SDKs**: upgraded to Node.js **24**, `@actions/core@3` and `@actions/github@9`.
- **Modern API inputs**: use `owner`, `repo`, `release_id` instead of `upload_url`.
- **Batch upload**: use `files` (newline-separated paths) instead of `asset_path` + `asset_name`.
  - Asset names are derived from each file’s basename.
  - Output changes from `browser_download_url` to `browser_download_urls` (newline-separated).
- **Modern build pipeline**: TypeScript + ESM for development, bundled to CJS with **esbuild** for GitHub Actions.

## Usage

### Requirements

- A GitHub Release must already exist.
- `GITHUB_TOKEN` must be available (usually `${{ secrets.GITHUB_TOKEN }}`).

### Inputs

- `owner` (required): Repository owner (user or org).
- `repo` (required): Repository name.
- `release_id` (required): Numeric release id to upload assets to.
- `files` (required): Newline-separated list of file paths to upload.
- `content_type` (optional): `Content-Type` for uploaded assets. Defaults to `application/octet-stream`.

### Outputs

- `browser_download_urls`: Newline-separated list of uploaded asset download URLs.

## Examples

### Upload multiple assets to a release event

```yaml
name: Upload Release Assets

on:
  release:
    types: [published]

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Build
        run: |
          mkdir -p dist
          echo "hello" > dist/hello.txt
          echo "world" > dist/world.txt

      - name: Upload assets
        id: upload
        uses: kuankuan2007/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          owner: ${{ github.repository_owner }}
          repo: ${{ github.event.repository.name }}
          release_id: ${{ github.event.release.id }}
          files: |
            dist/hello.txt
            dist/world.txt

      - name: Print URLs
        run: |
          echo "${{ steps.upload.outputs.browser_download_urls }}"
```

## Migration from [actions/upload-release-asset](https://github.com/actions/upload-release-asset)

### 1) Replace `upload_url` with `owner` + `repo` + `release_id`

New:

```yaml
with:
  owner: ${{ github.repository_owner }}
  repo: ${{ github.event.repository.name }}
  release_id: ${{ github.event.release.id }}
```

Old:

```yaml
with:
  upload_url: ${{ github.event.release.upload_url }}
```

### 2) Replace `asset_path` + `asset_name` with `files`

- Use `files` to provide one or more file paths (newline-separated).
- Asset name is inferred from the filename in each path.

### 3) Replace `browser_download_url` with `browser_download_urls`

- Expect **multiple URLs**, newline-separated.

## Development

- Build: `npm run build`
- Lint: `npm run lint`

The bundled action entry is `dist/index.cjs` and the action runs on Node.js 24.

## License

Mulan Permissive Software License, Version 2.0 (Mulan PSL v2). See [LICENSE](LICENSE).
