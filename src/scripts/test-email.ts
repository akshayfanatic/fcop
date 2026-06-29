import { createTestEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';

const to = process.argv[2] ?? 'akshay@fanaticcoders.com';
const template = createTestEmailTemplate();
const data = await sendTemplateEmail({
  to,
  template
});

console.log({ data });
