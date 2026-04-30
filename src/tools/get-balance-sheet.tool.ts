import { getQuickbooksBalanceSheet } from "../handlers/get-quickbooks-balance-sheet.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_balance_sheet";
const toolDescription =
  "Generate a Balance Sheet report from QuickBooks Online showing assets, liabilities, and equity. Returns both raw and normalized shapes.";
const toolSchema = z.object({
  as_of_date: z
    .string()
    .optional()
    .describe('"As of" date (YYYY-MM-DD). Balance Sheet is point-in-time.'),
  end_date: z
    .string()
    .optional()
    .describe("Alias for as_of_date kept for backwards compatibility."),
  start_date: z.string().optional().describe("Start date (YYYY-MM-DD), only meaningful with summarize_column_by."),
  accounting_method: z.enum(["Cash", "Accrual"]).optional().describe("Cash or Accrual"),
  summarize_column_by: z
    .enum(["Total", "Month", "Quarter", "Year", "Week", "Days"])
    .optional()
    .describe("How to summarize columns"),
  date_macro: z.string().optional().describe('e.g. "This Month", "Year to Date"'),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksBalanceSheet(params);
  if (response.isError) return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  return {
    content: [
      { type: "text" as const, text: `Balance Sheet Report:` },
      { type: "text" as const, text: JSON.stringify(response.result, null, 2) },
    ],
  };
};

export const GetBalanceSheetTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
