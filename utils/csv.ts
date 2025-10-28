
import { Transaction } from '../types';

export const convertToCSV = (data: Transaction[]): string => {
    if (data.length === 0) {
        return '';
    }

    // Note: 'id' and 'type' are excluded from the default CSV export
    const headers = ['Date', 'Description', 'Amount', 'Debit Account', 'Credit Account', 'Category'];
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = [
            row.date,
            `"${row.description.replace(/"/g, '""')}"`, // Handle quotes in description
            row.amount.toString(),
            row.debitAccount,
            row.creditAccount,
            row.category,
        ];
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

export const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
