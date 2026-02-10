// Simple test script to verify the backend works
// Run this after starting the server with: node test-server.js

const fetch = require('node:fetch');

const API_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log('🧪 Testing Feuerwehr Panel Backend Server\n');
    
    let passed = 0;
    let failed = 0;

    // Test 1: Health Check
    try {
        console.log('Test 1: Health Check...');
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        if (response.ok && data.status === 'ok') {
            console.log('✅ Health check passed\n');
            passed++;
        } else {
            throw new Error('Health check failed');
        }
    } catch (error) {
        console.log('❌ Health check failed:', error.message, '\n');
        failed++;
    }

    // Test 2: Save Moveables
    try {
        console.log('Test 2: Save Moveables...');
        const testData = [{
            id: 'test-123',
            label: 'Test PA',
            areaId: 'test-area',
            timestamp: Date.now()
        }];
        const response = await fetch(`${API_URL}/moveables/test-page.html`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        const data = await response.json();
        if (response.ok && data.success) {
            console.log('✅ Save moveables passed\n');
            passed++;
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.log('❌ Save moveables failed:', error.message, '\n');
        failed++;
    }

    // Test 3: Get Moveables
    try {
        console.log('Test 3: Get Moveables...');
        const response = await fetch(`${API_URL}/moveables/test-page.html`);
        const data = await response.json();
        if (response.ok && Array.isArray(data) && data.length > 0) {
            console.log('✅ Get moveables passed (found', data.length, 'items)\n');
            passed++;
        } else {
            throw new Error('Get failed or no data');
        }
    } catch (error) {
        console.log('❌ Get moveables failed:', error.message, '\n');
        failed++;
    }

    // Test 4: Save Button Text
    try {
        console.log('Test 4: Save Button Text...');
        const response = await fetch(`${API_URL}/button-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: 'test-label', customText: 'Test Text' })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            console.log('✅ Save button text passed\n');
            passed++;
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.log('❌ Save button text failed:', error.message, '\n');
        failed++;
    }

    // Test 5: Get Button Texts
    try {
        console.log('Test 5: Get Button Texts...');
        const response = await fetch(`${API_URL}/button-texts`);
        const data = await response.json();
        if (response.ok && typeof data === 'object' && data['test-label'] === 'Test Text') {
            console.log('✅ Get button texts passed\n');
            passed++;
        } else {
            throw new Error('Get failed or data mismatch');
        }
    } catch (error) {
        console.log('❌ Get button texts failed:', error.message, '\n');
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n✅ All tests passed! Backend is working correctly.\n');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed. Check the server logs.\n');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    console.log('\nMake sure the server is running: npm start\n');
    process.exit(1);
});
