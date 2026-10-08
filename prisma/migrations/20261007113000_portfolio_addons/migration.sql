-- AlterTable
ALTER TABLE `portfolio` DROP COLUMN `approach`,
    DROP COLUMN `gallery`,
    DROP COLUMN `quote`,
    DROP COLUMN `sections`,
    DROP COLUMN `stats`;

-- CreateTable
CREATE TABLE `portfolioAddon` (
    `id` VARCHAR(36) NOT NULL,
    `portfolioId` VARCHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NULL,
    `imageUrl` TEXT NULL,
    `cards` JSON NULL,
    `author` VARCHAR(255) NULL,
    `authorRole` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `portfolioAddon_portfolioId_sortOrder_idx`(`portfolioId`, `sortOrder`),
    INDEX `portfolioAddon_portfolioId_type_idx`(`portfolioId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `portfolioAddon` ADD CONSTRAINT `portfolioAddon_portfolioId_fkey` FOREIGN KEY (`portfolioId`) REFERENCES `portfolio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
