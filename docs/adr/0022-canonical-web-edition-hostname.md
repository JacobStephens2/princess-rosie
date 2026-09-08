# Canonical Web Edition hostname is rosie.stephens.page

The live site is still `rosi.stephens.page`; ADR-0021 and issue #103 already named `rosie.stephens.page`. We cut over in one window: the advertised URL becomes `https://rosie.stephens.page/`, the Apache document root and rsync jail move to `/var/www/rosie.stephens.page/public`, and production keeps tracking `main` through the existing GitHub Actions rsync pipeline. Both hostnames serve the same `dist/` so a PWA already installed on the `rosi` origin still receives deploys; there is no 301. Downtime during the cutover is acceptable because no one else is playing.

## Considered Options

- **301 `rosi` to `rosie`.** Cleaner public URL, but an installed home-screen PWA on the old origin can keep serving the cached previous build and never follow the redirect.
- **Leave the document root named `/var/www/rosi.stephens.page/public`.** Avoids touching the rsync jail, but every other vhost on the box matches hostname to path, and the public name would then disagree with the disk path.
- **Two-step sequence** (repair `npm ci` onto the old name, rename later). Safer if the family were playing, but it would ship the Web Edition under the hostname we are retiring. No one else is playing, so one cutover is better.

## Consequences

- `rosi.stephens.page` originally stayed a working HTTPS vhost during initial cutover, and has now been retired to a permanent 301 redirect to `https://rosie.stephens.page`.
- The GitHub `production` environment URL, HTML canonical/og tags, README, deploy runbook, and smoke tests advertise `rosie.stephens.page`.
- The restricted deploy key’s `rrsync` jail must move with the directory; the GitHub secret itself does not encode the path.
- Wildcard DNS already points `rosie` at the droplet; the remaining server work is the vhost, Let’s Encrypt cert, jail, and closing the leak that currently serves 15 East on unknown names.
