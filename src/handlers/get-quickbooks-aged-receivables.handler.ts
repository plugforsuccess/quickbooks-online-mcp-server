import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { normalizeReport } from "../helpers/normalize-report.js";
import { validateIsoDate } from "../helpers/validate-date.js";
import { ReportResult } from "./get-quickbooks-profit-and-loss.handler.js";

export interface AgedReceivablesOptions {
  report_date?: string;
  customer?: string;
  aging_method?: "Current" | "Report_Date";
  aging_period?: number;
  days_per_aging_period?: number;
  num_periods?: number;
}

export async function getQuickbooksAgedReceivables(
  options: AgedReceivablesOptions
): Promise<ToolResponse<ReportResult>> {
  try {
    validateIsoDate(options.report_date, "report_date");
    const raw = await quickbooksClient.fetchReport("AgedReceivables", {
      report_date: options.report_date,
      customer: options.customer,
      aging_method: options.aging_method,
      // QBO uses days_per_aging_period; accept aging_period as alias.
      days_per_aging_period: options.days_per_aging_period ?? options.aging_period,
      num_periods: options.num_periods,
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
