/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT floor(random() * 90000 + 10000)::text;

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
