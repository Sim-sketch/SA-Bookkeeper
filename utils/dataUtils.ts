
import { Transaction, SaTaxCategory } from '../types';

export const sanitizeTransaction = (tx: any): Transaction => {
    // Safety check for null/undefined or non-object inputs
    if (!tx || typeof tx !== 'object') {
        return {
            id: `unknown-${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString().split('T')[0],
            description: 'Unknown Transaction',
            amount: 0,
            type: 'Debit',
            debitAccount: 'Uncategorized',
            creditAccount: 'Uncategorized',
            category: 'Uncategorized',
            taxCategory: 'N/A'
        };
    }

    // Strictly cast all fields to primitives to avoid circular structure errors 
    // (e.g. from Firestore References, React SyntheticEvents, or DOM nodes)
    return {
        id: String(tx.id || ''),
        date: String(tx.date || new Date().toISOString().split('T')[0]),
        description: String(tx.description || '').substring(0, 500), // Limit length just in case
        amount: Number(tx.amount) || 0,
        // Ensure type is exactly 'Debit' or 'Credit'
        type: String(tx.type) === 'Credit' ? 'Credit' : 'Debit',
        debitAccount: String(tx.debitAccount || ''),
        creditAccount: String(tx.creditAccount || ''),
        category: String(tx.category || 'Operating Expense'),
        // FIX: Explicitly cast taxCategory to SaTaxCategory
        taxCategory: (String(tx.taxCategory) as SaTaxCategory) || 'N/A'
    };
};

export const sanitizeTransactions = (transactions: any[]): Transaction[] => {
    if (!Array.isArray(transactions)) return [];
    return transactions.map(sanitizeTransaction);
};
