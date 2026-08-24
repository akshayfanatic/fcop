import type { Prisma } from '../../../generated/prisma/client.js';
import { SERVICE_INTEREST_OPTIONS } from '../../../constants/enum.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailIntro, EmailMetadata, EmailSummary } from '../components/email-content.js';
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
      <BaseEmail previewText={`Your project ${project.name} is now set up.`} category="PROJECT">
        <EmailIntro context="Your workspace is ready" title="Your project is ready">
          Hi {project.client.member.user.name}, we created your project workspace. Our team will use it to manage delivery, updates, and next steps.
        </EmailIntro>
        <EmailSummary
          label="PROJECT"
          title={project.name}
          items={[
            { label: 'Service', value: serviceLabel },
            { label: 'Project manager', value: manager?.name ?? 'To be assigned' },
            { label: 'Start date', value: formatDate(project.startDate) },
            { label: 'Budget', value: budget }
          ]}
        />
        <EmailMetadata>Project ID: {project.id}</EmailMetadata>
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
