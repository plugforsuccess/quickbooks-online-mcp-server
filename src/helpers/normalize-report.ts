// Flattens QuickBooks Online's nested Rows/ColData report structure into a
// shape that's easy for an AI assistant or a dashboard to consume. The raw
// QBO response uses recursively nested Section rows whose depth varies by
// report type, so the walker is recursive rather than depth-hardcoded.

export interface NormalizedHeader {
  report_name?: string;
  start_period?: string;
  end_period?: string;
  currency?: string;
  accounting_method?: string;
  generated_at?: string;
  date_macro?: string;
  summarize_columns_by?: string;
}

export interface NormalizedColumn {
  id: string;
  title: string;
  type: string;
}

export interface NormalizedRow {
  account_name: string | null;
  account_id: string | null;
  account_type: string | null;
  group: string | null;
  values: (number | string | null)[];
  total: number | null;
}

export interface NormalizedTotals {
  total_income?: number;
  total_cogs?: number;
  gross_profit?: number;
  total_expenses?: number;
  net_operating_income?: number;
  net_income?: number;
  total_other_income?: number;
  total_other_expenses?: number;
  net_other_income?: number;
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
  total_liabilities_and_equity?: number;
}

export interface NormalizedReport {
  header: NormalizedHeader;
  columns: NormalizedColumn[];
  rows: NormalizedRow[];
  totals: NormalizedTotals;
}

interface ColData {
  value?: string;
  id?: string;
}

interface QboRow {
  type?: "Section" | "Data";
  group?: string;
  Header?: { ColData?: ColData[] };
  Summary?: { ColData?: ColData[] };
  ColData?: ColData[];
  Rows?: { Row?: QboRow[] };
}

const TOTAL_KEY_BY_GROUP: Record<string, keyof NormalizedTotals> = {
  Income: "total_income",
  COGS: "total_cogs",
  GrossProfit: "gross_profit",
  Expenses: "total_expenses",
  NetOperatingIncome: "net_operating_income",
  NetIncome: "net_income",
  OtherIncome: "total_other_income",
  OtherExpenses: "total_other_expenses",
  NetOtherIncome: "net_other_income",
  TotalAssets: "total_assets",
  TotalLiabilities: "total_liabilities",
  TotalEquity: "total_equity",
  TotalLiabilitiesAndEquity: "total_liabilities_and_equity",
};

const SUMMARY_LABEL_TO_TOTAL: Array<[RegExp, keyof NormalizedTotals]> = [
  [/^total income$/i, "total_income"],
  [/^total cost of goods sold$|^total cogs$/i, "total_cogs"],
  [/^gross profit$/i, "gross_profit"],
  [/^total expenses$/i, "total_expenses"],
  [/^net operating income$/i, "net_operating_income"],
  [/^net income$/i, "net_income"],
  [/^total other income$/i, "total_other_income"],
  [/^total other expenses$/i, "total_other_expenses"],
  [/^net other income$/i, "net_other_income"],
  [/^total assets$/i, "total_assets"],
  [/^total liabilities$/i, "total_liabilities"],
  [/^total equity$/i, "total_equity"],
  [/^total liabilities and equity$/i, "total_liabilities_and_equity"],
];

function parseValueCell(v: string | undefined): number | string | null {
  if (v === undefined || v === "") return null;
  // QBO numeric values come as strings like "1234.56" or "-1234.56".
  // Non-numeric cells (dates, account names, memos) stay as strings.
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function extractValuesAndTotal(cells: ColData[]): {
  values: (number | string | null)[];
  total: number | null;
} {
  // Callers guarantee a non-empty cells array. First cell is the row label
  // (account name / summary label); the rest are data columns. The last
  // data column is conventionally the row total for summary reports.
  const dataCells = cells.slice(1);
  const values = dataCells.map((c) => parseValueCell(c.value));
  const last = values.length > 0 ? values[values.length - 1] : null;
  const total = typeof last === "number" ? last : null;
  return { values, total };
}

function walkRows(
  rows: QboRow[] | undefined,
  out: NormalizedRow[],
  totals: NormalizedTotals,
  inheritedGroup: string | null
): void {
  if (!rows) return;
  for (const row of rows) {
    const group = row.group ?? inheritedGroup;

    // Treat anything with nested Rows OR a Summary block as a section.
    // QBO often ships bottom-line summary rows (e.g. "TOTAL LIABILITIES
    // AND EQUITY") with a Summary but no nested children.
    if (row.type === "Section" || row.Rows?.Row || row.Summary) {
      walkRows(row.Rows?.Row, out, totals, group ?? null);

      const summaryCells = row.Summary?.ColData;
      if (summaryCells && summaryCells.length > 0) {
        const label = summaryCells[0]?.value ?? null;
        const { values, total } = extractValuesAndTotal(summaryCells);

        // Capture group totals: prefer the row's "group" attribute (which
        // QBO sets for canonical sections like Income, COGS, NetIncome),
        // and fall back to label matching for reports/sections that don't.
        if (total !== null) {
          if (group && TOTAL_KEY_BY_GROUP[group]) {
            totals[TOTAL_KEY_BY_GROUP[group]] = total;
          } else if (label) {
            for (const [re, key] of SUMMARY_LABEL_TO_TOTAL) {
              if (re.test(label.trim())) {
                totals[key] = total;
                break;
              }
            }
          }
        }

        out.push({
          account_name: label ? `Total ${label.replace(/^Total\s+/i, "")}` : null,
          account_id: null,
          account_type: "Summary",
          group: group ?? null,
          values,
          total,
        });
      }
      continue;
    }

    // Leaf data row.
    const cells = row.ColData;
    if (!cells || cells.length === 0) continue;
    const { values, total } = extractValuesAndTotal(cells);
    out.push({
      account_name: cells[0]?.value ?? null,
      account_id: cells[0]?.id ?? null,
      account_type: "Data",
      group: group ?? null,
      values,
      total,
    });
  }
}

interface QboReportShape {
  Header?: {
    Time?: string;
    ReportName?: string;
    StartPeriod?: string;
    EndPeriod?: string;
    Currency?: string;
    ReportBasis?: string;
    DateMacro?: string;
    SummarizeColumnsBy?: string;
  };
  Columns?: { Column?: Array<{ ColTitle?: string; ColType?: string; MetaData?: Array<{ Name?: string; Value?: string }> }> };
  Rows?: { Row?: QboRow[] };
}

export function normalizeReport(raw: unknown): NormalizedReport {
  const r = (raw ?? {}) as QboReportShape;

  const header: NormalizedHeader = {
    report_name: r.Header?.ReportName,
    start_period: r.Header?.StartPeriod,
    end_period: r.Header?.EndPeriod,
    currency: r.Header?.Currency,
    accounting_method: r.Header?.ReportBasis,
    generated_at: r.Header?.Time,
    date_macro: r.Header?.DateMacro,
    summarize_columns_by: r.Header?.SummarizeColumnsBy,
  };

  const columns: NormalizedColumn[] = (r.Columns?.Column ?? []).map((c, idx) => {
    const meta = c.MetaData?.find((m) => m.Name === "ColKey");
    return {
      id: meta?.Value ?? String(idx),
      title: c.ColTitle ?? "",
      type: c.ColType ?? "",
    };
  });

  const rows: NormalizedRow[] = [];
  const totals: NormalizedTotals = {};
  walkRows(r.Rows?.Row, rows, totals, null);

  return { header, columns, rows, totals };
}
