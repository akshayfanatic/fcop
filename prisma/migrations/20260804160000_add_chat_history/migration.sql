-- CreateTable
CREATE TABLE `chatHistories` (
    `id` VARCHAR(36) NOT NULL,
    `channelType` VARCHAR(32) NOT NULL,
    `channelId` VARCHAR(36) NOT NULL,
    `messages` JSON NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chatHistories_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `chatHistories_channelType_channelId_key`(`channelType`, `channelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
