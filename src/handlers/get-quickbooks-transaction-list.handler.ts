import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { normalizeReport } from "../helpers/normalize-report.js";
import { validateIsoDate } from "../helpers/validate-date.js";
import { ReportResult } from "./get-quickbooks-profit-and-loss.handler.js";

export interface TransactionListOptions {
  start_date?: string;
  end_date?: string;
  account?: string;
  transaction_type?: string;
  customer?: string;
  vendor?: string;
  name?: string;
  memo?: string;
  date_macro?: string;
  accounting_method?: "Cash" | "Accrual";
  columns?: string;
  sort_by?: string;
}

export async function getQuickbooksTransactionList(
  options: TransactionListOptions
): Promise<ToolResponse<ReportResult>> {
  try {
    validateIsoDate(options.start_date, "start_date");
    validateIsoDate(options.end_date, "end_date");
    const raw = await quickbooksClient.fetchReport("TransactionList", {
      start_date: options.start_date,
      end_date: options.end_date,
      account: options.account,
      transaction_type: options.transaction_type,
      customer: options.customer,
      vendor: options.vendor,
      name: options.name,
      memo: options.memo,
      date_macro: options.date_macro,
      accounting_method: options.accounting_method,
      columns: options.columns,
      sort_by: options.sort_by,
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
