/*
  Warnings:

  - Changed the type of `expiresAt` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expiresAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
