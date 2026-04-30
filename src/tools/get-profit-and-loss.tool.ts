import { getQuickbooksProfitAndLoss } from "../handlers/get-quickbooks-profit-and-loss.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_profit_and_loss";
const toolDescription =
  "Generate a Profit and Loss (Income Statement) report from QuickBooks Online. Returns both the raw QBO response and a flattened, easier-to-consume normalized shape.";
const toolSchema = z.object({
  start_date: z.string().optional().describe("Start date (YYYY-MM-DD). Required unless date_macro is supplied."),
  end_date: z.string().optional().describe("End date (YYYY-MM-DD). Required unless date_macro is supplied."),
  accounting_method: z
    .enum(["Cash", "Accrual"])
    .optional()
    .describe("Cash or Accrual. NOTE: QBO web UI may default differently from the API; mismatched totals are usually this."),
  summarize_column_by: z
    .enum(["Total", "Month", "Quarter", "Year", "Week", "Days"])
    .optional()
    .describe('How to summarize columns. Use "Month" with a quarterly date range to get a 3-column monthly breakdown in one call.'),
  date_macro: z
    .string()
    .optional()
    .describe('Convenience date range, e.g. "This Month", "Last Quarter", "Year to Date".'),
  customer: z.string().optional().describe("Filter by customer ID"),
  vendor: z.string().optional().describe("Filter by vendor ID"),
  item: z.string().optional().describe("Filter by item ID"),
  department: z.string().optional().describe("Filter by department ID"),
  class: z.string().optional().describe("Filter by class ID"),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksProfitAndLoss(params);
  if (response.isError) return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  return {
    content: [
      { type: "text" as const, text: `Profit and Loss Report:` },
      { type: "text" as const, text: JSON.stringify(response.result, null, 2) },
    ],
  };
};

export const GetProfitAndLossTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
