-- CreateTable
CREATE TABLE "Report" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "includeContacts" BOOLEAN NOT NULL DEFAULT true,
  "includeFinancial" BOOLEAN NOT NULL DEFAULT true,
  "fileName" TEXT,
  "fileUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
