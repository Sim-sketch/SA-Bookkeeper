import React from 'react';
import FileUpload from './FileUpload';

interface DatabaseSetupGuideProps {
    onUploadClick: (file: File) => void;
}

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
    <pre className="bg-gray-200 dark:bg-slate-900 rounded-md p-4 text-left text-sm text-gray-800 dark:text-slate-300 overflow-x-auto">
        <code>{code}</code>
    </pre>
);

const sqlSchema = `
-- 1. Create the 'transactions' table with a user_id foreign key.
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'Debit' or 'Credit'
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the 'rules' table with a user_id foreign key.
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  account TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) on both tables.
-- This is CRITICAL for protecting user data.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies to ensure users can only access their own data.
-- Policy for 'transactions' table
CREATE POLICY "Users can manage their own transactions"
ON public.transactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for 'rules' table
CREATE POLICY "Users can manage their own rules"
ON public.rules
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;

const DatabaseSetupGuide: React.FC<DatabaseSetupGuideProps> = ({ onUploadClick }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 text-center">
                 <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-300 mb-4">Dashboard</h2>
                 <p className="text-gray-500 dark:text-slate-400 mb-6">
                    You have no transactions yet.
                    <br />
                    Upload a bank statement to get started.
                </p>
                <FileUpload onFileSelect={onUploadClick} disabled={false} />
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-300 mb-4">Action Required: Database Setup</h2>
                <div className="space-y-4 text-gray-700 dark:text-slate-300 text-sm">
                    <p className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-500 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded-lg">
                        It looks like the database tables are not set up yet. Please follow the steps below.
                    </p>
                    <p>
                        <span className="font-bold text-teal-600 dark:text-teal-400">Step 1:</span> Create a new project at{' '}
                        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-500 dark:hover:text-teal-300">
                            supabase.com
                        </a>.
                    </p>
                    <p>
                        <span className="font-bold text-teal-600 dark:text-teal-400">Step 2:</span> In your Supabase project, go to the{' '}
                        <span className="font-semibold text-gray-800 dark:text-white">SQL Editor</span> and run the following script to create and secure your tables:
                    </p>
                    <CodeBlock code={sqlSchema} />
                    <p>
                        <span className="font-bold text-teal-600 dark:text-teal-400">Step 3:</span> Find your API credentials in{' '}
                        <span className="font-semibold text-gray-800 dark:text-white">Project Settings &gt; API</span>.
                    </p>
                     <p>
                        <span className="font-bold text-teal-600 dark:text-teal-400">Step 4:</span> When you first run this application, it will ask for your Project URL and anon key. Paste them into the form to connect. If you've already done this, simply <a href="#" onClick={() => window.location.reload()} className="underline hover:text-teal-500 dark:hover:text-teal-300">refresh the page</a> after running the SQL script above.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DatabaseSetupGuide;