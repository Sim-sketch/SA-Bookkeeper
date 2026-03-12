
import { TaskPriority } from '../types';

export interface TaxDeadlineDefinition {
    title: string;
    description: string;
    month: number; // 1-12
    day: number;
    priority: TaskPriority;
}

export const SARS_DEADLINES: TaxDeadlineDefinition[] = [
    {
        title: 'Provisional Tax (2nd Period)',
        description: 'Second provisional tax payment due (IRP6) for the tax year ending.',
        month: 2, // February
        day: 28, // Leap year logic handled in generator
        priority: 'high'
    },
    {
        title: 'EMP501 Annual Reconciliation',
        description: 'Employer Annual Reconciliation Declaration due to SARS.',
        month: 5, // May
        day: 31,
        priority: 'high'
    },
    {
        title: 'SARS Tax Season Opens',
        description: 'Individual filing season typically opens.',
        month: 7, // July
        day: 1, // Approximate
        priority: 'medium'
    },
    {
        title: 'Provisional Tax (1st Period)',
        description: 'First provisional tax payment due (IRP6) for the current tax year.',
        month: 8, // August
        day: 30, // Usually end of August
        priority: 'high'
    },
    {
        title: 'Individual Tax Deadline (Non-Provisional)',
        description: 'Filing season closes for non-provisional taxpayers (branch/eFiling).',
        month: 10, // October
        day: 21, // Changes yearly, usually around 21-24
        priority: 'high'
    },
    {
        title: 'EMP501 Interim Reconciliation',
        description: 'Employer Interim Reconciliation Declaration due to SARS.',
        month: 10, // October
        day: 31,
        priority: 'high'
    },
    {
        title: 'Provisional Tax (3rd Period / Top-up)',
        description: 'Optional 3rd provisional payment if taxable income was underestimated.',
        month: 9, // September (For Feb year-ends)
        day: 30,
        priority: 'medium'
    }
];

export const getCipcDeadline = (anniversaryDate: string): string => {
    // CIPC Annual Returns are due 30 business days after the anniversary.
    // For simplicity in this MVP, we set it to 30 calendar days after anniversary.
    const date = new Date(anniversaryDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
};
