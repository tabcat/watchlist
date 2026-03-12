# ts-template-pnpm

## Setup

Run `pnpm up --latest` and move `workflows` into `.github/workflows`.

### Add NPM_TOKEN to github secrets

For the publish workflow to work, you need to add your NPM token as a secret to the repository.

### Enable Github Pages for Docs

`Repo Settings > Pages > Build and deployment > Github Actions`

This will let the pages workflow complete.

The docs page will be published at https://\<user or org name\>.github.io/\<repo name\>

> Done!
