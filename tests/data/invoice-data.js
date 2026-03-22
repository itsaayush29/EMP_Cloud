const timestamp = Date.now();
const issueDate = new Date();
const dueDate = new Date(issueDate);
dueDate.setDate(dueDate.getDate() + 30);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export const invoiceData = {
  login: {
    email: process.env.ADMIN_EMAIL || 'admin@acme.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
  invoice: {
    clientIndex: 1,
    issueDate: formatDate(issueDate),
    dueDate: formatDate(dueDate),
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
