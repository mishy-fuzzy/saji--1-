-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_role_isSuspended_idx" ON "User"("role", "isSuspended");
