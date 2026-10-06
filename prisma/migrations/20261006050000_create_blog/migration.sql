-- CreateTable
CREATE TABLE `blog` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` JSON NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `featureImage` TEXT NULL,
    `excerpt` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_slug_key`(`slug`),
    INDEX `blog_isPublished_createdAt_idx`(`isPublished`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
