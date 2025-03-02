-- CreateTable
CREATE TABLE "ModelConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "modelPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Part" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "defaultValue" TEXT NOT NULL,
    "modelConfigId" INTEGER NOT NULL,
    CONSTRAINT "Part_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "ModelConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourcePartId" INTEGER NOT NULL,
    "targetPartId" INTEGER NOT NULL,
    "rule" TEXT NOT NULL,
    CONSTRAINT "Dependency_sourcePartId_fkey" FOREIGN KEY ("sourcePartId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dependency_targetPartId_fkey" FOREIGN KEY ("targetPartId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
