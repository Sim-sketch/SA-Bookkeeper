import { SupabaseClient } from '@supabase/supabase-js';
import { Transaction, CategorizationRule } from '../types';

// Helper to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        // Check for PostgREST error code for a missing table.
        if (error.code === '42P01') {
            const missingTable = error.message.match(/relation "public\.(.*?)" does not exist/)?.[1];
            // Throw a specific error that the frontend can catch to show the setup guide.
            throw new Error(`DB_SETUP_REQUIRED: The '${missingTable || 'required'}' table is missing from your database. Please run the setup script in 'docs/schema.sql'.`);
        }
        throw new Error(error.message);
    }
};

// =================================
// Transaction Functions
// =================================

// Fetch all transactions for the logged-in user
export const getTransactions = async (supabase: SupabaseClient, userId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    handleSupabaseError(error, 'getTransactions');
    return data || [];
};

// Add a single new transaction
export const addTransaction = async (supabase: SupabaseClient, userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: userId }])
        .select()
        .single();
    
    handleSupabaseError(error, 'addTransaction');
    return data;
};

// Update an existing transaction
export const updateTransaction = async (supabase: SupabaseClient, userId: string, transaction: Transaction): Promise<Transaction> => {
    const { id, ...updateData } = transaction;
    const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    handleSupabaseError(error, 'updateTransaction');
    return data;
};

// Save a batch of transactions (e.g., from a file upload)
export const saveAllTransactions = async (supabase: SupabaseClient, userId: string, transactions: Omit<Transaction, 'id'>[]): Promise<void> => {
    const transactionsToInsert = transactions.map(tx => ({ ...tx, user_id: userId }));
    
    const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

    handleSupabaseError(error, 'saveAllTransactions');
};

// Delete multiple transactions by their IDs
export const deleteTransactions = async (supabase: SupabaseClient, userId: string, ids: string[]): Promise<void> => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids)
        .eq('user_id', userId);

    handleSupabaseError(error, 'deleteTransactions');
};

// Update multiple transactions by their IDs
export const updateTransactions = async (supabase: SupabaseClient, userId: string, ids: string[], updateData: Partial<Omit<Transaction, 'id'>>): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .in('id', ids)
        .eq('user_id', userId)
        .select();

    handleSupabaseError(error, 'updateTransactions');
    return data || [];
};


// =================================
// Categorization Rule Functions
// =================================

// Fetch all rules for the logged-in user
export const getRules = async (supabase: SupabaseClient, userId: string): Promise<CategorizationRule[]> => {
    const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    handleSupabaseError(error, 'getRules');
    return data || [];
};

// Add a single new rule
export const addRule = async (supabase: SupabaseClient, userId: string, rule: Omit<CategorizationRule, 'id'>): Promise<CategorizationRule> => {
    const { data, error } = await supabase
        .from('rules')
        .insert([{ ...rule, user_id: userId }])
        .select()
        .single();
    
    handleSupabaseError(error, 'addRule');
    return data;
};

// Delete a rule
export const deleteRule = async (supabase: SupabaseClient, userId: string, ruleId: string): Promise<void> => {
    const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', userId);

    handleSupabaseError(error, 'deleteRule');
};