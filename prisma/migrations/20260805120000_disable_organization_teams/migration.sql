-- DropTable
DROP TABLE `teamMember`;

-- DropTable
DROP TABLE `team`;

-- AlterTable
ALTER TABLE `invitation` DROP COLUMN `teamId`;

-- AlterTable
ALTER TABLE `session` DROP COLUMN `activeTeamId`;
