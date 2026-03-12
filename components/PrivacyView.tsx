
import React from 'react';

const PrivacyView: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-10 max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Privacy Policy</h1>
            
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-6">
                <p className="text-sm text-slate-500 italic">Last Updated: {new Date().toLocaleDateString()}</p>
                
                <section>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">1. Introduction</h2>
                    <p>
                        Welcome to SA Bookkeeper AI. We respect your privacy and are committed to protecting your personal data. 
                        This privacy policy will inform you as to how we look after your personal data when you visit our website 
                        or use our application and tell you about your privacy rights and how the law protects you, specifically 
                        in compliance with the Protection of Personal Information Act (POPIA) of South Africa.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">2. Data We Collect</h2>
                    <p>
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                        <li><strong>Contact Data:</strong> includes email address and company details.</li>
                        <li><strong>Financial Data:</strong> includes bank statements, transaction details, and financial reports uploaded for processing.</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, and operating system.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">3. How We Use Your Data</h2>
                    <p>
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>To provide the AI-powered bookkeeping services you have requested.</li>
                        <li>To manage your account and registration.</li>
                        <li>To improve our website, products/services, marketing or customer relationships.</li>
                    </ul>
                    <p className="mt-2">
                        <strong>Note on AI Processing:</strong> Financial documents are processed using secure AI services (Google Gemini). 
                        Data is transmitted securely and is not used to train public AI models without your explicit consent.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">4. Data Security</h2>
                    <p>
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
                        used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal 
                        data to those employees, agents, contractors and other third parties who have a business need to know.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">5. Your Legal Rights</h2>
                    <p>
                        Under certain circumstances, you have rights under data protection laws in relation to your personal data, 
                        including the right to request access, correction, erasure, restriction, transfer, to object to processing, 
                        to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">6. Contact Us</h2>
                    <p>
                        If you have any questions about this privacy policy or our privacy practices, please contact us at 
                        <a href="mailto:privacy@sabookkeeper.ai" className="text-teal-600 hover:underline ml-1">privacy@sabookkeeper.ai</a>.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyView;
