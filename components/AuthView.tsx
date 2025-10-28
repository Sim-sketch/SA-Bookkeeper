import React, { useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import Spinner from './Spinner';

type AuthMode = 'login' | 'signup' | 'forgotPassword';

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
                    <p className="text-sm text-center text-gray-500 dark:text-slate-400">Enter your email and we'll send you a link to get back into your account.</p>
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-slate-300">Email address</label>
                            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input mt-1" placeholder="you@example.com" />
                        </div>
                        <div>
                            <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center">
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
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-slate-300">Email address</label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input mt-1" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input mt-1" placeholder="••••••••" />
                    </div>
                     {mode === 'login' && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-600 rounded bg-gray-200 dark:bg-slate-700" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-slate-400">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <button type="button" onClick={() => setMode('forgotPassword')} className="font-medium text-teal-500 dark:text-teal-400 hover:text-teal-400 dark:hover:text-teal-300">
                                    Forgot your password?
                                </button>
                            </div>
                        </div>
                    )}
                    <div>
                        <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center">
                            {loading ? <Spinner /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </div>
                </form>
            </>
        );
    };

    return (
        <div className="flex justify-center items-center py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-lg">
                {renderFormContent()}
                 {error && <p className="text-xs text-red-500 dark:text-red-400 text-center pt-4">{error}</p>}
                 {message && <p className="text-xs text-green-600 dark:text-green-400 text-center pt-4">{message}</p>}
                <p className="text-sm text-center text-gray-500 dark:text-slate-400">
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
                     .btn-primary:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
            `}</style>
            </div>
        </div>
    );
};

export default AuthView;