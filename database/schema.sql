-- Feuerwehr Panel Database Schema
-- SQLite compatible schema for managing fire department resources

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
