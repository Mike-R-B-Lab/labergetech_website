# LabergeTech

Marketing site for LabergeTech: automation, AI agents and software systems.
Built by Michael Laberge, Montreal.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The whole site, a single self-contained page, English |
| `assets/` | Photography and the LabergeTech logo |
| `.nojekyll` | Required: keeps GitHub Pages from stripping `_ds/` |
| `support.js`, `_ds/` | Unused. Left from the previous `<x-dc>` build of the page |

## Running locally

```
python3 -m http.server 8765
```

Then open http://localhost:8765. It is fully static, no build step. The page
carries its own CSS and JS inline, so there is nothing to install.

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

The page is English only. The previous build had an EN/FR toggle with French
as the default; that went away when this design replaced it. The old bilingual
copy is still in git history at `d0cf5c4:index.html` if it needs to come back.

The contact form posts to Web3Forms using this site's own access key. It is
separate from the key the sendbetter.ai site uses, so leads from here are
distinguishable from anything still arriving through the old site. Rotate it
at web3forms.com if it attracts spam.
