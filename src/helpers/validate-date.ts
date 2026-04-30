// QBO accepts YYYY-MM-DD for date params. Validating before the request
// surfaces a clear local error rather than a generic 400 from QBO.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateIsoDate(value: string | undefined, fieldName: string): void {
  if (value === undefined) return;
  if (!ISO_DATE.test(value)) {
    throw new Error(
      `Invalid ${fieldName}: "${value}". Expected YYYY-MM-DD.`
    );
  }
  // Reject impossible calendar dates (e.g. 2025-02-31).
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    throw new Error(
      `Invalid ${fieldName}: "${value}" is not a real date.`
    );
  }
}
