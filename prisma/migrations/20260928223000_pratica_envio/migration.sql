CREATE TABLE "PracticeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '',
    "filePath" TEXT,
    "fileName" TEXT NOT NULL DEFAULT '',
    "score" REAL,
    "comment" TEXT NOT NULL DEFAULT '',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PracticeSubmission_questionId_createdAt_idx" ON "PracticeSubmission"("questionId", "createdAt");
CREATE INDEX "PracticeSubmission_userId_questionId_idx" ON "PracticeSubmission"("userId", "questionId");
