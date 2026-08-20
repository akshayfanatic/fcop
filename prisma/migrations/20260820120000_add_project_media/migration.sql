-- CreateTable
CREATE TABLE `media` (
    `id` VARCHAR(36) NOT NULL,
    `targetType` ENUM('PROJECT') NOT NULL,
    `targetId` VARCHAR(36) NOT NULL,
    `publicId` VARCHAR(255) NOT NULL,
    `secureUrl` TEXT NOT NULL,
    `resourceType` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `media_publicId_key`(`publicId`),
    INDEX `media_targetType_targetId_createdAt_idx`(`targetType`, `targetId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
