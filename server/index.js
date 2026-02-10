// Feuerwehr Panel Backend API Server
// Node.js + Express + SQLite backend for fire department resource management

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
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/feuerwehr.db');
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
