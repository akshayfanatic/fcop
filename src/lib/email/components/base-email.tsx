import type { ReactNode } from 'react';
import { env } from '../../../config/env.js';
import { emailStyles } from '../styles.js';

type BaseEmailProps = {
  previewText: string;
  children: ReactNode;
};

export const BaseEmail = ({ previewText, children }: BaseEmailProps) => {
  const logoUrl = new URL('/assets/images/fcop.png', env.betterAuthUrl).toString();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
      </head>
      <body style={emailStyles.body}>
        <div style={emailStyles.preview}>{previewText}</div>
        <table role="presentation" width="100%" cellSpacing="0" cellPadding="0" style={emailStyles.page}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellSpacing="0" cellPadding="0" style={emailStyles.container}>
                  <tbody>
                    <tr>
                      <td align="center" style={emailStyles.brandCell}>
                        <img src={logoUrl} width="64" height="64" alt="FCOP" style={emailStyles.logo} />
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style={emailStyles.contentCell}>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style={emailStyles.footerCell}>
                        <p style={emailStyles.footerContactText}>
                          For more information, contact{' '}
                          <a href="mailto:info@fanaticcoders.com" style={emailStyles.footerLink}>
                            info@fanaticcoders.com
                          </a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
};
