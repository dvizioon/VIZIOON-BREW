-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "scoreScale" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "embedUrl" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "embedMode" TEXT NOT NULL DEFAULT 'local';
