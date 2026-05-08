import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type {
  FinancialState, FinancialContextType, StudioConfig, FixedExpenses,
  Product, InventoryItem, Transaction, BenchmarkData, ProductMath,
  MarginStatus, StockStatus,
} from '../types'

// ─── Initial State ────────────────────────────────────────────
const defaultFixedExpenses: FixedExpenses = {
  housing: 0, food: 0, transport: 0,
  subscriptions: [], workshopRent: 0, equipmentInstallments: 0,
}
const defaultStudio: StudioConfig = {
  projectName: '', backgroundImageUrl: null,
  goalBucket: null, extraGoalAmount: 0, onboardingCompleted: false,
}
const initialState: FinancialState = {
  studio: defaultStudio, fixedExpenses: defaultFixedExpenses,
  products: [], inventoryItems: [], transactions: [], benchmarks: [],
}

// ─── Actions ──────────────────────────────────────────────────
type Action =
  | { type: 'UPDATE_STUDIO'; payload: Partial<StudioConfig> }
  | { type: 'UPDATE_FIXED_EXPENSES'; payload: Partial<FixedExpenses> }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; data: Partial<Product> } }
  | { type: 'REMOVE_PRODUCT'; payload: string }
  | { type: 'ADD_INVENTORY_ITEM'; payload: InventoryItem }
  | { type: 'UPDATE_INVENTORY_ITEM'; payload: { id: string; data: Partial<InventoryItem> } }
  | { type: 'REMOVE_INVENTORY_ITEM'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'SET_BENCHMARK'; payload: BenchmarkData }
  | { type: 'LOAD_STATE'; payload: FinancialState }

function reducer(state: FinancialState, action: Action): FinancialState {
  switch (action.type) {
    case 'UPDATE_STUDIO':
      return { ...state, studio: { ...state.studio, ...action.payload } }
    case 'UPDATE_FIXED_EXPENSES':
      return { ...state, fixedExpenses: { ...state.fixedExpenses, ...action.payload } }
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] }
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map(p => p.id === action.payload.id ? { ...p, ...action.payload.data } : p) }
    case 'REMOVE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) }
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventoryItems: [...state.inventoryItems, action.payload] }
    case 'UPDATE_INVENTORY_ITEM':
      return { ...state, inventoryItems: state.inventoryItems.map(i => i.id === action.payload.id ? { ...i, ...action.payload.data } : i) }
    case 'REMOVE_INVENTORY_ITEM':
      return { ...state, inventoryItems: state.inventoryItems.filter(i => i.id !== action.payload) }
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }
    case 'REMOVE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }
    case 'SET_BENCHMARK':
      return { ...state, benchmarks: [...state.benchmarks.filter(b => b.productId !== action.payload.productId), action.payload] }
    case 'LOAD_STATE':
      return action.payload
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────
const FinancialDataContext = createContext<FinancialContextType | null>(null)
const STORAGE_KEY = 'la-costeadora-v1'

export function FinancialDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved) as FinancialState
    } catch { /* ignore */ }
    return init
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // ── Helpers ────────────────────────────────────────────────
  const getMarginStatus = (margin: number): MarginStatus => {
    if (margin >= 60) return 'healthy'
    if (margin >= 40) return 'warning'
    return 'critical'
  }

  const getStockStatus = (item: InventoryItem): StockStatus => {
    const pct = item.maxQuantity > 0 ? (item.totalQuantity / item.maxQuantity) * 100 : 0
    if (pct > 50) return 'ok'
    if (pct >= 20) return 'low'
    return 'critical'
  }

  const getTotalFixedExpenses = (): number => {
    const { housing, food, transport, subscriptions, workshopRent, equipmentInstallments } = state.fixedExpenses
    const subsTotal = subscriptions.filter(s => s.isActive).reduce((a, s) => a + s.monthlyAmount, 0)
    return housing + food + transport + subsTotal + workshopRent + equipmentInstallments
  }

  const getMonthlyObjective = (): number =>
    getTotalFixedExpenses() + (state.studio.extraGoalAmount / 12)

  const getAccumulatedCash = (): number =>
    state.transactions.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0)

  const getProductMath = (productId: string): ProductMath | null => {
    const product = state.products.find(p => p.id === productId)
    if (!product) return null
    const productionTotal = product.productionCosts.reduce((a, c) => a + c.quantity * c.unitPrice, 0)
    const distributionTotal = product.distributionCosts.reduce((a, c) => a + c.quantity * c.unitPrice, 0)
    const investmentPerUnit = product.estimatedUnits > 0 ? product.initialInvestment / product.estimatedUnits : 0
    const productCost = productionTotal + distributionTotal + investmentPerUnit
    const profitMargin = product.sellingPrice > 0
      ? ((product.sellingPrice - productCost) / product.sellingPrice) * 100 : 0
    const totalFixed = getTotalFixedExpenses()
    const productFixedShare = state.products.length > 0 ? totalFixed / state.products.length : 0
    const unitContribution = product.sellingPrice - productCost
    const unitsNeeded = unitContribution > 0 ? Math.ceil(productFixedShare / unitContribution) : 0
    return {
      productionTotal, distributionTotal, investmentPerUnit, productCost, profitMargin,
      marginStatus: getMarginStatus(profitMargin), unitContribution, productFixedShare,
      unitsNeeded, revenueNeeded: unitsNeeded * product.sellingPrice,
      pendingAmount: product.sellingPrice * product.estimatedUnits - product.amountCollected,
    }
  }

  // ── Actions ────────────────────────────────────────────────
  const updateStudio = (data: Partial<StudioConfig>) => dispatch({ type: 'UPDATE_STUDIO', payload: data })
  const updateFixedExpenses = (data: Partial<FixedExpenses>) => dispatch({ type: 'UPDATE_FIXED_EXPENSES', payload: data })
  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) =>
    dispatch({ type: 'ADD_PRODUCT', payload: { ...product, id: crypto.randomUUID(), createdAt: new Date().toISOString() } })
  const updateProduct = (id: string, data: Partial<Product>) => dispatch({ type: 'UPDATE_PRODUCT', payload: { id, data } })
  const removeProduct = (id: string) => dispatch({ type: 'REMOVE_PRODUCT', payload: id })
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) =>
    dispatch({ type: 'ADD_INVENTORY_ITEM', payload: { ...item, id: crypto.randomUUID() } })
  const updateInventoryItem = (id: string, data: Partial<InventoryItem>) =>
    dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { id, data } })
  const removeInventoryItem = (id: string) => dispatch({ type: 'REMOVE_INVENTORY_ITEM', payload: id })
  const addTransaction = (tx: Omit<Transaction, 'id'>) =>
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...tx, id: crypto.randomUUID() } })
  const removeTransaction = (id: string) => dispatch({ type: 'REMOVE_TRANSACTION', payload: id })
  const setBenchmarkData = (data: BenchmarkData) => dispatch({ type: 'SET_BENCHMARK', payload: data })

  const value: FinancialContextType = {
    ...state,
    updateStudio, updateFixedExpenses,
    addProduct, updateProduct, removeProduct,
    addInventoryItem, updateInventoryItem, removeInventoryItem,
    addTransaction, removeTransaction, setBenchmarkData,
    getProductMath, getTotalFixedExpenses, getMonthlyObjective,
    getAccumulatedCash, getMarginStatus, getStockStatus,
  }

  return <FinancialDataContext.Provider value={value}>{children}</FinancialDataContext.Provider>
}

export function useFinancialData(): FinancialContextType {
  const ctx = useContext(FinancialDataContext)
  if (!ctx) throw new Error('useFinancialData must be used within FinancialDataProvider')
  return ctx
}

export default FinancialDataContext
