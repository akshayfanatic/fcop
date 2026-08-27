-- CreateTable
CREATE TABLE `taskComments` (
    `id` VARCHAR(36) NOT NULL,
    `taskId` VARCHAR(36) NOT NULL,
    `memberId` VARCHAR(36) NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `taskComments_taskId_createdAt_idx`(`taskId`, `createdAt`),
    INDEX `taskComments_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `taskComments` ADD CONSTRAINT `taskComments_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taskComments` ADD CONSTRAINT `taskComments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
