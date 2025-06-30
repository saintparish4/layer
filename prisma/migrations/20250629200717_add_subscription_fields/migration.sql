-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('HOBBY', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "tenant" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "subscriptionPeriodStart" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'inactive',
ADD COLUMN     "subscriptionTier" "SubscriptionTier" DEFAULT 'HOBBY';

-- CreateIndex
CREATE INDEX "tenant_stripeCustomerId_idx" ON "tenant"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "tenant_stripeSubscriptionId_idx" ON "tenant"("stripeSubscriptionId");
