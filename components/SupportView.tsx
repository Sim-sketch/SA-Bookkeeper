
import React, { useState } from 'react';
import { CheckIcon } from './icons/CheckIcon';

const SupportView: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    if (submitted) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 max-w-2xl mx-auto text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Thank you for reaching out. Our support team will get back to you within 24 hours.
                </p>
                <button 
                    onClick={() => setSubmitted(false)}
                    className="text-teal-600 hover:text-teal-500 font-medium"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-10 max-w-4xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Contact Support</h1>
                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                        Need help with your bookkeeping? Have a feature request? 
                        Fill out the form or send us an email, and we'll get back to you as soon as possible.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Email Us</h3>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">support@sabookkeeper.ai</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Office Hours</h3>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">Mon - Fri: 8:00 AM - 5:00 PM (SAST)</p>
                        </div>
                        <div className="p-4 bg-teal-50 dark:bg-teal-900/10 rounded-lg border border-teal-100 dark:border-teal-800/30">
                            <h4 className="font-semibold text-teal-800 dark:text-teal-300 mb-1">Quick Tip</h4>
                            <p className="text-sm text-teal-700 dark:text-teal-400">
                                You can use the AI Chat assistant for immediate answers about your financial data and tax categories!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                            <select 
                                id="subject" 
                                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2.5 border"
                                required
                            >
                                <option value="">Select a topic...</option>
                                <option value="technical">Technical Issue</option>
                                <option value="billing">Billing / Account</option>
                                <option value="feature">Feature Request</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                            <textarea
                                id="message"
                                rows={5}
                                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2.5 border"
                                placeholder="Describe your issue or question..."
                                required
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SupportView;
