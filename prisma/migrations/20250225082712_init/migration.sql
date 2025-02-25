-- AlterTable
ALTER TABLE "User" ALTER COLUMN "userId" SET DEFAULT floor(random() * 90000 + 10000)::text;
