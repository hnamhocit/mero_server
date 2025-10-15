/*
  Warnings:

  - You are about to drop the column `friend_id` on the `Friend` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Friend` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[conversationId,userId]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friendId` to the `Friend` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Friend` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Friend" DROP CONSTRAINT "Friend_friend_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Friend" DROP CONSTRAINT "Friend_user_id_fkey";

-- AlterTable
ALTER TABLE "Friend" DROP COLUMN "friend_id",
DROP COLUMN "user_id",
ADD COLUMN     "friendId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_conversationId_userId_key" ON "Participant"("conversationId", "userId");

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
