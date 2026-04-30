import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { normalizeReport } from "../helpers/normalize-report.js";
import { validateIsoDate } from "../helpers/validate-date.js";
import { ReportResult } from "./get-quickbooks-profit-and-loss.handler.js";

export interface Contractor1099SummaryOptions {
  start_date?: string;
  end_date?: string;
  vendor?: string;
  date_macro?: string;
}

export async function getQuickbooks1099ContractorSummary(
  options: Contractor1099SummaryOptions
): Promise<ToolResponse<ReportResult>> {
  try {
    validateIsoDate(options.start_date, "start_date");
    validateIsoDate(options.end_date, "end_date");
    const raw = await quickbooksClient.fetchReport("Vendor1099Contractor", {
      start_date: options.start_date,
      end_date: options.end_date,
      vendor: options.vendor,
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
