import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    writeBatch,
    getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
    Transaction, 
    CategorizationRule, 
    Customer, 
    TeamMember, 
    Task, 
    Employee, 
    CompanySettings, 
    Product, 
    Invoice, 
    PayrollRun, 
    Payslip
} from '../types.ts';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Connection Test ---
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

// --- Helper to get user-scoped collection ---
const getCollection = (userId: string, collectionName: string) => {
    return collection(db, 'users', userId, collectionName);
};

// --- Transactions ---
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
    const path = `users/${userId}/transactions`;
    try {
        const q = getCollection(userId, 'transactions');
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const path = `users/${userId}/transactions`;
    try {
        const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const docRef = doc(db, 'users', userId, 'transactions', id);
        const newTx = { ...transaction, id } as Transaction;
        await setDoc(docRef, newTx);
        return newTx;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
        throw e;
    }
};

export const bulkAddTransactions = async (userId: string, transactions: Omit<Transaction, 'id'>[]): Promise<void> => {
    const path = `users/${userId}/transactions`;
    try {
        const batch = writeBatch(db);
        transactions.forEach(t => {
            const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const docRef = doc(db, 'users', userId, 'transactions', id);
            batch.set(docRef, { ...t, id });
        });
        await batch.commit();
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
    }
};

export const updateTransaction = async (userId: string, transaction: Transaction): Promise<Transaction> => {
    const path = `users/${userId}/transactions/${transaction.id}`;
    try {
        const docRef = doc(db, 'users', userId, 'transactions', transaction.id);
        await updateDoc(docRef, transaction as any);
        return transaction;
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
        throw e;
    }
};

export const deleteTransactions = async (userId: string, ids: string[]): Promise<void> => {
    const path = `users/${userId}/transactions`;
    try {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, 'users', userId, 'transactions', id);
            batch.delete(docRef);
        });
        await batch.commit();
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

export const updateTransactions = async (userId: string, ids: string[], updateData: Partial<Omit<Transaction, 'id'>>): Promise<void> => {
    const path = `users/${userId}/transactions`;
    try {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, 'users', userId, 'transactions', id);
            batch.update(docRef, updateData as any);
        });
        await batch.commit();
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
    }
};

// --- Rules ---
export const getRules = async (userId: string): Promise<CategorizationRule[]> => {
    const path = `users/${userId}/rules`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'rules'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CategorizationRule));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const addRule = async (userId: string, rule: Omit<CategorizationRule, 'id'>): Promise<CategorizationRule> => {
    const path = `users/${userId}/rules`;
    try {
        const id = `rule-${Date.now()}`;
        const docRef = doc(db, 'users', userId, 'rules', id);
        const newRule = { ...rule, id } as CategorizationRule;
        await setDoc(docRef, newRule);
        return newRule;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
        throw e;
    }
};

export const deleteRule = async (userId: string, id: string): Promise<void> => {
    const path = `users/${userId}/rules/${id}`;
    try {
        await deleteDoc(doc(db, 'users', userId, 'rules', id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

// --- Customers ---
export const getCustomers = async (userId: string): Promise<Customer[]> => {
    const path = `users/${userId}/customers`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'customers'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const addCustomer = async (userId: string, customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const path = `users/${userId}/customers`;
    try {
        const id = `cust-${Date.now()}`;
        const docRef = doc(db, 'users', userId, 'customers', id);
        const newItem = { ...customer, id } as Customer;
        await setDoc(docRef, newItem);
        return newItem;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
        throw e;
    }
};

export const updateCustomer = async (userId: string, customer: Customer): Promise<Customer> => {
    const path = `users/${userId}/customers/${customer.id}`;
    try {
        const docRef = doc(db, 'users', userId, 'customers', customer.id);
        await updateDoc(docRef, customer as any);
        return customer;
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
        throw e;
    }
};

export const deleteCustomer = async (userId: string, id: string): Promise<void> => {
    const path = `users/${userId}/customers/${id}`;
    try {
        await deleteDoc(doc(db, 'users', userId, 'customers', id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

// --- Employees ---
export const getEmployees = async (userId: string): Promise<Employee[]> => {
    const path = `users/${userId}/employees`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'employees'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Employee));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const addEmployee = async (userId: string, employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
    const path = `users/${userId}/employees`;
    try {
        const id = `emp-${Date.now()}`;
        const now = new Date().toISOString();
        const docRef = doc(db, 'users', userId, 'employees', id);
        const newItem = { ...employee, id, createdAt: now, updatedAt: now } as Employee;
        await setDoc(docRef, newItem);
        return newItem;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
        throw e;
    }
};

export const updateEmployee = async (userId: string, employee: Employee): Promise<Employee> => {
    const path = `users/${userId}/employees/${employee.id}`;
    try {
        const updated = { ...employee, updatedAt: new Date().toISOString() };
        const docRef = doc(db, 'users', userId, 'employees', employee.id);
        await updateDoc(docRef, updated as any);
        return updated;
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
        throw e;
    }
};

export const deleteEmployee = async (userId: string, id: string): Promise<void> => {
    const path = `users/${userId}/employees/${id}`;
    try {
        await deleteDoc(doc(db, 'users', userId, 'employees', id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

// --- Tasks ---
export const getTasks = async (userId: string): Promise<Task[]> => {
    const path = `users/${userId}/tasks`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'tasks'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const addTask = async (userId: string, task: Omit<Task, 'id'>): Promise<Task> => {
    const path = `users/${userId}/tasks`;
    try {
        const id = `task-${Date.now()}`;
        const docRef = doc(db, 'users', userId, 'tasks', id);
        const newItem = { ...task, id } as Task;
        await setDoc(docRef, newItem);
        return newItem;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
        throw e;
    }
};

export const updateTask = async (userId: string, task: Task): Promise<Task> => {
    const path = `users/${userId}/tasks/${task.id}`;
    try {
        const docRef = doc(db, 'users', userId, 'tasks', task.id);
        await updateDoc(docRef, task as any);
        return task;
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
        throw e;
    }
};

export const deleteTask = async (userId: string, id: string): Promise<void> => {
    const path = `users/${userId}/tasks/${id}`;
    try {
        await deleteDoc(doc(db, 'users', userId, 'tasks', id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

// --- Team ---
export const getTeamMembers = async (userId: string): Promise<TeamMember[]> => {
    const path = `users/${userId}/team`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'team'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeamMember));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const removeTeamMember = async (userId: string, id: string): Promise<void> => {
    const path = `users/${userId}/team/${id}`;
    try {
        await deleteDoc(doc(db, 'users', userId, 'team', id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

// --- Settings ---
export const getCompanySettings = async (userId: string): Promise<CompanySettings> => {
    const path = `users/${userId}/settings/company`;
    try {
        const docRef = doc(db, 'users', userId, 'settings', 'company');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as CompanySettings;
        }
        return {
            companyName: 'SA Bookkeeper AI',
            invoiceCounter: 1000,
            invoicePrefix: 'INV-',
            quoteCounter: 1000,
            quotePrefix: 'QTE-',
            poCounter: 1000,
            poPrefix: 'PO-'
        };
    } catch (e) {
        handleFirestoreError(e, OperationType.GET, path);
        return {
            companyName: 'SA Bookkeeper AI',
            invoiceCounter: 1000,
            invoicePrefix: 'INV-',
            quoteCounter: 1000,
            quotePrefix: 'QTE-',
            poCounter: 1000,
            poPrefix: 'PO-'
        };
    }
};

export const updateCompanySettings = async (userId: string, settings: CompanySettings): Promise<void> => {
    const path = `users/${userId}/settings/company`;
    try {
        const docRef = doc(db, 'users', userId, 'settings', 'company');
        await setDoc(docRef, settings);
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
    }
};

// --- Products ---
export const getProducts = async (userId: string): Promise<Product[]> => {
    const path = `users/${userId}/products`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'products'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const addProduct = async (userId: string, product: Omit<Product, 'id'>): Promise<Product> => {
    const path = `users/${userId}/products`;
    try {
        const id = `prod-${Date.now()}`;
        const docRef = doc(db, 'users', userId, 'products', id);
        const newItem = { ...product, id } as Product;
        await setDoc(docRef, newItem);
        return newItem;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
        throw e;
    }
};

export const updateProduct = async (userId: string, product: Product): Promise<void> => {
    const path = `users/${userId}/products/${product.id}`;
    try {
        const docRef = doc(db, 'users', userId, 'products', product.id);
        await updateDoc(docRef, product as any);
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
    }
};

export const deleteProduct = async (userId: string, id: string): Promise<void> => {
    const path = `users/${userId}/products/${id}`;
    try {
        await deleteDoc(doc(db, 'users', userId, 'products', id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

// --- Invoices ---
export const getInvoices = async (userId: string): Promise<Invoice[]> => {
    const path = `users/${userId}/invoices`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'invoices'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Invoice));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const addInvoice = async (userId: string, invoice: Omit<Invoice, 'id' | 'number'>, type: string): Promise<Invoice> => {
    const path = `users/${userId}/invoices`;
    try {
        const settings = await getCompanySettings(userId);
        let counter = settings.invoiceCounter;
        let prefix = settings.invoicePrefix;
        
        if (type === 'Quote') { counter = settings.quoteCounter; prefix = settings.quotePrefix; }
        if (type === 'Purchase Order') { counter = settings.poCounter; prefix = settings.poPrefix; }
        
        const docNumber = `${prefix}${counter}`;
        const id = `inv-${Date.now()}`;
        const data = { ...invoice, number: docNumber, id } as Invoice;
        
        const docRef = doc(db, 'users', userId, 'invoices', id);
        await setDoc(docRef, data);
        
        const updatedSettings = { ...settings };
        if (type === 'Invoice') updatedSettings.invoiceCounter++;
        else if (type === 'Quote') updatedSettings.quoteCounter++;
        else if (type === 'Purchase Order') updatedSettings.poCounter++;
        await updateCompanySettings(userId, updatedSettings);

        return data;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
        throw e;
    }
};

export const updateInvoice = async (userId: string, invoice: Invoice): Promise<void> => {
    const path = `users/${userId}/invoices/${invoice.id}`;
    try {
        const docRef = doc(db, 'users', userId, 'invoices', invoice.id);
        await updateDoc(docRef, invoice as any);
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
    }
};

export const deleteInvoice = async (userId: string, id: string): Promise<void> => {
    const path = `users/${userId}/invoices/${id}`;
    try {
        await deleteDoc(doc(db, 'users', userId, 'invoices', id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
    }
};

// --- Payroll ---
export const getPayrollRuns = async (userId: string): Promise<PayrollRun[]> => {
    const path = `users/${userId}/payroll_runs`;
    try {
        const snapshot = await getDocs(getCollection(userId, 'payroll_runs'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PayrollRun));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};

export const createPayrollRun = async (userId: string, run: Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'>, slips: Omit<Payslip, 'id'>[]): Promise<PayrollRun> => {
    const path = `users/${userId}/payroll_runs`;
    try {
        const now = new Date().toISOString();
        const runId = `run-${Date.now()}`;
        const runData = { ...run, id: runId, createdAt: now, updatedAt: now } as PayrollRun;
        
        const batch = writeBatch(db);
        const runRef = doc(db, 'users', userId, 'payroll_runs', runId);
        batch.set(runRef, runData);
        
        slips.forEach(s => {
            const slipId = `slip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const slipRef = doc(db, 'users', userId, 'payslips', slipId);
            batch.set(slipRef, { ...s, id: slipId, runId });
        });
        
        await batch.commit();
        return runData;
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
        throw e;
    }
};

export const getPayslipsForRun = async (userId: string, runId: string): Promise<Payslip[]> => {
    const path = `users/${userId}/payslips`;
    try {
        const q = query(getCollection(userId, 'payslips'), where('runId', '==', runId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Payslip));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
        return [];
    }
};
