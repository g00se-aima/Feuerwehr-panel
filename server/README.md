# Feuerwehr Panel Server

Backend server for multi-user access to the Feuerwehr Panel application.

## Quick Start

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start server
npm start
```

The server will be available at `http://localhost:3000`

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start with auto-reload (requires nodemon)
- `npm run init-db` - Initialize/reset the database

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

Example:
```bash
PORT=8080 npm start
```

## Database

The server uses SQLite with WAL mode for better concurrent access. The database file `feuerwehr.db` is created automatically when you run `npm run init-db`.

**Location**: `server/feuerwehr.db`

### Tables

- `moveables` - Moveable buttons and assignments
- `custom_buttons` - Custom PA buttons
- `custom_vehicles` - Custom vehicles per group
- `removed_items` - Removed items tracking
- `settings` - Application settings

## API Documentation

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete API documentation.

### Key Endpoints

- `GET /api/health` - Health check
- `GET /api/moveables/:pageFile` - Get moveables
- `POST /api/moveables/:pageFile` - Save moveables
- `POST /api/migrate` - Migrate localStorage data

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions including:
- Production setup
- Network configuration
- HTTPS setup
- Service configuration (systemd, PM2, Windows Service)
- Backup and restore procedures

## Development

For development with auto-reload:

```bash
npm install --save-dev nodemon
npm run dev
```

## Troubleshooting

### Port already in use

Change the port:
```bash
PORT=8080 npm start
```

### Database locked

Make sure only one server instance is running. WAL mode helps with concurrent access.

### Can't connect from network

1. Check firewall settings
2. Ensure server is accessible on your IP
3. Update API_BASE_URL in the client

## License

MIT
