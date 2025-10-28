import React, { useState } from 'react';

interface SupabaseConnectFormProps {
    onConnect: (url: string, key: string) => void;
}

const SupabaseConnectForm: React.FC<SupabaseConnectFormProps> = ({ onConnect }) => {
    const [url, setUrl] = useState('');
    const [anonKey, setAnonKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || !anonKey.trim()) {
            setError('Both URL and Anon Key are required.');
            return;
        }
        // Basic validation for Supabase URL format
        if (!url.startsWith('https://') || !url.endsWith('.supabase.co')) {
            setError('Please enter a valid Supabase Project URL.');
            return;
        }
        setError('');
        onConnect(url, anonKey);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        SA <span className="text-teal-500 dark:text-teal-400">Bookkeeper AI</span>
                    </h1>
                    <h2 className="mt-2 text-xl font-bold text-teal-600 dark:text-teal-300">
                        Connect to Supabase
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                        Please enter your Supabase project credentials to continue. This information is stored securely in your browser's local storage and is never sent to us.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="supabase-url" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            Project URL
                        </label>
                        <input
                            id="supabase-url"
                            type="url"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="form-input mt-1"
                            placeholder="https://your-project-ref.supabase.co"
                        />
                    </div>
                    <div>
                        <label htmlFor="supabase-key" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            Project Anon Key
                        </label>
                        <input
                            id="supabase-key"
                            type="text"
                            required
                            value={anonKey}
                            onChange={(e) => setAnonKey(e.target.value)}
                            className="form-input mt-1"
                            placeholder="ey..."
                        />
                        <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                            You can find your credentials in your Supabase project under Project Settings &gt; API.
                        </p>
                    </div>
                    <div>
                        <button type="submit" className="w-full btn-primary">
                            Connect & Save
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-500 dark:text-red-400 text-center">{error}</p>}
                </form>
            </div>
            <style>{`
                .dark .form-input {
                    background-color: #334155; /* slate-700 */
                    border-color: #475569; /* slate-600 */
                    color: white;
                }
                .form-input {
                    background-color: #f1f5f9; /* slate-100 */
                    border: 1px solid #cbd5e1; /* slate-300 */
                    border-radius: 0.375rem; /* rounded-md */
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    color: #1e293b; /* slate-800 */
                    width: 100%;
                }
                .form-input:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px #14b8a6; /* ring-2 ring-teal-500 */
                    border-color: #14b8a6;
                }
                .btn-primary {
                    background-color: #14b8a6; /* teal-500 */
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                .btn-primary:hover {
                    background-color: #0d9488; /* teal-600 */
                }
            `}</style>
        </div>
    );
};

export default SupabaseConnectForm;