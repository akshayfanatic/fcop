-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `memberId` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(2048) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_memberId_readAt_createdAt_idx`(`memberId`, `readAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
