import { emailConfig } from '../config.js';
import type { EmailTemplate, SendEmailParams, SendReactEmailParams } from '../types.js';
import { resend } from './resend.service.js';

export const sendEmail = async (params: SendEmailParams) => {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email provider error.';
    throw new Error(`Failed to send email: ${message}`, { cause: error });
  }
};

export const sendTemplateEmail = async (
  params: Omit<SendReactEmailParams, 'subject' | 'react' | 'text'> & {
    template: EmailTemplate;
  }
) =>
  sendReactEmail({
    to: params.to,
    replyTo: params.replyTo,
    subject: params.template.subject,
    react: params.template.react,
    text: params.template.text
  });

export const sendReactEmail = async (params: SendReactEmailParams) => {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: params.to,
      subject: params.subject,
      react: params.react,
      text: params.text,
      replyTo: params.replyTo
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email provider error.';
    throw new Error(`Failed to send email: ${message}`, { cause: error });
  }
};
