import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction, TrialBalance, PnlData, BalanceSheetData, CashFlowData } from './types';

// FIX: Removed module augmentation for 'jspdf' which was causing a type error.
// Casting to 'any' is used for plugin methods like 'autoTable' as a workaround,
// which is consistent with existing usage for 'lastAutoTable'.

const generatePdf = (title: string, addContent: (doc: jsPDF) => void) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const today = new Date().toISOString().split('T')[0];

    // Header
    doc.setFontSize(18);
    doc.setTextColor(34, 197, 195); // Teal-400
    doc.text("SA Bookkeeper AI", 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(title, 14, 30);
    
    // Add content using the callback
    addContent(doc);

    // Footer
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Generated on ${today}`, 14, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 35, pageHeight - 10);
    }
    
    doc.save(`${title.toLowerCase().replace(/ /g, '-')}-${today}.pdf`);
};

export const exportJournalAsPDF = (transactions: Transaction[]) => {
    generatePdf("General Journal", (doc) => {
        (doc as any).autoTable({
            startY: 40,
            head: [['Date', 'Description', 'Debit Acc', 'Credit Acc', 'Amount (R)']],
            body: transactions.map(tx => [
                tx.date,
                tx.description,
                tx.debitAccount,
                tx.creditAccount,
                { content: tx.amount.toFixed(2), styles: { halign: 'right' } }
            ]),
            headStyles: { fillColor: [13, 148, 136] }, // Teal-600
            theme: 'grid',
        });
    });
};

export const exportTrialBalanceAsPDF = (data: TrialBalance) => {
     generatePdf("Trial Balance", (doc) => {
        (doc as any).autoTable({
            startY: 40,
            head: [['Account', 'Debit (R)', 'Credit (R)']],
            body: data.balances.map(b => [
                b.account,
                { content: b.debit > 0 ? b.debit.toFixed(2) : '-', styles: { halign: 'right' } },
                { content: b.credit > 0 ? b.credit.toFixed(2) : '-', styles: { halign: 'right' } }
            ]),
             foot: [[
                { content: 'Totals', styles: { fontStyle: 'bold' } },
                { content: data.totals.debit.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
                { content: data.totals.credit.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
            ]],
            headStyles: { fillColor: [13, 148, 136] },
            footStyles: { fillColor: [241, 245, 249] },
            theme: 'grid',
        });
    });
};

export const exportPnlAndBalanceSheetAsPDF = (pnlData: PnlData, bsData: BalanceSheetData) => {
    generatePdf("Financial Statements", (doc) => {
        let finalY = 40;

        // --- P&L Section ---
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Statement of Comprehensive Income", 14, finalY);
        finalY += 8;

        (doc as any).autoTable({
            startY: finalY,
            head: [['Revenue', 'Amount (R)']],
            body: Object.entries(pnlData.revenues).map(([acc, amt]) => [acc, { content: (amt as number).toFixed(2), styles: { halign: 'right' } }]),
            foot: [[{ content: 'Total Revenue', styles: { fontStyle: 'bold' } }, { content: pnlData.totalRevenue.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }]],
            headStyles: { fillColor: [16, 185, 129] }, // Green-500
            theme: 'striped',
            didDrawPage: (data: any) => finalY = data.cursor?.y || finalY,
        });

        finalY = (doc as any).lastAutoTable.finalY + 5;
        
        (doc as any).autoTable({
            startY: finalY,
            head: [['Expenses', 'Amount (R)']],
            body: Object.entries(pnlData.expenses).map(([acc, amt]) => [acc, { content: (amt as number).toFixed(2), styles: { halign: 'right' } }]),
            foot: [[{ content: 'Total Expenses', styles: { fontStyle: 'bold' } }, { content: pnlData.totalExpenses.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }]],
            headStyles: { fillColor: [239, 68, 68] }, // Red-500
            theme: 'striped',
             didDrawPage: (data: any) => finalY = data.cursor?.y || finalY,
        });

        finalY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Net Profit / (Loss)", 14, finalY);
        doc.text(`R ${pnlData.netProfit.toFixed(2)}`, doc.internal.pageSize.getWidth() - 14, finalY, { align: 'right' });
        finalY += 15;

         // --- Balance Sheet Section ---
        doc.setFontSize(14);
        doc.text("Statement of Financial Position", 14, finalY);
        finalY += 8;

        (doc as any).autoTable({
            startY: finalY,
            head: [['Assets', 'Amount (R)']],
            body: Object.entries(bsData.assets).map(([acc, amt]) => [acc, { content: (amt as number).toFixed(2), styles: { halign: 'right' } }]),
            foot: [[{ content: 'Total Assets', styles: { fontStyle: 'bold' } }, { content: bsData.totals.assets.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }]],
            headStyles: { fillColor: [59, 130, 246] }, // Blue-500
            theme: 'striped',
            didDrawPage: (data: any) => finalY = data.cursor?.y || finalY,
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text("Liabilities & Equity", 14, finalY);
        finalY += 5;

        (doc as any).autoTable({
            startY: finalY,
            head: [['Liabilities', 'Amount (R)']],
            body: Object.entries(bsData.liabilities).map(([acc, amt]) => [acc, { content: (amt as number).toFixed(2), styles: { halign: 'right' } }]),
            headStyles: { fillColor: [249, 115, 22] }, // Orange-500
            theme: 'striped',
            didDrawPage: (data: any) => finalY = data.cursor?.y || finalY,
        });
        finalY = (doc as any).lastAutoTable.finalY + 5;

        (doc as any).autoTable({
            startY: finalY,
            head: [['Equity', 'Amount (R)']],
            body: Object.entries(bsData.equity).map(([acc, amt]) => [acc, { content: (amt as number).toFixed(2), styles: { halign: 'right' } }]),
            foot: [[{ content: 'Total Liabilities & Equity', styles: { fontStyle: 'bold' } }, { content: bsData.totals.liabilitiesAndEquity.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }]],
            headStyles: { fillColor: [168, 85, 247] }, // Purple-500
            theme: 'striped',
        });
    });
};

export const exportCashFlowAsPDF = (data: CashFlowData) => {
    generatePdf("Cash Flow Statement", (doc) => {
        let finalY = 40;

        const addSection = (title: string, activities: {[key:string]: number}, total: number, color: [number, number, number]) => {
            if (Object.keys(activities).length === 0) return;
             (doc as any).autoTable({
                startY: finalY,
                head: [[title, 'Amount (R)']],
                body: Object.entries(activities).map(([acc, amt]) => [acc, { content: (amt as number).toFixed(2), styles: { halign: 'right' } }]),
                foot: [[{ content: `Net Cash from ${title}`, styles: { fontStyle: 'bold' } }, { content: total.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }]],
                headStyles: { fillColor: color },
                theme: 'striped',
                didDrawPage: (data: any) => finalY = data.cursor?.y || finalY,
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        addSection('Operating Activities', data.operatingActivities, data.totalOperating, [34, 197, 94]); // Green
        addSection('Investing Activities', data.investingActivities, data.totalInvesting, [59, 130, 246]); // Blue
        addSection('Financing Activities', data.financingActivities, data.totalFinancing, [249, 115, 22]); // Orange
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        
        const summary = [
            { label: 'Net Increase/(Decrease) in Cash', value: data.netCashFlow },
            { label: 'Cash at Beginning of Period', value: data.startingBankBalance },
            { label: 'Cash at End of Period', value: data.endingBankBalance },
        ];
        
        summary.forEach(item => {
             doc.text(item.label, 14, finalY);
             doc.text(`R ${item.value.toFixed(2)}`, doc.internal.pageSize.getWidth() - 14, finalY, { align: 'right' });
             finalY += 7;
        });

    });
};