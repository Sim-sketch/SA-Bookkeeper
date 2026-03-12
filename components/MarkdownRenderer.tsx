
import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const parseInline = (text: string): React.ReactNode[] => {
        // Handle **bold**
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: React.ReactNode[] = [];

    const flushList = (keyPrefix: number) => {
        if (listBuffer.length > 0) {
            elements.push(
                <ul key={`ul-${keyPrefix}`} className="list-disc pl-5 mb-4 space-y-1 text-slate-600 dark:text-slate-300">
                    {listBuffer}
                </ul>
            );
            listBuffer = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Headings
        if (trimmed.startsWith('### ')) {
            flushList(index);
            elements.push(<h3 key={index} className="text-lg font-bold mt-6 mb-2 text-teal-600 dark:text-teal-400">{parseInline(trimmed.replace(/^###\s+/, ''))}</h3>);
            return;
        }
        if (trimmed.startsWith('## ')) {
            flushList(index);
            elements.push(<h2 key={index} className="text-xl font-bold mt-8 mb-3 text-slate-800 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">{parseInline(trimmed.replace(/^##\s+/, ''))}</h2>);
            return;
        }
        if (trimmed.startsWith('# ')) {
             flushList(index);
             elements.push(<h1 key={index} className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">{parseInline(trimmed.replace(/^#\s+/, ''))}</h1>);
             return;
        }

        // List Items (Bullet points)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.replace(/^[-*]\s+/, '');
            listBuffer.push(<li key={`li-${index}`}>{parseInline(content)}</li>);
            return;
        }
        
        // Numbered Lists (Treat as paragraphs with bold styling for now for simplicity)
        if (/^\d+\.\s/.test(trimmed)) {
             flushList(index);
             // Check if it looks like a header (e.g. "1. Spending Breakdown:")
             if (trimmed.includes(':') && trimmed.length < 50) {
                 elements.push(<h4 key={index} className="text-md font-bold mt-4 mb-2 text-slate-800 dark:text-slate-200">{parseInline(trimmed)}</h4>);
             } else {
                 elements.push(<p key={index} className="mb-2 text-slate-600 dark:text-slate-300 mt-2">{parseInline(trimmed)}</p>);
             }
             return;
        }

        // Bold lines as headers (often used in AI responses)
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            flushList(index);
            elements.push(<h4 key={index} className="font-bold mt-4 mb-2 text-slate-700 dark:text-slate-200">{parseInline(trimmed.replace(/\*\*/g, ''))}</h4>);
            return;
        }

        // Standard Paragraph
        if (trimmed) {
            flushList(index);
            elements.push(<p key={index} className="mb-3 text-slate-600 dark:text-slate-300 leading-relaxed">{parseInline(trimmed)}</p>);
        }
    });
    
    flushList(lines.length);

    return <div className="markdown-content text-sm md:text-base">{elements}</div>;
};

export default MarkdownRenderer;
