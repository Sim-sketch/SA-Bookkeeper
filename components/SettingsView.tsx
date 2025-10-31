import React, { useState, useEffect } from 'react';
import { SaveIcon } from './icons/SaveIcon';

export interface Settings {
    apiKey: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
}

interface SettingsViewProps {
    currentApiKey: string;
    currentSupabaseUrl: string;
    currentSupabaseAnonKey: string;
    onSaveSettings: (settings: Settings) => void;
    isInitialSetup?: boolean;
}

const formInputClasses = "w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition";
const btnPrimaryClasses = "inline-flex justify-center items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const SettingsView: React.FC<SettingsViewProps> = ({ 
    currentApiKey, 
    currentSupabaseUrl,
    currentSupabaseAnonKey,
    onSaveSettings,
    isInitialSetup = false 
}) => {
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
    const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState('');

    useEffect(() => {
        setApiKeyInput(currentApiKey);
        setSupabaseUrlInput(currentSupabaseUrl);
        setSupabaseAnonKeyInput(currentSupabaseAnonKey);
    }, [currentApiKey, currentSupabaseUrl, currentSupabaseAnonKey]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveSettings({
            apiKey: apiKeyInput,
            supabaseUrl: supabaseUrlInput,
            supabaseAnonKey: supabaseAnonKeyInput
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">Settings</h2>
            
            {isInitialSetup && (
                <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-500/50 rounded-lg text-blue-800 dark:text-blue-200">
                    <h3 className="font-bold">Welcome! Let's get you set up.</h3>
                    <p className="text-sm mt-1">
                        To use the app, you need to connect to your database and provide an AI key. 
                        Your credentials are saved securely in your browser and are never shared.
                    </p>
                </div>
            )}
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Configure your application settings here. Your keys are stored securely in your browser's local storage.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Database Connection</h3>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="supabaseUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Supabase Project URL
                            </label>
                            <input
                                id="supabaseUrl"
                                type="text"
                                value={supabaseUrlInput}
                                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                                placeholder="https://your-project-ref.supabase.co"
                                className={formInputClasses}
                            />
                        </div>
                         <div>
                            <label htmlFor="supabaseAnonKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Supabase Anon (Public) Key
                            </label>
                            <input
                                id="supabaseAnonKey"
                                type="text"
                                value={supabaseAnonKeyInput}
                                onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                                placeholder="Enter your Supabase anon key"
                                className={formInputClasses}
                            />
                             <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                You can find these in your Supabase project's "API Settings".
                            </p>
                        </div>
                    </div>
                </div>

                 <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">AI Configuration</h3>
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Gemini API Key
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="Enter your Gemini API key"
                            className={formInputClasses}
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            You can get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">Google AI Studio</a>.
                        </p>
                    </div>
                 </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={!apiKeyInput.trim() || !supabaseUrlInput.trim() || !supabaseAnonKeyInput.trim()}
                        className={`${btnPrimaryClasses} flex items-center gap-2`}
                    >
                        <SaveIcon className="w-4 h-4" />
                        Save and Reload
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsView;