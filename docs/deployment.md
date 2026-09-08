# Deployment

Use this runbook to publish a revision to [rosie.stephens.page](https://rosie.stephens.page/). The production site is the static Vite build in `dist/`, served by Apache from `jacob@stephens.page:/var/www/rosie.stephens.page/public/`. `rosi.stephens.page` permanently redirects to `rosie.stephens.page`.

## Automatic production deployments

Every push to `main` runs [the production deployment workflow](../.github/workflows/deploy.yml). The workflow installs locked dependencies, runs the complete unit, build, and browser checks, uploads `dist/`, and smoke-tests the live site. It can also be started manually with GitHub's **Run workflow** action.

The workflow uses the `production` GitHub environment secrets `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS`. Its dedicated SSH key is forced through `rrsync` in write-only mode and restricted to `/var/www/rosie.stephens.page/public/`; it cannot open a general server shell or write elsewhere.

Use the manual procedure below only for recovery or when GitHub Actions is unavailable.

## 1. Verify the revision

Install the locked dependencies when needed, then run every project check:

```sh
npm ci
npm run check
npm run test:e2e
```

Continue when the unit tests, typecheck, production build, and browser tests all pass. `npm run check` produces the deployable `dist/` directory.

## 2. Preview the upload

Confirm the fixed production target exists:

```sh
ssh -o BatchMode=yes jacob@stephens.page \
  'test "$(readlink -f /var/www/rosie.stephens.page/public)" = /var/www/rosie.stephens.page/public'
```

Preview the exact file changes, including stale generated assets that will be removed:

```sh
rsync --archive --compress --delete --dry-run --itemize-changes \
  dist/ jacob@stephens.page:/var/www/rosie.stephens.page/public/
```

Continue only when every reported deletion is inside the fixed `public/` target and belongs to an earlier static build.

## 3. Publish

Repeat the reviewed upload without `--dry-run`:

```sh
rsync --archive --compress --delete --itemize-changes \
  dist/ jacob@stephens.page:/var/www/rosie.stephens.page/public/
```

Confirm that the deployed entry point is byte-for-byte identical to the local build:

```sh
local_index_sha=$(shasum -a 256 dist/index.html | cut -d ' ' -f 1)
remote_index_sha=$(ssh -o BatchMode=yes jacob@stephens.page \
  'sha256sum /var/www/rosie.stephens.page/public/index.html | cut -d " " -f 1')
test "$local_index_sha" = "$remote_index_sha"
```

## 4. Smoke-test production

Verify the redirect and core PWA resources:

```sh
test "$(curl -sS -o /dev/null -w '%{http_code}' http://rosie.stephens.page/)" = 301
test "$(curl -sS -o /dev/null -w '%{http_code}' https://rosie.stephens.page/)" = 200
test "$(curl -sS -o /dev/null -w '%{http_code}' https://rosie.stephens.page/manifest.webmanifest)" = 200
test "$(curl -sS -o /dev/null -w '%{http_code}' https://rosie.stephens.page/sw.js)" = 200
test "$(curl -sS -o /dev/null -w '%{http_code}' http://rosi.stephens.page/)" = 301
test "$(curl -sS -o /dev/null -w '%{http_code}' https://rosi.stephens.page/)" = 301
test "$(curl -sS -L -o /dev/null -w '%{http_code}' https://rosi.stephens.page/)" = 200
```

Open the live site in a browser and exercise the revised behavior. Check that the game starts, input responds, sound can be toggled, and the browser console has no new errors. The deployment is complete when these checks pass and the intended revision is visible.

## Existing infrastructure

- Canonical Apache configuration: `/etc/apache2/sites-available/rosie.stephens.page.conf`
- Canonical Apache HTTPS configuration: `/etc/apache2/sites-available/rosie.stephens.page-le-ssl.conf`
- Legacy Apache configuration: `/etc/apache2/sites-available/rosi.stephens.page.conf` and `/etc/apache2/sites-available/rosi.stephens.page-le-ssl.conf` (redirects permanently to `https://rosie.stephens.page`)
- Canonical TLS certificate: Let's Encrypt certificate named `rosie.stephens.page`, renewed automatically by Certbot

A routine game deployment changes only the files under the production document root. If Apache configuration changes, run `sudo apache2ctl configtest` on the server before reloading Apache.
