/*
  Warnings:

  - You are about to drop the column `userAId` on the `Friend` table. All the data in the column will be lost.
  - You are about to drop the column `userBId` on the `Friend` table. All the data in the column will be lost.
  - Added the required column `friend_id` to the `Friend` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Friend` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Friend" DROP CONSTRAINT "Friend_userAId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Friend" DROP CONSTRAINT "Friend_userBId_fkey";

-- AlterTable
ALTER TABLE "Friend" DROP COLUMN "userAId",
DROP COLUMN "userBId",
ADD COLUMN     "friend_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
