-- LifeSync integrity rules that Prisma's schema language cannot express.

-- Exactly-three-member household: seat ∈ {1,2,3} and UNIQUE(householdId, seat).
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_seat_range" CHECK ("seat" BETWEEN 1 AND 3);

-- Lower-cased e-mail addresses (case-insensitive identity).
ALTER TABLE "User" ADD CONSTRAINT "User_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_email_lowercase" CHECK ("email" = lower("email"));

-- Household currency is ISO-4217 upper-case.
ALTER TABLE "Household" ADD CONSTRAINT "Household_currency_iso" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "Household" ADD CONSTRAINT "Household_weekstart" CHECK ("weekStartsOn" BETWEEN 1 AND 7);

-- "HH:MM" wall-clock times and ISO weekdays on recurring templates.
ALTER TABLE "ShiftTemplate" ADD CONSTRAINT "ShiftTemplate_weekday" CHECK ("isoWeekday" BETWEEN 1 AND 7);
ALTER TABLE "ShiftTemplate" ADD CONSTRAINT "ShiftTemplate_times" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" <> "endTime");
ALTER TABLE "ShiftTemplate" ADD CONSTRAINT "ShiftTemplate_break" CHECK ("breakMinutes" >= 0);
ALTER TABLE "UniSessionTemplate" ADD CONSTRAINT "UniSessionTemplate_weekday" CHECK ("isoWeekday" BETWEEN 1 AND 7);
ALTER TABLE "UniSessionTemplate" ADD CONSTRAINT "UniSessionTemplate_times" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" < "endTime");
ALTER TABLE "PlacementSessionTemplate" ADD CONSTRAINT "PlacementSessionTemplate_weekday" CHECK ("isoWeekday" BETWEEN 1 AND 7);
ALTER TABLE "PlacementSessionTemplate" ADD CONSTRAINT "PlacementSessionTemplate_times" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" < "endTime");
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_weekday" CHECK ("isoWeekday" IS NULL OR "isoWeekday" BETWEEN 1 AND 7);
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_one_off_or_recurring" CHECK (
  ("startAt" IS NOT NULL AND "endAt" IS NOT NULL AND "endAt" > "startAt" AND "isoWeekday" IS NULL)
  OR ("startAt" IS NULL AND "isoWeekday" IS NOT NULL AND "startTime" IS NOT NULL AND "endTime" IS NOT NULL)
);
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_weekday" CHECK ("isoWeekday" IS NULL OR "isoWeekday" BETWEEN 1 AND 7);
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_interval" CHECK ("startAt" IS NULL OR "endAt" IS NULL OR "endAt" > "startAt");
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_cost" CHECK ("cost" IS NULL OR "cost" >= 0);

-- Time intervals must be positive.
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_interval" CHECK ("endAt" > "startAt");
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_money" CHECK (("expectedEarnings" IS NULL OR "expectedEarnings" >= 0) AND ("actualEarnings" IS NULL OR "actualEarnings" >= 0) AND "breakMinutes" >= 0);
ALTER TABLE "UniSession" ADD CONSTRAINT "UniSession_interval" CHECK ("endAt" > "startAt");
ALTER TABLE "PlacementSession" ADD CONSTRAINT "PlacementSession_interval" CHECK ("endAt" > "startAt");
ALTER TABLE "PlacementSession" ADD CONSTRAINT "PlacementSession_hours" CHECK ("hoursCompleted" IS NULL OR "hoursCompleted" >= 0);
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_interval" CHECK ("endAt" > "startAt");
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_confidence" CHECK ("confidence" BETWEEN 0 AND 1);
ALTER TABLE "Task" ADD CONSTRAINT "Task_durations" CHECK (("estimatedMinutes" IS NULL OR "estimatedMinutes" > 0) AND ("actualMinutes" IS NULL OR "actualMinutes" >= 0) AND "postponeCount" >= 0);
ALTER TABLE "Task" ADD CONSTRAINT "Task_completed_has_timestamp" CHECK ("status" <> 'COMPLETED' OR "completedAt" IS NOT NULL);

-- Stock can never go negative; quantities positive.
ALTER TABLE "GroceryProduct" ADD CONSTRAINT "GroceryProduct_stock" CHECK ("currentStock" >= 0 AND "minimumStock" >= 0 AND ("preferredQuantity" IS NULL OR "preferredQuantity" > 0));
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_qty" CHECK ("quantity" > 0 AND "balanceAfter" >= 0 AND abs("signedQuantity") = "quantity");
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_sign" CHECK (
  ("type" = 'STOCK_IN' AND "signedQuantity" > 0)
  OR ("type" IN ('STOCK_OUT','WASTE','EXPIRED') AND "signedQuantity" < 0)
  OR ("type" = 'ADJUSTMENT')
);
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_qty" CHECK ("quantity" > 0 AND ("estimatedPrice" IS NULL OR "estimatedPrice" >= 0) AND ("actualPrice" IS NULL OR "actualPrice" >= 0));

-- Money is never negative.
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_amount" CHECK ("totalAmount" >= 0);
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_amounts" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "lineTotal" >= 0);
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_amount" CHECK ("amount" >= 0 AND ("percentage" IS NULL OR "percentage" BETWEEN 0 AND 100));
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_amount" CHECK ("amount" > 0 AND "fromUserId" <> "toUserId");
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_amount" CHECK ("amount" >= 0 AND "dueDay" BETWEEN 1 AND 28);
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_amount" CHECK ("amount" >= 0);
ALTER TABLE "BillShare" ADD CONSTRAINT "BillShare_amount" CHECK ("amount" >= 0);
ALTER TABLE "BillContribution" ADD CONSTRAINT "BillContribution_amount" CHECK ("amount" > 0);
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_amount" CHECK ("amount" >= 0);
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_received_has_date" CHECK ("status" <> 'RECEIVED' OR "actualPaymentDate" IS NOT NULL);
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_amount" CHECK ("amount" >= 0);
ALTER TABLE "Job" ADD CONSTRAINT "Job_rate" CHECK (("hourlyRate" IS NULL OR "hourlyRate" >= 0) AND "travelMinutes" >= 0);

-- Only one live (DRAFT or APPROVED) plan per household per week.
CREATE UNIQUE INDEX "WeeklyPlan_one_live_per_week" ON "WeeklyPlan" ("householdId", "weekStart") WHERE "status" IN ('DRAFT', 'APPROVED');

-- Only one pending invitation per e-mail per household.
CREATE UNIQUE INDEX "Invitation_one_pending" ON "Invitation" ("householdId", "email") WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL;

-- Audit log is append-only.
CREATE OR REPLACE FUNCTION lifesync_audit_immutable() RETURNS trigger AS $$
BEGIN
  -- The only permitted change is ON DELETE SET NULL of the actor.
  IF NEW."actorId" IS NULL AND OLD."actorId" IS NOT NULL
     AND NEW."action" = OLD."action" AND NEW."entityType" = OLD."entityType"
     AND NEW."entityId" = OLD."entityId" AND NEW."createdAt" = OLD."createdAt"
     AND NEW."before" IS NOT DISTINCT FROM OLD."before"
     AND NEW."after" IS NOT DISTINCT FROM OLD."after" THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'AuditLog rows are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "AuditLog_no_update" BEFORE UPDATE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION lifesync_audit_immutable();
