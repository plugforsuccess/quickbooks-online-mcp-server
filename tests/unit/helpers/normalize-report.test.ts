import { describe, it, expect } from '@jest/globals';
import { normalizeReport } from '../../../src/helpers/normalize-report';

describe('normalizeReport', () => {
  it('returns empty shape for empty input', () => {
    const out = normalizeReport({});
    expect(out.header).toEqual({
      report_name: undefined,
      start_period: undefined,
      end_period: undefined,
      currency: undefined,
      accounting_method: undefined,
      generated_at: undefined,
      date_macro: undefined,
      summarize_columns_by: undefined,
    });
    expect(out.columns).toEqual([]);
    expect(out.rows).toEqual([]);
    expect(out.totals).toEqual({});
  });

  it('handles undefined raw input', () => {
    const out = normalizeReport(undefined);
    expect(out.rows).toEqual([]);
  });

  it('captures header fields and column ColKeys', () => {
    const raw = {
      Header: {
        ReportName: 'BalanceSheet',
        StartPeriod: '2024-01-01',
        EndPeriod: '2024-12-31',
        Currency: 'USD',
        ReportBasis: 'Cash',
        Time: '2024-01-01T00:00:00Z',
        DateMacro: 'Year to Date',
        SummarizeColumnsBy: 'Total',
      },
      Columns: {
        Column: [
          { ColTitle: 'Account', ColType: 'Account', MetaData: [{ Name: 'ColKey', Value: 'account' }] },
          { ColTitle: 'Total', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'total' }] },
          { ColTitle: 'Other' }, // no metadata, no type — fall back to index
        ],
      },
      Rows: { Row: [] },
    };
    const out = normalizeReport(raw);
    expect(out.header.report_name).toBe('BalanceSheet');
    expect(out.header.accounting_method).toBe('Cash');
    expect(out.header.date_macro).toBe('Year to Date');
    expect(out.columns).toEqual([
      { id: 'account', title: 'Account', type: 'Account' },
      { id: 'total', title: 'Total', type: 'Money' },
      { id: '2', title: 'Other', type: '' },
    ]);
  });

  it('keeps non-numeric ColData cells as strings', () => {
    const raw = {
      Rows: {
        Row: [
          {
            type: 'Data',
            ColData: [
              { value: 'Bill #123', id: '99' },
              { value: '2024-12-15' }, // date string — should remain a string
              { value: 'Memo text' },
              { value: '250.00' }, // numeric — last column
            ],
          },
        ],
      },
    };
    const out = normalizeReport(raw);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].account_name).toBe('Bill #123');
    expect(out.rows[0].account_id).toBe('99');
    expect(out.rows[0].values).toEqual(['2024-12-15', 'Memo text', 250]);
    expect(out.rows[0].total).toBe(250);
  });

  it('falls back to summary-label matching when group attribute is absent', () => {
    const raw = {
      Rows: {
        Row: [
          {
            // No "group" attribute — exercises the SUMMARY_LABEL_TO_TOTAL path.
            Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Cash', id: '1' }, { value: '500.00' }] }] },
            Summary: { ColData: [{ value: 'TOTAL ASSETS' }, { value: '500.00' }] },
          },
          {
            Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Loans', id: '2' }, { value: '100.00' }] }] },
            Summary: { ColData: [{ value: 'Total Liabilities' }, { value: '100.00' }] },
          },
          {
            Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Owner Equity', id: '3' }, { value: '400.00' }] }] },
            Summary: { ColData: [{ value: 'Total Equity' }, { value: '400.00' }] },
          },
          {
            Summary: { ColData: [{ value: 'TOTAL LIABILITIES AND EQUITY' }, { value: '500.00' }] },
          },
        ],
      },
    };
    const out = normalizeReport(raw);
    expect(out.totals.total_assets).toBe(500);
    expect(out.totals.total_liabilities).toBe(100);
    expect(out.totals.total_equity).toBe(400);
    expect(out.totals.total_liabilities_and_equity).toBe(500);
  });

  it('skips rows with no ColData', () => {
    const raw = {
      Rows: { Row: [{ type: 'Data' }] }, // ColData missing
    };
    const out = normalizeReport(raw);
    expect(out.rows).toEqual([]);
  });

  it('handles summary rows with no total cell', () => {
    const raw = {
      Rows: {
        Row: [
          {
            group: 'Income',
            Rows: { Row: [] },
            Summary: { ColData: [{ value: 'Total Income' }] }, // no value column
          },
        ],
      },
    };
    const out = normalizeReport(raw);
    expect(out.totals.total_income).toBeUndefined();
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].total).toBeNull();
  });

  it('handles non-matching summary labels gracefully', () => {
    const raw = {
      Rows: {
        Row: [
          {
            Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Misc', id: '1' }, { value: '10.00' }] }] },
            Summary: { ColData: [{ value: 'Some Other Subtotal' }, { value: '10.00' }] },
          },
        ],
      },
    };
    const out = normalizeReport(raw);
    expect(out.totals).toEqual({});
    // Walker emits the leaf data row first, then the section summary.
    expect(out.rows[0].account_type).toBe('Data');
    expect(out.rows[1].account_type).toBe('Summary');
  });

  it('parses negative numbers correctly', () => {
    const raw = {
      Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Refunds', id: '5' }, { value: '-150.50' }] }] },
    };
    const out = normalizeReport(raw);
    expect(out.rows[0].values).toEqual([-150.5]);
    expect(out.rows[0].total).toBe(-150.5);
  });

  it('treats empty value cells as null', () => {
    const raw = {
      Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Acct' }, { value: '' }, {}] }] },
    };
    const out = normalizeReport(raw);
    expect(out.rows[0].values).toEqual([null, null]);
    expect(out.rows[0].total).toBeNull();
  });

  it('handles section row with empty Summary.ColData', () => {
    const raw = {
      Rows: {
        Row: [
          {
            type: 'Section',
            Summary: { ColData: [] },
          },
        ],
      },
    };
    const out = normalizeReport(raw);
    // Empty ColData skips the summary push entirely.
    expect(out.rows).toEqual([]);
  });

  it('handles section summary where label cell is missing', () => {
    const raw = {
      Rows: {
        Row: [
          {
            type: 'Section',
            // No "value" on first cell — exercises label fallback to null.
            Summary: { ColData: [{}, { value: '99.00' }] },
          },
        ],
      },
    };
    const out = normalizeReport(raw);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].account_name).toBeNull();
    expect(out.rows[0].total).toBe(99);
    // No label means no SUMMARY_LABEL_TO_TOTAL lookup populates totals.
    expect(out.totals).toEqual({});
  });

  it('handles leaf data row with missing first cell value/id', () => {
    const raw = {
      Rows: { Row: [{ type: 'Data', ColData: [{}, { value: '5.00' }] }] },
    };
    const out = normalizeReport(raw);
    expect(out.rows[0].account_name).toBeNull();
    expect(out.rows[0].account_id).toBeNull();
    expect(out.rows[0].total).toBe(5);
  });

  it('handles columns whose ColKey metadata exists but lacks Value', () => {
    const raw = {
      Columns: {
        Column: [
          { ColTitle: 'Account', ColType: 'Account', MetaData: [{ Name: 'ColKey' }] },
          {}, // wholly empty column — exercises every "?? fallback" branch.
        ],
      },
    };
    const out = normalizeReport(raw);
    expect(out.columns).toEqual([
      { id: '0', title: 'Account', type: 'Account' },
      { id: '1', title: '', type: '' },
    ]);
  });

  it('inherits group from parent section when child row has none', () => {
    const raw = {
      Rows: {
        Row: [
          {
            type: 'Section',
            group: 'Income',
            Rows: {
              Row: [
                {
                  // Nested section with NO group of its own — inherits Income.
                  type: 'Section',
                  Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Sub-account', id: '7' }, { value: '50.00' }] }] },
                  Summary: { ColData: [{ value: 'Total Sub' }, { value: '50.00' }] },
                },
              ],
            },
            Summary: { ColData: [{ value: 'Total Income' }, { value: '50.00' }] },
          },
        ],
      },
    };
    const out = normalizeReport(raw);
    expect(out.totals.total_income).toBe(50);
    // The data leaf and inner summary should both report inherited group.
    const dataRow = out.rows.find((r) => r.account_id === '7')!;
    expect(dataRow.group).toBe('Income');
  });
});
