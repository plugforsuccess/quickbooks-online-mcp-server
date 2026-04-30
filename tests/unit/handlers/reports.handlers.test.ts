import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockQuickbooksClient, mockQuickBooksInstance, resetAllMocks } from '../../mocks/quickbooks.mock';

// ESM-compatible module mocking
jest.unstable_mockModule('../../../src/clients/quickbooks-client', () => ({
  quickbooksClient: mockQuickbooksClient,
}));

// Dynamic imports after mock setup
const { getQuickbooksBalanceSheet } = await import('../../../src/handlers/get-quickbooks-balance-sheet.handler');
const { getQuickbooksProfitAndLoss } = await import('../../../src/handlers/get-quickbooks-profit-and-loss.handler');
const { getQuickbooksCashFlow } = await import('../../../src/handlers/get-quickbooks-cash-flow.handler');
const { getQuickbooksTrialBalance } = await import('../../../src/handlers/get-quickbooks-trial-balance.handler');
const { getQuickbooksGeneralLedger } = await import('../../../src/handlers/get-quickbooks-general-ledger.handler');
const { getQuickbooksCustomerSales } = await import('../../../src/handlers/get-quickbooks-customer-sales.handler');
const { getQuickbooksAgedReceivables } = await import('../../../src/handlers/get-quickbooks-aged-receivables.handler');
const { getQuickbooksCustomerBalance } = await import('../../../src/handlers/get-quickbooks-customer-balance.handler');
const { getQuickbooksAgedPayables } = await import('../../../src/handlers/get-quickbooks-aged-payables.handler');
const { getQuickbooksVendorExpenses } = await import('../../../src/handlers/get-quickbooks-vendor-expenses.handler');
const { getQuickbooksVendorBalance } = await import('../../../src/handlers/get-quickbooks-vendor-balance.handler');
const { getQuickbooksTransactionList } = await import('../../../src/handlers/get-quickbooks-transaction-list.handler');
const { getQuickbooks1099ContractorSummary } = await import('../../../src/handlers/get-quickbooks-1099-contractor-summary.handler');

describe('Report Handlers', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('getQuickbooksBalanceSheet', () => {
    it('should get balance sheet report and return raw + normalized', async () => {
      const mockReport = { Header: { ReportName: 'BalanceSheet', StartPeriod: '2024-12-31', EndPeriod: '2024-12-31' }, Rows: { Row: [] }, Columns: { Column: [] } };
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue(mockReport);

      const result = await getQuickbooksBalanceSheet({ as_of_date: '2024-12-31' });

      expect(result.isError).toBe(false);
      expect(result.result?.raw).toEqual(mockReport);
      expect(result.result?.normalized.header.report_name).toBe('BalanceSheet');
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'BalanceSheet',
        expect.objectContaining({ end_date: '2024-12-31' })
      );
    });

    it('should accept end_date as alias for as_of_date', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({});
      const result = await getQuickbooksBalanceSheet({ end_date: '2024-12-31', accounting_method: 'Accrual', summarize_column_by: 'Month' });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'BalanceSheet',
        expect.objectContaining({ end_date: '2024-12-31', accounting_method: 'Accrual', summarize_column_by: 'Month' })
      );
    });

    it('should reject malformed dates locally without hitting QBO', async () => {
      const result = await getQuickbooksBalanceSheet({ as_of_date: '2024/12/31' });
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Invalid as_of_date');
      expect(mockQuickbooksClient.fetchReport).not.toHaveBeenCalled();
    });

    it('should handle fetchReport errors', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Report failed'));
      const result = await getQuickbooksBalanceSheet({});
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Report failed');
    });
  });

  describe('getQuickbooksProfitAndLoss', () => {
    it('should get P&L and return raw + normalized', async () => {
      const mockReport = { Header: { ReportName: 'ProfitAndLoss' } };
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue(mockReport);
      const result = await getQuickbooksProfitAndLoss({ start_date: '2024-01-01', end_date: '2024-12-31' });
      expect(result.isError).toBe(false);
      expect(result.result?.raw).toEqual(mockReport);
      expect(result.result?.normalized.header.report_name).toBe('ProfitAndLoss');
    });

    it('should pass all filters and date_macro through', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({});
      const result = await getQuickbooksProfitAndLoss({
        date_macro: 'Year to Date',
        accounting_method: 'Cash',
        summarize_column_by: 'Month',
        customer: 'cust-1',
        vendor: 'vendor-1',
        item: 'item-1',
        department: 'dept-1',
        class: 'class-1',
      });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'ProfitAndLoss',
        expect.objectContaining({
          date_macro: 'Year to Date',
          accounting_method: 'Cash',
          summarize_column_by: 'Month',
          customer: 'cust-1',
          vendor: 'vendor-1',
          item: 'item-1',
          department: 'dept-1',
          class: 'class-1',
        })
      );
    });

    it('should normalize totals from canonical group rows', async () => {
      const raw = {
        Header: { ReportName: 'ProfitAndLoss' },
        Columns: { Column: [{ ColTitle: 'Account', ColType: 'Account' }, { ColTitle: 'Total', ColType: 'Money' }] },
        Rows: {
          Row: [
            {
              type: 'Section', group: 'Income',
              Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Sales', id: '1' }, { value: '1000.00' }] }] },
              Summary: { ColData: [{ value: 'Total Income' }, { value: '1000.00' }] },
            },
            {
              type: 'Section', group: 'Expenses',
              Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Rent', id: '2' }, { value: '300.00' }] }] },
              Summary: { ColData: [{ value: 'Total Expenses' }, { value: '300.00' }] },
            },
            {
              type: 'Section', group: 'NetIncome',
              Summary: { ColData: [{ value: 'Net Income' }, { value: '700.00' }] },
            },
          ],
        },
      };
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue(raw);
      const result = await getQuickbooksProfitAndLoss({ start_date: '2024-01-01', end_date: '2024-12-31' });
      expect(result.isError).toBe(false);
      expect(result.result?.normalized.totals.total_income).toBe(1000);
      expect(result.result?.normalized.totals.total_expenses).toBe(300);
      expect(result.result?.normalized.totals.net_income).toBe(700);
      expect(result.result?.normalized.rows.length).toBeGreaterThan(0);
    });

    it('should reject malformed start_date', async () => {
      const result = await getQuickbooksProfitAndLoss({ start_date: '2024-13-01' });
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Invalid start_date');
    });

    it('should handle authentication errors via fetchReport', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Auth failed'));
      const result = await getQuickbooksProfitAndLoss({});
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Auth failed');
    });
  });

  describe('getQuickbooksCashFlow', () => {
    it('should get cash flow report', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({ Header: { ReportName: 'CashFlow' } });
      const result = await getQuickbooksCashFlow({});
      expect(result.isError).toBe(false);
      expect(result.result?.normalized.header.report_name).toBe('CashFlow');
    });

    it('should pass all options', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({});
      const result = await getQuickbooksCashFlow({ start_date: '2024-01-01', end_date: '2024-12-31', summarize_column_by: 'Month', accounting_method: 'Cash' });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'CashFlow',
        expect.objectContaining({ start_date: '2024-01-01', end_date: '2024-12-31', summarize_column_by: 'Month', accounting_method: 'Cash' })
      );
    });

    it('should handle errors', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Report failed'));
      const result = await getQuickbooksCashFlow({});
      expect(result.isError).toBe(true);
    });
  });

  describe('getQuickbooksTrialBalance', () => {
    it('should get trial balance', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({ Header: { ReportName: 'TrialBalance' } });
      const result = await getQuickbooksTrialBalance({ accounting_method: 'Cash' });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'TrialBalance',
        expect.objectContaining({ accounting_method: 'Cash' })
      );
    });

    it('should handle errors', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Report failed'));
      const result = await getQuickbooksTrialBalance({});
      expect(result.isError).toBe(true);
    });
  });

  describe('getQuickbooksGeneralLedger', () => {
    it('should pass all options including columns', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({});
      const result = await getQuickbooksGeneralLedger({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        accounting_method: 'Accrual',
        account: '1',
        source_account: '2',
        sort_by: 'Date',
        columns: 'tx_date,txn_type,account_name,debt_amt,credit_amt',
      });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'GeneralLedger',
        expect.objectContaining({ account: '1', source_account: '2', sort_by: 'Date', columns: 'tx_date,txn_type,account_name,debt_amt,credit_amt' })
      );
    });

    it('should handle errors', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Report failed'));
      const result = await getQuickbooksGeneralLedger({});
      expect(result.isError).toBe(true);
    });
  });

  describe('getQuickbooksCustomerSales', () => {
    it('should get customer sales report', async () => {
      const mockReport = { Header: { ReportName: 'CustomerSales' } };
      mockQuickBooksInstance.reportCustomerSales.mockImplementation((params: any, cb: any) => cb(null, mockReport));
      const result = await getQuickbooksCustomerSales({ customer: 'cust-1' });
      expect(result.isError).toBe(false);
    });

    it('should handle all options', async () => {
      mockQuickBooksInstance.reportCustomerSales.mockImplementation((params: any, cb: any) => cb(null, {}));
      const result = await getQuickbooksCustomerSales({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        customer: 'cust-1',
        summarize_column_by: 'Month',
      });
      expect(result.isError).toBe(false);
    });

    it('should handle API errors', async () => {
      mockQuickBooksInstance.reportCustomerSales.mockImplementation((params: any, cb: any) => cb(new Error('Report failed'), null));
      const result = await getQuickbooksCustomerSales({});
      expect(result.isError).toBe(true);
    });

    it('should handle authentication errors', async () => {
      (mockQuickbooksClient.authenticate as any).mockRejectedValue(new Error('Auth failed'));
      const result = await getQuickbooksCustomerSales({});
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Auth failed');
    });
  });

  describe('getQuickbooksAgedReceivables', () => {
    it('should pass aging params', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({ Header: { ReportName: 'AgedReceivables' } });
      const result = await getQuickbooksAgedReceivables({
        report_date: '2024-12-31',
        aging_method: 'Current',
        days_per_aging_period: 30,
        num_periods: 4,
      });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'AgedReceivables',
        expect.objectContaining({ report_date: '2024-12-31', aging_method: 'Current', days_per_aging_period: 30, num_periods: 4 })
      );
    });

    it('should treat aging_period as alias for days_per_aging_period', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({});
      await getQuickbooksAgedReceivables({ aging_period: 60 });
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'AgedReceivables',
        expect.objectContaining({ days_per_aging_period: 60 })
      );
    });

    it('should handle errors', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Report failed'));
      const result = await getQuickbooksAgedReceivables({});
      expect(result.isError).toBe(true);
    });
  });

  describe('getQuickbooksCustomerBalance', () => {
    it('should get customer balance report', async () => {
      const mockReport = { Header: { ReportName: 'CustomerBalance' } };
      mockQuickBooksInstance.reportCustomerBalance.mockImplementation((params: any, cb: any) => cb(null, mockReport));
      const result = await getQuickbooksCustomerBalance({});
      expect(result.isError).toBe(false);
    });

    it('should handle all options', async () => {
      mockQuickBooksInstance.reportCustomerBalance.mockImplementation((params: any, cb: any) => cb(null, {}));
      const result = await getQuickbooksCustomerBalance({
        report_date: '2024-12-31',
        customer: 'cust-1',
        summarize_column_by: 'Month',
      });
      expect(result.isError).toBe(false);
    });

    it('should handle errors', async () => {
      mockQuickBooksInstance.reportCustomerBalance.mockImplementation((params: any, cb: any) => cb(new Error('Report failed'), null));
      const result = await getQuickbooksCustomerBalance({});
      expect(result.isError).toBe(true);
    });

    it('should handle authentication errors', async () => {
      (mockQuickbooksClient.authenticate as any).mockRejectedValue(new Error('Auth failed'));
      const result = await getQuickbooksCustomerBalance({});
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Auth failed');
    });
  });

  describe('getQuickbooksAgedPayables', () => {
    it('should pass aging params', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({});
      const result = await getQuickbooksAgedPayables({
        report_date: '2024-12-31',
        vendor: 'vendor-1',
        aging_method: 'Current',
        days_per_aging_period: 30,
        num_periods: 4,
      });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'AgedPayables',
        expect.objectContaining({ vendor: 'vendor-1', report_date: '2024-12-31', days_per_aging_period: 30 })
      );
    });

    it('should handle errors', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Report failed'));
      const result = await getQuickbooksAgedPayables({});
      expect(result.isError).toBe(true);
    });
  });

  describe('getQuickbooksVendorExpenses', () => {
    it('should get vendor expenses report', async () => {
      const mockReport = { Header: { ReportName: 'VendorExpenses' } };
      mockQuickBooksInstance.reportVendorExpenses.mockImplementation((params: any, cb: any) => cb(null, mockReport));
      const result = await getQuickbooksVendorExpenses({ accounting_method: 'Accrual' });
      expect(result.isError).toBe(false);
    });

    it('should handle all options', async () => {
      mockQuickBooksInstance.reportVendorExpenses.mockImplementation((params: any, cb: any) => cb(null, {}));
      const result = await getQuickbooksVendorExpenses({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        vendor: 'vendor-1',
        summarize_column_by: 'Month',
        accounting_method: 'Accrual',
      });
      expect(result.isError).toBe(false);
    });

    it('should handle errors', async () => {
      mockQuickBooksInstance.reportVendorExpenses.mockImplementation((params: any, cb: any) => cb(new Error('Report failed'), null));
      const result = await getQuickbooksVendorExpenses({});
      expect(result.isError).toBe(true);
    });

    it('should handle authentication errors', async () => {
      (mockQuickbooksClient.authenticate as any).mockRejectedValue(new Error('Auth failed'));
      const result = await getQuickbooksVendorExpenses({});
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Auth failed');
    });
  });

  describe('getQuickbooksVendorBalance', () => {
    it('should get vendor balance report', async () => {
      const mockReport = { Header: { ReportName: 'VendorBalance' } };
      mockQuickBooksInstance.reportVendorBalance.mockImplementation((params: any, cb: any) => cb(null, mockReport));
      const result = await getQuickbooksVendorBalance({});
      expect(result.isError).toBe(false);
    });

    it('should handle all options', async () => {
      mockQuickBooksInstance.reportVendorBalance.mockImplementation((params: any, cb: any) => cb(null, {}));
      const result = await getQuickbooksVendorBalance({
        report_date: '2024-12-31',
        vendor: 'vendor-1',
        summarize_column_by: 'Month',
      });
      expect(result.isError).toBe(false);
    });

    it('should handle errors', async () => {
      mockQuickBooksInstance.reportVendorBalance.mockImplementation((params: any, cb: any) => cb(new Error('Report failed'), null));
      const result = await getQuickbooksVendorBalance({});
      expect(result.isError).toBe(true);
    });

    it('should handle authentication errors', async () => {
      (mockQuickbooksClient.authenticate as any).mockRejectedValue(new Error('Auth failed'));
      const result = await getQuickbooksVendorBalance({});
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Auth failed');
    });
  });

  describe('getQuickbooksTransactionList', () => {
    it('should call TransactionList with filters', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({ Header: { ReportName: 'TransactionList' } });
      const result = await getQuickbooksTransactionList({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        account: '35',
        transaction_type: 'Bill',
      });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'TransactionList',
        expect.objectContaining({ account: '35', transaction_type: 'Bill', start_date: '2024-01-01', end_date: '2024-12-31' })
      );
    });

    it('should reject malformed end_date', async () => {
      const result = await getQuickbooksTransactionList({ end_date: 'yesterday' });
      expect(result.isError).toBe(true);
      expect(result.error).toContain('Invalid end_date');
    });
  });

  describe('getQuickbooks1099ContractorSummary', () => {
    it('should call Vendor1099Contractor', async () => {
      (mockQuickbooksClient.fetchReport as any).mockResolvedValue({ Header: { ReportName: 'Vendor1099Contractor' } });
      const result = await getQuickbooks1099ContractorSummary({ start_date: '2025-01-01', end_date: '2025-12-31' });
      expect(result.isError).toBe(false);
      expect(mockQuickbooksClient.fetchReport).toHaveBeenCalledWith(
        'Vendor1099Contractor',
        expect.objectContaining({ start_date: '2025-01-01', end_date: '2025-12-31' })
      );
    });

    it('should handle errors', async () => {
      (mockQuickbooksClient.fetchReport as any).mockRejectedValue(new Error('Report failed'));
      const result = await getQuickbooks1099ContractorSummary({});
      expect(result.isError).toBe(true);
    });
  });
});
