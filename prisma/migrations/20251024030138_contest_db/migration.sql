/*
  Warnings:

  - You are about to drop the column `description` on the `problems` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `problems` table. All the data in the column will be lost.
  - You are about to drop the column `inputSpec` on the `problems` table. All the data in the column will be lost.
  - You are about to drop the column `outputSpec` on the `problems` table. All the data in the column will be lost.
  - You are about to drop the column `sampleInput` on the `problems` table. All the data in the column will be lost.
  - You are about to drop the column `sampleOutput` on the `problems` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `problems` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `team_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "problems" DROP COLUMN "description",
DROP COLUMN "difficulty",
DROP COLUMN "inputSpec",
DROP COLUMN "outputSpec",
DROP COLUMN "sampleInput",
DROP COLUMN "sampleOutput",
DROP COLUMN "tags";

-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "role";
