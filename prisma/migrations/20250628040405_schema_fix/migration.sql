/*
  Warnings:

  - You are about to drop the `tenant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tenant" DROP CONSTRAINT "tenant_ownerId_fkey";

-- DropTable
DROP TABLE "tenant";
