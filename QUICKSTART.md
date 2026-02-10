# Quick Start Guide - Multi-User Setup

This guide will help you get the multi-user SQL server running in 5 minutes.

## Step 1: Install Node.js

If you don't have Node.js installed:
- Download from https://nodejs.org/
- Install the LTS (Long Term Support) version
- Verify installation: `node --version`

## Step 2: Start the Server

Open a terminal/command prompt and run:

```bash
# Navigate to the server directory
cd server

# Install dependencies (first time only)
npm install

# Initialize the database (first time only)
npm run init-db

# Start the server
npm start
```

You should see:
```
Feuerwehr Panel Server running on http://localhost:3000
Database: /path/to/feuerwehr.db
API available at http://localhost:3000/api/
```

**Keep this terminal window open!** The server needs to stay running.

## Step 3: Access the Application

### Single Device

Open your browser and go to:
```
http://localhost:3000
```

Use the standard `index.html` (single-user mode with localStorage).

### Multi-User Mode (Multiple Devices)

1. **Option A**: Use the pre-configured file

   Open: `http://localhost:3000/index.multi-user.html`

2. **Option B**: Enable API mode manually

   a. Open `http://localhost:3000` in your browser
   
   b. Open the browser console (F12)
   
   c. Run these commands:
   ```javascript
   window.enableAPIStorage('http://localhost:3000/api');
   window.migrateToAPI(); // If you have existing data
   location.reload();
   ```

## Step 4: Access from Other Devices

### Find Your Server's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for your network interface's inet address

**Example IP:** `192.168.1.100`

### Configure Firewall

Allow port 3000 through your firewall:

**Windows:**
```powershell
netsh advfirewall firewall add rule name="Feuerwehr Panel" dir=in action=allow protocol=TCP localport=3000
```

**Linux (ufw):**
```bash
sudo ufw allow 3000/tcp
```

### Access from Other Devices

On other devices (iPads, phones, computers) on the same network:

1. Open browser and go to: `http://192.168.1.100:3000/index.multi-user.html`
   (Replace `192.168.1.100` with your server's IP)

2. Or manually enable API mode:
   - Open: `http://192.168.1.100:3000`
   - Press F12 (or enable developer tools on mobile)
   - Run:
   ```javascript
   window.enableAPIStorage('http://192.168.1.100:3000/api');
   location.reload();
   ```

## Step 5: Migrate Existing Data (Optional)

If you have existing data in localStorage (from single-user mode):

1. Open the browser console (F12)
2. Run:
```javascript
window.migrateToAPI();
```

This will copy all your localStorage data to the SQL database.

## Troubleshooting

### Server won't start

**"Port 3000 already in use"**
```bash
# Use a different port
PORT=8080 npm start
# Then update API_BASE_URL to http://localhost:8080/api
```

**"Cannot find module"**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Can't access from other devices

1. ✓ Server is running
2. ✓ Firewall allows port 3000
3. ✓ Devices are on the same network
4. ✓ Using the correct IP address
5. ✓ Updated API_BASE_URL with the server's IP

### Data not syncing

1. Check browser console for errors
2. Verify server is running: `http://localhost:3000/api/health`
3. Ensure API mode is enabled:
   ```javascript
   console.log(window.USE_API_STORAGE); // Should be true
   ```

## Running 24/7

### Using PM2 (Recommended)

Install PM2 globally:
```bash
npm install -g pm2
```

Start the server:
```bash
cd server
pm2 start server.js --name feuerwehr-panel
pm2 save
pm2 startup  # Follow instructions to run on boot
```

Manage the server:
```bash
pm2 status           # Check status
pm2 logs             # View logs
pm2 restart feuerwehr-panel
pm2 stop feuerwehr-panel
```

### Windows Service

For Windows, see DEPLOYMENT.md for instructions on creating a Windows service.

## Backup Your Data

The database is in `server/feuerwehr.db`. Back it up regularly:

```bash
# Simple copy
cp server/feuerwehr.db server/backup/feuerwehr-$(date +%Y%m%d).db

# Or use SQLite backup
sqlite3 server/feuerwehr.db ".backup 'backup.db'"
```

## Next Steps

- See [DEPLOYMENT.md](DEPLOYMENT.md) for advanced configuration
- Configure HTTPS for secure access
- Set up automatic backups
- Monitor server health and logs

## Support

For detailed documentation, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [server/README.md](server/README.md) - Server documentation
