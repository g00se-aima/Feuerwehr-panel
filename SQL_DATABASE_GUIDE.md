# SQL Database Integration Guide for Feuerwehr Panel

## Overview

This guide explains how to migrate the Feuerwehr Panel application from localStorage to a SQL database. This transition enables multi-user access, better data integrity, and scalability.

## Is SQL Database Right for This Project?

### YES - SQL Database Makes Sense If:

1. **Multi-user/Multi-device Access**: You need multiple firefighters to access and update the same data simultaneously from different devices
2. **Centralized Management**: You want a single source of truth accessible across your fire department
3. **Data Backup & Recovery**: You need professional backup solutions and disaster recovery
4. **Reporting & Analytics**: You want to generate reports on equipment usage, assignments, etc.
5. **Data Integrity**: You need ACID compliance to prevent data corruption during concurrent updates
6. **Growth**: Your department is growing and localStorage's ~5-10MB limit might become an issue

### NO - Stick with localStorage If:

1. **Single User/Device**: Only one person/iPad uses the app
2. **Offline-First**: You need the app to work without any internet connection
3. **Simplicity**: You want zero server maintenance and deployment complexity
4. **Privacy**: You want all data to stay on the local device only

## Architecture Options

### Option 1: Node.js Backend + SQLite (Recommended for Small/Medium Teams)

**Pros:**
- Simple to set up and maintain
- Single file database
- No separate database server needed
- Good for 1-50 concurrent users

**Cons:**
- Requires a server (can be a Raspberry Pi)
- Limited scalability for very large deployments

### Option 2: Node.js Backend + PostgreSQL/MySQL (For Large Departments)

**Pros:**
- Handles hundreds of concurrent users
- Advanced features (replication, clustering)
- Industry-standard reliability

**Cons:**
- More complex setup
- Requires dedicated database server
- Higher maintenance overhead

## Implementation Guide

The following sections provide complete code examples for implementing SQL database support.

### 1. Database Schema

```sql
-- File: database/schema.sql

-- Pages/Vehicles table
CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moveable items (equipment assigned to vehicles)
CREATE TABLE IF NOT EXISTS moveables (
    id VARCHAR(50) PRIMARY KEY,
    page_file VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    base_label VARCHAR(200),
    class_name VARCHAR(100),
    style TEXT,
    area_id VARCHAR(100),
    area_title VARCHAR(200),
    from_page VARCHAR(100),
    assigned_to_page VARCHAR(100),
    custom_id VARCHAR(50),
    timestamp BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_file) REFERENCES pages(file_name) ON DELETE CASCADE
);

-- Custom buttons
CREATE TABLE IF NOT EXISTS custom_buttons (
    id VARCHAR(50) PRIMARY KEY,
    button_type VARCHAR(50) NOT NULL, -- 'csa', 'vehicle', etc.
    label VARCHAR(200) NOT NULL,
    display_text VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Button text customizations
CREATE TABLE IF NOT EXISTS button_texts (
    label VARCHAR(200) PRIMARY KEY,
    custom_text VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Removed items tracking
CREATE TABLE IF NOT EXISTS removed_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type VARCHAR(50) NOT NULL, -- 'pa', 'fl', 'tf', 'fh', 'am', 'si', 'x', 'csa'
    list_category VARCHAR(100) NOT NULL,
    item_label VARCHAR(200) NOT NULL,
    removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_type, list_category, item_label)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moveables_page ON moveables(page_file);
CREATE INDEX IF NOT EXISTS idx_moveables_area ON moveables(area_id);
CREATE INDEX IF NOT EXISTS idx_removed_items_type ON removed_items(item_type, list_category);

-- Update timestamp trigger for moveables
CREATE TRIGGER IF NOT EXISTS update_moveables_timestamp 
AFTER UPDATE ON moveables
BEGIN
    UPDATE moveables SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for pages
CREATE TRIGGER IF NOT EXISTS update_pages_timestamp 
AFTER UPDATE ON pages
BEGIN
    UPDATE pages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 2. Backend Server (Node.js + Express + SQLite)

```javascript
// File: server/index.js

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize database
const dbPath = process.env.DB_PATH || './database/feuerwehr.db';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Better concurrency

// Load and execute schema
const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log(`Database initialized at ${dbPath}`);

// ============================================
// API Endpoints
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------- Moveables Endpoints ----------

// Get all moveables for a page
app.get('/api/moveables/:pageFile', (req, res) => {
    try {
        const { pageFile } = req.params;
        const stmt = db.prepare('SELECT * FROM moveables WHERE page_file = ? ORDER BY timestamp DESC');
        const moveables = stmt.all(pageFile);
        res.json(moveables);
    } catch (error) {
        console.error('Error fetching moveables:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save/update moveables for a page
app.post('/api/moveables/:pageFile', (req, res) => {
    try {
        const { pageFile } = req.params;
        const moveables = req.body;

        if (!Array.isArray(moveables)) {
            return res.status(400).json({ error: 'Expected array of moveables' });
        }

        // Begin transaction
        const deleteStmt = db.prepare('DELETE FROM moveables WHERE page_file = ?');
        const insertStmt = db.prepare(`
            INSERT INTO moveables (
                id, page_file, label, base_label, class_name, style,
                area_id, area_title, from_page, assigned_to_page, custom_id, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((pageFile, moveables) => {
            deleteStmt.run(pageFile);
            for (const item of moveables) {
                insertStmt.run(
                    item.id,
                    pageFile,
                    item.label || '',
                    item.baseLabel || '',
                    item.className || '',
                    item.style || '',
                    item.areaId || '',
                    item.areaTitle || '',
                    item.fromPage || '',
                    item.assignedToPage || '',
                    item.customId || null,
                    item.timestamp || Date.now()
                );
            }
        });

        transaction(pageFile, moveables);
        res.json({ success: true, count: moveables.length });
    } catch (error) {
        console.error('Error saving moveables:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a single moveable
app.post('/api/moveable', (req, res) => {
    try {
        const item = req.body;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO moveables (
                id, page_file, label, base_label, class_name, style,
                area_id, area_title, from_page, assigned_to_page, custom_id, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            item.id,
            item.pageFile,
            item.label || '',
            item.baseLabel || '',
            item.className || '',
            item.style || '',
            item.areaId || '',
            item.areaTitle || '',
            item.fromPage || '',
            item.assignedToPage || '',
            item.customId || null,
            item.timestamp || Date.now()
        );

        res.json({ success: true, id: item.id });
    } catch (error) {
        console.error('Error adding moveable:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a moveable
app.delete('/api/moveable/:id', (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM moveables WHERE id = ?');
        const result = stmt.run(id);
        res.json({ success: true, deleted: result.changes });
    } catch (error) {
        console.error('Error deleting moveable:', error);
        res.status(500).json({ error: error.message });
    }
});

// ---------- Custom Buttons Endpoints ----------

// Get custom buttons
app.get('/api/custom-buttons', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM custom_buttons ORDER BY created_at DESC');
        const buttons = stmt.all();
        res.json(buttons);
    } catch (error) {
        console.error('Error fetching custom buttons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add custom button
app.post('/api/custom-button', (req, res) => {
    try {
        const { id, buttonType, label, displayText } = req.body;
        const stmt = db.prepare(`
            INSERT INTO custom_buttons (id, button_type, label, display_text)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(id, buttonType, label, displayText || label);
        res.json({ success: true, id });
    } catch (error) {
        console.error('Error adding custom button:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete custom button
app.delete('/api/custom-button/:id', (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM custom_buttons WHERE id = ?');
        const result = stmt.run(id);
        res.json({ success: true, deleted: result.changes });
    } catch (error) {
        console.error('Error deleting custom button:', error);
        res.status(500).json({ error: error.message });
    }
});

// ---------- Button Texts Endpoints ----------

// Get all button texts
app.get('/api/button-texts', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM button_texts');
        const texts = stmt.all();
        // Convert to object format for compatibility
        const result = {};
        texts.forEach(row => {
            result[row.label] = row.custom_text;
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching button texts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save button text
app.post('/api/button-text', (req, res) => {
    try {
        const { label, customText } = req.body;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO button_texts (label, custom_text)
            VALUES (?, ?)
        `);
        stmt.run(label, customText);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving button text:', error);
        res.status(500).json({ error: error.message });
    }
});

// ---------- Removed Items Endpoints ----------

// Get removed items
app.get('/api/removed-items/:itemType/:listCategory', (req, res) => {
    try {
        const { itemType, listCategory } = req.params;
        const stmt = db.prepare(`
            SELECT item_label FROM removed_items 
            WHERE item_type = ? AND list_category = ?
            ORDER BY removed_at DESC
        `);
        const items = stmt.all(itemType, listCategory);
        res.json(items.map(row => row.item_label));
    } catch (error) {
        console.error('Error fetching removed items:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add removed item
app.post('/api/removed-item', (req, res) => {
    try {
        const { itemType, listCategory, itemLabel } = req.body;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO removed_items (item_type, list_category, item_label)
            VALUES (?, ?, ?)
        `);
        stmt.run(itemType, listCategory, itemLabel);
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding removed item:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove from removed items (restore)
app.delete('/api/removed-item/:itemType/:listCategory/:itemLabel', (req, res) => {
    try {
        const { itemType, listCategory, itemLabel } = req.params;
        const stmt = db.prepare(`
            DELETE FROM removed_items 
            WHERE item_type = ? AND list_category = ? AND item_label = ?
        `);
        const result = stmt.run(itemType, listCategory, itemLabel);
        res.json({ success: true, deleted: result.changes });
    } catch (error) {
        console.error('Error removing item from removed list:', error);
        res.status(500).json({ error: error.message });
    }
});

// ---------- Migration Endpoint ----------

// Import data from localStorage export
app.post('/api/migrate/import', (req, res) => {
    try {
        const data = req.body;
        
        // Begin transaction
        const transaction = db.transaction((data) => {
            // Import moveables
            if (data.moveables) {
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO moveables (
                        id, page_file, label, base_label, class_name, style,
                        area_id, area_title, from_page, assigned_to_page, custom_id, timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                for (const [pageFile, items] of Object.entries(data.moveables)) {
                    if (Array.isArray(items)) {
                        for (const item of items) {
                            stmt.run(
                                item.id,
                                pageFile,
                                item.label || '',
                                item.baseLabel || '',
                                item.className || '',
                                item.style || '',
                                item.areaId || '',
                                item.areaTitle || '',
                                item.fromPage || '',
                                item.assignedToPage || '',
                                item.customId || null,
                                item.timestamp || Date.now()
                            );
                        }
                    }
                }
            }

            // Import custom buttons
            if (data.customButtons && Array.isArray(data.customButtons)) {
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO custom_buttons (id, button_type, label, display_text)
                    VALUES (?, ?, ?, ?)
                `);
                for (const btn of data.customButtons) {
                    stmt.run(btn.id, 'csa', btn.label, btn.label);
                }
            }

            // Import button texts
            if (data.buttonTexts && typeof data.buttonTexts === 'object') {
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO button_texts (label, custom_text)
                    VALUES (?, ?)
                `);
                for (const [label, text] of Object.entries(data.buttonTexts)) {
                    stmt.run(label, text);
                }
            }

            // Import removed items
            if (data.removedItems && typeof data.removedItems === 'object') {
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO removed_items (item_type, list_category, item_label)
                    VALUES (?, ?, ?)
                `);
                for (const [key, items] of Object.entries(data.removedItems)) {
                    if (Array.isArray(items)) {
                        // Parse key like "removed_pas_liste_pa"
                        const match = key.match(/^removed_([^_]+)_liste_(.+)$/);
                        if (match) {
                            const itemType = match[1];
                            const listCategory = match[2];
                            for (const item of items) {
                                stmt.run(itemType, listCategory, item);
                            }
                        }
                    }
                }
            }
        });

        transaction(data);
        res.json({ success: true, message: 'Data imported successfully' });
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export all data (for backup)
app.get('/api/export', (req, res) => {
    try {
        const moveablesStmt = db.prepare('SELECT * FROM moveables');
        const customButtonsStmt = db.prepare('SELECT * FROM custom_buttons');
        const buttonTextsStmt = db.prepare('SELECT * FROM button_texts');
        const removedItemsStmt = db.prepare('SELECT * FROM removed_items');

        const moveables = moveablesStmt.all();
        const customButtons = customButtonsStmt.all();
        const buttonTexts = buttonTextsStmt.all();
        const removedItems = removedItemsStmt.all();

        res.json({
            moveables,
            customButtons,
            buttonTexts,
            removedItems,
            exportedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Feuerwehr Panel API Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nClosing database connection...');
    db.close();
    process.exit(0);
});
```

### 3. Database Abstraction Layer (Frontend)

```javascript
// File: db-adapter.js
// Drop-in replacement for localStorage calls

class DatabaseAdapter {
    constructor(apiBaseUrl = 'http://localhost:3000/api') {
        this.apiUrl = apiBaseUrl;
        this.cache = new Map();
        this.pendingWrites = new Map();
    }

    async init() {
        // Test connection
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (!response.ok) throw new Error('Server not responding');
            console.log('Database adapter initialized');
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }

    // Get moveables for a page
    async getMoveables(pageFile) {
        try {
            const cacheKey = `moveables_${pageFile}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const response = await fetch(`${this.apiUrl}/moveables/${pageFile}`);
            if (!response.ok) throw new Error('Failed to fetch moveables');
            
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching moveables:', error);
            return [];
        }
    }

    // Save moveables for a page
    async saveMoveables(pageFile, moveables) {
        try {
            const cacheKey = `moveables_${pageFile}`;
            
            // Debounce writes
            if (this.pendingWrites.has(cacheKey)) {
                clearTimeout(this.pendingWrites.get(cacheKey));
            }

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(async () => {
                    this.pendingWrites.delete(cacheKey);
                    
                    const response = await fetch(`${this.apiUrl}/moveables/${pageFile}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(moveables)
                    });

                    if (!response.ok) throw new Error('Failed to save moveables');
                    
                    this.cache.set(cacheKey, moveables);
                    const result = await response.json();
                    resolve(result);
                }, 500); // Debounce 500ms

                this.pendingWrites.set(cacheKey, timeout);
            });
        } catch (error) {
            console.error('Error saving moveables:', error);
            throw error;
        }
    }

    // Get button texts
    async getButtonTexts() {
        try {
            if (this.cache.has('button_texts')) {
                return this.cache.get('button_texts');
            }

            const response = await fetch(`${this.apiUrl}/button-texts`);
            if (!response.ok) throw new Error('Failed to fetch button texts');
            
            const data = await response.json();
            this.cache.set('button_texts', data);
            return data;
        } catch (error) {
            console.error('Error fetching button texts:', error);
            return {};
        }
    }

    // Save button text
    async saveButtonText(label, customText) {
        try {
            const response = await fetch(`${this.apiUrl}/button-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, customText })
            });

            if (!response.ok) throw new Error('Failed to save button text');
            
            // Update cache
            const texts = this.cache.get('button_texts') || {};
            texts[label] = customText;
            this.cache.set('button_texts', texts);
            
            return await response.json();
        } catch (error) {
            console.error('Error saving button text:', error);
            throw error;
        }
    }

    // Get custom buttons
    async getCustomButtons() {
        try {
            if (this.cache.has('custom_buttons')) {
                return this.cache.get('custom_buttons');
            }

            const response = await fetch(`${this.apiUrl}/custom-buttons`);
            if (!response.ok) throw new Error('Failed to fetch custom buttons');
            
            const data = await response.json();
            this.cache.set('custom_buttons', data);
            return data;
        } catch (error) {
            console.error('Error fetching custom buttons:', error);
            return [];
        }
    }

    // Add custom button
    async addCustomButton(id, buttonType, label, displayText) {
        try {
            const response = await fetch(`${this.apiUrl}/custom-button`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, buttonType, label, displayText })
            });

            if (!response.ok) throw new Error('Failed to add custom button');
            
            // Update cache
            const buttons = this.cache.get('custom_buttons') || [];
            buttons.push({ id, button_type: buttonType, label, display_text: displayText });
            this.cache.set('custom_buttons', buttons);
            
            return await response.json();
        } catch (error) {
            console.error('Error adding custom button:', error);
            throw error;
        }
    }

    // Get removed items
    async getRemovedItems(itemType, listCategory) {
        try {
            const cacheKey = `removed_${itemType}_${listCategory}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const response = await fetch(`${this.apiUrl}/removed-items/${itemType}/${listCategory}`);
            if (!response.ok) throw new Error('Failed to fetch removed items');
            
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching removed items:', error);
            return [];
        }
    }

    // Add removed item
    async addRemovedItem(itemType, listCategory, itemLabel) {
        try {
            const response = await fetch(`${this.apiUrl}/removed-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemType, listCategory, itemLabel })
            });

            if (!response.ok) throw new Error('Failed to add removed item');
            
            // Update cache
            const cacheKey = `removed_${itemType}_${listCategory}`;
            const items = this.cache.get(cacheKey) || [];
            if (!items.includes(itemLabel)) {
                items.push(itemLabel);
                this.cache.set(cacheKey, items);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error adding removed item:', error);
            throw error;
        }
    }

    // Clear cache (call when switching pages or reloading)
    clearCache() {
        this.cache.clear();
    }

    // Flush pending writes (call before page unload)
    async flush() {
        const pending = Array.from(this.pendingWrites.values());
        await Promise.all(pending.map(timeout => {
            clearTimeout(timeout);
            return Promise.resolve();
        }));
        this.pendingWrites.clear();
    }
}

// Export singleton instance
window.dbAdapter = new DatabaseAdapter();
```

### 4. Migration Utility

```javascript
// File: migrate-to-sql.js
// Run this in browser console to export localStorage data

function exportLocalStorageData() {
    const data = {
        moveables: {},
        customButtons: [],
        buttonTexts: {},
        removedItems: {}
    };

    // Export all moveables
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('moveables_')) {
            const pageFile = key.replace('moveables_', '');
            try {
                data.moveables[pageFile] = JSON.parse(localStorage.getItem(key) || '[]');
            } catch (e) {
                console.error(`Error parsing ${key}:`, e);
            }
        }
        else if (key === 'custom_csa_buttons') {
            try {
                data.customButtons = JSON.parse(localStorage.getItem(key) || '[]');
            } catch (e) {
                console.error('Error parsing custom_csa_buttons:', e);
            }
        }
        else if (key === 'custom_button_texts') {
            try {
                data.buttonTexts = JSON.parse(localStorage.getItem(key) || '{}');
            } catch (e) {
                console.error('Error parsing custom_button_texts:', e);
            }
        }
        else if (key.startsWith('removed_')) {
            try {
                data.removedItems[key] = JSON.parse(localStorage.getItem(key) || '[]');
            } catch (e) {
                console.error(`Error parsing ${key}:`, e);
            }
        }
    }

    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feuerwehr-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('Data exported successfully!');
    return data;
}

// Upload to server
async function uploadToServer(apiUrl = 'http://localhost:3000/api') {
    const data = exportLocalStorageData();
    
    try {
        const response = await fetch(`${apiUrl}/migrate/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload successful:', result);
        alert('Data migrated to SQL database successfully!');
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading data: ' + error.message);
    }
}

// Instructions
console.log(`
=== Feuerwehr Panel Data Migration ===

To export your localStorage data:
1. Run: exportLocalStorageData()
   This will download a JSON file

To upload directly to server:
1. Make sure server is running at http://localhost:3000
2. Run: uploadToServer()

To use a different server:
   uploadToServer('https://your-server.com/api')
`);
```

### 5. Package Configuration

```json
{
  "name": "feuerwehr-panel-backend",
  "version": "1.0.0",
  "description": "Backend API for Feuerwehr Panel",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "migrate": "node database/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "better-sqlite3": "^9.2.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## Deployment Options

### Option 1: Local Server (Raspberry Pi)

1. Install Node.js on a Raspberry Pi
2. Clone repository and install dependencies: `npm install`
3. Start server: `npm start`
4. Configure your router to allow local network access
5. Update frontend API URL to point to Pi's IP address

### Option 2: Cloud Hosting (Railway/Render/Heroku)

1. Push code to GitHub
2. Connect to Railway/Render
3. Deploy with one click
4. Update frontend API URL to your deployment URL

### Option 3: Docker Container

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Migration Steps

1. **Export existing data**: Run migration script in browser console
2. **Set up server**: Install Node.js and dependencies
3. **Initialize database**: Server automatically creates schema on first run
4. **Import data**: Upload exported JSON via migration endpoint
5. **Update frontend**: Integrate database adapter (see next section)
6. **Test thoroughly**: Verify all functionality works with SQL backend
7. **Deploy**: Choose deployment option and go live

## Updating the Frontend

To use the SQL backend, modify `spa.js` to use the database adapter:

```javascript
// At the top of spa.js, after initializing:
(async function initDatabase() {
    const useDatabase = true; // Set to false to use localStorage
    
    if (useDatabase) {
        await window.dbAdapter.init();
    }
})();

// Replace localStorage calls with database adapter calls:
// OLD:
// const moveables = JSON.parse(localStorage.getItem('moveables_' + pageFile) || '[]');

// NEW:
// const moveables = await window.dbAdapter.getMoveables(pageFile);

// OLD:
// localStorage.setItem('moveables_' + pageFile, JSON.stringify(moveables));

// NEW:
// await window.dbAdapter.saveMoveables(pageFile, moveables);
```

## Maintenance

### Backup Database

```bash
# SQLite backup
sqlite3 database/feuerwehr.db ".backup database/backup-$(date +%Y%m%d).db"

# Or use API
curl http://localhost:3000/api/export > backup.json
```

### Restore from Backup

```bash
# SQLite restore
cp database/backup-YYYYMMDD.db database/feuerwehr.db

# Or use migration endpoint
curl -X POST http://localhost:3000/api/migrate/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

## Performance Considerations

- **Caching**: Database adapter caches responses to minimize API calls
- **Debouncing**: Writes are debounced to prevent excessive database updates
- **Indexes**: Database schema includes indexes on frequently queried columns
- **WAL Mode**: SQLite uses Write-Ahead Logging for better concurrency

## Security Considerations

⚠️ **Important**: This example does not include authentication! For production use:

1. Add authentication (JWT, session-based, etc.)
2. Implement role-based access control
3. Use HTTPS only
4. Validate all inputs
5. Add rate limiting
6. Implement proper error handling that doesn't leak sensitive info

## Conclusion

This guide provides a complete implementation for migrating from localStorage to SQL. The modular design allows you to:

- Keep using localStorage for offline-first scenarios
- Switch to SQL for multi-user deployments
- Run both in parallel during transition
- Scale from small (SQLite) to large (PostgreSQL) deployments

Choose SQL if you need centralized, multi-user access. Stick with localStorage if you need simplicity and offline-first operation.
