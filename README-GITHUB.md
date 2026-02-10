Feuerwehr Panel
===============

This repo contains a small SPA (single-file runtime in `spa.js`) plus `index.html` and `style.css`.

## Deployment Options

### Option 1: GitHub Pages (Single User)
Goal: publish to GitHub Pages (HTTPS) so you can Add-to-Home-Screen on iPad and get standalone fullscreen behavior.

### Option 2: Local Server with Multi-User Support
For multi-user access with centralized SQL storage, see [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup instructions.

## GitHub Pages Setup

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

## Multi-User Server Setup

For hosting on a local server with SQL storage and multi-user access:

1. Navigate to the `server` directory
2. Install dependencies: `npm install`
3. Initialize database: `npm run init-db`
4. Start server: `npm start`
5. Access at `http://localhost:3000`

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup, configuration, and deployment instructions including:
- Network access configuration
- Production deployment options
- Database backup and maintenance
- Troubleshooting guide

