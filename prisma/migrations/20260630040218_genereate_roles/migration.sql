/*
  Warnings:

  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(0))`.

*/
-- AlterTable
-- MySQL cannot convert existing USER rows directly to an enum without USER.
-- First allow both old and new values, then migrate existing data, then remove USER.
ALTER TABLE `user` MODIFY `role` ENUM('USER', 'ADMIN', 'CLIENT', 'MANAGER', 'MEMBER') NOT NULL DEFAULT 'CLIENT';

UPDATE `user`
SET `role` = 'MEMBER'
WHERE `role` = 'USER';

ALTER TABLE `user` MODIFY `role` ENUM('ADMIN', 'CLIENT', 'MANAGER', 'MEMBER') NOT NULL DEFAULT 'CLIENT';
