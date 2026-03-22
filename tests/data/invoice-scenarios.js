const timestamp = Date.now();
const issueDate = new Date();
const dueDate = new Date(issueDate);
dueDate.setDate(dueDate.getDate() + 30);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export const testScenarios = {
  multipleItems: {
    login: {
      email: process.env.ADMIN_EMAIL || 'admin@acme.com',
      password: process.env.ADMIN_PASSWORD || '',
    },
    invoice: {
      clientIndex: 1,
      issueDate: formatDate(issueDate),
      dueDate: formatDate(dueDate),
      currency: 'EUR',
      reference: `MULTI-${timestamp}`,
      notes: 'Invoice with multiple line items',
      terms: 'Payment due within 30 days',
      customField: {
        name: 'project_code',
        value: 'PROJ-2026',
      },
    },
    lineItems: [
      {
        name: 'Consulting Services',
        description: 'Technical consulting for Q1',
        quantity: '40',
        rate: '150',
      },
      {
        name: 'Development Work',
        description: 'Custom software development',
        quantity: '80',
        rate: '120',
      },
      {
        name: 'Testing Services',
        description: 'Quality assurance and testing',
        quantity: '20',
        rate: '100',
      },
    ],
  },
};
