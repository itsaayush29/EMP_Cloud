import { createRegistrationUser } from './registration-data.js';

export const registrationScenarios = {
  validRegistration: {
    name: 'registers a new account with valid data',
    user: createRegistrationUser(),
  },
  missingFirstName: {
    name: 'shows required validation when first name is missing',
    user: createRegistrationUser({ firstName: '' }),
    invalidField: 'firstName',
  },
  invalidEmail: {
    name: 'shows email validation when work email format is invalid',
    user: createRegistrationUser({ workEmail: 'invalid-email-format' }),
    invalidField: 'workEmail',
  },
};
