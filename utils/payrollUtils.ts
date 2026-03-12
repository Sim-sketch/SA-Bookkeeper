
// Simplified SA Tax Logic for 2024/2025 (Mar 2024 - Feb 2025)
// Note: This is an approximation for MVP purposes.

export const calculatePAYE = (monthlySalary: number): number => {
    const annual = monthlySalary * 12;
    
    // 2025 Tax Thresholds (Approximate)
    if (annual <= 95750) return 0; 
    
    let tax = 0;
    
    // 2025 Tax Tables
    if (annual <= 237100) {
        tax = annual * 0.18;
    } else if (annual <= 370500) {
        tax = 42678 + ((annual - 237100) * 0.26);
    } else if (annual <= 512800) {
        tax = 77362 + ((annual - 370500) * 0.31);
    } else if (annual <= 673000) {
        tax = 121475 + ((annual - 512800) * 0.36);
    } else if (annual <= 857900) {
        tax = 179147 + ((annual - 673000) * 0.39);
    } else if (annual <= 1817000) {
        tax = 251258 + ((annual - 857900) * 0.41);
    } else {
        tax = 644489 + ((annual - 1817000) * 0.45);
    }
    
    // Primary Rebate (2025)
    const primaryRebate = 19154;
    tax = Math.max(0, tax - primaryRebate);
    
    return tax / 12;
};

export const calculateUIF = (monthlySalary: number): number => {
    // 1% of gross remuneration, capped at ceiling
    const uifCeiling = 17712; 
    const amount = Math.min(monthlySalary, uifCeiling);
    return amount * 0.01;
};
