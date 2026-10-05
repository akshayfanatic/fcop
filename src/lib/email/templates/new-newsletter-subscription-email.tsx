import type { NewsletterSubscriber } from '../../../generated/prisma/client.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type NewNewsletterSubscriptionEmailProps = {
  subscriber: NewsletterSubscriber;
};

export const createNewNewsletterSubscriptionEmailTemplate = ({ subscriber }: NewNewsletterSubscriptionEmailProps): EmailTemplate => ({
  subject: 'New newsletter subscription',
  react: (
    <BaseEmail previewText={`${subscriber.email} subscribed to the FCOP newsletter.`} category="NEWSLETTER">
      <h1 style={{ ...emailStyles.heading, fontSize: '24px', lineHeight: '31px', letterSpacing: '-0.3px' }}>New subscriber</h1>
      <p style={emailStyles.text}>Someone new joined the FCOP newsletter.</p>
      <table role="presentation" width="100%" cellSpacing="0" cellPadding="0" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ ...emailStyles.detailLabel, padding: '12px 0', borderBottom: '1px solid #e4eaf0' }}>Email</td>
            <td align="right" style={{ ...emailStyles.detailValue, padding: '12px 0', borderBottom: '1px solid #e4eaf0' }}>
              <a href={`mailto:${subscriber.email}`} style={emailStyles.link}>
                {subscriber.email}
              </a>
            </td>
          </tr>
          <tr>
            <td style={{ ...emailStyles.detailLabel, padding: '12px 0' }}>Subscribed</td>
            <td align="right" style={{ ...emailStyles.detailValue, padding: '12px 0' }}>
              {subscriber.createdAt.toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC'
              })}{' '}
              UTC
            </td>
          </tr>
        </tbody>
      </table>
    </BaseEmail>
  ),
  text: [
    'New newsletter subscription',
    '',
    `Email: ${subscriber.email}`,
    `Subscribed: ${subscriber.createdAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`
  ].join('\n')
});
