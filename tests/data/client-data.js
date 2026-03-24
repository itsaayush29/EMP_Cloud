const timestamp = Date.now();

export const clientData = {
  client: {
    name: `Test ${timestamp}`,
    displayName: `TC ${timestamp}`,
    email: `client${timestamp}@example.com`,
    phone: '9876543210',
    gstin: '22AAAAA0000A1Z5',
    addressLine: '456 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'Indian',
    tag: 'Test',
    notes: 'Testing notes',
    customFieldValue: '54',
  },
};
