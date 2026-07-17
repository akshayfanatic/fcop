-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(36) NOT NULL,
    `memberId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clients_memberId_key`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `serviceRequests` (
    `id` VARCHAR(36) NOT NULL,
    `clientId` VARCHAR(36) NOT NULL,
    `service` ENUM('GOOGLE_ADS', 'SEO', 'WEB_DEVELOPMENT', 'MOBILE_APP_DEVELOPMENT', 'GENERAL_MARKETING', 'OTHER') NOT NULL,
    `status` ENUM('NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `data` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `serviceRequests_clientId_idx`(`clientId`),
    INDEX `serviceRequests_service_idx`(`service`),
    INDEX `serviceRequests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `serviceRequests` ADD CONSTRAINT `serviceRequests_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
