# LabergeTech

Marketing site for LabergeTech: automation, AI agents and software systems.
Built by Michael Laberge, Montreal.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The whole site, a single page, EN/FR |
| `support.js` | Runtime that renders the `<x-dc>` template and bindings |
| `_ds/modernist-*/` | Modernist design system: `styles.css` + bundle |
| `assets/` | Photography and the LabergeTech logo |
| `.nojekyll` | Required: keeps GitHub Pages from stripping `_ds/` |

## Running locally

```
python3 -m http.server 8765
```

Then open http://localhost:8765. It is fully static, no build step.

## Deploying

```
./deploy.sh "what changed"
```

Commits and pushes to `main`. The live site is labergetech.com, served by
Cloudflare in front of this repo, so there is no `CNAME` file here and none
is needed. A push goes live once Cloudflare rebuilds.

`deploy.sh` here only commits and pushes; it does not confirm the deploy
actually landed. `../sendbetter_website/deploy.sh` has a longer version that
polls until the build is live and the edge is serving the new commit. Worth
porting over if pushing blind starts to bite.

## Notes

The contact form posts to Web3Forms using this site's own access key. It is
separate from the key the sendbetter.ai site uses, so leads from here are
distinguishable from anything still arriving through the old site. Rotate it
at web3forms.com if it attracts spam.
