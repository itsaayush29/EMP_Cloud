const timestamp = Date.now();
const issueDate = new Date();
const expiryDate = new Date(issueDate);
expiryDate.setDate(expiryDate.getDate() + 30);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export const quoteData = {
  quote: {
    issueDate: formatDate(issueDate),
    expiryDate: formatDate(expiryDate),
    currency: 'USD',
    notes: 'Thank you',
    terms: 'Test',
  },
  lineItems: [
    {
      name: `Quote Item ${timestamp}`,
      description: 'Testing',
      quantity: '11',
      rate: '10',
    },
  ],
};
