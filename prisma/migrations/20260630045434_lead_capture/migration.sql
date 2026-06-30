-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `serviceInterest` ENUM('GOOGLE_ADS', 'SEO', 'WEB_DEVELOPMENT', 'MOBILE_APP_DEVELOPMENT', 'GENERAL_MARKETING', 'OTHER') NOT NULL,
    `budgetRange` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'IN_PROGRESS', 'DEAD') NOT NULL DEFAULT 'NEW',
    `source` ENUM('CONTACT_FORM') NOT NULL DEFAULT 'CONTACT_FORM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leads_email_idx`(`email`),
    INDEX `leads_status_idx`(`status`),
    INDEX `leads_serviceInterest_idx`(`serviceInterest`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
