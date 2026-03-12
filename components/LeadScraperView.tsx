
import React, { useState } from 'react';
import { ScrapedLead, Customer, CustomerStatus } from '../types';
import { searchBusinesses } from '../services/geminiService';
import Spinner from './Spinner';
import { MapIcon } from './icons/MapIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SearchIcon } from './icons/SearchIcon';

interface LeadScraperViewProps {
    onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
}

const LeadScraperView: React.FC<LeadScraperViewProps> = ({ onAddCustomer }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ScrapedLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setResults([]);
        setSavedIndices(new Set());

        try {
            const leads = await searchBusinesses(query);
            setResults(leads);
            if (leads.length === 0) {
                setError("No results found. Try a different query or location.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to search.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveLead = (lead: ScrapedLead, index: number) => {
        // Add to CRM
        onAddCustomer({
            name: lead.name,
            companyName: lead.name, // Usually same for businesses found on maps
            status: 'Lead',
            balance: 0,
            notes: `Source: Google Search Scraper\nLink: ${lead.googleMapsUri}\nDetails: ${lead.description}`,
            email: lead.email || '', 
            phone: lead.phone || ''  
        });
        
        setSavedIndices(prev => new Set(prev).add(index));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                        <MapIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Lead Scraper</h1>
                        <p className="text-blue-100">Find local businesses on Google and add them to your CRM instantly.</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="relative max-w-2xl">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full p-4 pl-11 text-sm text-slate-900 border-none rounded-lg bg-white focus:ring-4 focus:ring-blue-400 focus:outline-none shadow-lg"
                            placeholder="e.g. 'Plumbers in Cape Town' or 'Coffee Shops near Sandton'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="absolute right-2.5 bottom-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-6 py-2 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Area */}
            <div className="space-y-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Spinner className="w-10 h-10 text-blue-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Scouring the web for leads...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {!isLoading && results.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((lead, index) => (
                            <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-2" title={lead.name}>{lead.name}</h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 shrink-0 ml-2">Lead</span>
                                </div>
                                
                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-grow space-y-2">
                                    {lead.address && <p className="flex items-start gap-2"><MapIcon className="w-4 h-4 mt-0.5 shrink-0" /> {lead.address}</p>}
                                    {lead.phone && <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300 font-mono text-xs">📞 {lead.phone}</p>}
                                    {lead.email && <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300 font-mono text-xs">✉️ {lead.email}</p>}
                                    {lead.description && <p className="text-xs mt-2 italic border-l-2 pl-2 border-slate-200">{lead.description}</p>}
                                    
                                    {lead.googleMapsUri && (
                                        <a href={lead.googleMapsUri} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs block mt-2">View Details ↗</a>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleSaveLead(lead, index)}
                                    disabled={savedIndices.has(index)}
                                    className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                                        savedIndices.has(index)
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                    {savedIndices.has(index) ? (
                                        <>
                                            <CheckIcon className="w-4 h-4" />
                                            Saved to CRM
                                        </>
                                    ) : (
                                        '+ Add as Lead'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && results.length === 0 && !error && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                        <MapIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Ready to find new clients?</p>
                        <p className="text-sm">Enter a business type and location above to start scraping.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadScraperView;
