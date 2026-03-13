
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, TrialBalance, PnlData, BalanceSheetData, CashFlowData, FinancialAnalysis, Invoice, Payslip, Employee, CompanySettings, Address, BankingDetails } from '../types';

interface UserProfile {
    displayName?: string | null;
    photoURL?: string | null;
    email?: string | null;
}

// --- Constants & Styling ---
const PRIMARY_COLOR: [number, number, number] = [13, 148, 136]; // Teal 600 (#0d9488)
const TEXT_COLOR: [number, number, number] = [15, 23, 42]; // Slate 900
const TEXT_LIGHT: [number, number, number] = [100, 116, 139]; // Slate 500
const BOTTOM_MARGIN = 40;

const formatCurrency = (amount: number): string => {
    const absVal = Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount < 0 ? `(R ${absVal})` : `R ${absVal}`;
};

const getImageFormat = (base64Data: string): string => {
    if (!base64Data) return 'PNG';
    const match = base64Data.match(/data:image\/(\w+);base64,/);
    if (match && match[1]) {
        const type = match[1].toUpperCase();
        if (type === 'JPG') return 'JPEG';
        if (type === 'JPEG' || type === 'PNG' || type === 'WEBP') return type;
    }
    return 'PNG';
};

const getBase64ImageFromURL = async (url: string): Promise<string> => {
    if (!url) return "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 
    try {
        const response = await fetch(url, { mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(""); 
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        return ""; 
    }
};

const checkPageBreak = (doc: jsPDF, currentY: number, requiredSpace: number = 20): number => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + requiredSpace > pageHeight - BOTTOM_MARGIN) {
        doc.addPage();
        return 40; // Start lower on new pages to clear header
    }
    return currentY;
};

// Helper to format address object to string
const formatAddress = (addr?: Address): string => {
    if (!addr) return '';
    const parts = [addr.street, addr.city, addr.zip, addr.country].filter(p => p && p.trim() !== '');
    return parts.join('\n');
};

// Helper to format banking object to string
const formatBanking = (bank?: BankingDetails): string => {
    if (!bank || !bank.bankName) return '';
    const lines = [
        `Bank: ${bank.bankName}`,
        `Account Holder: ${bank.accountNumber}`, 
        `Account No: ${bank.accountNumber}`,
        bank.sortCode ? `Branch Code: ${bank.sortCode}` : '',
        bank.accountType ? `Account Type: ${bank.accountType}` : '',
        bank.swiftCode ? `SWIFT: ${bank.swiftCode}` : '',
        bank.iban ? `IBAN: ${bank.iban}` : ''
    ].filter(l => l !== '');
    return lines.join('\n');
};

const addBankingDetails = (doc: jsPDF, y: number, bankingDetails?: BankingDetails): number => {
    if (!bankingDetails || !bankingDetails.bankName) return y;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + 40 > pageHeight - BOTTOM_MARGIN) {
        doc.addPage();
        y = 40;
    }
    
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(14, y, 90, 35, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text("Banking Details:", 18, y + 6);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
    
    const text = formatBanking(bankingDetails);
    doc.text(text, 18, y + 12);
    
    return y + 45;
};

const drawInitialsLogo = (doc: jsPDF, name: string, x: number, y: number, size: number) => {
    doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.roundedRect(x, y, size, size, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(size * 0.45);
    doc.setFont(undefined, 'bold');
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "SA";
    const textWidth = doc.getStringUnitWidth(initials) * size * 0.45 / doc.internal.scaleFactor;
    doc.text(initials, x + (size - textWidth) / 2, y + (size * 0.7));
};

const initializePdf = async (doc: jsPDF, title: string, user?: UserProfile | null, company?: CompanySettings): Promise<number> => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const companyName = company?.companyName || user?.displayName || "My Business";
    
    let logoDrawn = false;
    const logoUrl = company?.logoUrl || user?.photoURL;
    if (logoUrl) {
        try {
            const logoBase64 = await getBase64ImageFromURL(logoUrl);
            if (logoBase64 && logoBase64.length > 100) {
                const format = getImageFormat(logoBase64);
                doc.addImage(logoBase64, format, 14, 10, 15, 15);
                logoDrawn = true;
            }
        } catch (e) {
            console.error('Failed to load logo', e);
        }
    }

    if (!logoDrawn) {
        drawInitialsLogo(doc, companyName, 14, 10, 15);
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(companyName, 35, 18); 
    
    // Company Address / VAT Details block
    const startY = 35;
    if (company) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
        
        let headerY = 10;
        const rightX = pageWidth - 14;
        if (company.registrationNumber) {
            doc.text(`Reg: ${company.registrationNumber}`, rightX, headerY, { align: 'right' });
            headerY += 4;
        }
        if (company.vatNumber) {
            doc.text(`VAT: ${company.vatNumber}`, rightX, headerY, { align: 'right' });
            headerY += 4;
        }
        if (company.address) {
            const addrStr = formatAddress(company.address);
            const addressLines = doc.splitTextToSize(addrStr.replace(/\n/g, ', '), 80);
            doc.text(addressLines, rightX, headerY, { align: 'right' });
        }
    }

    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.5);
    doc.line(14, startY - 5, pageWidth - 14, startY - 5);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(title, 14, startY + 5);
    
    return startY + 15;
};

const addStylishFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 16;
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerY = pageHeight - footerHeight;
        
        // Stylish colored box
        doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.rect(0, footerY, pageWidth, footerHeight, 'F');
        
        // Add a darker strip on top for definition
        doc.setFillColor(10, 110, 100); // Darker Teal
        doc.rect(0, footerY, pageWidth, 1, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        
        // Left Text (Interactive-looking)
        doc.text("SA Bookkeeper AI", 14, footerY + 10);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text(" |  Automated Financial Reporting", 42, footerY + 10);

        // Right Text (Page Number)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, footerY + 10, { align: 'right' });
    }
};

const drawSectionBox = (doc: jsPDF, y: number, title: string, text: string, bgColor: [number, number, number], titleColor: [number, number, number], bodyColor: [number, number, number]) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const splitText = doc.splitTextToSize(text, pageWidth - 38); // Padding
    const height = (splitText.length * 4.5) + 22;
    
    y = checkPageBreak(doc, y, height);

    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(14, y, pageWidth - 28, height, 2, 2, 'F');
    doc.setDrawColor(bgColor[0] - 20, bgColor[1] - 20, bgColor[2] - 20);
    doc.rect(14, y, pageWidth - 28, height, 'S'); // Subtle border
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    doc.text(title, 20, y + 10);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
    doc.text(splitText, 20, y + 18);
    
    return y + height + 8;
}

// -- Table Generation Helpers --

const addIncomeStatementTable = (doc: jsPDF, startY: number, data: PnlData) => {
    const body: any[] = [];

    // Revenue
    body.push([{ content: 'REVENUE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 253, 244] as [number, number, number], textColor: TEXT_COLOR } }]);
    Object.entries(data.revenues).forEach(([account, amount]) => {
        body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
    });
    body.push([{ content: 'Total Revenue', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.totalRevenue), styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Cost of Sales
    body.push([{ content: 'COST OF SALES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 247, 237] as [number, number, number], textColor: TEXT_COLOR } }]);
    if (Object.keys(data.costOfSales).length > 0) {
        Object.entries(data.costOfSales).forEach(([account, amount]) => {
            body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
        });
    } else {
        body.push([{ content: 'No Cost of Sales', colSpan: 2, styles: { textColor: 150, fontStyle: 'italic' } }]);
    }
    body.push([{ content: 'Total Cost of Sales', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.totalCostOfSales), styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Gross Profit
    body.push([{ content: 'GROSS PROFIT', styles: { fontStyle: 'bold', fillColor: [239, 246, 255] as [number, number, number], textColor: TEXT_COLOR } }, { content: formatCurrency(data.grossProfit), styles: { fontStyle: 'bold', halign: 'right', fillColor: [239, 246, 255] as [number, number, number], textColor: TEXT_COLOR } }]);

    // Expenses
    body.push([{ content: 'OPERATING EXPENSES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [254, 242, 242] as [number, number, number], textColor: TEXT_COLOR } }]);
    Object.entries(data.operatingExpenses).forEach(([account, amount]) => {
        body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
    });
    body.push([{ content: 'Total Operating Expenses', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.totalOperatingExpenses), styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Net Profit
    const isProfit = data.netProfit >= 0;
    const highlightColor = isProfit ? [220, 252, 231] : [254, 226, 226];
    
    body.push([
        { content: 'NET PROFIT / (LOSS)', styles: { fontStyle: 'bold', fontSize: 11, fillColor: highlightColor as [number, number, number], textColor: TEXT_COLOR } }, 
        { content: formatCurrency(data.netProfit), styles: { fontStyle: 'bold', fontSize: 11, halign: 'right', fillColor: highlightColor as [number, number, number], textColor: isProfit ? [21, 128, 61] : [185, 28, 28] } }
    ]);

    autoTable(doc, {
        startY,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR },
        styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] as [number, number, number] },
        columnStyles: { 1: { halign: 'right' } }
    });
};

const addBalanceSheetTable = (doc: jsPDF, startY: number, data: BalanceSheetData) => {
    const body: any[] = [];

    // Assets
    body.push([{ content: 'ASSETS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [239, 246, 255] as [number, number, number], textColor: TEXT_COLOR } }]);
    Object.entries(data.assets).forEach(([account, amount]) => {
        body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
    });
    body.push([{ content: 'Total Assets', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as [number, number, number] } }, { content: formatCurrency(data.totals.assets), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] as [number, number, number] } }]);

    // Liabilities
    body.push([{ content: 'LIABILITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 247, 237] as [number, number, number], textColor: TEXT_COLOR } }]);
    Object.entries(data.liabilities).forEach(([account, amount]) => {
        body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
    });
    const totalLiabilities = (Object.values(data.liabilities) as number[]).reduce((a, b) => a + b, 0);
    body.push([{ content: 'Total Liabilities', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as [number, number, number] } }, { content: formatCurrency(totalLiabilities), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] as [number, number, number] } }]);

    // Equity
    body.push([{ content: 'EQUITY', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [250, 245, 255] as [number, number, number], textColor: TEXT_COLOR } }]);
    Object.entries(data.equity).forEach(([account, amount]) => {
        body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
    });
    const totalEquity = (Object.values(data.equity) as number[]).reduce((a, b) => a + b, 0);
    body.push([{ content: 'Total Equity', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as [number, number, number] } }, { content: formatCurrency(totalEquity), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] as [number, number, number] } }]);

    // Total Liab + Equity
    const isBalanced = data.totals.assets.toFixed(2) === data.totals.liabilitiesAndEquity.toFixed(2);
    body.push([
        { content: 'TOTAL LIABILITIES & EQUITY', styles: { fontStyle: 'bold', fontSize: 10, fillColor: isBalanced ? [240, 253, 244] : [254, 226, 226] as [number, number, number] } }, 
        { content: formatCurrency(data.totals.liabilitiesAndEquity), styles: { fontStyle: 'bold', fontSize: 10, halign: 'right', fillColor: isBalanced ? [240, 253, 244] : [254, 226, 226] as [number, number, number] } }
    ]);

    autoTable(doc, {
        startY,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR },
        styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] as [number, number, number] },
        columnStyles: { 1: { halign: 'right' } }
    });
};

const addCashFlowTable = (doc: jsPDF, startY: number, data: CashFlowData) => {
    const body: any[] = [];

    // Operating
    body.push([{ content: 'OPERATING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 253, 244] as [number, number, number], textColor: TEXT_COLOR } }]);
    Object.entries(data.operatingActivities).forEach(([account, amount]) => {
        body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
    });
    body.push([{ content: 'Net Cash from Operating', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.totalOperating), styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Investing
    body.push([{ content: 'INVESTING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [239, 246, 255] as [number, number, number], textColor: TEXT_COLOR } }]);
    if (Object.keys(data.investingActivities).length > 0) {
        Object.entries(data.investingActivities).forEach(([account, amount]) => {
            body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
        });
    } else {
        body.push([{ content: 'No investing activities', colSpan: 2, styles: { textColor: 150, fontStyle: 'italic' } }]);
    }
    body.push([{ content: 'Net Cash from Investing', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.totalInvesting), styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Financing
    body.push([{ content: 'FINANCING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 247, 237] as [number, number, number], textColor: TEXT_COLOR } }]);
    if (Object.keys(data.financingActivities).length > 0) {
        Object.entries(data.financingActivities).forEach(([account, amount]) => {
            body.push([account, { content: formatCurrency(amount as number), styles: { halign: 'right' } }]);
        });
    } else {
        body.push([{ content: 'No financing activities', colSpan: 2, styles: { textColor: 150, fontStyle: 'italic' } }]);
    }
    body.push([{ content: 'Net Cash from Financing', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.totalFinancing), styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Summary
    body.push([{ content: 'NET INCREASE / (DECREASE) IN CASH', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] as [number, number, number] } }, { content: formatCurrency(data.netCashFlow), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] as [number, number, number] } }]);
    body.push([{ content: 'Cash at Beginning of Period', styles: { fontStyle: 'italic' } }, { content: formatCurrency(data.startingBankBalance), styles: { fontStyle: 'italic', halign: 'right' } }]);
    body.push([
        { content: 'CASH AT END OF PERIOD', styles: { fontStyle: 'bold', fontSize: 10, fillColor: [241, 245, 249] as [number, number, number] } }, 
        { content: formatCurrency(data.endingBankBalance), styles: { fontStyle: 'bold', fontSize: 10, halign: 'right', fillColor: [241, 245, 249] as [number, number, number] } }
    ]);

    autoTable(doc, {
        startY,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR },
        styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] as [number, number, number] },
        columnStyles: { 1: { halign: 'right' } }
    });
};

// --- Exports ---

export const exportInvoiceAsPDF = async (invoice: Invoice, user?: UserProfile | null, companySettings?: CompanySettings) => {
    const doc = new jsPDF();
    let title = 'TAX INVOICE';
    if (invoice.type === 'Quote') title = 'ESTIMATE / QUOTE';
    if (invoice.type === 'Sales Order') title = 'SALES ORDER';
    if (invoice.type === 'Purchase Order') title = 'PURCHASE ORDER';
    if (invoice.type === 'Delivery Note') title = 'DELIVERY NOTE';

    const startY = await initializePdf(doc, title, user, companySettings);
    const pageWidth = doc.internal.pageSize.getWidth();

    // Meta
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(`Document Number: ${invoice.number}`, pageWidth - 14, startY + 5, { align: 'right' });
    doc.text(`Date: ${invoice.date}`, pageWidth - 14, startY + 10, { align: 'right' });
    doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - 14, startY + 15, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
    doc.text(invoice.status.toUpperCase(), pageWidth - 14, startY + 25, { align: 'right' });

    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(invoice.type === 'Purchase Order' ? "Supplier:" : "Customer:", 14, startY + 5);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.customerName, 14, startY + 10);
    
    let currentY = startY + 15;
    if (invoice.customerAddress) {
        const splitAddress = doc.splitTextToSize(invoice.customerAddress, 80);
        doc.text(splitAddress, 14, currentY);
        currentY += (splitAddress.length * 5);
    }
    if (invoice.customerVatNumber) {
        doc.text(`VAT No: ${invoice.customerVatNumber}`, 14, currentY);
        currentY += 5;
    }

    currentY = Math.max(currentY, startY + 30) + 10;

    autoTable(doc, {
        startY: currentY,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: invoice.items.map(item => [
            item.description,
            item.quantity,
            { content: formatCurrency(item.unitPrice), styles: { halign: 'right' } },
            { content: formatCurrency(item.quantity * item.unitPrice), styles: { halign: 'right' } }
        ]),
        foot: [
            [{ content: 'Subtotal', colSpan: 3, styles: { halign: 'right' } }, formatCurrency(invoice.subtotal)],
            [{ content: 'VAT (15%)', colSpan: 3, styles: { halign: 'right' } }, formatCurrency(invoice.vatTotal)],
            [{ content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } }, { content: formatCurrency(invoice.total), styles: { fontStyle: 'bold', fontSize: 11, halign: 'right' } }]
        ],
        headStyles: { fillColor: PRIMARY_COLOR },
        theme: 'striped',
        margin: { bottom: BOTTOM_MARGIN }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
    currentY = checkPageBreak(doc, currentY, 60);

    if (companySettings?.bankingDetails) {
        currentY = addBankingDetails(doc, currentY, companySettings.bankingDetails);
    }

    if (invoice.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        doc.text("Notes:", 14, currentY + 5);
        doc.setFont(undefined, 'normal');
        const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 28);
        doc.text(splitNotes, 14, currentY + 10);
    }

    addStylishFooter(doc);
    doc.save(`${title.replace(/ /g, '_')}-${invoice.number}.pdf`);
};

export const exportVatReportAsPDF = async (period: string, totals: any, transactions: Transaction[], user?: UserProfile | null) => {
    const doc = new jsPDF();
    let currentY = await initializePdf(doc, "VAT 201 Calculation", user); 
    
    doc.setFontSize(11);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(`Tax Period: ${period}`, 14, currentY + 10);
    
    currentY += 20;

    const summaryBody = [
        ['Standard Rate Sales', formatCurrency(totals.standardRateSales)],
        ['Output Tax (A)', { content: formatCurrency(totals.outputTax), styles: { fontStyle: 'bold' as const, textColor: [185, 28, 28] as [number, number, number] } }],
        ['Input Tax - Capital Goods', formatCurrency(totals.capitalGoodsInput)],
        ['Input Tax - Other', formatCurrency(totals.inputTax - totals.capitalGoodsInput)],
        ['Total Input Tax (B)', { content: formatCurrency(totals.inputTax), styles: { fontStyle: 'bold' as const, textColor: [21, 128, 61] as [number, number, number] } }],
        ['VAT Payable / (Refundable)', { content: formatCurrency(totals.netVat), styles: { fontStyle: 'bold' as const, fontSize: 11, fillColor: [248, 250, 252] as [number, number, number] } }]
    ];

    autoTable(doc, {
        startY: currentY,
        head: [['Description', 'Amount']],
        body: summaryBody,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR },
        columnStyles: { 1: { halign: 'right' } }
    });

    addStylishFooter(doc);
    doc.save(`vat201-report-${period.replace('/', '-')}.pdf`);
};

export const exportPayslipAsPDF = async (payslip: Payslip, employee: Employee | undefined, user?: UserProfile | null, company?: CompanySettings) => {
    const doc = new jsPDF();
    let currentY = await initializePdf(doc, "Payslip", user, company);
    
    doc.setFontSize(10);
    doc.text(`Employee: ${payslip.employeeName}`, 14, currentY + 10);
    doc.text(`Pay Date: ${payslip.generationDate}`, 14, currentY + 15);
    
    currentY += 25;
    
    autoTable(doc, {
        startY: currentY,
        head: [['Earnings', 'Amount']],
        body: [
            ['Basic Salary / Wages', formatCurrency(payslip.grossPay)],
            ['Total Earnings', { content: formatCurrency(payslip.grossPay), styles: { fontStyle: 'bold' as const } }]
        ] as any[],
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] as [number, number, number] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;

    const deductionRows: any[] = [
        ['PAYE Tax', formatCurrency(payslip.deductions.tax)],
        ['UIF (Social Security)', formatCurrency(payslip.deductions.socialSecurity)]
    ];
    if (payslip.deductions.pension) deductionRows.push(['Pension', formatCurrency(payslip.deductions.pension)]);
    if (payslip.deductions.other) deductionRows.push(['Other', formatCurrency(payslip.deductions.other)]);
    
    const totalDeductions = payslip.deductions.tax + payslip.deductions.socialSecurity + (payslip.deductions.pension || 0) + (payslip.deductions.other || 0);
    deductionRows.push(['Total Deductions', { content: formatCurrency(totalDeductions), styles: { fontStyle: 'bold' as const } }]);

    autoTable(doc, {
        startY: currentY,
        head: [['Deductions', 'Amount']],
        body: deductionRows,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] as [number, number, number] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(240, 253, 244);
    doc.rect(14, currentY - 5, 182, 12, 'F');
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`NET PAY`, 16, currentY + 3);
    doc.text(formatCurrency(payslip.netPay), 194, currentY + 3, { align: 'right' });

    addStylishFooter(doc);
    doc.save(`payslip-${payslip.employeeName.replace(' ', '_')}-${payslip.generationDate}.pdf`);
};

export const exportJournalAsPDF = async (transactions: Transaction[], user?: UserProfile | null) => {
    const doc = new jsPDF();
    const startY = await initializePdf(doc, "General Journal", user);
    
    const body = transactions.map(t => [
        t.date,
        t.description,
        t.debitAccount,
        t.creditAccount,
        formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        startY,
        head: [['Date', 'Description', 'Debit', 'Credit', 'Amount']],
        body: body,
        headStyles: { fillColor: PRIMARY_COLOR },
        columnStyles: { 4: { halign: 'right' } }
    });

    addStylishFooter(doc);
    doc.save(`journal-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportTrialBalanceAsPDF = async (data: TrialBalance, user?: UserProfile | null) => {
    const doc = new jsPDF();
    const startY = await initializePdf(doc, "Trial Balance", user);
    
    const body: any[] = data.balances.map(b => [
        b.account,
        b.debit > 0 ? formatCurrency(b.debit) : '',
        b.credit > 0 ? formatCurrency(b.credit) : ''
    ]);
    
    body.push([
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: formatCurrency(data.totals.debit), styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatCurrency(data.totals.credit), styles: { fontStyle: 'bold', halign: 'right' } }
    ]);

    autoTable(doc, {
        startY,
        head: [['Account', 'Debit', 'Credit']],
        body: body,
        headStyles: { fillColor: PRIMARY_COLOR },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
    });

    addStylishFooter(doc);
    doc.save(`trial-balance-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportIncomeStatementAsPDF = async (pnlData: PnlData, user?: UserProfile | null) => {
    const doc = new jsPDF();
    const startY = await initializePdf(doc, "Statement of Comprehensive Income", user);
    addIncomeStatementTable(doc, startY, pnlData);
    addStylishFooter(doc);
    doc.save(`income-statement-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportBalanceSheetAsPDF = async (bsData: BalanceSheetData, user?: UserProfile | null) => {
    const doc = new jsPDF();
    const startY = await initializePdf(doc, "Statement of Financial Position", user);
    addBalanceSheetTable(doc, startY, bsData);
    addStylishFooter(doc);
    doc.save(`balance-sheet-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportCashFlowAsPDF = async (data: CashFlowData, user?: UserProfile | null) => {
    const doc = new jsPDF();
    const startY = await initializePdf(doc, "Cash Flow Statement", user);
    addCashFlowTable(doc, startY, data);
    addStylishFooter(doc);
    doc.save(`cash-flow-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportPnlAndBalanceSheetAsPDF = async (pnlData: PnlData, bsData: BalanceSheetData, user?: UserProfile | null) => {
    // Kept for legacy button, though management pack is preferred
    const doc = new jsPDF();
    let currentY = await initializePdf(doc, "Financial Statements", user);
    
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("Income Statement", 14, currentY + 10);
    addIncomeStatementTable(doc, currentY + 15, pnlData);
    
    doc.addPage();
    currentY = 20;
    doc.text("Balance Sheet", 14, currentY);
    addBalanceSheetTable(doc, currentY + 10, bsData);

    addStylishFooter(doc);
    doc.save(`financial-statements-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportAnalysisAsPDF = async (analysis: FinancialAnalysis, user?: UserProfile | null, period?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = await initializePdf(doc, "Financial Analysis Report", user);
    
    // Date & Period
    doc.setFontSize(9);
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, currentY + 6);
    if (period) {
        doc.setFont(undefined, 'bold');
        doc.text(`Period: ${period}`, pageWidth - 14, currentY + 6, { align: 'right' });
        doc.setFont(undefined, 'normal');
    }
    
    currentY += 12;

    // Disclaimer Banner (Styled like UI)
    doc.setFillColor(255, 251, 235); // Amber-50
    doc.setDrawColor(252, 211, 77); // Amber-300
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(217, 119, 6); // Amber-600
    doc.text("!", 18, currentY + 14); // Simple icon approximation
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(146, 64, 14); // Amber-800
    doc.text("AI-Generated Financial Report", 26, currentY + 8);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(180, 83, 9); // Amber-700
    const disclaimerText = "This analysis is generated by an AI model and is for informational purposes only. It does not constitute registered financial advice. Please review with a qualified accountant.";
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 46);
    doc.text(splitDisclaimer, 26, currentY + 14);
    
    currentY += 30;

    // 1. Executive Summary
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("Executive Summary", 14, currentY);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    const splitText = doc.splitTextToSize(analysis.executiveSummary, pageWidth - 28);
    doc.text(splitText, 14, currentY + 6);
    
    currentY += 6 + (splitText.length * 5) + 10;

    // 2. Key Metrics Grid (Matching UI Colors)
    const boxWidth = (pageWidth - 34) / 4; // 4 boxes
    const boxHeight = 25;
    const startX = 14;
    
    const metrics = [
        { title: 'Revenue', value: analysis.keyMetrics.totalRevenue, color: [240, 253, 244] as [number, number, number], textColor: [21, 128, 61] as [number, number, number], borderColor: [220, 252, 231] as [number, number, number] }, // Green-50
        { title: 'Expenses', value: analysis.keyMetrics.totalExpenses, color: [254, 242, 242] as [number, number, number], textColor: [220, 38, 38] as [number, number, number], borderColor: [254, 226, 226] as [number, number, number] }, // Red-50
        { title: 'Net Profit', value: analysis.keyMetrics.netProfit, color: [239, 246, 255] as [number, number, number], textColor: [37, 99, 235] as [number, number, number], borderColor: [219, 234, 254] as [number, number, number] }, // Blue-50
        { title: 'Profit Margin', value: analysis.keyMetrics.profitMargin, isPercent: true, color: [250, 245, 255] as [number, number, number], textColor: [147, 51, 234] as [number, number, number], borderColor: [243, 232, 255] as [number, number, number] }, // Purple-50
    ];

    metrics.forEach((m, i) => {
        const x = startX + (i * (boxWidth + 2));
        doc.setFillColor(m.color[0], m.color[1], m.color[2]);
        doc.setDrawColor(m.borderColor[0], m.borderColor[1], m.borderColor[2]);
        doc.roundedRect(x, currentY, boxWidth, boxHeight, 3, 3, 'FD');
        
        doc.setFontSize(8);
        doc.setTextColor(m.textColor[0], m.textColor[1], m.textColor[2]); // Use colored text for label too like UI
        doc.text(m.title.toUpperCase(), x + 5, currentY + 8);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        const displayValue = m.isPercent ? `${m.value.toFixed(1)}%` : formatCurrency(m.value as number);
        doc.text(displayValue, x + 5, currentY + 18);
    });

    currentY += boxHeight + 15;

    // 3. Future Outlook (Styled Indigo Box)
    currentY = drawSectionBox(
        doc, 
        currentY, 
        "Future Outlook", 
        analysis.futureOutlook, 
        [238, 242, 255], // Indigo-50
        [55, 48, 163], // Indigo-800
        [49, 46, 129]  // Indigo-900
    );

    // 4. Tax Implications (Styled Amber Box)
    currentY = drawSectionBox(
        doc, 
        currentY, 
        "Tax Considerations", 
        analysis.taxImplications, 
        [255, 251, 235], // Amber-50
        [146, 64, 14], // Amber-800
        [120, 53, 15]  // Amber-900
    );

    // 5. Spending Breakdown
    if (analysis.spendingBreakdown && analysis.spendingBreakdown.length > 0) {
        currentY = checkPageBreak(doc, currentY, 60);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.text("Top Spending Categories", 14, currentY);
        currentY += 6;

        const spendingBody = analysis.spendingBreakdown.map(item => [
            item.category,
            formatCurrency(item.amount),
            `${item.percentage.toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Category', 'Amount', '% of Expenses']],
            body: spendingBody,
            theme: 'striped',
            headStyles: { fillColor: [249, 115, 22] as [number, number, number] }, // Orange like UI icon
            columnStyles: { 
                1: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] as [number, number, number] },
                2: { halign: 'right' } 
            },
            styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 6. Risk Assessment
    if (analysis.riskAssessment && analysis.riskAssessment.length > 0) {
        currentY = checkPageBreak(doc, currentY, 60);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.text("Risk Assessment", 14, currentY);
        currentY += 6;

        const risksBody = analysis.riskAssessment.map(risk => [
            risk.severity,
            risk.risk,
            risk.mitigation
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Severity', 'Risk Factor', 'Mitigation Strategy']],
            body: risksBody,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38] as [number, number, number] }, // Red
            styles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 25 } },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 0) {
                    const severity = data.cell.raw as string;
                    if (severity === 'High') data.cell.styles.textColor = [220, 38, 38] as [number, number, number];
                    if (severity === 'Medium') data.cell.styles.textColor = [217, 119, 6] as [number, number, number]; // Amber
                    if (severity === 'Low') data.cell.styles.textColor = [21, 128, 61] as [number, number, number]; // Green
                }
            }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 7. Benchmarks
    if (analysis.industryBenchmarks && analysis.industryBenchmarks.length > 0) {
        currentY = checkPageBreak(doc, currentY, 60);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.text("Industry Benchmarks", 14, currentY);
        currentY += 6;

        const benchBody = analysis.industryBenchmarks.map(b => [
            b.metric,
            b.yourValue,
            b.benchmark,
            b.status
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Metric', 'Your Value', 'Industry Target', 'Status']],
            body: benchBody,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] as [number, number, number] }, // Blue
            styles: { fontSize: 9 },
            columnStyles: { 3: { fontStyle: 'bold' } },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 3) {
                    const status = data.cell.raw as string;
                    if (status === 'Above') data.cell.styles.textColor = [21, 128, 61] as [number, number, number]; // Green
                    if (status === 'Below') data.cell.styles.textColor = [220, 38, 38] as [number, number, number]; // Red
                    if (status === 'On Track') data.cell.styles.textColor = [37, 99, 235] as [number, number, number]; // Blue
                }
            }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 8. Actionable Tips
    if (analysis.actionableTips && analysis.actionableTips.length > 0) {
        currentY = checkPageBreak(doc, currentY, 60);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.text("Actionable Insights", 14, currentY);
        currentY += 6;

        const tipsBody = analysis.actionableTips.map(tip => [
            tip.type,
            tip.title,
            tip.description
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Category', 'Tip', 'Details']],
            body: tipsBody,
            theme: 'striped',
            headStyles: { fillColor: PRIMARY_COLOR },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 1: { fontStyle: 'bold', cellWidth: 50 } },
            styles: { fontSize: 9 }
        });
    }

    addStylishFooter(doc);
    doc.save(`financial-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportManagementReportAsPDF = async (pnlData: PnlData, bsData: BalanceSheetData, cfData: CashFlowData, analysis: FinancialAnalysis | null, user?: UserProfile | null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const currentDate = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

    // --- COVER PAGE ---
    // Background
    doc.setFillColor(240, 253, 244); // Light Green/Teal bg
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative elements
    doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.rect(0, 0, 15, pageHeight, 'F'); // Side bar

    // Logo
    const logoUrl = user?.photoURL;
    if (logoUrl) {
        try {
            const logoBase64 = await getBase64ImageFromURL(logoUrl);
            if (logoBase64) {
                const format = getImageFormat(logoBase64);
                const imgWidth = 50;
                const imgHeight = 50;
                doc.addImage(logoBase64, format, (pageWidth / 2) - (imgWidth / 2), 60, imgWidth, imgHeight);
            }
        } catch (e) {
            console.error('Failed to load report logo', e);
        }
    } else {
        drawInitialsLogo(doc, user?.displayName || "MB", (pageWidth / 2) - 20, 60, 40);
    }

    // Titles
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text("MANAGEMENT", pageWidth / 2, 130, { align: 'center' });
    doc.text("REPORT PACK", pageWidth / 2, 145, { align: 'center' });

    // Divider
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, 155, pageWidth / 2 + 40, 155);

    // Company & Date
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
    const companyName = user?.displayName || "My Business";
    doc.text(companyName.toUpperCase(), pageWidth / 2, 170, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(`Statement Date: ${currentDate}`, pageWidth / 2, 180, { align: 'center' });

    // --- EXECUTIVE SUMMARY PAGE ---
    if (analysis) {
        doc.addPage();
        let y = await initializePdf(doc, "Executive Summary", user);
        
        // Summary Text
        doc.setFontSize(10);
        doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        const summaryLines = doc.splitTextToSize(analysis.executiveSummary, pageWidth - 28);
        doc.text(summaryLines, 14, y);
        y += (summaryLines.length * 5) + 10;

        // Key Metrics (Grid - 4 items)
        const boxWidth = (pageWidth - 34) / 4; // 4 boxes
        const boxHeight = 25;
        const startX = 14;
        const metrics = [
            { title: 'Total Revenue', value: analysis.keyMetrics.totalRevenue, color: [220, 252, 231] as [number, number, number], textColor: [21, 128, 61] as [number, number, number] },
            { title: 'Total Expenses', value: analysis.keyMetrics.totalExpenses, color: [254, 226, 226] as [number, number, number], textColor: [185, 28, 28] as [number, number, number] },
            { title: 'Net Profit', value: analysis.keyMetrics.netProfit, color: [240, 253, 244] as [number, number, number], textColor: analysis.keyMetrics.netProfit >= 0 ? [21, 128, 61] as [number, number, number] : [185, 28, 28] as [number, number, number] },
            { title: 'Profit Margin', value: analysis.keyMetrics.profitMargin, isPercent: true, color: [239, 246, 255] as [number, number, number], textColor: [37, 99, 235] as [number, number, number] },
        ];

        metrics.forEach((m, i) => {
            const x = startX + (i * (boxWidth + 2));
            doc.setFillColor(m.color[0], m.color[1], m.color[2]);
            doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
            
            doc.setFontSize(8);
            doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
            doc.text(m.title, x + 4, y + 8);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(m.textColor[0], m.textColor[1], m.textColor[2]);
            const displayValue = m.isPercent ? `${m.value.toFixed(1)}%` : formatCurrency(m.value as number);
            doc.text(displayValue, x + 4, y + 18);
        });

        y += 35;

        // New Sections for Management Pack: Outlook & Tax
        y = drawSectionBox(
            doc, 
            y, 
            "Future Outlook", 
            analysis.futureOutlook, 
            [238, 242, 255], // Indigo-50
            [55, 48, 163], 
            [49, 46, 129]
        );

        y = drawSectionBox(
            doc, 
            y, 
            "Tax Considerations", 
            analysis.taxImplications, 
            [255, 251, 235], // Amber-50
            [146, 64, 14], 
            [120, 53, 15]
        );

        // Actionable Tips Table
        if (analysis.actionableTips && analysis.actionableTips.length > 0) {
            y = checkPageBreak(doc, y, 60);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            doc.text("Actionable Tips", 14, y);
            y += 4;

            const tipsBody = analysis.actionableTips.map(tip => [
                tip.type, 
                tip.title, 
                tip.description
            ]);

            autoTable(doc, {
                startY: y,
                head: [['Type', 'Tip', 'Details']],
                body: tipsBody,
                theme: 'striped',
                headStyles: { fillColor: PRIMARY_COLOR },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 30 },
                    1: { fontStyle: 'bold', cellWidth: 50 }
                },
                styles: { fontSize: 9 }
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Risk Assessment
        if (analysis.riskAssessment && analysis.riskAssessment.length > 0) {
            // Check space
            y = checkPageBreak(doc, y, 60);

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            doc.text("Risk Assessment", 14, y);
            y += 4;

            const risksBody = analysis.riskAssessment.map(risk => [
                risk.severity,
                risk.risk,
                risk.mitigation
            ]);

            autoTable(doc, {
                startY: y,
                head: [['Severity', 'Risk', 'Mitigation Strategy']],
                body: risksBody,
                theme: 'grid',
                headStyles: { fillColor: [185, 28, 28] as [number, number, number] }, // Red header for risk
                styles: { fontSize: 9 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 25 },
                    1: { fontStyle: 'bold', cellWidth: 50 }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 0) {
                        const severity = data.cell.raw as string;
                        if (severity === 'High') data.cell.styles.textColor = [220, 38, 38] as [number, number, number];
                        if (severity === 'Medium') data.cell.styles.textColor = [217, 119, 6] as [number, number, number];
                    }
                }
            });
        }
    }

    // --- INCOME STATEMENT PAGE ---
    doc.addPage();
    let currentY = await initializePdf(doc, "Income Statement", user);
    
    // Add tips/insights relevant to PnL if available from analysis
    if (analysis) {
        doc.setFontSize(9);
        doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
        doc.text(`Revenue: ${formatCurrency(analysis.keyMetrics.totalRevenue)}  |  Expenses: ${formatCurrency(analysis.keyMetrics.totalExpenses)}`, 14, currentY);
        currentY += 8;
    }
    
    addIncomeStatementTable(doc, currentY + 5, pnlData);

    // --- BALANCE SHEET PAGE ---
    doc.addPage();
    currentY = await initializePdf(doc, "Balance Sheet", user);
    addBalanceSheetTable(doc, currentY + 5, bsData);

    // --- CASH FLOW PAGE ---
    doc.addPage();
    currentY = await initializePdf(doc, "Cash Flow Statement", user);
    addCashFlowTable(doc, currentY + 5, cfData);

    addStylishFooter(doc);
    doc.save(`management-report-${currentDate.replace(/ /g, '_')}.pdf`);
};
