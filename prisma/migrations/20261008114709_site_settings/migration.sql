-- CreateTable
CREATE TABLE `site_settings` (
    `id` VARCHAR(36) NOT NULL DEFAULT 'main',
    `contactEmail` VARCHAR(320) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `whatsapp` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `businessHours` TEXT NULL,
    `facebookUrl` VARCHAR(2048) NULL,
    `twitterUrl` VARCHAR(2048) NULL,
    `instagramUrl` VARCHAR(2048) NULL,
    `linkedinUrl` VARCHAR(2048) NULL,
    `githubUrl` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
