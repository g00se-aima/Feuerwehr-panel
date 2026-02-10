# Multi-User Server Implementation - Summary

## What Has Been Added

This implementation adds multi-user support to the Feuerwehr Panel application using a local SQL server.

## Files Added

### Server Backend (`/server/`)
- **`package.json`** - Node.js dependencies and scripts
- **`server.js`** - Express server with REST API endpoints
- **`init-db.js`** - Database schema initialization script
- **`export-import.js`** - Data backup and restore utility
- **`README.md`** - Server-specific documentation
- **`.gitignore`** - Excludes database files and exports from git

### Client Integration
- **`api-storage.js`** - Storage adapter that bridges localStorage and API
- **`index.multi-user.html`** - Pre-configured HTML for multi-user mode

### Documentation
- **`QUICKSTART.md`** - 5-minute setup guide for beginners
- **`DEPLOYMENT.md`** - Comprehensive deployment and operations guide
- **`README-GITHUB.md`** (updated) - Added multi-user setup section

## How It Works

### Architecture

```
┌─────────────────┐         HTTP/REST API        ┌──────────────────┐
│   Web Browser   │ ◄───────────────────────────► │  Express Server  │
│  (Client App)   │                               │   (Node.js)      │
└─────────────────┘                               └──────────────────┘
        │                                                   │
        │ api-storage.js                                   │
        │ (adapter)                                        │
        │                                                  │
        ▼                                                  ▼
┌─────────────────┐                               ┌──────────────────┐
│  localStorage   │                               │ SQLite Database  │
│    (cache)      │                               │  (feuerwehr.db)  │
└─────────────────┘                               └──────────────────┘
```

### Data Flow

1. **Single-User Mode** (default):
   - Data stored in browser's localStorage
   - No server required
   - Each device has its own data

2. **Multi-User Mode**:
   - Client sends requests to API server
   - Server stores data in SQLite database
   - All devices share the same data
   - localStorage used as cache

## Database Schema

### Tables
- **moveables** - Button assignments and positions
- **custom_buttons** - User-created PA buttons
- **custom_vehicles** - Custom vehicles per page/group
- **removed_items** - Tracking of removed items
- **settings** - Application configuration

All tables have appropriate indexes for performance.

## API Endpoints

### Core Data
- `GET/POST /api/moveables/:pageFile` - Moveable items
- `GET/POST /api/custom-buttons` - Custom buttons
- `GET/POST /api/custom-button-texts` - Button labels
- `GET/POST /api/custom-vehicles/:group` - Custom vehicles
- `DELETE /api/custom-vehicles/:group/:label` - Remove vehicle
- `GET/POST /api/removed-items/:listKey` - Removed items

### Settings & Migration
- `GET/POST /api/settings/:key` - Configuration
- `POST /api/migrate` - Import localStorage data
- `GET /api/health` - Server health check

## Setup Options

### Quick Start (5 minutes)
See [QUICKSTART.md](QUICKSTART.md) for step-by-step instructions.

```bash
cd server
npm install
npm run init-db
npm start
```

Then access: `http://localhost:3000/index.multi-user.html`

### Production Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Network access configuration
- Firewall setup
- HTTPS with reverse proxy
- Running as a service (PM2, systemd, Windows Service)
- Backup strategies
- Monitoring and maintenance

## Key Features

### Concurrent Access
- SQLite with WAL mode for better concurrency
- Multiple users can access simultaneously
- Automatic conflict resolution via timestamps

### Data Migration
- Import existing localStorage data to database
- Export database to JSON for backup
- Import JSON to restore or transfer data

### Caching Strategy
- API responses cached in localStorage
- Reduces server load
- Improves responsiveness
- Falls back to server if cache miss

### Zero-Downtime Updates
- Server can be updated without losing data
- Database persists across server restarts
- Graceful shutdown handling

## Usage Examples

### Enable Multi-User Mode

**Option 1: Use pre-configured file**
```
http://localhost:3000/index.multi-user.html
```

**Option 2: Enable in console**
```javascript
window.enableAPIStorage('http://localhost:3000/api');
window.migrateToAPI(); // Migrate existing data
location.reload();
```

### Network Access

1. Find server IP: `192.168.1.100`
2. Update API URL: `http://192.168.1.100:3000/api`
3. Allow firewall port 3000
4. Access from other devices

### Data Operations

**Export database:**
```bash
npm run export
# or
node export-import.js export backup.json
```

**Import data:**
```bash
node export-import.js import backup.json
```

**View database:**
```bash
sqlite3 feuerwehr.db
.tables
.schema
SELECT * FROM moveables LIMIT 10;
```

## Performance Considerations

### SQLite Optimizations
- WAL mode enabled for better concurrency
- Indexes on frequently queried columns
- Transactions for batch operations

### Network Optimizations
- localStorage caching reduces API calls
- Async writes don't block UI
- Synchronous reads from cache when available

### Scalability
- SQLite handles hundreds of concurrent reads
- For very high concurrency (100+ users), consider PostgreSQL/MySQL
- Current implementation suitable for typical fire department use cases

## Security Considerations

### Current Implementation
- No authentication (trusted network only)
- No encryption (local network only)
- CORS enabled for all origins

### Production Recommendations
1. Use HTTPS (reverse proxy with SSL/TLS)
2. Add authentication middleware
3. Restrict CORS to known origins
4. Use firewall to limit access
5. Regular database backups
6. Keep Node.js and dependencies updated

## Troubleshooting

### Common Issues

1. **Port in use**: Change PORT environment variable
2. **Can't install dependencies**: Update Node.js to LTS version
3. **Network access fails**: Check firewall settings
4. **Data not syncing**: Verify API_BASE_URL is correct

See [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section for detailed solutions.

## Maintenance

### Regular Tasks
- Backup database weekly
- Monitor disk space
- Review server logs
- Update dependencies monthly

### Database Maintenance
```bash
# Vacuum database (optimize size)
sqlite3 feuerwehr.db "VACUUM;"

# Backup
cp feuerwehr.db backups/feuerwehr-$(date +%Y%m%d).db

# Check integrity
sqlite3 feuerwehr.db "PRAGMA integrity_check;"
```

## Migration Path

### From Single-User to Multi-User

1. Set up server (see QUICKSTART.md)
2. Open app in browser
3. Enable API mode in console
4. Run `window.migrateToAPI()`
5. Data is now in shared database
6. Other devices can connect

### From Multi-User Back to Single-User

1. Export data: `npm run export`
2. Disable API mode: `window.disableAPIStorage()`
3. Data reverts to localStorage
4. Each device independent again

## Future Enhancements

Potential improvements for future versions:
- User authentication and permissions
- Real-time sync with WebSockets
- Audit log for changes
- Conflict resolution UI
- PostgreSQL/MySQL support for larger deployments
- Docker containerization
- Automated backups
- Web-based admin interface

## Support & Documentation

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Full Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Server Documentation**: [server/README.md](server/README.md)
- **Main README**: [README-GITHUB.md](README-GITHUB.md)

## Credits

This multi-user implementation provides a complete solution for hosting the Feuerwehr Panel on a local server with shared SQL storage, enabling multiple users to collaborate in real-time.
