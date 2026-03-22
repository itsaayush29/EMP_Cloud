const timestamp = Date.now();

export const vendorData = {
  login: {
    email: process.env.ADMIN_EMAIL || 'admin@acme.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
  vendor: {
    name: `Vendor ${timestamp}`,
    company: 'Globus',
    email: `vendor.${timestamp}@example.com`,
    phone: '4545454545',
    taxId: `TAX-${timestamp}`,
    addressLine1: 'Bhilai',
    addressLine2: 'Suite B',
    city: 'Bhilai',
    state: 'CG',
    postalCode: '490020',
    country: 'India',
    notes: 'Created by Playwright automation',
  },
};
