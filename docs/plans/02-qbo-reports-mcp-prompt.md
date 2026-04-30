# QBO MCP Server — Reports API Extension Prompt

**Purpose:** Hand this to your AI dev (Claude Code, Cursor, etc.) to extend Intuit's official QuickBooks Online MCP Server with the Reports API. The base repo (`github.com/intuit/quickbooks-online-mcp-server`) only exposes CRUD entities — no P&L, Balance Sheet, or Cash Flow. This prompt adds them.

**When to use:** After forking the Intuit MCP repo and getting OAuth working. This is the core implementation prompt.

---

## The Prompt

```
ROLE
You are extending the official Intuit QuickBooks Online MCP Server 
(github.com/intuit/quickbooks-online-mcp-server) to add Reports API 
support. The current server exposes CRUD tools for entities like 
Invoice, Bill, Customer, and Journal Entry — but does NOT expose 
QBO's native Reports API. Your job is to fix that.

BUSINESS CONTEXT
- Company: Wiley-Wilson Agency, Inc. (Allstate insurance agency)
- QBO Realm ID: 9341456605421051 (production)
- Stack: TypeScript, Node.js, MCP SDK
- Owner needs: monthly P&L, quarterly P&L, balance sheet, cash flow, 
  and general ledger — pulled directly from QBO's authoritative 
  Reports API, not reconstructed from journal entries
- Downstream consumer: a Supabase-backed bookkeeper dashboard already 
  integrated via QuickBooks OAuth

OBJECTIVE
Add a new set of MCP tools that wrap the QBO Reports API endpoint:
   GET /v3/company/{realmId}/reports/{reportName}

REPORTS TO IMPLEMENT (priority order)

1. get_profit_and_loss
   - QBO report name: ProfitAndLoss
   - Required params: start_date, end_date
   - Optional params: accounting_method (Cash | Accrual), 
     summarize_column_by (Month | Quarter | Year | Total),
     date_macro (e.g., "This Month", "Last Quarter", "Year to Date")

2. get_balance_sheet
   - QBO report name: BalanceSheet
   - Required params: as_of_date
   - Optional params: accounting_method, summarize_column_by

3. get_cash_flow
   - QBO report name: CashFlow
   - Required params: start_date, end_date
   - Optional params: accounting_method, summarize_column_by

4. get_general_ledger
   - QBO report name: GeneralLedger
   - Required params: start_date, end_date
   - Optional params: accounting_method, columns (subset)

5. get_trial_balance
   - QBO report name: TrialBalance
   - Required params: start_date, end_date
   - Optional params: accounting_method

6. get_ar_aging_summary
   - QBO report name: AgedReceivables
   - Optional params: report_date, aging_period, num_periods

7. get_ap_aging_summary
   - QBO report name: AgedPayables
   - Optional params: report_date, aging_period, num_periods

8. get_transaction_list_by_account (TAX-READINESS ADDITION)
   - QBO report name: TransactionList
   - Required for transaction substantiation when prepping returns
   - Required params: start_date, end_date
   - Optional params: account, transaction_type

9. get_1099_contractor_summary (TAX-READINESS ADDITION)
   - QBO report name: Vendor1099Contractor
   - Critical for January 1099-NEC filing
   - Optional params: start_date, end_date

TECHNICAL REQUIREMENTS

1. Use the existing OAuth/refresh-token logic already in the repo. 
   Do not duplicate auth code — import or reuse the existing 
   QuickBooks client.

2. Build a single shared helper function:
   
   async function fetchReport(
     reportName: string, 
     params: Record<string, string | undefined>
   ): Promise<QboReportResponse>
   
   This should:
   - Construct the URL: 
     `${baseUrl}/v3/company/${realmId}/reports/${reportName}`
   - Append query params, skipping undefined values
   - Set Accept: application/json (QBO defaults to XML otherwise — 
     this is a known footgun)
   - Handle 401 by refreshing the token and retrying ONCE
   - Surface QBO error responses with the QBO fault code intact

3. Each tool wraps fetchReport with typed inputs and a clean output 
   schema. Do NOT just return the raw QBO response — it's a deeply 
   nested Rows/ColData structure that's brutal to consume.

4. The OAuth handler must read the redirect URI from 
   process.env.QUICKBOOKS_REDIRECT_URI, falling back to 
   http://localhost:8000/callback if unset. This makes the same 
   code work in both local and Codespaces environments.

OUTPUT SCHEMA (this is the part the existing repo gets wrong)

QBO returns reports as nested rows of rows of rows. For each report 
tool, return BOTH:

   {
     raw: <unmodified QBO response>,
     normalized: {
       header: { 
         report_name, start_period, end_period, 
         currency, accounting_method, generated_at 
       },
       columns: [{ id, title, type }],
       rows: [
         { 
           account_name, account_id, account_type, 
           values: number[],          // one per column
           total: number 
         }
       ],
       totals: { 
         total_income, total_cogs, gross_profit, 
         total_expenses, net_operating_income, net_income 
         // populate the ones relevant to the specific report
       }
     }
   }

The flattened `normalized` shape is what an AI assistant or a 
dashboard will actually consume. Recursive flattening of QBO's 
nested rows is required — write a small recursive walker, do not 
hardcode depth.

ERROR HANDLING

- If realm ID is missing → throw with a clear message pointing 
  to the .env config
- If date params are malformed → validate to YYYY-MM-DD before 
  hitting the API
- If QBO returns a 400 with "Reports business validation error" 
  → return the QBO message verbatim, not a generic "request failed"
- Log the full request URL (with realm ID redacted) on any error 
  for debugging

TESTING

After implementation, manually verify against the production 
Realm ID 9341456605421051 with these specific calls:

1. get_profit_and_loss for the current month
   (start_date = first of month, end_date = today)

2. get_profit_and_loss for the current quarter, 
   summarize_column_by = "Month" 
   (this is the killer feature — produces a 3-column monthly 
   breakdown of the quarter in one call)

3. get_profit_and_loss for YTD with date_macro = "Year to Date"

4. get_balance_sheet as_of_date = today

5. get_cash_flow for the current quarter

Confirm the normalized output has correct totals matching what 
QBO's web UI shows. If they don't match, the issue is almost 
always accounting_method (Cash vs Accrual) — the QBO web UI 
defaults can differ from API defaults.

DELIVERABLES

1. New file: src/tools/reports.ts containing all 9 report tools
2. Updated tool registration in the MCP server entrypoint
3. Updated README section listing the new tools and their params
4. A short [USAGE.md](http://USAGE.md) with example MCP tool calls for each report 
   and what to expect back
5. PR-ready commit with a clean message

DO NOT

- Do not modify the existing CRUD tools
- Do not change the auth flow beyond the env-driven redirect URI
- Do not add new dependencies unless absolutely necessary 
  (the repo already has what you need)
- Do not invent QBO report names — only use names from Intuit's 
  official Reports API documentation: 
  developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/reports

FIRST STEP

Before writing any code, fetch the current repo structure and 
identify:
1. Where the existing QuickBooks client is instantiated
2. Where tools are registered with the MCP server
3. The pattern existing tools use (input schema, handler, return shape)

Mirror that pattern exactly. Then implement get_profit_and_loss 
first, get it working end-to-end against the production realm, 
and only then build the others.
```

---

## Why This Prompt Is Structured This Way

- **`summarize_column_by = "Month"` is the killer feature.** One API call returns a quarter broken into three monthly columns. Without this, you'd make 3+ separate calls.
- **Cash vs. Accrual default mismatch trips up everyone.** Insurance agencies typically run on Cash basis (commissions recognized when received). If the API returns Accrual but your books are Cash, numbers won't match QBO web UI.
- **Reports 8 and 9 are tax-readiness additions** beyond pure financial reporting — added because the goal is filing your own taxes via TaxBandits + CPA handoff.
- **Normalized output schema matters.** QBO's raw report API returns nested Rows of Rows with ColData. An AI consuming that directly is unpleasant; flatten it once at the server.
