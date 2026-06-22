-- Drop foreign key constraint
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_tableId_fkey";

-- Drop index on tableId
DROP INDEX "Ticket_tableId_idx";

-- Drop tableId column from Ticket
ALTER TABLE "Ticket" DROP COLUMN "tableId";

-- Drop Table table
DROP TABLE "Table";
