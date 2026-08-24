-- CreateTable
CREATE TABLE `addOnTasks` (
    `id` VARCHAR(36) NOT NULL,
    `taskId` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `addOnTasks_taskId_idx`(`taskId`),
    INDEX `addOnTasks_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `addOnTasks` ADD CONSTRAINT `addOnTasks_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addOnTasks` ADD CONSTRAINT `addOnTasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
