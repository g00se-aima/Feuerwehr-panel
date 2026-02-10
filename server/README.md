# Feuerwehr Panel - Backend Server Setup

## Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will start on http://localhost:3000

### Development Mode

For auto-reloading during development:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Moveables
- `GET /api/moveables/:pageFile` - Get all moveables for a page
- `POST /api/moveables/:pageFile` - Save moveables for a page
- `POST /api/moveable` - Add single moveable
- `DELETE /api/moveable/:id` - Delete a moveable

### Custom Buttons
- `GET /api/custom-buttons` - Get all custom buttons
- `POST /api/custom-button` - Add custom button
- `DELETE /api/custom-button/:id` - Delete custom button

### Button Texts
- `GET /api/button-texts` - Get all button text customizations
- `POST /api/button-text` - Save button text

### Removed Items
- `GET /api/removed-items/:itemType/:listCategory` - Get removed items
- `POST /api/removed-item` - Add removed item
- `DELETE /api/removed-item/:itemType/:listCategory/:itemLabel` - Restore item

### Migration
- `POST /api/migrate/import` - Import data from localStorage export
- `GET /api/export` - Export all data (for backup)

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_PATH` - Database file path (default: ./database/feuerwehr.db)

Example:
```bash
PORT=8080 DB_PATH=/data/feuerwehr.db npm start
```

## Docker Deployment

Build and run with Docker:
```bash
docker build -t feuerwehr-panel-backend .
docker run -p 3000:3000 -v $(pwd)/data:/app/database feuerwehr-panel-backend
```

## Database

The SQLite database is automatically created on first run at `database/feuerwehr.db`.

### Backup

```bash
# Manual backup
cp database/feuerwehr.db database/backup-$(date +%Y%m%d).db

# Or use API
curl http://localhost:3000/api/export > backup.json
```

### Restore

```bash
# From database file
cp database/backup-YYYYMMDD.db database/feuerwehr.db

# From JSON export
curl -X POST http://localhost:3000/api/migrate/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

## Production Deployment

### Railway / Render / Heroku

1. Push code to GitHub
2. Connect repository to deployment platform
3. Set environment variables if needed
4. Deploy!

### VPS / Dedicated Server

1. Clone repository
2. Install dependencies: `npm install --production`
3. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server/index.js --name feuerwehr-api
pm2 save
pm2 startup
```

### Security Considerations

⚠️ **This example does not include authentication!** For production:

1. Add authentication (JWT, OAuth, etc.)
2. Use HTTPS only
3. Implement rate limiting
4. Add input validation
5. Set up CORS properly for your domain
6. Use environment variables for secrets

## Monitoring

Check server logs:
```bash
# If using PM2
pm2 logs feuerwehr-api

# If running directly
npm start 2>&1 | tee server.log
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Database locked
- Ensure only one server instance is running
- Check file permissions on database directory
- WAL mode is enabled by default for better concurrency

### Connection refused
- Verify server is running: `curl http://localhost:3000/api/health`
- Check firewall settings
- Ensure correct port is configured

## Support

For issues and questions:
1. Check SQL_DATABASE_GUIDE.md for detailed documentation
2. Review server logs for error messages
3. Verify database file exists and is accessible
