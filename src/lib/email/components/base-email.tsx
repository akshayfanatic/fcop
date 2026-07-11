import type { ReactNode } from 'react';
import { emailStyles } from '../styles.js';

type BaseEmailProps = {
  previewText: string;
  children: ReactNode;
};

export const BaseEmail = ({ previewText, children }: BaseEmailProps) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
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
                    <td style={emailStyles.brandCell}>
                      <p style={emailStyles.brandText}>FCOP</p>
                    </td>
                  </tr>
                  <tr>
                    <td style={emailStyles.contentCell}>{children}</td>
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
