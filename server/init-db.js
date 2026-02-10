const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'feuerwehr.db');
const db = new sqlite3.Database(dbPath);

console.log('Creating database schema...');

// Create tables
const schema = `
  -- Moveables table: stores all moveable items (buttons) and their assignments
  CREATE TABLE IF NOT EXISTS moveables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_file TEXT NOT NULL,
    moveable_id TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    type TEXT,
    area_id TEXT,
    assigned_to_page TEXT,
    erk_id TEXT,
    timestamp INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Custom buttons table: stores custom PA buttons
  CREATE TABLE IF NOT EXISTS custom_buttons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    button_id TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    button_type TEXT DEFAULT 'pa',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Custom vehicles table: stores custom vehicles for each group/page
  CREATE TABLE IF NOT EXISTS custom_vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT NOT NULL,
    label TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_name, label)
  );

  -- Removed items table: tracks items that have been removed
  CREATE TABLE IF NOT EXISTS removed_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    list_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_type, item_id, list_key)
  );

  -- Settings table: stores key-value pairs for app configuration
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_moveables_page_file ON moveables(page_file);
  CREATE INDEX IF NOT EXISTS idx_moveables_label ON moveables(label);
  CREATE INDEX IF NOT EXISTS idx_moveables_assigned_to_page ON moveables(assigned_to_page);
  CREATE INDEX IF NOT EXISTS idx_custom_vehicles_group ON custom_vehicles(group_name);
  CREATE INDEX IF NOT EXISTS idx_removed_items_type ON removed_items(item_type, list_key);
`;

db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error creating schema:', err);
      process.exit(1);
    }
    console.log('Database schema created successfully!');
    console.log('Database location:', dbPath);
    db.close();
  });
});

