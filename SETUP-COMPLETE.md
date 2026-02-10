# Multi-User SQL Server Setup - COMPLETE ✓

## What You Need to Host This on a Local Server

Your question: "if i want to host sql data on a local server i have and multiple users have access to it, what do i need to host this codebase?"

**Answer:** Everything you need is now included! Follow the steps below.

## Prerequisites

You need **only one thing** installed on your server:
- **Node.js** (version 14 or higher) - [Download from nodejs.org](https://nodejs.org/)

That's it! Everything else will be installed automatically.

## Quick Start (5 Minutes)

### 1. Install Node.js
Download and install from https://nodejs.org/ (choose the LTS version)

### 2. Set Up the Server
Open a terminal/command prompt:

```bash
# Navigate to the server directory
cd server

# Install required packages (first time only)
npm install

# Create the database (first time only)
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

**Keep this terminal open!** The server must stay running.

### 3. Access the Application

**Single Device (Same Computer):**
- Open browser: `http://localhost:3000/index.multi-user.html`

**Multiple Devices (Network):**

1. Find your server's IP address:
   - Windows: `ipconfig` → Look for IPv4 Address
   - Mac/Linux: `ifconfig` or `ip addr`
   - Example: `192.168.1.100`

2. Allow port 3000 through firewall:
   - Windows: `netsh advfirewall firewall add rule name="Feuerwehr" dir=in action=allow protocol=TCP localport=3000`
   - Linux: `sudo ufw allow 3000/tcp`

3. On other devices, open:
   `http://192.168.1.100:3000/index.multi-user.html`
   (Replace with your server's IP)

## What's Included

### Server Components
✓ **Node.js Express Server** - Handles all requests
✓ **SQLite Database** - Stores all data
✓ **REST API** - 15+ endpoints for data operations
✓ **Rate Limiting** - Prevents abuse
✓ **Concurrent Access** - Multiple users simultaneously

### Client Integration
✓ **Storage Adapter** - Seamlessly connects to API
✓ **Backward Compatible** - Single-user mode still works
✓ **Example Configuration** - Pre-configured HTML file

### Documentation
✓ **QUICKSTART.md** - 5-minute setup guide (you should read this!)
✓ **DEPLOYMENT.md** - Complete deployment guide
✓ **IMPLEMENTATION-SUMMARY.md** - Technical details
✓ **server/README.md** - Server-specific docs

### Utilities
✓ **Data Export/Import** - Backup and restore
✓ **Database Migration** - Import from localStorage
✓ **Health Monitoring** - Check server status

## File Structure

```
Feuerwehr-panel/
├── server/                      # Backend server
│   ├── server.js               # Main server file
│   ├── init-db.js              # Database initialization
│   ├── export-import.js        # Backup/restore utility
│   ├── package.json            # Dependencies
│   ├── feuerwehr.db            # SQLite database (created on first run)
│   └── README.md               # Server documentation
│
├── api-storage.js              # Client-server bridge
├── index.multi-user.html       # Pre-configured for multi-user
├── spa.js                      # Original app (unchanged)
├── style.css                   # Styles (unchanged)
│
└── Documentation:
    ├── QUICKSTART.md           # Start here!
    ├── DEPLOYMENT.md           # Advanced setup
    ├── IMPLEMENTATION-SUMMARY.md
    └── README-GITHUB.md        # Updated main README
```

## Common Questions

### Q: Do I need to change any existing files?
**A:** No! The original app still works. Multi-user mode is optional.

### Q: What if I already have data?
**A:** Use the migration tool to import it:
```javascript
// In browser console:
window.enableAPIStorage('http://localhost:3000/api');
window.migrateToAPI();
```

### Q: How do I backup my data?
**A:** 
```bash
# Export to JSON
npm run export

# Or just copy the database
cp feuerwehr.db backups/
```

### Q: Can I run this 24/7?
**A:** Yes! See DEPLOYMENT.md for:
- PM2 (process manager)
- systemd (Linux service)
- Windows Service
- Auto-start on boot

### Q: Is this secure?
**A:** For local networks, yes:
- Rate limiting (100 req/min)
- SQL injection prevention
- Proper error handling

For internet access, add:
- HTTPS (reverse proxy)
- Authentication
- Stricter rate limits

See DEPLOYMENT.md for details.

### Q: What if something goes wrong?
**A:** Check the troubleshooting sections in:
1. QUICKSTART.md (common issues)
2. DEPLOYMENT.md (detailed solutions)

## Next Steps

### To Start Using Now:
1. Read [QUICKSTART.md](QUICKSTART.md)
2. Follow the 5-minute setup
3. Access from your devices

### For Production Use:
1. Read [DEPLOYMENT.md](DEPLOYMENT.md)
2. Set up PM2 or systemd
3. Configure automatic backups
4. Set up HTTPS (optional)

### For Technical Details:
1. Read [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)
2. Review [server/README.md](server/README.md)
3. Check API documentation in DEPLOYMENT.md

## What Technologies Are Used

- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **SQLite** - Database (single file, no setup needed)
- **express-rate-limit** - Security
- No other dependencies required!

## Database Tables

All your data is stored in `server/feuerwehr.db`:
- `moveables` - Button positions and assignments
- `custom_buttons` - User-created buttons
- `custom_vehicles` - Custom vehicle definitions
- `removed_items` - Deleted items tracking
- `settings` - Application configuration

## Support

For help:
1. Check QUICKSTART.md troubleshooting
2. Check DEPLOYMENT.md troubleshooting
3. Review server logs (terminal output)
4. Check browser console (F12) for errors

## Summary

✅ Everything is ready to use
✅ No code changes needed to existing app
✅ Complete documentation included
✅ Tested and working
✅ Security measures in place

**You can now host this on a local server with multiple users accessing it!**

Start with [QUICKSTART.md](QUICKSTART.md) for detailed instructions.
