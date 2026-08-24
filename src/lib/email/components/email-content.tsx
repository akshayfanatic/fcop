import type { ReactNode } from 'react';
import { emailStyles } from '../styles.js';

type EmailIntroProps = {
  context: string;
  title: string;
  children: ReactNode;
};

export const EmailIntro = ({ context, title, children }: EmailIntroProps) => (
  <>
    <p style={emailStyles.context}>{context}</p>
    <h1 style={emailStyles.heading}>{title}</h1>
    <p style={emailStyles.text}>{children}</p>
  </>
);

type EmailSummaryItem = {
  label: string;
  value: ReactNode;
};

type EmailSummaryProps = {
  label: string;
  title: ReactNode;
  items: EmailSummaryItem[];
};

export const EmailSummary = ({ label, title, items }: EmailSummaryProps) => (
  <table role="presentation" width="100%" cellSpacing="0" cellPadding="0" style={emailStyles.summary}>
    <tbody>
      <tr>
        <td style={emailStyles.summaryTitleCell}>
          <p style={emailStyles.summaryLabel}>{label}</p>
          <p style={emailStyles.summaryTitle}>{title}</p>
        </td>
      </tr>
      {items.length > 0 && (
        <tr>
          <td style={emailStyles.summaryDetailsCell}>
            <table role="presentation" width="100%" cellSpacing="0" cellPadding="0">
              <tbody>
                {items.map((item) => (
                  <tr key={item.label}>
                    <td style={emailStyles.detailLabel}>{item.label}</td>
                    <td style={emailStyles.detailValue}>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export const EmailAction = ({ href, children }: { href: string; children: ReactNode }) => (
  <p style={emailStyles.buttonRow}>
    <a href={href} style={emailStyles.button}>
      {children}
    </a>
  </p>
);

export const EmailMetadata = ({ children }: { children: ReactNode }) => <p style={emailStyles.lastText}>{children}</p>;
