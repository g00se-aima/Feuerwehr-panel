# Multi-User SQL Server Setup Guide

This guide explains how to set up and host the Feuerwehr Panel application on a local server with SQL storage for multi-user access.

## Overview

The application has been extended with a Node.js backend server that provides:
- SQLite database for persistent storage
- REST API for multi-user access
- Concurrent access support via WAL mode
- Data migration from localStorage

## Prerequisites

You need to have the following installed on your server:
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Quick Start

### 1. Install Dependencies

Navigate to the server directory and install required packages:

```bash
cd server
npm install
```

This will install:
- `express` - Web server framework
- `better-sqlite3` - SQLite database driver
- `cors` - Cross-origin resource sharing
- `body-parser` - Request body parsing

### 2. Initialize the Database

Create the SQLite database with the required schema:

```bash
npm run init-db
```

This creates a `feuerwehr.db` file in the server directory with all necessary tables.

### 3. Start the Server

Start the backend server:

```bash
npm start
```

The server will start on port 3000 by default. You should see:
```
Feuerwehr Panel Server running on http://localhost:3000
Database: /path/to/feuerwehr.db
API available at http://localhost:3000/api/
```

### 4. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

The application will be served by the Node.js server.

## Enabling Multi-User Mode

By default, the application uses localStorage (single-user mode). To enable multi-user mode:

### Option 1: Enable in Browser Console

1. Open the browser developer console (F12)
2. Run these commands:

```javascript
// Enable API storage mode
window.enableAPIStorage('http://localhost:3000/api');

// Migrate existing localStorage data to the database (if you have existing data)
window.migrateToAPI();

// Reload the page
location.reload();
```

### Option 2: Configure in HTML

Add this script to `index.html` before loading `spa.js`:

```html
<script>
  // Enable API storage for multi-user access
  window.USE_API_STORAGE = true;
  window.API_BASE_URL = 'http://localhost:3000/api';
</script>
<script src="api-storage.js"></script>
<script src="spa.js?v=20251207_2"></script>
```

## Network Access

### Accessing from Other Devices on Your Network

1. Find your server's local IP address:
   - **Windows**: Run `ipconfig` in Command Prompt, look for "IPv4 Address"
   - **Mac/Linux**: Run `ifconfig` or `ip addr`, look for your network interface
   - Example: `192.168.1.100`

2. Update the API base URL to use your server's IP:

```javascript
window.enableAPIStorage('http://192.168.1.100:3000/api');
```

3. Access the application from other devices using:
```
http://192.168.1.100:3000
```

### Firewall Configuration

You may need to allow incoming connections on port 3000:

**Windows Firewall:**
```powershell
netsh advfirewall firewall add rule name="Feuerwehr Panel" dir=in action=allow protocol=TCP localport=3000
```

**Linux (ufw):**
```bash
sudo ufw allow 3000/tcp
```

**macOS:**
System Preferences → Security & Privacy → Firewall → Firewall Options → Add port 3000

## Production Deployment

### Using a Different Port

Set the PORT environment variable:

```bash
PORT=8080 npm start
```

Or modify the server configuration in `server/server.js`.

### Running as a Background Service

#### Using PM2 (Recommended)

Install PM2 globally:
```bash
npm install -g pm2
```

Start the server:
```bash
cd server
pm2 start server.js --name feuerwehr-panel
```

Useful PM2 commands:
```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart feuerwehr-panel
pm2 stop feuerwehr-panel
pm2 startup         # Configure to start on boot
```

#### Using systemd (Linux)

Create a service file `/etc/systemd/system/feuerwehr-panel.service`:

```ini
[Unit]
Description=Feuerwehr Panel Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/Feuerwehr-panel/server
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable feuerwehr-panel
sudo systemctl start feuerwehr-panel
sudo systemctl status feuerwehr-panel
```

#### Windows Service

Use [node-windows](https://github.com/coreybutler/node-windows) to create a Windows service.

### Using HTTPS

For secure connections, use a reverse proxy like nginx or Apache with SSL certificates.

Example nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Management

### Backup

The database is stored in `server/feuerwehr.db`. Back it up regularly:

```bash
cp server/feuerwehr.db server/feuerwehr.db.backup
```

Or use SQLite's backup command:
```bash
sqlite3 server/feuerwehr.db ".backup 'backup.db'"
```

### Restore

```bash
cp server/feuerwehr.db.backup server/feuerwehr.db
```

### Export Data

Export all data as JSON:

```bash
sqlite3 server/feuerwehr.db -json "SELECT * FROM moveables" > moveables.json
```

### View Database

Use any SQLite client or command-line:

```bash
sqlite3 server/feuerwehr.db
.tables
.schema
SELECT * FROM moveables LIMIT 10;
```

## Monitoring and Maintenance

### Rate Limiting

The server includes rate limiting to prevent abuse:
- Default: 100 requests per IP per minute
- Configured in `server.js` via `express-rate-limit`
- Adjust limits based on your use case:
  - Local trusted network: Current settings are fine
  - Internet-facing: Reduce to 20-30 requests/minute
  - High-traffic scenarios: Consider using Redis for distributed rate limiting

To modify rate limits, edit `server.js`:
```javascript
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // requests per windowMs
  // ...
});
```

### Health Check

Check if the server is running:

```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Logs

When running with PM2:
```bash
pm2 logs feuerwehr-panel
```

When running directly:
- Logs appear in the terminal where you started the server
- Redirect to file: `npm start > server.log 2>&1`

### Database Optimization

Optimize the database periodically:

```bash
sqlite3 server/feuerwehr.db "VACUUM;"
```

## Troubleshooting

### Server won't start

1. Check if port 3000 is already in use:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Mac/Linux
   lsof -i :3000
   ```

2. Check Node.js is installed:
   ```bash
   node --version
   ```

3. Ensure all dependencies are installed:
   ```bash
   cd server
   npm install
   ```

### Can't connect from other devices

1. Verify server is listening on all interfaces (not just localhost)
2. Check firewall settings
3. Ensure devices are on the same network
4. Try accessing using the IP address instead of hostname

### Data not syncing

1. Verify API mode is enabled:
   ```javascript
   console.log(window.USE_API_STORAGE); // Should be true
   ```

2. Check browser console for errors
3. Verify server is running and accessible
4. Check network tab in developer tools for failed API requests

### Database locked errors

This usually happens with high concurrent access. The server uses WAL mode which helps, but if you still see issues:
- Reduce concurrent writes
- Add retry logic in the client
- Consider switching to PostgreSQL or MySQL for higher concurrency

## Architecture

### Database Schema

**moveables** - Stores moveable buttons and assignments
- `page_file` - Which page the moveable belongs to
- `moveable_id` - Unique identifier
- `label` - Display text
- `type`, `area_id`, `assigned_to_page`, `erk_id` - Assignment details

**custom_buttons** - Stores custom PA buttons

**custom_vehicles** - Stores custom vehicles per group

**removed_items** - Tracks removed items

**settings** - Key-value configuration storage

### API Endpoints

All endpoints are under `/api`:

- `GET /health` - Health check
- `GET /moveables/:pageFile` - Get moveables for a page
- `POST /moveables/:pageFile` - Save moveables for a page
- `GET /custom-buttons` - Get all custom buttons
- `POST /custom-buttons` - Save custom buttons
- `GET /custom-button-texts` - Get button text mappings
- `POST /custom-button-texts` - Save button text mappings
- `GET /custom-vehicles/:groupName` - Get custom vehicles for a group
- `POST /custom-vehicles/:groupName` - Add custom vehicle
- `DELETE /custom-vehicles/:groupName/:label` - Remove custom vehicle
- `GET /removed-items/:listKey` - Get removed items
- `POST /removed-items/:listKey` - Save removed items
- `POST /migrate` - Migrate localStorage data to database

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console and server logs
3. Verify your configuration matches the examples in this guide
