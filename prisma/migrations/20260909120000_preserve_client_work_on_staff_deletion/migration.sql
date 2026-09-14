-- DropForeignKey
ALTER TABLE `proposals` DROP FOREIGN KEY `proposals_createdByMemberId_fkey`;

-- DropForeignKey
ALTER TABLE `projects` DROP FOREIGN KEY `projects_createdByMemberId_fkey`;

-- DropForeignKey
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_createdByMemberId_fkey`;

-- AlterTable
ALTER TABLE `proposals` MODIFY `createdByMemberId` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `projects` MODIFY `createdByMemberId` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `tasks` MODIFY `createdByMemberId` VARCHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_createdByMemberId_fkey` FOREIGN KEY (`createdByMemberId`) REFERENCES `member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_createdByMemberId_fkey` FOREIGN KEY (`createdByMemberId`) REFERENCES `member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_createdByMemberId_fkey` FOREIGN KEY (`createdByMemberId`) REFERENCES `member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
