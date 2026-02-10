// API Storage Adapter
// This file provides a bridge between localStorage and the backend API
// Set window.USE_API_STORAGE = true to enable API mode

(function() {
  'use strict';
  
  // Configuration
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';
  
  // Check if we should use API storage
  function shouldUseAPI() {
    return window.USE_API_STORAGE === true;
  }
  
  // Helper: make API request
  async function apiRequest(method, endpoint, data = null) {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data !== null) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // --- Storage Wrapper ---
  
  const originalLocalStorage = {
    getItem: localStorage.getItem.bind(localStorage),
    setItem: localStorage.setItem.bind(localStorage),
    removeItem: localStorage.removeItem.bind(localStorage)
  };
  
  // Override localStorage methods when API mode is enabled
  const storageWrapper = {
    getItem: function(key) {
      if (!shouldUseAPI()) {
        return originalLocalStorage.getItem(key);
      }
      
      // Handle moveables_* keys
      if (key.startsWith('moveables_')) {
        const pageFile = key.replace('moveables_', '');
        // Use cached value if available, otherwise fetch from API
        const cached = originalLocalStorage.getItem(key);
        if (cached) return cached;
        
        // Note: This is synchronous but API is async
        // We'll use a workaround with synchronous XMLHttpRequest for now
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `${API_BASE_URL}/moveables/${encodeURIComponent(pageFile)}`, false);
          xhr.send();
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const result = JSON.stringify(data);
            originalLocalStorage.setItem(key, result);
            return result;
          }
        } catch (e) {
          console.error('Error fetching from API:', e);
        }
        return null;
      }
      
      // Handle custom_pa_buttons
      if (key === 'custom_pa_buttons') {
        const cached = originalLocalStorage.getItem(key);
        if (cached) return cached;
        
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `${API_BASE_URL}/custom-buttons`, false);
          xhr.send();
          if (xhr.status === 200) {
            const result = xhr.responseText;
            originalLocalStorage.setItem(key, result);
            return result;
          }
        } catch (e) {
          console.error('Error fetching from API:', e);
        }
        return null;
      }
      
      // Handle custom_button_texts
      if (key === 'custom_button_texts') {
        const cached = originalLocalStorage.getItem(key);
        if (cached) return cached;
        
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `${API_BASE_URL}/custom-button-texts`, false);
          xhr.send();
          if (xhr.status === 200) {
            const result = xhr.responseText;
            originalLocalStorage.setItem(key, result);
            return result;
          }
        } catch (e) {
          console.error('Error fetching from API:', e);
        }
        return null;
      }
      
      // Handle custom_vehicles_* keys
      if (key.startsWith('custom_vehicles_')) {
        const groupName = key.replace('custom_vehicles_', '');
        const cached = originalLocalStorage.getItem(key);
        if (cached) return cached;
        
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `${API_BASE_URL}/custom-vehicles/${encodeURIComponent(groupName)}`, false);
          xhr.send();
          if (xhr.status === 200) {
            const result = xhr.responseText;
            originalLocalStorage.setItem(key, result);
            return result;
          }
        } catch (e) {
          console.error('Error fetching from API:', e);
        }
        return null;
      }
      
      // Handle removed_* keys
      if (key.startsWith('removed_')) {
        const cached = originalLocalStorage.getItem(key);
        if (cached) return cached;
        
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `${API_BASE_URL}/removed-items/${encodeURIComponent(key)}`, false);
          xhr.send();
          if (xhr.status === 200) {
            const result = xhr.responseText;
            originalLocalStorage.setItem(key, result);
            return result;
          }
        } catch (e) {
          console.error('Error fetching from API:', e);
        }
        return null;
      }
      
      // Default: use localStorage
      return originalLocalStorage.getItem(key);
    },
    
    setItem: function(key, value) {
      // Always write to localStorage for cache
      originalLocalStorage.setItem(key, value);
      
      if (!shouldUseAPI()) {
        return;
      }
      
      // Also send to API asynchronously
      try {
        // Handle moveables_* keys
        if (key.startsWith('moveables_')) {
          const pageFile = key.replace('moveables_', '');
          const data = JSON.parse(value || '[]');
          fetch(`${API_BASE_URL}/moveables/${encodeURIComponent(pageFile)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch(e => console.error('Error saving to API:', e));
          return;
        }
        
        // Handle custom_pa_buttons
        if (key === 'custom_pa_buttons') {
          const data = JSON.parse(value || '[]');
          fetch(`${API_BASE_URL}/custom-buttons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch(e => console.error('Error saving to API:', e));
          return;
        }
        
        // Handle custom_button_texts
        if (key === 'custom_button_texts') {
          const data = JSON.parse(value || '{}');
          fetch(`${API_BASE_URL}/custom-button-texts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch(e => console.error('Error saving to API:', e));
          return;
        }
        
        // Handle custom_vehicles_* keys
        if (key.startsWith('custom_vehicles_')) {
          const groupName = key.replace('custom_vehicles_', '');
          const data = JSON.parse(value || '[]');
          // Clear existing and re-add all vehicles
          fetch(`${API_BASE_URL}/custom-vehicles/${encodeURIComponent(groupName)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch(e => console.error('Error saving to API:', e));
          return;
        }
        
        // Handle removed_* keys
        if (key.startsWith('removed_')) {
          const data = JSON.parse(value || '[]');
          fetch(`${API_BASE_URL}/removed-items/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch(e => console.error('Error saving to API:', e));
          return;
        }
      } catch (e) {
        console.error('Error in setItem:', e);
      }
    },
    
    removeItem: function(key) {
      originalLocalStorage.removeItem(key);
      
      if (!shouldUseAPI()) {
        return;
      }
      
      // Handle API cleanup if needed
      // For now, we just remove from localStorage cache
    }
  };
  
  // Expose the wrapper globally
  window.storageAdapter = storageWrapper;
  
  // Helper function to migrate existing localStorage data to API
  window.migrateToAPI = async function() {
    if (!shouldUseAPI()) {
      console.error('API mode is not enabled. Set window.USE_API_STORAGE = true first.');
      return;
    }
    
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('moveables_') ||
        key.startsWith('custom_') ||
        key.startsWith('removed_')
      )) {
        data[key] = localStorage.getItem(key);
      }
    }
    
    try {
      const result = await apiRequest('POST', '/migrate', data);
      console.log('Migration successful:', result);
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  };
  
  // Helper to enable API mode
  window.enableAPIStorage = function(baseUrl) {
    if (baseUrl) {
      window.API_BASE_URL = baseUrl;
    }
    window.USE_API_STORAGE = true;
    console.log('API storage enabled. Base URL:', API_BASE_URL);
    console.log('Run window.migrateToAPI() to migrate existing localStorage data.');
  };
  
  // Helper to disable API mode
  window.disableAPIStorage = function() {
    window.USE_API_STORAGE = false;
    console.log('API storage disabled. Using localStorage only.');
  };
  
})();
