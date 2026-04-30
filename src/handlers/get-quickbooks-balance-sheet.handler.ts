import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { normalizeReport } from "../helpers/normalize-report.js";
import { validateIsoDate } from "../helpers/validate-date.js";
import { ReportResult } from "./get-quickbooks-profit-and-loss.handler.js";

export interface BalanceSheetOptions {
  // Balance Sheet is a point-in-time report; QBO uses end_date as the
  // "as of" date. Accept as_of_date for clarity but keep end_date as an
  // alias so existing callers still work.
  as_of_date?: string;
  end_date?: string;
  start_date?: string;
  accounting_method?: "Cash" | "Accrual";
  summarize_column_by?: "Total" | "Month" | "Quarter" | "Year" | "Week" | "Days";
  date_macro?: string;
}

export async function getQuickbooksBalanceSheet(
  options: BalanceSheetOptions
): Promise<ToolResponse<ReportResult>> {
  try {
    const asOf = options.as_of_date ?? options.end_date;
    validateIsoDate(asOf, "as_of_date");
    validateIsoDate(options.start_date, "start_date");
    const raw = await quickbooksClient.fetchReport("BalanceSheet", {
      end_date: asOf,
      start_date: options.start_date,
      accounting_method: options.accounting_method,
      summarize_column_by: options.summarize_column_by,
      date_macro: options.date_macro,
    });
    return {
      result: { raw, normalized: normalizeReport(raw) },
      isError: false,
      error: null,
    };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
