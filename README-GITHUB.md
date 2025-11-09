Feuerwehr Panel
===============

This repo contains a small SPA (single-file runtime in `spa.js`) plus `index.html` and `style.css`.

Goal: publish to GitHub Pages (HTTPS) so you can Add-to-Home-Screen on iPad and get standalone fullscreen behavior.

Quick steps to create a GitHub repo and publish from this local folder:

1. Create a new repository on GitHub (https://github.com/new). Name it e.g. `feuerwehr-panel`.
2. On your Mac, in this project folder run these commands (replace <YOUR_REPO_URL> with the URL GitHub shows):

```bash
# inside /Users/sharmany/Downloads/FireDeptApp
git remote add origin <YOUR_REPO_URL>
# Push local main branch to GitHub
git push -u origin main
```

3. Enable GitHub Pages:
   - Go to the repository Settings → Pages
   - Under 'Source' choose 'Deploy from a branch' and select `main` and folder `/ (root)`
   - Save. GitHub will publish the site at `https://<your-username>.github.io/<repo>/` (or the custom domain you configure)

4. Open that URL on the iPad in Safari and use Share → "Add to Home Screen".

Notes:
- Service worker (`sw.js`) and `manifest.webmanifest` are included to enable PWA behavior once hosted over HTTPS.
- If you prefer, you can publish with Netlify: create a new site, drag-and-drop the ZIP or connect the GitHub repo.

If you want, I can also:
- Prepare a ZIP for drag-and-drop deploy to Netlify or AirDrop to the iPad.
- Attempt to create the GitHub repo via the GitHub API (requires your token).

