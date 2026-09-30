CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    CONSTRAINT "Activity_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Activity_moduleId_order_idx" ON "Activity"("moduleId", "order");

CREATE TABLE "ActivityQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ActivityQuestion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ActivityQuestion_activityId_order_idx" ON "ActivityQuestion"("activityId", "order");

CREATE TABLE "ActivityCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "stdin" TEXT NOT NULL DEFAULT '',
    "expectedStdout" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    CONSTRAINT "ActivityCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ActivityQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ActivityDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityDelivery_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ActivityDelivery_userId_activityId_idx" ON "ActivityDelivery"("userId", "activityId");

CREATE TABLE "ActivityAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL DEFAULT '',
    "passed" BOOLEAN NOT NULL,
    CONSTRAINT "ActivityAnswer_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "ActivityDelivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ActivityQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "LabWorkspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "files" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LabWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LabWorkspace_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LabWorkspace_userId_challengeId_key" ON "LabWorkspace"("userId", "challengeId");
