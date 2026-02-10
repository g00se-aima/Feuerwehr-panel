# SQL Database Integration - Quick Start

## Overview

This implementation provides a complete SQL database backend for the Feuerwehr Panel application, enabling multi-user access, better data integrity, and scalability.

## 📁 Files Added

- **SQL_DATABASE_GUIDE.md** - Complete integration guide with analysis and code examples
- **server/index.js** - Express.js API server with SQLite backend
- **database/schema.sql** - Database schema definition
- **db-adapter.js** - Frontend database adapter (localStorage replacement)
- **migrate-to-sql.js** - Migration utility for existing data
- **sql-demo.html** - Interactive demo and testing page
- **package.json** - Node.js dependencies and scripts
- **Dockerfile** - Container deployment configuration
- **.gitignore** - Ignore database files and dependencies

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Server will start on http://localhost:3000

### 3. Test the Setup

Open `sql-demo.html` in your browser to:
- Test database connection
- Migrate existing localStorage data
- Try database operations
- Export/import data

## 💡 Should You Use SQL?

**✅ Use SQL Database If You Need:**
- Multi-user/multi-device access
- Centralized data management
- Professional backup solutions
- Data integrity (ACID compliance)
- Reporting and analytics
- Room for growth beyond 5-10MB

**❌ Stick with localStorage If:**
- Single user/device
- Offline-first operation required
- Want zero server maintenance
- Privacy concerns (data stays local)

## 📖 Documentation

See **SQL_DATABASE_GUIDE.md** for:
- Detailed analysis of whether SQL makes sense for your use case
- Complete API documentation
- Frontend integration examples
- Deployment options (Railway, Render, Docker, VPS)
- Security considerations
- Backup and maintenance procedures

## 🔧 Configuration

### Environment Variables

```bash
PORT=3000                           # Server port
DB_PATH=./database/feuerwehr.db    # Database file location
```

### API Endpoints

- `GET /api/health` - Health check
- `GET /api/moveables/:pageFile` - Get moveables
- `POST /api/moveables/:pageFile` - Save moveables
- `GET /api/button-texts` - Get button texts
- `POST /api/button-text` - Save button text
- `POST /api/migrate/import` - Import localStorage data
- `GET /api/export` - Export all data

See server/README.md for complete API documentation.

## 🔄 Migration Process

### Option 1: Using Demo Page (Easiest)

1. Open `sql-demo.html` in browser
2. Click "Export localStorage Data" (backup)
3. Click "Test Connection" (verify server)
4. Click "Upload to SQL Server" (migrate)
5. Click "Test Data Retrieval" (verify)

### Option 2: Using Browser Console

```javascript
// Export to file
exportLocalStorageData()

// Upload to server
uploadToServer('http://localhost:3000/api')
```

### Option 3: Manual Export/Import

```bash
# Export via API
curl http://localhost:3000/api/export > backup.json

# Import via API
curl -X POST http://localhost:3000/api/migrate/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

## 🐳 Deployment

### Docker

```bash
docker build -t feuerwehr-panel-backend .
docker run -p 3000:3000 -v $(pwd)/data:/app/database feuerwehr-panel-backend
```

### Railway / Render

1. Push to GitHub
2. Connect repository
3. Deploy automatically
4. Update frontend API URL

### VPS

```bash
npm install --production
npm install -g pm2
pm2 start server/index.js --name feuerwehr-api
pm2 save
pm2 startup
```

## 🔒 Security

⚠️ **Important:** This example does NOT include authentication!

For production deployment, add:
- Authentication (JWT, OAuth, session-based)
- HTTPS only
- Rate limiting
- Input validation
- CORS configuration
- Environment variable secrets

## 📊 Database Schema

```sql
Pages (id, file_name, title, created_at, updated_at)
Moveables (id, page_file, label, area_id, timestamp, ...)
Custom Buttons (id, button_type, label, display_text, ...)
Button Texts (label, custom_text, ...)
Removed Items (item_type, list_category, item_label, ...)
```

## 🛠️ Development

### Run in Dev Mode

```bash
npm run dev
```

Auto-reloads on file changes.

### Database Management

```bash
# Backup
sqlite3 database/feuerwehr.db ".backup database/backup.db"

# Restore
cp database/backup.db database/feuerwehr.db

# View tables
sqlite3 database/feuerwehr.db ".tables"

# Query data
sqlite3 database/feuerwehr.db "SELECT * FROM moveables LIMIT 10;"
```

## 🧪 Testing

Open `sql-demo.html` and use the test buttons:
- Test Connection
- Get Moveables
- Save Test Moveables
- Get Button Texts
- Export All Data

## 📝 Next Steps

1. Review SQL_DATABASE_GUIDE.md for complete documentation
2. Test migration with your actual data
3. Update frontend to use db-adapter.js (optional)
4. Deploy to production (Railway, Render, VPS)
5. Add authentication and security
6. Set up automated backups

## 🤝 Support

For issues:
1. Check SQL_DATABASE_GUIDE.md
2. Review server logs
3. Verify database file exists and is accessible
4. Test with sql-demo.html

## 📄 License

MIT
