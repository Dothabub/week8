-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "JobSlot" AS ENUM ('JOB1', 'JOB2');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('WORK', 'UNIVERSITY', 'PLACEMENT', 'HOUSEHOLD', 'SHOPPING', 'PERSONAL', 'PASTA', 'FILISHAKE', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'WORKED', 'CANCELLED', 'MISSED');

-- CreateEnum
CREATE TYPE "UniSessionType" AS ENUM ('LECTURE', 'SEMINAR', 'TUTORIAL', 'LAB', 'OTHER');

-- CreateEnum
CREATE TYPE "UniDeadlineKind" AS ENUM ('ASSIGNMENT', 'EXAM', 'OTHER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PLANNED', 'ATTENDED', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "CommitmentKind" AS ENUM ('FIXED', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PlanEngine" AS ENUM ('RULE_BASED', 'AI_ASSISTED');

-- CreateEnum
CREATE TYPE "PlanItemKind" AS ENUM ('FIXED_COMMITMENT', 'TASK', 'TRAVEL_BUFFER', 'REST', 'STUDY', 'SHOPPING', 'HOUSEHOLD', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "PlanItemDecision" AS ENUM ('PENDING', 'ACCEPTED', 'EDITED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScheduleSource" AS ENUM ('SHIFT', 'UNI_SESSION', 'PLACEMENT_SESSION', 'COMMITMENT', 'ACTIVITY', 'TASK', 'GENERATED');

-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('KG', 'GRAM', 'LITRE', 'ML', 'PACKET', 'PIECE', 'DOZEN');

-- CreateEnum
CREATE TYPE "StockTxnType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'WASTE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ShoppingListStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShoppingItemSource" AS ENUM ('MANUAL', 'LOW_STOCK', 'CONSUMPTION_FORECAST', 'MEAL_PLAN');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'GROCERY', 'RENT', 'BILL', 'TRAVEL', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseScope" AS ENUM ('PERSONAL', 'SHARED');

-- CreateEnum
CREATE TYPE "SplitMethod" AS ENUM ('EQUAL', 'CUSTOM_AMOUNT', 'PERCENTAGE', 'SINGLE_PAYER');

-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('BUS', 'TRAIN', 'UNDERGROUND', 'TAXI', 'FUEL', 'PARKING', 'OTHER');

-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('RENT', 'ELECTRICITY', 'GAS', 'WATER', 'INTERNET', 'COUNCIL_TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('JOB1', 'JOB2', 'PLACEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'LATE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORK_SHIFT', 'UNIVERSITY_CLASS', 'UNIVERSITY_DEADLINE', 'PLACEMENT', 'TASK_DEADLINE', 'RENT_DUE', 'BILL_DUE', 'LOW_STOCK', 'SHOPPING_REMINDER', 'HOUSEHOLD_TASK', 'PLAN_READY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'DISMISSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "emailVerifiedAt" TIMESTAMPTZ(6),
    "lastLoginAt" TIMESTAMPTZ(6),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "seat" INTEGER NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "dayStartTime" TEXT NOT NULL DEFAULT '07:00',
    "dayEndTime" TEXT NOT NULL DEFAULT '22:30',
    "maxWorkMinutesPerDay" INTEGER NOT NULL DEFAULT 600,
    "maxPlannedMinutesPerDay" INTEGER NOT NULL DEFAULT 720,
    "minRestMinutesBetween" INTEGER NOT NULL DEFAULT 15,
    "defaultTravelMinutes" INTEGER NOT NULL DEFAULT 30,
    "preferredShoppingDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "studyBlockMinutes" INTEGER NOT NULL DEFAULT 90,
    "behaviourAnalysisEnabled" BOOLEAN NOT NULL DEFAULT true,
    "shareEarningsWithHousehold" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "push" BOOLEAN NOT NULL DEFAULT false,
    "leadMinutes" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slot" "JobSlot" NOT NULL,
    "name" TEXT NOT NULL,
    "workplace" TEXT,
    "workplaceAddress" TEXT,
    "hourlyRate" DECIMAL(10,2),
    "travelMinutes" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftTemplate" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "isoWeekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "expectedEarnings" DECIMAL(12,2),
    "actualEarnings" DECIMAL(12,2),
    "actualStartAt" TIMESTAMPTZ(6),
    "actualEndAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniModule" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniSessionTemplate" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "type" "UniSessionType" NOT NULL,
    "isoWeekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "room" TEXT,
    "lecturerNotes" TEXT,
    "travelMinutes" INTEGER NOT NULL DEFAULT 30,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,

    CONSTRAINT "UniSessionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniSession" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "templateId" TEXT,
    "type" "UniSessionType" NOT NULL,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "room" TEXT,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,

    CONSTRAINT "UniSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniDeadline" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "kind" "UniDeadlineKind" NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "estimatedPrepMinutes" INTEGER,
    "completedAt" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "UniDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "location" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "requiredHours" DECIMAL(7,2),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" DECIMAL(10,2),
    "travelMinutes" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementSessionTemplate" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "isoWeekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,

    CONSTRAINT "PlacementSessionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementSession" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "templateId" TEXT,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'PLANNED',
    "hoursCompleted" DECIMAL(5,2),
    "tasks" TEXT,
    "learningActivities" TEXT,
    "notes" TEXT,

    CONSTRAINT "PlacementSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementDeadline" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMPTZ(6) NOT NULL,
    "completedAt" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "PlacementDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "CommitmentKind" NOT NULL DEFAULT 'FIXED',
    "startAt" TIMESTAMPTZ(6),
    "endAt" TIMESTAMPTZ(6),
    "isoWeekday" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "validFrom" DATE,
    "validUntil" DATE,
    "location" TEXT,
    "travelMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityCategory" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "CommitmentKind" NOT NULL DEFAULT 'FLEXIBLE',
    "startAt" TIMESTAMPTZ(6),
    "endAt" TIMESTAMPTZ(6),
    "isoWeekday" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "cost" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL DEFAULT 'PERSONAL',
    "activityCategoryId" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isHousehold" BOOLEAN NOT NULL DEFAULT false,
    "date" DATE,
    "startAt" TIMESTAMPTZ(6),
    "deadlineAt" TIMESTAMPTZ(6),
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "reminderAt" TIMESTAMPTZ(6),
    "postponeCount" INTEGER NOT NULL DEFAULT 0,
    "recurrenceId" TEXT,
    "planItemId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskRecurrence" (
    "id" TEXT NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "isoWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "dayOfMonth" INTEGER,
    "startTime" TEXT,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE,
    "template" JSONB NOT NULL,
    "rotateAssignees" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskRecurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus" NOT NULL,
    "fromDate" TIMESTAMPTZ(6),
    "toDate" TIMESTAMPTZ(6),
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "engine" "PlanEngine" NOT NULL DEFAULT 'RULE_BASED',
    "engineVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "diagnostics" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PlanItemKind" NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" "ScheduleSource" NOT NULL,
    "sourceId" TEXT,
    "reason" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "needsConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "decision" "PlanItemDecision" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "WeeklyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDecision" (
    "id" TEXT NOT NULL,
    "planItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decision" "PlanItemDecision" NOT NULL,
    "originalStart" TIMESTAMPTZ(6) NOT NULL,
    "originalEnd" TIMESTAMPTZ(6) NOT NULL,
    "finalStart" TIMESTAMPTZ(6),
    "finalEnd" TIMESTAMPTZ(6),
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryProduct" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "unit" "StockUnit" NOT NULL,
    "currentStock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "minimumStock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "preferredQuantity" DECIMAL(12,3),
    "lastPurchasePrice" DECIMAL(12,2),
    "lastPurchasedAt" TIMESTAMPTZ(6),
    "lastPurchasedById" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GroceryProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "StockTxnType" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "signedQuantity" DECIMAL(12,3) NOT NULL,
    "balanceAfter" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,2),
    "expiryDate" DATE,
    "expenseItemId" TEXT,
    "note" TEXT,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ShoppingListStatus" NOT NULL DEFAULT 'OPEN',
    "plannedDate" DATE,
    "assignedToId" TEXT,
    "expenseId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "StockUnit" NOT NULL,
    "estimatedPrice" DECIMAL(12,2),
    "actualPrice" DECIMAL(12,2),
    "source" "ShoppingItemSource" NOT NULL DEFAULT 'MANUAL',
    "sourceReason" TEXT,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "purchasedById" TEXT,
    "purchasedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "paidById" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "scope" "ExpenseScope" NOT NULL DEFAULT 'PERSONAL',
    "splitMethod" "SplitMethod" NOT NULL DEFAULT 'SINGLE_PAYER',
    "merchant" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "StockUnit",
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "category" TEXT,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseShare" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "percentage" DECIMAL(5,2),

    CONSTRAINT "ExpenseShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDetail" (
    "expenseId" TEXT NOT NULL,
    "transportType" "TransportType" NOT NULL,
    "fromPlace" TEXT,
    "toPlace" TEXT,
    "purpose" TEXT,

    CONSTRAINT "TravelDetail_pkey" PRIMARY KEY ("expenseId")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "settledAt" TIMESTAMPTZ(6) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringBill" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" "BillType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "splitConfig" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE,

    CONSTRAINT "RecurringBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "recurringBillId" TEXT,
    "type" "BillType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "periodMonth" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillShare" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "BillShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillContribution" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMPTZ(6) NOT NULL,
    "note" TEXT,

    CONSTRAINT "BillContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earning" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "IncomeSource" NOT NULL,
    "jobId" TEXT,
    "shiftId" TEXT,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "earnedDate" DATE NOT NULL,
    "expectedPaymentDate" DATE,
    "actualPaymentDate" DATE,
    "status" "PaymentStatus" NOT NULL DEFAULT 'EXPECTED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Earning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "category" "ExpenseCategory",
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "scheduledFor" TIMESTAMPTZ(6) NOT NULL,
    "sentAt" TIMESTAMPTZ(6),
    "readAt" TIMESTAMPTZ(6),
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviourEvent" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviourEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "validUntil" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_householdId_idx" ON "Membership"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_householdId_seat_key" ON "Membership"("householdId", "seat");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_householdId_email_idx" ON "Invitation"("householdId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_key" ON "NotificationPreference"("userId", "type");

-- CreateIndex
CREATE INDEX "Job_householdId_idx" ON "Job"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_userId_slot_key" ON "Job"("userId", "slot");

-- CreateIndex
CREATE INDEX "ShiftTemplate_jobId_idx" ON "ShiftTemplate"("jobId");

-- CreateIndex
CREATE INDEX "Shift_userId_startAt_idx" ON "Shift"("userId", "startAt");

-- CreateIndex
CREATE INDEX "Shift_householdId_startAt_idx" ON "Shift"("householdId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_templateId_startAt_key" ON "Shift"("templateId", "startAt");

-- CreateIndex
CREATE INDEX "UniModule_userId_idx" ON "UniModule"("userId");

-- CreateIndex
CREATE INDEX "UniSessionTemplate_moduleId_idx" ON "UniSessionTemplate"("moduleId");

-- CreateIndex
CREATE INDEX "UniSession_moduleId_startAt_idx" ON "UniSession"("moduleId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "UniSession_templateId_startAt_key" ON "UniSession"("templateId", "startAt");

-- CreateIndex
CREATE INDEX "UniDeadline_moduleId_dueAt_idx" ON "UniDeadline"("moduleId", "dueAt");

-- CreateIndex
CREATE INDEX "Placement_userId_idx" ON "Placement"("userId");

-- CreateIndex
CREATE INDEX "PlacementSessionTemplate_placementId_idx" ON "PlacementSessionTemplate"("placementId");

-- CreateIndex
CREATE INDEX "PlacementSession_placementId_startAt_idx" ON "PlacementSession"("placementId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementSession_templateId_startAt_key" ON "PlacementSession"("templateId", "startAt");

-- CreateIndex
CREATE INDEX "PlacementDeadline_placementId_dueAt_idx" ON "PlacementDeadline"("placementId", "dueAt");

-- CreateIndex
CREATE INDEX "Commitment_userId_startAt_idx" ON "Commitment"("userId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_householdId_key_key" ON "ActivityCategory"("householdId", "key");

-- CreateIndex
CREATE INDEX "Activity_userId_startAt_idx" ON "Activity"("userId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "Task_planItemId_key" ON "Task"("planItemId");

-- CreateIndex
CREATE INDEX "Task_householdId_date_idx" ON "Task"("householdId", "date");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_date_idx" ON "Task"("assigneeId", "status", "date");

-- CreateIndex
CREATE INDEX "Task_householdId_isHousehold_status_idx" ON "Task"("householdId", "isHousehold", "status");

-- CreateIndex
CREATE INDEX "Task_deadlineAt_idx" ON "Task"("deadlineAt");

-- CreateIndex
CREATE INDEX "TaskNote_taskId_idx" ON "TaskNote"("taskId");

-- CreateIndex
CREATE INDEX "TaskEvent_taskId_createdAt_idx" ON "TaskEvent"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "WeeklyPlan_householdId_weekStart_status_idx" ON "WeeklyPlan"("householdId", "weekStart", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlan_householdId_weekStart_version_key" ON "WeeklyPlan"("householdId", "weekStart", "version");

-- CreateIndex
CREATE INDEX "WeeklyPlanItem_planId_userId_startAt_idx" ON "WeeklyPlanItem"("planId", "userId", "startAt");

-- CreateIndex
CREATE INDEX "PlanDecision_userId_createdAt_idx" ON "PlanDecision"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GroceryProduct_householdId_active_idx" ON "GroceryProduct"("householdId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryProduct_householdId_name_key" ON "GroceryProduct"("householdId", "name");

-- CreateIndex
CREATE INDEX "StockTransaction_productId_occurredAt_idx" ON "StockTransaction"("productId", "occurredAt");

-- CreateIndex
CREATE INDEX "StockTransaction_householdId_type_occurredAt_idx" ON "StockTransaction"("householdId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "StockTransaction_expiryDate_idx" ON "StockTransaction"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingList_expenseId_key" ON "ShoppingList"("expenseId");

-- CreateIndex
CREATE INDEX "ShoppingList_householdId_status_idx" ON "ShoppingList"("householdId", "status");

-- CreateIndex
CREATE INDEX "ShoppingListItem_listId_idx" ON "ShoppingListItem"("listId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_productId_idx" ON "ShoppingListItem"("productId");

-- CreateIndex
CREATE INDEX "Expense_householdId_category_occurredAt_idx" ON "Expense"("householdId", "category", "occurredAt");

-- CreateIndex
CREATE INDEX "Expense_paidById_occurredAt_idx" ON "Expense"("paidById", "occurredAt");

-- CreateIndex
CREATE INDEX "ExpenseItem_expenseId_idx" ON "ExpenseItem"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseItem_productId_idx" ON "ExpenseItem"("productId");

-- CreateIndex
CREATE INDEX "ExpenseShare_userId_idx" ON "ExpenseShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseShare_expenseId_userId_key" ON "ExpenseShare"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "Settlement_householdId_settledAt_idx" ON "Settlement"("householdId", "settledAt");

-- CreateIndex
CREATE INDEX "RecurringBill_householdId_idx" ON "RecurringBill"("householdId");

-- CreateIndex
CREATE INDEX "Bill_householdId_dueDate_idx" ON "Bill"("householdId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_recurringBillId_periodMonth_key" ON "Bill"("recurringBillId", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "BillShare_billId_userId_key" ON "BillShare"("billId", "userId");

-- CreateIndex
CREATE INDEX "BillContribution_billId_idx" ON "BillContribution"("billId");

-- CreateIndex
CREATE INDEX "BillContribution_userId_paidAt_idx" ON "BillContribution"("userId", "paidAt");

-- CreateIndex
CREATE INDEX "Earning_userId_earnedDate_idx" ON "Earning"("userId", "earnedDate");

-- CreateIndex
CREATE INDEX "Earning_householdId_earnedDate_idx" ON "Earning"("householdId", "earnedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_householdId_month_category_key" ON "Budget"("householdId", "month", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_scheduledFor_idx" ON "Notification"("userId", "readAt", "scheduledFor");

-- CreateIndex
CREATE INDEX "BehaviourEvent_userId_type_occurredAt_idx" ON "BehaviourEvent"("userId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "BehaviourEvent_householdId_type_occurredAt_idx" ON "BehaviourEvent"("householdId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "Recommendation_householdId_status_idx" ON "Recommendation"("householdId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_householdId_createdAt_idx" ON "AuditLog"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftTemplate" ADD CONSTRAINT "ShiftTemplate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ShiftTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniModule" ADD CONSTRAINT "UniModule_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniModule" ADD CONSTRAINT "UniModule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniSessionTemplate" ADD CONSTRAINT "UniSessionTemplate_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "UniModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniSession" ADD CONSTRAINT "UniSession_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "UniModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniSession" ADD CONSTRAINT "UniSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "UniSessionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniDeadline" ADD CONSTRAINT "UniDeadline_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "UniModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSessionTemplate" ADD CONSTRAINT "PlacementSessionTemplate_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSession" ADD CONSTRAINT "PlacementSession_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSession" ADD CONSTRAINT "PlacementSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PlacementSessionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementDeadline" ADD CONSTRAINT "PlacementDeadline_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCategory" ADD CONSTRAINT "ActivityCategory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_activityCategoryId_fkey" FOREIGN KEY ("activityCategoryId") REFERENCES "ActivityCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "TaskRecurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "WeeklyPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDecision" ADD CONSTRAINT "PlanDecision_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "WeeklyPlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDecision" ADD CONSTRAINT "PlanDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryProduct" ADD CONSTRAINT "GroceryProduct_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryProduct" ADD CONSTRAINT "GroceryProduct_lastPurchasedById_fkey" FOREIGN KEY ("lastPurchasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "GroceryProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_expenseItemId_fkey" FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "GroceryProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "GroceryProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDetail" ADD CONSTRAINT "TravelDetail_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_recurringBillId_fkey" FOREIGN KEY ("recurringBillId") REFERENCES "RecurringBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillShare" ADD CONSTRAINT "BillShare_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillContribution" ADD CONSTRAINT "BillContribution_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillContribution" ADD CONSTRAINT "BillContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviourEvent" ADD CONSTRAINT "BehaviourEvent_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviourEvent" ADD CONSTRAINT "BehaviourEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
