/*
  Warnings:

  - You are about to drop the column `path` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `storedName` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceType` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "path",
DROP COLUMN "storedName",
ADD COLUMN     "publicId" TEXT NOT NULL,
ADD COLUMN     "resourceType" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_publicId_key" ON "File"("publicId");
