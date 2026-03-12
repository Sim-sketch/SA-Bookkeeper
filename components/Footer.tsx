import React from 'react';
import { View } from '../types.ts';

interface FooterProps {
    setView: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ setView }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
            <div className="container mx-auto px-4 py-6 md:py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">SA Bookkeeper AI</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            &copy; {currentYear} All rights reserved.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <button onClick={() => setView(View.PRIVACY)} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy Policy</button>
                        <button onClick={() => setView(View.TERMS)} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms of Service</button>
                        <button onClick={() => setView(View.SUPPORT)} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Support</button>
                    </div>

                    <div className="text-xs text-slate-400 dark:text-slate-600 text-center md:text-right">
                        <p>Proudly built for South African Businesses 🇿🇦</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;