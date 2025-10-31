import React, { useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import Spinner from './Spinner';

type AuthMode = 'login' | 'signup' | 'forgotPassword';

const formInputClasses = "block w-full rounded-md border-0 py-1.5 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 dark:focus:ring-teal-500 sm:text-sm sm:leading-6";
const btnPrimaryClasses = "w-full inline-flex justify-center items-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const AuthView: React.FC = () => {
    const { client: supabase } = useSupabase();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!supabase) {
            setError("Database is not configured. Please go to the Settings page to configure it.");
            setLoading(false);
            return;
        }

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    },
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else if (mode === 'forgotPassword') {
                 const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/`,
                });
                if (error) throw error;
                setMessage('Check your email for a password reset link!');
            }
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const renderFormContent = () => {
        if (mode === 'forgotPassword') {
            return (
                <>
                    <h2 className="text-2xl font-bold text-center text-teal-500 dark:text-teal-400">Reset Password</h2>
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400">Enter your email and we'll send you a link to get back into your account.</p>
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${formInputClasses} mt-1`} placeholder="you@example.com" />
                        </div>
                        <div>
                            <button type="submit" disabled={loading} className={btnPrimaryClasses}>
                                {loading ? <Spinner /> : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                </>
            );
        }

        return (
            <>
                <h2 className="text-2xl font-bold text-center text-teal-500 dark:text-teal-400">
                    {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${formInputClasses} mt-1`} placeholder="you@example.com" />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={`${formInputClasses} mt-1`} placeholder="••••••••" />
                    </div>
                     {mode === 'login' && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 rounded bg-slate-200 dark:bg-slate-700" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <button type="button" onClick={() => setMode('forgotPassword')} className="font-medium text-teal-500 dark:text-teal-400 hover:text-teal-400 dark:hover:text-teal-300">
                                    Forgot your password?
                                </button>
                            </div>
                        </div>
                    )}
                    <div>
                        <button type="submit" disabled={loading} className={btnPrimaryClasses}>
                            {loading ? <Spinner /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </div>
                </form>
            </>
        );
    };

    return (
        <div className="flex justify-center items-center py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {renderFormContent()}
                 {error && <p className="text-xs text-red-500 dark:text-red-400 text-center pt-4">{error}</p>}
                 {message && <p className="text-xs text-green-600 dark:text-green-400 text-center pt-4">{message}</p>}
                <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                    {mode === 'login' ? "Don't have an account?" : (mode === 'signup' ? 'Already have an account?' : '')}
                    {mode !== 'forgotPassword' && (
                        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }} className="font-medium text-teal-500 dark:text-teal-400 hover:text-teal-400 dark:hover:text-teal-300 ml-2">
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    )}
                     {mode === 'forgotPassword' && (
                         <button onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="font-medium text-teal-500 dark:text-teal-400 hover:text-teal-400 dark:hover:text-teal-300 ml-2">
                            Back to Sign In
                        </button>
                    )}
                </p>
            </div>
        </div>
    );
};

export default AuthView;