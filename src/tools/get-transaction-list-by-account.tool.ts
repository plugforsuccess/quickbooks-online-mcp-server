import { getQuickbooksTransactionList } from "../handlers/get-quickbooks-transaction-list.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_transaction_list_by_account";
const toolDescription =
  "Generate a Transaction List report from QuickBooks Online (substantiates account activity for tax prep). Returns both raw and normalized shapes.";
const toolSchema = z.object({
  start_date: z.string().describe("Start date (YYYY-MM-DD)"),
  end_date: z.string().describe("End date (YYYY-MM-DD)"),
  account: z.string().optional().describe("Filter by account ID or name"),
  transaction_type: z
    .string()
    .optional()
    .describe("Filter by transaction type, e.g. 'Bill', 'Invoice', 'JournalEntry'"),
  customer: z.string().optional().describe("Filter by customer ID"),
  vendor: z.string().optional().describe("Filter by vendor ID"),
  name: z.string().optional().describe("Filter by name (customer/vendor display name)"),
  memo: z.string().optional().describe("Filter by memo text"),
  date_macro: z.string().optional().describe('e.g. "Year to Date"'),
  accounting_method: z.enum(["Cash", "Accrual"]).optional().describe("Cash or Accrual"),
  columns: z
    .string()
    .optional()
    .describe("Comma-separated subset of columns to include"),
  sort_by: z.string().optional().describe("Field to sort by"),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksTransactionList(params);
  if (response.isError) return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  return {
    content: [
      { type: "text" as const, text: `Transaction List:` },
      { type: "text" as const, text: JSON.stringify(response.result, null, 2) },
    ],
  };
};

export const GetTransactionListByAccountTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
