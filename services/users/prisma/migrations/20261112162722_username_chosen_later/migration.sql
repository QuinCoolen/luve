-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "username" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

