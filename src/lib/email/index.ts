export { sendEmail, sendReactEmail, sendTemplateEmail } from './services/email.service.js';
export { createNewLeadEmailTemplate } from './templates/new-lead-email.js';
export { createTestEmailTemplate } from './templates/test-email.js';
export type {
  EmailAddress,
  EmailTemplate,
  SendEmailParams,
  SendReactEmailParams
} from './types.js';
