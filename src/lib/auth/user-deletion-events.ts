import { EventEmitter } from 'node:events';

export type UserDeletion = { userId: string; projectIds: string[]; requestIds: string[] };
export const userDeletionEvents = new EventEmitter<{ deleted: [UserDeletion] }>();
