DROP TABLE IF EXISTS "LabWorkspace";

CREATE TABLE "LabSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "score" INTEGER,
    "comment" TEXT NOT NULL DEFAULT '',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LabSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LabSubmission_challengeId_createdAt_idx" ON "LabSubmission"("challengeId", "createdAt");
CREATE INDEX "LabSubmission_userId_challengeId_idx" ON "LabSubmission"("userId", "challengeId");

DROP TABLE IF EXISTS "ExamAnswer";
DROP TABLE IF EXISTS "ExamCodeRun";
DROP TABLE IF EXISTS "ExamOption";
DROP TABLE IF EXISTS "ExamCase";
DROP TABLE IF EXISTS "ExamSitting";
DROP TABLE IF EXISTS "ExamAttempt";
DROP TABLE IF EXISTS "ExamQuestion";
DROP TABLE IF EXISTS "Exam";
