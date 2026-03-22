const timestamp = Date.now();

export function createRegistrationUser(overrides = {}) {
  return {
    firstName: 'Test',
    lastName: 'User',
    workEmail: `test.user+${timestamp}@example.com`,
    organizationName: `Test Org ${timestamp}`,
    password: 'Test@1234',
    ...overrides,
  };
}

export const registrationData = {
  validUser: createRegistrationUser(),
  invalidUsers: {
    missingFirstName: createRegistrationUser({ firstName: '' }),
    invalidEmail: createRegistrationUser({
      workEmail: `invalid-email-${timestamp}`,
    }),
  },
};
