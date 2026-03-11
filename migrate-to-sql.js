// Migration utility for Feuerwehr Panel
// Exports localStorage data and uploads to SQL backend

function exportLocalStorageData() {
    const data = {
        moveables: {},
        customButtons: [],
        buttonTexts: {},
        removedItems: {}
    };

    console.log('📦 Exporting localStorage data...');

    // Export all moveables
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('moveables_')) {
            const pageFile = key.replace('moveables_', '');
            try {
                data.moveables[pageFile] = JSON.parse(localStorage.getItem(key) || '[]');
                console.log(`  ✓ Exported ${data.moveables[pageFile].length} moveables from ${pageFile}`);
            } catch (e) {
                console.error(`  ✗ Error parsing ${key}:`, e);
            }
        }
        else if (key === 'custom_csa_buttons') {
            try {
                data.customButtons = JSON.parse(localStorage.getItem(key) || '[]');
                console.log(`  ✓ Exported ${data.customButtons.length} custom buttons`);
            } catch (e) {
                console.error('  ✗ Error parsing custom_csa_buttons:', e);
            }
        }
        else if (key === 'custom_button_texts') {
            try {
                data.buttonTexts = JSON.parse(localStorage.getItem(key) || '{}');
                console.log(`  ✓ Exported ${Object.keys(data.buttonTexts).length} button texts`);
            } catch (e) {
                console.error('  ✗ Error parsing custom_button_texts:', e);
            }
        }
        else if (key.startsWith('removed_')) {
            try {
                data.removedItems[key] = JSON.parse(localStorage.getItem(key) || '[]');
                console.log(`  ✓ Exported ${data.removedItems[key].length} items from ${key}`);
            } catch (e) {
                console.error(`  ✗ Error parsing ${key}:`, e);
            }
        }
    }

    console.log('✅ Export complete!');
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feuerwehr-data-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Data downloaded as JSON file');
    return data;
}

// Upload to server
async function uploadToServer(apiUrl = 'http://localhost:3000/api') {
    console.log('🚀 Starting migration to SQL database...');
    
    const data = {
        moveables: {},
        customButtons: [],
        buttonTexts: {},
        removedItems: {}
    };

    // Collect data without downloading
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
    
    try {
        console.log(`📡 Uploading to ${apiUrl}/migrate/import...`);
        const response = await fetch(`${apiUrl}/migrate/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Upload successful:', result);
        alert('✅ Data migrated to SQL database successfully!\n\nYou can now use the SQL backend for multi-device access.');
        return result;
    } catch (error) {
        console.error('❌ Upload error:', error);
        alert('❌ Error uploading data: ' + error.message + '\n\nMake sure the server is running at ' + apiUrl);
        throw error;
    }
}

// Show migration instructions
function showInstructions() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║      Feuerwehr Panel - Data Migration to SQL Database            ║
╚═══════════════════════════════════════════════════════════════════╝

📖 INSTRUCTIONS:

1️⃣  EXPORT DATA TO FILE (for backup):
   → Run: exportLocalStorageData()
   → This will download a JSON file with all your data

2️⃣  MIGRATE TO SQL SERVER (recommended):
   → Make sure the backend server is running
   → Run: uploadToServer()
   → Or specify URL: uploadToServer('https://your-server.com/api')

3️⃣  VERIFY MIGRATION:
   → Check server console for confirmation
   → Test accessing data from another device

⚠️  BEFORE MIGRATION:
   • Backup your current data: exportLocalStorageData()
   • Make sure the backend server is running
   • Test with sample data first

💡 TIPS:
   • Keep localStorage data as backup during transition
   • Test thoroughly before deploying to production
   • See SQL_DATABASE_GUIDE.md for full documentation
   • Server must be accessible from all devices that will use the app

🔗 DEFAULT SERVER URL: http://localhost:3000/api
`);
}

// Auto-run instructions when loaded
if (typeof console !== 'undefined') {
    showInstructions();
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.exportLocalStorageData = exportLocalStorageData;
    window.uploadToServer = uploadToServer;
    window.showMigrationInstructions = showInstructions;
}
