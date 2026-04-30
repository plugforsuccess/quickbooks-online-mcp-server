import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { normalizeReport, NormalizedReport } from "../helpers/normalize-report.js";
import { validateIsoDate } from "../helpers/validate-date.js";

export interface ProfitAndLossOptions {
  start_date?: string;
  end_date?: string;
  accounting_method?: "Cash" | "Accrual";
  summarize_column_by?: "Total" | "Month" | "Quarter" | "Year" | "Week" | "Days";
  date_macro?: string;
  customer?: string;
  vendor?: string;
  item?: string;
  department?: string;
  class?: string;
}

export interface ReportResult {
  raw: unknown;
  normalized: NormalizedReport;
}

export async function getQuickbooksProfitAndLoss(
  options: ProfitAndLossOptions
): Promise<ToolResponse<ReportResult>> {
  try {
    validateIsoDate(options.start_date, "start_date");
    validateIsoDate(options.end_date, "end_date");
    const raw = await quickbooksClient.fetchReport("ProfitAndLoss", {
      start_date: options.start_date,
      end_date: options.end_date,
      accounting_method: options.accounting_method,
      summarize_column_by: options.summarize_column_by,
      date_macro: options.date_macro,
      customer: options.customer,
      vendor: options.vendor,
      item: options.item,
      department: options.department,
      class: options.class,
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
