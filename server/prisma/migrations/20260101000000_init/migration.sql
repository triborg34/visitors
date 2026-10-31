-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "activeExhibitionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "users_activeExhibitionId_fkey" FOREIGN KEY ("activeExhibitionId") REFERENCES "exhibitions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exhibitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "company" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorId" TEXT NOT NULL,
    "exhibitionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "sendThankYou" BOOLEAN NOT NULL DEFAULT false,
    "preferredPlatform" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" DATETIME,
    "consentContext" TEXT,
    "followUpStatus" TEXT NOT NULL DEFAULT 'NEW',
    "assignedEmployeeId" TEXT,
    "visitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "visits_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "visits_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "exhibitions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "visits_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "visits_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "lastContactAt" DATETIME,
    "nextFollowUpAt" DATETIME,
    "assignedEmployeeId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "follow_ups_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "platform" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "templateKey" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "providerMessageId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "message_logs_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT '╪º┘à┘åΓÇî╪ó┘ü╪▒█î┘å╪º┘å',
    "description" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "catalogUrl" TEXT,
    "defaultPlatform" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "updatedAt" DATETIME NOT NULL,
    "updatedById" TEXT
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "exhibitions_status_idx" ON "exhibitions"("status");

-- CreateIndex
CREATE INDEX "exhibitions_deletedAt_idx" ON "exhibitions"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_mobile_key" ON "visitors"("mobile");

-- CreateIndex
CREATE INDEX "visitors_fullName_idx" ON "visitors"("fullName");

-- CreateIndex
CREATE INDEX "visitors_company_idx" ON "visitors"("company");

-- CreateIndex
CREATE INDEX "visitors_deletedAt_idx" ON "visitors"("deletedAt");

-- CreateIndex
CREATE INDEX "visits_exhibitionId_idx" ON "visits"("exhibitionId");

-- CreateIndex
CREATE INDEX "visits_employeeId_idx" ON "visits"("employeeId");

-- CreateIndex
CREATE INDEX "visits_followUpStatus_idx" ON "visits"("followUpStatus");

-- CreateIndex
CREATE INDEX "visits_priority_idx" ON "visits"("priority");

-- CreateIndex
CREATE INDEX "visits_requestType_idx" ON "visits"("requestType");

-- CreateIndex
CREATE INDEX "visits_marketingConsent_idx" ON "visits"("marketingConsent");

-- CreateIndex
CREATE INDEX "visits_createdAt_idx" ON "visits"("createdAt");

-- CreateIndex
CREATE INDEX "visits_deletedAt_idx" ON "visits"("deletedAt");

-- CreateIndex
CREATE INDEX "follow_ups_visitId_idx" ON "follow_ups"("visitId");

-- CreateIndex
CREATE INDEX "follow_ups_nextFollowUpAt_idx" ON "follow_ups"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "follow_ups_status_idx" ON "follow_ups"("status");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_key_key" ON "message_templates"("key");

-- CreateIndex
CREATE INDEX "message_templates_isActive_idx" ON "message_templates"("isActive");

-- CreateIndex
CREATE INDEX "message_logs_visitId_idx" ON "message_logs"("visitId");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "message_logs_createdAt_idx" ON "message_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

