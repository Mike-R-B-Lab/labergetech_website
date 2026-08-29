# LabergeTech

Marketing site for LabergeTech — automation, AI agents and software systems.
Built by Michael Laberge, Montreal.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The whole site — a single page, EN/FR |
| `support.js` | Runtime that renders the `<x-dc>` template and bindings |
| `_ds/modernist-*/` | Modernist design system — `styles.css` + bundle |
| `assets/` | Photography and the LabergeTech logo |
| `.nojekyll` | Required: keeps GitHub Pages from stripping `_ds/` |

## Running locally

```
python3 -m http.server 8765
```

Then open http://localhost:8765. It is fully static — no build step.

## Deploying

```
./deploy.sh "what changed"
```

Commits and pushes to `main`. If GitHub Pages is enabled for this repo, add
a `CNAME` file and point it at your domain the way the sendbetter.ai site
does — see `../sendbetter_website/deploy.sh` for the version that also waits
for the Pages build and the DNS edge to catch up.

## Notes

The contact form posts to Web3Forms using the same access key as the
sendbetter.ai site (same owner); rotate it at web3forms.com if it attracts
spam.
