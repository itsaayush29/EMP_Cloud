const timestamp = Date.now();

export const invoiceData = {
  login: {
    email: process.env.ADMIN_EMAIL || 'admin@acme.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
  invoice: {
    clientIndex: 1,
    issueDate: '2026-03-06',
    dueDate: '2026-04-07',
    currency: 'USD',
    reference: `INV-${timestamp}`,
    notes: 'Automation invoice',
    terms: 'Payment due within 30 days',
    customField: {
      name: 'custom_field',
      value: '74',
    },
  },
  lineItems: [
    {
      name: 'Implementation',
      description: 'Invoice automation coverage',
      quantity: '12',
      rate: '10',
    },
    {
      name: 'Validation',
      description: 'Regression validation',
      quantity: '3',
      rate: '3',
    },
  ],
};
