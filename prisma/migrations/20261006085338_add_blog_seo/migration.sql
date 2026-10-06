-- CreateTable
CREATE TABLE `blogSeo` (
    `id` VARCHAR(36) NOT NULL,
    `blogId` VARCHAR(36) NOT NULL,
    `metaTitle` VARCHAR(255) NOT NULL,
    `metaDescription` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blogSeo_blogId_key`(`blogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blogSeo` ADD CONSTRAINT `blogSeo_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
