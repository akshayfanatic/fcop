import type { ReactNode } from 'react';

export type EmailAddress = string | string[];

export type SendEmailParams = {
  to: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailAddress;
};

export type SendReactEmailParams = {
  to: EmailAddress;
  subject: string;
  react: ReactNode;
  text?: string;
  replyTo?: EmailAddress;
};

export type EmailTemplate = {
  subject: string;
  react: ReactNode;
  text: string;
};
