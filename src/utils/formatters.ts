/**
 * Financial formatters and helper utilities with precision support.
 */

export function formatCurrency(amount: number, currency: string = 'MMK'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0 ${currency}`;
  }

  // MMK typically does not use decimals in cash operations
  const decimals = currency === 'MMK' ? 0 : 2;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${formatted} ${currency}`;
}

export function formatNumber(num: number, decimals: number = 0): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function formatDateTime(isoOrDate: string): string {
  if (!isoOrDate) return '';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return isoOrDate;
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoOrDate;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function generateTransactionId(dateStr?: string): string {
  const d = dateStr || getTodayDateString();
  const cleanDate = d.replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${cleanDate}-${randomSuffix}`;
}

export function generateExpenseId(dateStr?: string): string {
  const d = dateStr || getTodayDateString();
  const cleanDate = d.replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `EXP-${cleanDate}-${randomSuffix}`;
}

export function generateMovementId(dateStr?: string): string {
  const d = dateStr || getTodayDateString();
  const cleanDate = d.replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `MOV-${cleanDate}-${randomSuffix}`;
}

/**
 * Simple client-side hash function for non-plain-text storage
 */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * CSV trigger export helper
 */
export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    rows
      .map(row =>
        row
          .map(cell => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
