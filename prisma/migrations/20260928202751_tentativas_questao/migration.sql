-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN "maxAttempts" INTEGER;

-- CreateTable
CREATE TABLE "ExamCodeRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamCodeRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamCodeRun_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExamCodeRun_userId_questionId_idx" ON "ExamCodeRun"("userId", "questionId");
