import React, { useState, useCallback, useEffect } from 'react';
import { Transaction } from '../types';
import { generateFinancialAnalysis } from '../services/geminiService';
import Spinner from './Spinner';
import { AnalysisIcon } from './icons/AnalysisIcon';

interface AnalysisViewProps {
    transactions: Transaction[];
    initialAnalysis: string;
    checkApiKey: () => boolean;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ transactions, initialAnalysis, checkApiKey }) => {
    const [analysis, setAnalysis] = useState<string>(initialAnalysis);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setAnalysis(initialAnalysis);
    }, [initialAnalysis]);

    const handleGenerateAnalysis = useCallback(async () => {
        if (!checkApiKey()) {
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis('');
        try {
            const result = await generateFinancialAnalysis(transactions);
            setAnalysis(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [transactions, checkApiKey]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-2 md:mb-0">AI Financial Analysis & Advice</h2>
                <button
                    onClick={handleGenerateAnalysis}
                    disabled={isLoading}
                    className="inline-flex justify-center items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <AnalysisIcon className="w-4 h-4" />
                    {isLoading ? 'Generating...' : (analysis ? 'Regenerate Analysis' : 'Generate Analysis')}
                </button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center h-64">
                    <Spinner />
                    <p className="mt-4 text-teal-600 dark:text-teal-400">AI is analyzing your data... this may take a minute.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Analysis Failed: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {analysis && (
                <div className="prose prose-sm md:prose-base max-w-none prose-slate dark:prose-invert bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-sans">{analysis}</pre>
                </div>
            )}

            {!analysis && !isLoading && !error && (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    <p>Click "Generate Analysis" to get AI-powered insights on your financial data.</p>
                </div>
            )}
        </div>
    );
};

export default AnalysisView;