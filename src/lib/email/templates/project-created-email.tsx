import type { Prisma } from '../../../generated/prisma/client.js';
import { SERVICE_INTEREST_OPTIONS } from '../../../constants/enum.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type CreatedProject = Prisma.ProjectGetPayload<{
  include: {
    client: {
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                email: true;
              };
            };
          };
        };
      };
    };
    memberProjects: {
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                email: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type ProjectCreatedEmailProps = {
  project: CreatedProject;
};

const formatDate = (date?: Date | null) =>
  date?.toLocaleString('en-US', {
    dateStyle: 'medium'
  }) ?? 'To be scheduled';

export const createProjectCreatedEmailTemplate = ({ project }: ProjectCreatedEmailProps): EmailTemplate => {
  const serviceLabel = getOptionLabel(SERVICE_INTEREST_OPTIONS, project.service);
  const manager = project.memberProjects.find((memberProject) => memberProject.role === 'MANAGER')?.member.user;
  const budget = project.budgetAmount ? `${project.currency} ${project.budgetAmount.toString()}` : 'To be confirmed';

  return {
    subject: `Your ${serviceLabel} project has been created`,
    react: (
      <BaseEmail previewText={`Your project ${project.name} is now set up.`}>
        <h1 style={emailStyles.heading}>Your project is ready</h1>
        <p style={emailStyles.text}>Hi {project.client.member.user.name},</p>
        <p style={emailStyles.text}>We created your project workspace for {project.name}. Our team will use it to manage delivery, updates, and next steps.</p>
        <p style={emailStyles.text}>Service: {serviceLabel}</p>
        <p style={emailStyles.text}>Project manager: {manager?.name ?? 'To be assigned'}</p>
        <p style={emailStyles.text}>Start date: {formatDate(project.startDate)}</p>
        <p style={emailStyles.text}>Budget: {budget}</p>
        <p style={emailStyles.lastText}>Project ID: {project.id}</p>
      </BaseEmail>
    ),
    text: [
      'Your project is ready',
      `Hi ${project.client.member.user.name},`,
      `Project: ${project.name}`,
      `Service: ${serviceLabel}`,
      `Project manager: ${manager?.name ?? 'To be assigned'}`,
      `Start date: ${formatDate(project.startDate)}`,
      `Budget: ${budget}`,
      `Project ID: ${project.id}`
    ].join('\n')
  };
};
