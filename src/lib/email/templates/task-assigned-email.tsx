import type { Prisma } from '../../../generated/prisma/client.js';
import { TASK_PRIORITY_OPTIONS } from '../../../constants/enum.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailAction, EmailIntro, EmailMetadata, EmailSummary } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type AssignedTask = Prisma.TaskGetPayload<{
  include: {
    project: {
      select: {
        id: true;
        name: true;
      };
    };
    createdBy: {
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
}>;

type TaskAssignedEmailProps = {
  task: AssignedTask;
  assigneeName: string;
  projectUrl: string;
};

const formatDate = (date?: Date | null) =>
  date?.toLocaleString('en-US', {
    dateStyle: 'medium'
  }) ?? 'Not set';

export const createTaskAssignedEmailTemplate = ({ task, assigneeName, projectUrl }: TaskAssignedEmailProps): EmailTemplate => {
  const priorityLabel = getOptionLabel(TASK_PRIORITY_OPTIONS, task.priority);

  return {
    subject: `New task assigned: ${task.title}`,
    react: (
      <BaseEmail previewText={`You were assigned to ${task.title}.`} category="TASK">
        <EmailIntro context={task.project.name} title="New task assigned">
          Hi {assigneeName}, you were assigned a new task. Review the details before work begins.
        </EmailIntro>
        <EmailSummary
          label="TASK"
          title={task.title}
          items={[
            { label: 'Priority', value: priorityLabel },
            { label: 'Due date', value: formatDate(task.dueDate) },
            { label: 'Assigned by', value: task.createdBy.user.name }
          ]}
        />
        <EmailAction href={projectUrl}>View task details</EmailAction>
        <EmailMetadata>Task ID: {task.id}</EmailMetadata>
      </BaseEmail>
    ),
    text: [
      'New task assigned',
      `Hi ${assigneeName},`,
      `Task: ${task.title}`,
      `Project: ${task.project.name}`,
      `Priority: ${priorityLabel}`,
      `Due date: ${formatDate(task.dueDate)}`,
      `Assigned by: ${task.createdBy.user.name}`,
      `Project link: ${projectUrl}`,
      `Task ID: ${task.id}`
    ].join('\n')
  };
};
