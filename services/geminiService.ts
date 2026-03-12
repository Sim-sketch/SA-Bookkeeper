
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AnalyzedStatement, AnalyzedReceipt, FinancialAnalysis, AiChatResponse, ScrapedLead } from '../types.ts';

// Specialized instruction for high-accuracy OCR on SA Bank Statements
const STATEMENT_SYSTEM_INSTRUCTION = `You are a high-speed South African Banking OCR agent.
Extract EVERY transaction from the statement. 

EXTRACTION RULES:
1. COLUMNS: [Date, Description, Amount].
2. DIRECTION: Withdrawals are 'Debit', Deposits are 'Credit'.
3. CLEANING: Remove branch codes, store IDs, and locations (e.g., "632005", "CPT", "JHB").
4. DATES: strictly YYYY-MM-DD.
5. CONSERVATION: Keep descriptions brief to save output space.

CRITICAL: If the list is long, STOP extracting before you hit your token limit. 
ALWAYS ensure the JSON structure (brackets and braces) is closed correctly at the end of your response, even if you have to truncate the list.`;

const RECEIPT_SYSTEM_INSTRUCTION = `You are an expert SA Bookkeeper. Extract data from this receipt. ZAR currency. 15% VAT component.`;

/**
 * Advanced JSON repair utility for handling AI truncation errors.
 */
const cleanJsonResponse = (text: string): string => {
    if (!text) return '{}';
    
    // 1. Standard markdown block removal
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 2. Find the root start
    const start = cleaned.indexOf('{');
    if (start === -1) return '{}';

    // 3. Try to find the last valid transaction object in an array
    // Truncation usually happens like: ..., {"date": "2024-01-01", "desc": "Checkers
    const lastClosingBrace = cleaned.lastIndexOf('}');
    const lastOpeningBrace = cleaned.lastIndexOf('{');

    // If the response ends in the middle of an object (opening brace after last closing brace)
    if (lastOpeningBrace > lastClosingBrace) {
        console.warn("Gemini: Truncated object detected. Rebuilding structure...");
        // Cut back to the last fully closed object
        cleaned = cleaned.substring(0, lastClosingBrace + 1);
        
        // Re-close the JSON structure
        const openBrackets = (cleaned.match(/\[/g) || []).length;
        const closeBrackets = (cleaned.match(/\]/g) || []).length;
        if (openBrackets > closeBrackets) cleaned += ']';

        const openBraces = (cleaned.match(/\{/g) || []).length;
        const closeBraces = (cleaned.match(/\}/g) || []).length;
        if (openBraces > closeBraces) cleaned += '}'.repeat(openBraces - closeBraces);
    } else {
        // Find the absolute last brace for a healthy response
        const absoluteEnd = cleaned.lastIndexOf('}');
        if (absoluteEnd !== -1) {
            cleaned = cleaned.substring(start, absoluteEnd + 1);
        }
    }

    return cleaned;
};

export const analyzeStatement = async (base64Data: string, mimeType: string): Promise<AnalyzedStatement> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    
    // Use gemini-3-flash-preview for high-volume OCR tasks. 
    // It is more resilient to large PDF payloads and faster than Pro.
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: [{
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: "OCR this bank statement. Return as many transactions as possible in JSON format. Priority is accuracy of amounts and dates." }
            ]
        }],
        config: {
            systemInstruction: STATEMENT_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            // Disable thinking to save output tokens and reduce completion latency for raw extraction
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 8192, 
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    metadata: {
                        type: Type.OBJECT,
                        properties: {
                            bankName: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            currency: { type: Type.STRING }
                        },
                        required: ["bankName", "currency"]
                    },
                    transactions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING },
                                description: { type: Type.STRING },
                                amount: { type: Type.NUMBER },
                                type: { type: Type.STRING, enum: ["Debit", "Credit"] },
                                debitAccount: { type: Type.STRING },
                                creditAccount: { type: Type.STRING },
                                category: { type: Type.STRING },
                                taxCategory: { type: Type.STRING }
                            },
                            required: ["date", "description", "amount", "type", "debitAccount", "creditAccount", "category", "taxCategory"]
                        }
                    }
                },
                required: ["metadata", "transactions"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("Server returned an empty response. The file might be too large or encrypted.");
    
    try {
        const cleaned = cleanJsonResponse(text);
        const parsed = JSON.parse(cleaned);
        
        if (!parsed.transactions || parsed.transactions.length === 0) {
            throw new Error("No transactions were found. Please check if the PDF is a standard bank statement.");
        }
        
        return parsed as AnalyzedStatement;
    } catch (e: any) {
        console.error("Statement OCR Failure:", e);
        // If it's a JSON parse error after cleaning, the truncation was likely too severe to fix
        if (e instanceof SyntaxError) {
            throw new Error("The statement response was incomplete. Please try splitting the PDF into fewer pages.");
        }
        throw e;
    }
};

export const analyzeReceipt = async (base64Data: string, mimeType: string): Promise<AnalyzedReceipt> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: "Analyze this receipt." }
            ]
        }],
        config: {
            systemInstruction: RECEIPT_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING },
                    merchant: { type: Type.STRING },
                    totalAmount: { type: Type.NUMBER },
                    vatAmount: { type: Type.NUMBER },
                    suggestedCategory: { type: Type.STRING },
                    suggestedTaxCategory: { type: Type.STRING },
                    debitAccount: { type: Type.STRING },
                    creditAccount: { type: Type.STRING }
                },
                required: ["date", "merchant", "totalAmount", "suggestedCategory", "debitAccount", "creditAccount"]
            }
        }
    });

    const cleaned = cleanJsonResponse(response.text || '');
    return JSON.parse(cleaned) as AnalyzedReceipt;
};

export const generateFinancialAnalysis = async (transactions: Transaction[]): Promise<FinancialAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const summary = transactions.slice(0, 400).map(t => ({ d: t.description, a: t.amount, ty: t.type, c: t.category }));
    const prompt = `Perform an audit on these ZAR business transactions: ${JSON.stringify(summary)}. Return JSON FinancialAnalysis.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 8000 }
        }
    });

    const cleaned = cleanJsonResponse(response.text || '{}');
    return JSON.parse(cleaned) as FinancialAnalysis;
};

export const getAiChatResponse = async (question: string, transactions: Transaction[]): Promise<AiChatResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const recent = transactions.slice(0, 50).map(t => ({ d: t.description, a: t.amount, c: t.category }));
    const prompt = `Sipho (Bookkeeper). Question: ${question}. Recent Data: ${JSON.stringify(recent)}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const cleaned = cleanJsonResponse(response.text || '{"text": "Chat error."}');
    return JSON.parse(cleaned) as AiChatResponse;
};

export const searchBusinesses = async (query: string): Promise<ScrapedLead[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const prompt = `Find SA businesses for: "${query}". Return JSON ScrapedLead[].`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        }
    });

    const cleaned = cleanJsonResponse(response.text || '[]');
    return JSON.parse(cleaned) as ScrapedLead[];
};

export const suggestCategorization = async (description: string, amount: number, type: 'Debit' | 'Credit'): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const prompt = `Suggest accounts: "${description}" (R${amount}, ${type}).`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        debitAccount: { type: Type.STRING },
                        creditAccount: { type: Type.STRING },
                        category: { type: Type.STRING },
                        taxCategory: { type: Type.STRING }
                    },
                    required: ["debitAccount", "creditAccount", "category", "taxCategory"]
                }
            }
        });
        const cleaned = cleanJsonResponse(response.text || '{}');
        return JSON.parse(cleaned);
    } catch (e) {
        return { 
            debitAccount: type === 'Debit' ? 'General Expense' : 'Bank Account', 
            creditAccount: type === 'Debit' ? 'Bank Account' : 'Sales',
            category: type === 'Debit' ? 'Operating Expense' : 'Revenue', 
            taxCategory: 'VAT Standard Rate (15%)' 
        };
    }
};
