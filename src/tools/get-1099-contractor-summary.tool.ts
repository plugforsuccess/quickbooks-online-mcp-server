import { getQuickbooks1099ContractorSummary } from "../handlers/get-quickbooks-1099-contractor-summary.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_1099_contractor_summary";
const toolDescription =
  "Generate the 1099 Contractor (Vendor1099Contractor) summary from QuickBooks Online. Use to prepare 1099-NEC filings in January.";
const toolSchema = z.object({
  start_date: z.string().optional().describe("Start date (YYYY-MM-DD), typically Jan 1 of the tax year"),
  end_date: z.string().optional().describe("End date (YYYY-MM-DD), typically Dec 31 of the tax year"),
  vendor: z.string().optional().describe("Filter by vendor ID"),
  date_macro: z.string().optional().describe('e.g. "Last Year"'),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooks1099ContractorSummary(params);
  if (response.isError) return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  return {
    content: [
      { type: "text" as const, text: `1099 Contractor Summary:` },
      { type: "text" as const, text: JSON.stringify(response.result, null, 2) },
    ],
  };
};

export const Get1099ContractorSummaryTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
