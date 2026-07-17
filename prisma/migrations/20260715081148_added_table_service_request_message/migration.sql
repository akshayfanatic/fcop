-- CreateTable
CREATE TABLE `serviceRequestMessages` (
    `id` VARCHAR(36) NOT NULL,
    `serviceRequestId` VARCHAR(36) NOT NULL,
    `authorMemberId` VARCHAR(36) NOT NULL,
    `body` TEXT NOT NULL,
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `serviceRequestMessages_serviceRequestId_createdAt_idx`(`serviceRequestId`, `createdAt`),
    INDEX `serviceRequestMessages_authorMemberId_idx`(`authorMemberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `serviceRequestMessages` ADD CONSTRAINT `serviceRequestMessages_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `serviceRequests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `serviceRequestMessages` ADD CONSTRAINT `serviceRequestMessages_authorMemberId_fkey` FOREIGN KEY (`authorMemberId`) REFERENCES `member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
