// Database Adapter for Feuerwehr Panel
// Drop-in replacement for localStorage calls that interfaces with SQL backend

class DatabaseAdapter {
    constructor(apiBaseUrl = 'http://localhost:3000/api') {
        this.apiUrl = apiBaseUrl;
        this.cache = new Map();
        this.pendingWrites = new Map();
        this.isOnline = false;
    }

    async init() {
        // Test connection
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (!response.ok) throw new Error('Server not responding');
            this.isOnline = true;
            console.log('✅ Database adapter initialized');
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            this.isOnline = false;
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
                    
                    try {
                        const response = await fetch(`${this.apiUrl}/moveables/${pageFile}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(moveables)
                        });

                        if (!response.ok) throw new Error('Failed to save moveables');
                        
                        this.cache.set(cacheKey, moveables);
                        const result = await response.json();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
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
if (typeof window !== 'undefined') {
    window.dbAdapter = new DatabaseAdapter();
}

// Also export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseAdapter;
}
