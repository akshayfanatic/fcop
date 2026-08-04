-- DropForeignKey
ALTER TABLE `serviceRequestMessages` DROP FOREIGN KEY `serviceRequestMessages_authorMemberId_fkey`;

-- DropForeignKey
ALTER TABLE `serviceRequestMessages` DROP FOREIGN KEY `serviceRequestMessages_serviceRequestId_fkey`;

-- DropTable
DROP TABLE `serviceRequestMessages`;
