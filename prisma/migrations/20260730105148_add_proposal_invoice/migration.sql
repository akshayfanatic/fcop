/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `clients` ADD COLUMN `stripeCustomerId` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `proposals` (
    `id` VARCHAR(36) NOT NULL,
    `serviceRequestId` VARCHAR(36) NOT NULL,
    `createdByMemberId` VARCHAR(36) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` ENUM('USD', 'AED') NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED') NOT NULL DEFAULT 'DRAFT',
    `paymentStatus` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `acceptedAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `stripeInvoiceId` VARCHAR(255) NULL,
    `stripeInvoiceNumber` VARCHAR(255) NULL,
    `stripeHostedInvoiceUrl` TEXT NULL,
    `stripeInvoicePdfUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `proposals_serviceRequestId_key`(`serviceRequestId`),
    UNIQUE INDEX `proposals_stripeInvoiceId_key`(`stripeInvoiceId`),
    INDEX `proposals_createdByMemberId_idx`(`createdByMemberId`),
    INDEX `proposals_status_idx`(`status`),
    INDEX `proposals_paymentStatus_idx`(`paymentStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `clients_stripeCustomerId_key` ON `clients`(`stripeCustomerId`);

-- AddForeignKey
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `serviceRequests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_createdByMemberId_fkey` FOREIGN KEY (`createdByMemberId`) REFERENCES `member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
