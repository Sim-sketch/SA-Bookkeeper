import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';

/**
 * Retrieves the Gemini API key. It prioritizes the key from localStorage 
 * (set by the user in the Settings UI), falling back to environment variables 
 * for deployed environments. This provides flexibility for both local development 
 * and production deployment.
 * @returns The API key.
 * @throws An error if the API key is not configured in either location.
 */
const getApiKey = (): string => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        return storedKey;
    }
    // Fallback for deployed environments where the key is injected as an env var.
    if (process.env.API_KEY) {
        return process.env.API_KEY;
    }
    throw new Error("API Key not configured. Please go to the Settings page to add your Gemini API key.");
};

const analysisPrompt = `
You are an expert South African bookkeeper AI. Your task is to analyze the provided bank statement PDF and extract all transactions. For each transaction, you must perform double-entry bookkeeping.

Follow these rules precisely:
1.  Identify the transaction date, description, and amount.
2.  Determine if the transaction is money IN (a credit to the bank account) or money OUT (a debit from the bank account).
3.  Assign the correct debit and credit accounts based on a standard South African small business chart of accounts.
    -   The 'Bank' account is CREDITED when money is paid OUT.
    -   The 'Bank' account is DEBITED when money comes IN.
    -   For money IN (revenue): Debit 'Bank', Credit 'Sales Revenue' or 'Interest Income'.
    -   For money OUT (expenses): Credit 'Bank', Debit an appropriate expense account (e.g., 'Rent Expense', 'Salaries', 'Bank Charges', 'Telephone & Internet', 'Fuel Expense', 'Groceries', 'Entertainment').
    -   For capital: Debit 'Bank', Credit 'Owner's Capital Contribution'.
    -   For drawings: Credit 'Bank', Debit 'Owner's Drawings'.
4.  Categorize each transaction into a high-level group: 'Revenue', 'Operating Expense', 'Financing', 'Investing', or 'Personal'.
5.  Return the result as a JSON array matching the provided schema exactly. Do not include any explanatory text outside of the JSON structure.
`;

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            date: {
                type: Type.STRING,
                description: "Transaction date in YYYY-MM-DD format.",
            },
            description: {
                type: Type.STRING,
                description: "The full transaction description from the statement.",
            },
            amount: {
                type: Type.NUMBER,
                description: "The transaction amount as a positive number.",
            },
            type: {
                type: Type.STRING,
                description: "The type of transaction from the bank's perspective: 'Debit' for money out, 'Credit' for money in.",
            },
            debitAccount: {
                type: Type.STRING,
                description: "The general ledger account to be debited.",
            },
            creditAccount: {
                type: Type.STRING,
                description: "The general ledger account to be credited.",
            },
            category: {
                type: Type.STRING,
                description: "A high-level category: 'Revenue', 'Operating Expense', 'Financing', 'Investing', or 'Personal'.",
            },
        },
        required: ["date", "description", "amount", "type", "debitAccount", "creditAccount", "category"],
    },
};

export const analyzeStatement = async (base64Pdf: string, mimeType: string): Promise<Omit<Transaction, 'id'>[]> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        { text: analysisPrompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Pdf,
                            },
                        },
                    ],
                },
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const transactionsData = JSON.parse(jsonText);
        
        if (!Array.isArray(transactionsData)) {
            throw new Error("AI response is not a valid array.");
        }

        return transactionsData as Omit<Transaction, 'id'>[];

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        // Provide more granular error feedback
        if (error.message?.includes('API key not valid')) {
            throw new Error("Your API Key is not valid. Please check it in the Settings page.");
        }
         if (error.message?.includes('API key is not set')) {
            throw error; // Re-throw the specific error from getApiKey
        }
        if (error.message?.includes('billing')) {
            throw new Error("There seems to be an issue with your Google AI billing account.");
        }
         if (error.message?.includes('quota')) {
            throw new Error("You have exceeded your API usage quota.");
        }
        throw new Error("The AI failed to process the document. It might be an unsupported format or corrupted.");
    }
};

export const generateFinancialAnalysis = async (transactions: Transaction[]): Promise<string> => {
    const prompt = `
You are a financial advisor AI for South African small businesses. Based on the provided transaction data in JSON format, generate a concise but insightful financial analysis and provide actionable advice.

The analysis should cover:
1.  **Overall Financial Health:** A brief overview of the financial performance, including total income, total expenses, and net profit/loss for the period. Comment on the profitability.
2.  **Spending Breakdown:** Identify the top 3-5 spending categories and their percentages of total expenses. Highlight any potentially excessive spending.
3.  **Income Sources:** Highlight the main sources of revenue and their stability.
4.  **Actionable Insights & Advice:** Provide 2-3 specific, actionable recommendations in bullet points. For example, suggest concrete cost-saving measures, comment on cash flow management, or recommend strategies to increase revenue based on the data.
5.  **Tax Consideration (Disclaimer):** Briefly mention potential VAT or income tax obligations based on revenue, but include a strong disclaimer that this is not professional tax advice and a registered tax practitioner must be consulted for compliance.

Present the analysis in clear, easy-to-read markdown format. Be professional, encouraging, and accessible for a small business owner who may not be a finance expert.

Transaction Data:
${JSON.stringify(transactions, null, 2)}
`;

    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for analysis:", error);
        throw new Error("The AI failed to generate the financial analysis.");
    }
};

const suggestionSchema = {
    type: Type.OBJECT,
    properties: {
        debitAccount: { type: Type.STRING },
        creditAccount: { type: Type.STRING },
        category: { type: Type.STRING },
    },
    required: ["debitAccount", "creditAccount", "category"],
};

// FIX: Changed return type to be more specific, avoiding a type clash in the form component.
export const suggestCategorization = async (description: string, amount: number, type: 'Debit' | 'Credit'): Promise<Pick<Transaction, 'debitAccount' | 'creditAccount' | 'category'>> => {
    const prompt = `
    You are a South African bookkeeping expert. A user has entered a transaction manually. Based on the description, amount, and type (from the bank's perspective), suggest the correct double-entry accounts and category.

    - If type is 'Debit' (money out), the 'Bank' account is credited.
    - If type is 'Credit' (money in), the 'Bank' account is debited.

    Transaction Details:
    - Description: "${description}"
    - Amount: ${amount}
    - Type (from Bank): "${type}"

    Provide your suggestion as a single JSON object matching the schema.
    `;

    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error calling Gemini API for suggestion:", error);
        throw new Error("AI suggestion failed.");
    }
};

export const getAiChatResponse = async (question: string, transactions: Transaction[]): Promise<string> => {
    const prompt = `
You are an expert financial assistant AI. A user is asking a question about their transaction data.
Your task is to answer the user's question based *only* on the transaction data provided below in JSON format.
Be helpful and concise. If the data does not contain the answer, say so politely.
Do not make up information. Perform calculations if necessary (e.g., summing up totals for a category).

User's Question: "${question}"

Transaction Data:
${JSON.stringify(transactions, null, 2)}
`;

    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for chat:", error);
        throw new Error("The AI failed to answer the question.");
    }
};