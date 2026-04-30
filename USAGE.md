# Reports API Usage

All report tools wrap QBO's REST endpoint
`GET /v3/company/{realmId}/reports/{reportName}` and return:

```ts
{
  raw: <unmodified QBO response>,
  normalized: {
    header: { report_name, start_period, end_period, currency, accounting_method, generated_at, date_macro, summarize_columns_by },
    columns: [{ id, title, type }],
    rows: [{ account_name, account_id, account_type, group, values, total }],
    totals: { total_income?, total_cogs?, gross_profit?, total_expenses?, net_operating_income?, net_income?, total_assets?, total_liabilities?, total_equity?, ... }
  }
}
```

`normalized.rows` is a flat list — section headers become `Total <Section>`
summary rows tagged with `account_type: "Summary"`. `normalized.totals`
populates only the keys relevant to the specific report.

> **Cash vs Accrual.** If your numbers don't match what QBO's web UI shows,
> the cause is almost always `accounting_method`. Insurance agencies usually
> run on **Cash**; QBO's API can default differently. Pass it explicitly.

## Examples

### 1. Profit & Loss for the current month

```json
{
  "tool": "get_profit_and_loss",
  "params": {
    "start_date": "2026-04-01",
    "end_date": "2026-04-30",
    "accounting_method": "Cash"
  }
}
```

Expect `normalized.totals.total_income`, `total_expenses`, `net_income`.

### 2. Quarterly P&L broken down by month — the killer feature

One call returns 3 monthly columns plus a Total column.

```json
{
  "tool": "get_profit_and_loss",
  "params": {
    "start_date": "2026-04-01",
    "end_date": "2026-06-30",
    "summarize_column_by": "Month",
    "accounting_method": "Cash"
  }
}
```

Each row's `values` array has 4 entries (Apr, May, Jun, Total).
`normalized.columns` tells you which is which.

### 3. YTD P&L via date_macro

```json
{
  "tool": "get_profit_and_loss",
  "params": {
    "date_macro": "Year to Date",
    "accounting_method": "Cash"
  }
}
```

### 4. Balance Sheet as of today

```json
{
  "tool": "get_balance_sheet",
  "params": {
    "as_of_date": "2026-04-30",
    "accounting_method": "Cash"
  }
}
```

Expect `normalized.totals.total_assets`,
`total_liabilities`, `total_equity`,
`total_liabilities_and_equity`.

### 5. Cash Flow for the current quarter

```json
{
  "tool": "get_cash_flow",
  "params": {
    "start_date": "2026-04-01",
    "end_date": "2026-06-30"
  }
}
```

### 6. General Ledger for a single account

```json
{
  "tool": "get_general_ledger",
  "params": {
    "start_date": "2026-01-01",
    "end_date": "2026-04-30",
    "account": "35",
    "accounting_method": "Accrual"
  }
}
```

### 7. Trial Balance

```json
{
  "tool": "get_trial_balance",
  "params": {
    "start_date": "2026-01-01",
    "end_date": "2026-04-30",
    "accounting_method": "Accrual"
  }
}
```

### 8. A/R Aging

```json
{
  "tool": "get_aged_receivables",
  "params": {
    "report_date": "2026-04-30",
    "aging_period": 30,
    "num_periods": 4
  }
}
```

### 9. A/P Aging

```json
{
  "tool": "get_aged_payables",
  "params": {
    "report_date": "2026-04-30",
    "aging_period": 30,
    "num_periods": 4
  }
}
```

### 10. Transaction list (tax prep)

```json
{
  "tool": "get_transaction_list_by_account",
  "params": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "account": "35",
    "transaction_type": "Bill"
  }
}
```

### 11. 1099 Contractor summary (January filing)

```json
{
  "tool": "get_1099_contractor_summary",
  "params": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  }
}
```

## Errors

- Missing realm ID → `QUICKBOOKS_REALM_ID is missing. Set it in .env or run \`npm run auth\`...`
- Malformed dates → `Invalid start_date: "2026-13-01". Expected YYYY-MM-DD.`
- QBO API errors → preserved verbatim, e.g.
  `QuickBooks Reports API error (400): [4001] Reports business validation error — Start date is greater than end date`
- 401 → access token is refreshed automatically and the request retried once.
