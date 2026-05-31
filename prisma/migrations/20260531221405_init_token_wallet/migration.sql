-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant_kitchen";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant_souq";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant_timebank";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant_tutor";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "core"."Role" AS ENUM ('USER', 'PROVIDER', 'TENANT_ADMIN', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "core"."TenantTier" AS ENUM ('FREE', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "core"."KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "core"."IncidentType" AS ENUM ('FRAUD', 'SCAM', 'ABUSE', 'SPAM', 'IMPERSONATION', 'POLICY_VIOLATION', 'OTHER');

-- CreateTable
CREATE TABLE "core"."GlobalUser" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "role" "core"."Role" NOT NULL DEFAULT 'USER',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Tenant" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "schemaName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tierLevel" "core"."TenantTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."KycRegistry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedIdPath" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "status" "core"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."EcosystemSharedReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "offenderId" TEXT NOT NULL,
    "incidentType" "core"."IncidentType" NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "isPlatformWideBanned" BOOLEAN NOT NULL DEFAULT false,
    "originSubdomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcosystemSharedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."EcosystemCrossMatches" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sourceSubdomain" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcosystemCrossMatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."SemanticProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "embedding" vector(768),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."TokenWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessTokens" INTEGER NOT NULL DEFAULT 0,
    "individualTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."TokenAllocation" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "allocatedAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."TokenTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ActivityPricing" (
    "id" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_souq"."SouqListing" (
    "id" TEXT NOT NULL,
    "ownerGlobalUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SouqListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_kitchen"."KitchenMenuItem" (
    "id" TEXT NOT NULL,
    "ownerGlobalUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitchenMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_tutor"."TutorBooking" (
    "id" TEXT NOT NULL,
    "ownerGlobalUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_timebank"."TimeBankOffer" (
    "id" TEXT NOT NULL,
    "ownerGlobalUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeBankOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalUser_phoneNumber_key" ON "core"."GlobalUser"("phoneNumber");

-- CreateIndex
CREATE INDEX "GlobalUser_trustScore_idx" ON "core"."GlobalUser"("trustScore");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "core"."Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_schemaName_key" ON "core"."Tenant"("schemaName");

-- CreateIndex
CREATE INDEX "Tenant_isActive_idx" ON "core"."Tenant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "KycRegistry_userId_key" ON "core"."KycRegistry"("userId");

-- CreateIndex
CREATE INDEX "KycRegistry_status_idx" ON "core"."KycRegistry"("status");

-- CreateIndex
CREATE INDEX "EcosystemSharedReport_offenderId_idx" ON "core"."EcosystemSharedReport"("offenderId");

-- CreateIndex
CREATE INDEX "EcosystemSharedReport_incidentType_idx" ON "core"."EcosystemSharedReport"("incidentType");

-- CreateIndex
CREATE INDEX "EcosystemCrossMatches_sourceSubdomain_idx" ON "core"."EcosystemCrossMatches"("sourceSubdomain");

-- CreateIndex
CREATE INDEX "EcosystemCrossMatches_eventType_idx" ON "core"."EcosystemCrossMatches"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "SemanticProfile_userId_key" ON "core"."SemanticProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenWallet_userId_key" ON "core"."TokenWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenAllocation_walletId_activityType_tokenType_key" ON "core"."TokenAllocation"("walletId", "activityType", "tokenType");

-- CreateIndex
CREATE INDEX "TokenTransaction_walletId_createdAt_idx" ON "core"."TokenTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityPricing_activityType_key" ON "core"."ActivityPricing"("activityType");

-- AddForeignKey
ALTER TABLE "core"."KycRegistry" ADD CONSTRAINT "KycRegistry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core"."GlobalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."EcosystemSharedReport" ADD CONSTRAINT "EcosystemSharedReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "core"."GlobalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."EcosystemSharedReport" ADD CONSTRAINT "EcosystemSharedReport_offenderId_fkey" FOREIGN KEY ("offenderId") REFERENCES "core"."GlobalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."SemanticProfile" ADD CONSTRAINT "SemanticProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core"."GlobalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."TokenWallet" ADD CONSTRAINT "TokenWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core"."GlobalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."TokenAllocation" ADD CONSTRAINT "TokenAllocation_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "core"."TokenWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."TokenTransaction" ADD CONSTRAINT "TokenTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "core"."TokenWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
