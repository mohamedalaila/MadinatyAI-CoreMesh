/*
  Warnings:

  - You are about to drop the column `ownerGlobalUserId` on the `KitchenMenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `ownerGlobalUserId` on the `TutorBooking` table. All the data in the column will be lost.
  - Added the required column `businessId` to the `KitchenMenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `TutorBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `TutorBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tenant_kitchen"."KitchenMenuItem" DROP COLUMN "ownerGlobalUserId",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tenant_tutor"."TutorBooking" DROP COLUMN "ownerGlobalUserId",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "subject" TEXT;

-- CreateTable
CREATE TABLE "tenant_kitchen"."KitchenBusiness" (
    "id" TEXT NOT NULL,
    "ownerGlobalUserId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branding" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "cuisineType" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "openingHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_tutor"."TutorBusiness" (
    "id" TEXT NOT NULL,
    "ownerGlobalUserId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branding" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "subjects" TEXT[],
    "qualifications" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "address" TEXT,
    "phone" TEXT,
    "availability" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KitchenBusiness_slug_key" ON "tenant_kitchen"."KitchenBusiness"("slug");

-- CreateIndex
CREATE INDEX "KitchenBusiness_ownerGlobalUserId_idx" ON "tenant_kitchen"."KitchenBusiness"("ownerGlobalUserId");

-- CreateIndex
CREATE INDEX "KitchenBusiness_isActive_idx" ON "tenant_kitchen"."KitchenBusiness"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TutorBusiness_slug_key" ON "tenant_tutor"."TutorBusiness"("slug");

-- CreateIndex
CREATE INDEX "TutorBusiness_ownerGlobalUserId_idx" ON "tenant_tutor"."TutorBusiness"("ownerGlobalUserId");

-- CreateIndex
CREATE INDEX "TutorBusiness_isActive_idx" ON "tenant_tutor"."TutorBusiness"("isActive");

-- CreateIndex
CREATE INDEX "KitchenMenuItem_businessId_idx" ON "tenant_kitchen"."KitchenMenuItem"("businessId");

-- CreateIndex
CREATE INDEX "TutorBooking_businessId_idx" ON "tenant_tutor"."TutorBooking"("businessId");

-- CreateIndex
CREATE INDEX "TutorBooking_studentId_idx" ON "tenant_tutor"."TutorBooking"("studentId");

-- AddForeignKey
ALTER TABLE "tenant_kitchen"."KitchenMenuItem" ADD CONSTRAINT "KitchenMenuItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "tenant_kitchen"."KitchenBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_tutor"."TutorBooking" ADD CONSTRAINT "TutorBooking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "tenant_tutor"."TutorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
