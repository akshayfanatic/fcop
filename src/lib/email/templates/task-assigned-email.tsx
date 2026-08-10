import type { Prisma } from '../../../generated/prisma/client.js';
import { TASK_PRIORITY_OPTIONS } from '../../../constants/enum.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
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
      <BaseEmail previewText={`You were assigned to ${task.title}.`}>
        <h1 style={emailStyles.heading}>New task assigned</h1>
        <p style={emailStyles.text}>Hi {assigneeName},</p>
        <p style={emailStyles.text}>You were assigned to a task in {task.project.name}. Review the details and update the status when work starts.</p>
        <p style={emailStyles.text}>Task: {task.title}</p>
        <p style={emailStyles.text}>Priority: {priorityLabel}</p>
        <p style={emailStyles.text}>Due date: {formatDate(task.dueDate)}</p>
        <p style={emailStyles.text}>Assigned by: {task.createdBy.user.name}</p>
        <p style={emailStyles.text}>
          Project link:{' '}
          <a href={projectUrl} style={emailStyles.link}>
            {projectUrl}
          </a>
        </p>
        <p style={emailStyles.lastText}>Task ID: {task.id}</p>
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
