import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'personal' | 'business';
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  estimatedUnits: number;
  initialInvestment: number;
  productionCosts: { name: string; quantity: number; unitPrice: number }[];
  distributionCosts: { name: string; quantity: number; unitPrice: number }[];
  affectedByAuthorship: boolean;
}

interface FinancialContextType {
  projectName: string;
  setProjectName: (name: string) => void;
  bgImage: string | null;
  setBgImage: (img: string | null) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  monthlyGoal: number;
  setMonthlyGoal: (goal: number) => void;
  // Computed values
  totalFixedExpenses: number;
  financialMetrics: any;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [projectName, setProjectName] = useState('');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState(0);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const totalFixedExpenses = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const financialMetrics = useMemo(() => {
    return products.map(product => {
      const productionTotal = product.productionCosts.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
      const distributionTotal = product.distributionCosts.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
      const investmentPerUnit = product.estimatedUnits > 0 ? product.initialInvestment / product.estimatedUnits : 0;
      const productCost = productionTotal + distributionTotal + investmentPerUnit;
      const profitMargin = product.sellingPrice > 0 ? ((product.sellingPrice - productCost) / product.sellingPrice) * 100 : 0;
      
      const productFixedShare = products.length > 0 ? totalFixedExpenses / products.length : 0;
      const unitContribution = product.sellingPrice - productCost;
      const unitsNeeded = unitContribution > 0 ? Math.ceil(productFixedShare / unitContribution) : 0;

      return {
        ...product,
        productionTotal,
        distributionTotal,
        productCost,
        profitMargin,
        unitsNeeded,
        revenueNeeded: unitsNeeded * product.sellingPrice
      };
    });
  }, [products, totalFixedExpenses]);

  return (
    <FinancialContext.Provider value={{
      projectName, setProjectName,
      bgImage, setBgImage,
      expenses, addExpense,
      products, addProduct,
      monthlyGoal, setMonthlyGoal,
      totalFixedExpenses,
      financialMetrics
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancialData = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancialData must be used within a FinancialProvider');
  return context;
};
