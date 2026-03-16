/*
  Warnings:

  - The primary key for the `avatar` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ranking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ranking_global` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `ranking` DROP FOREIGN KEY `ranking_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `ranking_global` DROP FOREIGN KEY `ranking_global_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `user_avatar_id_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `user_course_id_fkey`;

-- AlterTable
ALTER TABLE `avatar` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `course` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ranking` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `user_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ranking_global` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `user_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `avatar_id` BIGINT NOT NULL DEFAULT 1,
    MODIFY `course_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE INDEX `ranking_score_idx` ON `ranking`(`score` DESC);

-- CreateIndex
CREATE INDEX `ranking_global_score_idx` ON `ranking_global`(`score` DESC);

-- CreateIndex
CREATE INDEX `user_max_score_idx` ON `user`(`max_score`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_avatar_id_fkey` FOREIGN KEY (`avatar_id`) REFERENCES `avatar`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ranking` ADD CONSTRAINT `ranking_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ranking_global` ADD CONSTRAINT `ranking_global_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `user_avatar_id_fkey` TO `user_avatar_id_idx`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `user_course_id_fkey` TO `user_course_id_idx`;
