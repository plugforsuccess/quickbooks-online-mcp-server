import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { normalizeReport } from "../helpers/normalize-report.js";
import { validateIsoDate } from "../helpers/validate-date.js";
import { ReportResult } from "./get-quickbooks-profit-and-loss.handler.js";

export interface GeneralLedgerOptions {
  start_date?: string;
  end_date?: string;
  accounting_method?: "Cash" | "Accrual";
  account?: string;
  source_account?: string;
  sort_by?: string;
  columns?: string;
  date_macro?: string;
}

export async function getQuickbooksGeneralLedger(
  options: GeneralLedgerOptions
): Promise<ToolResponse<ReportResult>> {
  try {
    validateIsoDate(options.start_date, "start_date");
    validateIsoDate(options.end_date, "end_date");
    const raw = await quickbooksClient.fetchReport("GeneralLedger", {
      start_date: options.start_date,
      end_date: options.end_date,
      accounting_method: options.accounting_method,
      account: options.account,
      source_account: options.source_account,
      sort_by: options.sort_by,
      columns: options.columns,
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
