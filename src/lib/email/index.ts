export { sendEmail, sendReactEmail, sendTemplateEmail } from './services/email.service.js';
export { createTestEmailTemplate } from './templates/test-email.js';
export type {
  EmailAddress,
  EmailTemplate,
  SendEmailParams,
  SendReactEmailParams
} from './types.js';
