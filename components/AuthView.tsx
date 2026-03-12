import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';
import { CheckIcon } from './icons/CheckIcon';
import { motion } from 'motion/react';

type ViewMode = 'login' | 'signup' | 'verify';

const formInputClasses = "block w-full rounded-lg border-0 py-3.5 pl-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 dark:focus:ring-teal-500 text-base sm:leading-6 bg-transparent dark:bg-slate-800 transition-all duration-200";
const btnPrimaryClasses = "flex w-full justify-center rounded-lg bg-teal-600 px-3 py-3 text-base font-semibold leading-6 text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";

const FeatureItem: React.FC<{ title: string; description: string; index: number }> = ({ title, description, index }) => (
    <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * index, duration: 0.5 }}
        className="flex gap-x-4"
    >
        <div className="mt-1 h-8 w-8 flex-none rounded-full bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/50">
            <CheckIcon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        </div>
        <div>
            <h3 className="text-lg font-semibold leading-7 text-white">{title}</h3>
            <p className="text-base leading-6 text-slate-300/80">{description}</p>
        </div>
    </motion.div>
);

const AuthView: React.FC = () => {
    const { user, login, signup, loginWithGoogle, logout } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

    const features = [
        { title: "AI-Powered OCR", description: "Instant categorization from bank statements." },
        { title: "SARS-Ready Reports", description: "Generate compliant Financial Statements." },
        { title: "Financial Insights", description: "Chat with your data to get instant answers." },
        { title: "VAT Tracking", description: "Real-time VAT calculation and reporting." },
        { title: "Secure Cloud", description: "Your data is encrypted and stored securely." }
    ];

    // If user is signed in but not verified, force verify screen
    useEffect(() => {
        if (user && !user.emailVerified) {
            setViewMode('verify');
        }
    }, [user]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (viewMode === 'login') {
                await login({ email, password });
            } else {
                // Keep the email for the verification screen as user will be signed out
                setVerificationEmail(email);
                await signup({ email, password });
                setViewMode('verify');
            }
        } catch (error: any) {
            let message = error.message;
            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/email-already-in-use') {
                message = 'An account already exists with this email. Please sign in instead.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const setMode = (mode: ViewMode) => {
        setViewMode(mode);
        setError(null);
        setPassword('');
        setVerificationEmail(null);
    };

    const handleGoToLogin = async () => {
        setLoading(true);
        try {
            // Sign out if an unverified session exists
            if (user) {
                await logout();
            }
            setViewMode('login');
            setError(null);
            setPassword('');
            setVerificationEmail(null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">
            <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-900 relative overflow-hidden px-14 py-14 flex-col justify-between transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-slate-950 opacity-90 z-0"></div>
                <div className="relative z-10">
                    <div className="mb-12 animate-fade-in">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">SA</div>
                             <span className="text-2xl font-bold text-white tracking-tight">Bookkeeper AI</span>
                         </div>
                    </div>
                    <div className="space-y-10 max-w-lg">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight"
                        >
                            Smart accounting for <span className="text-emerald-400">South African</span> businesses.
                        </motion.h1>
                        <div className="space-y-6">
                            {features.map((feature, index) => (
                                <FeatureItem 
                                    key={index}
                                    index={index}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="relative z-10 mt-12 flex items-center justify-between text-xs text-slate-400 animate-fade-in delay-300">
                    <span>&copy; {new Date().getFullYear()} SA Bookkeeper AI. Secure & Private.</span>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white dark:bg-slate-950 p-6 sm:p-10 lg:p-16 animate-fade-in">
                <div className="w-full max-w-md space-y-8 flex flex-col h-full justify-center relative">
                    <div className="lg:hidden flex flex-col items-center text-center mb-2">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-50 to-teal-700 flex items-center justify-center text-white font-bold text-xl shadow-md mb-3">SA</div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">SA Bookkeeper AI</h2>
                    </div>
                    
                    <div className="text-center lg:text-left mb-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-all duration-300">
                            {viewMode === 'login' ? 'Welcome back' : viewMode === 'signup' ? 'Create an account' : 'Verify your email'}
                        </h2>
                    </div>

                    {viewMode !== 'verify' && (
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                            <button
                                onClick={() => setMode('login')}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                    viewMode === 'login'
                                        ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setMode('signup')}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                    viewMode === 'signup'
                                        ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                Create Account
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30 animate-fade-in">
                            {error}
                        </div>
                    )}

                    {viewMode === 'verify' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="p-6 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-center">
                                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">📧</span>
                                </div>
                                <p className="text-lg leading-relaxed">
                                    We have sent you a verification email to <strong className="text-teal-600 dark:text-teal-400">{user?.email || verificationEmail}</strong>. Please verify it and log in.
                                </p>
                            </div>
                            <button 
                                onClick={handleGoToLogin} 
                                disabled={loading}
                                className={btnPrimaryClasses}
                            >
                                {loading ? <Spinner className="w-5 h-5 mr-2 text-white" /> : 'Back to Login'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <form className="mt-4 space-y-5" onSubmit={handleAuth}>
                                <div className="space-y-5">
                                    <input 
                                        type="email" 
                                        autoComplete="email" 
                                        required 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        className={formInputClasses} 
                                        placeholder="Email address" 
                                        disabled={loading} 
                                    />
                                    <input 
                                        type="password" 
                                        required 
                                        minLength={6} 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className={formInputClasses} 
                                        placeholder="Password" 
                                        disabled={loading} 
                                    />
                                </div>
                                <div className="space-y-4">
                                    <button type="submit" disabled={loading} className={btnPrimaryClasses}>
                                        {loading ? <Spinner className="w-5 h-5 mr-2 text-white" /> : (viewMode === 'login' ? 'Sign in' : 'Create account')}
                                    </button>
                                </div>
                            </form>

                            <div className="relative mt-6">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-sm font-medium leading-6">
                                    <span className="bg-white dark:bg-slate-950 px-4 text-slate-500 dark:text-slate-400">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="flex w-full justify-center items-center gap-3 rounded-lg bg-white dark:bg-slate-900 px-3 py-3 text-base font-semibold leading-6 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:ring-transparent transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    <span>Google</span>
                                </button>
                            </div>

                            <div className="lg:hidden mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Key Features</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{f.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthView;