import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import type {
  FinancialState, FinancialContextType, StudioConfig, FixedExpenses,
  Product, InventoryItem, Transaction, BenchmarkData, ProductMath,
  MarginStatus, StockStatus, MonthlySale
} from '../types'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

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
  | { type: 'SET_MONTHLY_SALE'; payload: { productId: string; month: string; unitsSold: number } }
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
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p
        )
      }
    case 'REMOVE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) }
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventoryItems: [...state.inventoryItems, action.payload] }
    case 'UPDATE_INVENTORY_ITEM':
      return {
        ...state,
        inventoryItems: state.inventoryItems.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload.data } : i
        )
      }
    case 'REMOVE_INVENTORY_ITEM':
      return { ...state, inventoryItems: state.inventoryItems.filter(i => i.id !== action.payload) }
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }
    case 'REMOVE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }
    case 'SET_BENCHMARK':
      return {
        ...state,
        benchmarks: [
          ...state.benchmarks.filter(b => b.productId !== action.payload.productId),
          action.payload
        ]
      }
    case 'SET_MONTHLY_SALE':
      return {
        ...state,
        products: state.products.map(p => {
          if (p.id !== action.payload.productId) return p;
          const sales = p.monthlySales || [];
          const filtered = sales.filter(s => s.month !== action.payload.month);
          return {
            ...p,
            monthlySales: [...filtered, { productId: action.payload.productId, month: action.payload.month, unitsSold: action.payload.unitsSold }]
          };
        })
      }
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
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [state, dispatch] = useReducer(reducer, initialState)

  // ── Load from Supabase on Auth Change ─────────────────────────
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!user) {
        if (isMounted) {
          dispatch({ type: 'LOAD_STATE', payload: initialState })
          setLoading(false)
        }
        return
      }

      setLoading(true)
      const userId = user.id

      try {
        // Fetch in parallel
        const [
          profileRes,
          fixedExpensesRes,
          subscriptionsRes,
          inventoryRes,
          productsRes,
          transactionsRes,
          benchmarksRes
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('fixed_expenses').select('*').eq('profile_id', userId).maybeSingle(),
          supabase.from('subscriptions').select('*').eq('profile_id', userId),
          supabase.from('inventory_items').select('*').eq('profile_id', userId),
          supabase.from('products').select('*, cost_items(*), inventory_usages(*), monthly_sales(*)').eq('profile_id', userId),
          supabase.from('transactions').select('*').eq('profile_id', userId),
          supabase.from('benchmarks').select('*').eq('profile_id', userId)
        ])

        if (!isMounted) return

        // Fallback or Trigger check
        let profileData = profileRes.data
        if (!profileData) {
          const { data } = await supabase.from('profiles').upsert({ id: userId, project_name: '', onboarding_completed: false }).select().single()
          profileData = data
        }

        let fixedExpensesData = fixedExpensesRes.data
        if (!fixedExpensesData) {
          const { data } = await supabase.from('fixed_expenses').upsert({ profile_id: userId }).select().single()
          fixedExpensesData = data
        }

        const loadedState: FinancialState = {
          studio: {
            projectName: profileData.project_name || '',
            backgroundImageUrl: profileData.background_image_url || null,
            goalBucket: profileData.goal_bucket || null,
            extraGoalAmount: Number(profileData.extra_goal_amount) || 0,
            onboardingCompleted: !!profileData.onboarding_completed,
          },
          fixedExpenses: {
            housing: Number(fixedExpensesData.housing) || 0,
            food: Number(fixedExpensesData.food) || 0,
            transport: Number(fixedExpensesData.transport) || 0,
            workshopRent: Number(fixedExpensesData.workshop_rent) || 0,
            equipmentInstallments: Number(fixedExpensesData.equipment_installments) || 0,
            directGoal: Number(fixedExpensesData.direct_goal) || 0,
            subscriptions: (subscriptionsRes.data || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              icon: s.icon || '',
              monthlyAmount: Number(s.monthly_amount) || 0,
              isActive: !!s.is_active,
            })),
          },
          products: (productsRes.data || []).map((p: any) => {
            const prodCosts = (p.cost_items || []).filter((c: any) => c.category === 'production').map((c: any) => ({
              id: c.id,
              name: c.name,
              quantity: Number(c.quantity) || 0,
              unitPrice: Number(c.unit_price) || 0,
              category: 'production',
              affectedByAuthorship: !!c.affected_by_authorship,
              inventoryId: c.inventory_id || undefined,
              isFixed: !!c.is_fixed,
            }))
            const distCosts = (p.cost_items || []).filter((c: any) => c.category === 'distribution').map((c: any) => ({
              id: c.id,
              name: c.name,
              quantity: Number(c.quantity) || 0,
              unitPrice: Number(c.unit_price) || 0,
              category: 'distribution',
              affectedByAuthorship: !!c.affected_by_authorship,
              inventoryId: c.inventory_id || undefined,
              isFixed: !!c.is_fixed,
            }))
            const investCosts = (p.cost_items || []).filter((c: any) => c.category === 'investment').map((c: any) => ({
              id: c.id,
              name: c.name,
              quantity: Number(c.quantity) || 0,
              unitPrice: Number(c.unit_price) || 0,
              category: 'investment',
              affectedByAuthorship: !!c.affected_by_authorship,
              inventoryId: c.inventory_id || undefined,
              isFixed: !!c.is_fixed,
            }))

            return {
              id: p.id,
              name: p.name,
              type: p.type,
              sellingPrice: Number(p.selling_price) || 0,
              estimatedUnits: Number(p.estimated_units) || 1,
              initialInvestment: Number(p.initial_investment) || 0,
              productionCosts: prodCosts,
              distributionCosts: distCosts,
              amountCollected: Number(p.amount_collected) || 0,
              createdAt: p.created_at,
              inventoryUsage: (p.inventory_usages || []).map((iu: any) => ({
                inventoryItemId: iu.inventory_item_id,
                quantityPerUnit: Number(iu.quantity_per_unit) || 0,
              })),
              monthlySales: (p.monthly_sales || []).map((ms: any) => ({
                id: ms.id,
                productId: ms.product_id,
                month: ms.month,
                unitsSold: Number(ms.units_sold) || 0,
              })),
              color: localStorage.getItem(`la_costeadora_colors_${p.id}`) || undefined
            }
          }),
          inventoryItems: (inventoryRes.data || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            totalQuantity: Number(i.total_quantity) || 0,
            maxQuantity: Number(i.max_quantity) || 0,
            threshold: Number(i.threshold) || 0,
            unitCost: Number(i.unit_cost) || 0,
          })),
          transactions: (transactionsRes.data || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount) || 0,
            description: t.description,
            category: t.category,
            date: t.date,
            productId: t.product_id || undefined,
            isProjection: !!t.is_projection,
          })),
          benchmarks: (benchmarksRes.data || []).map((b: any) => ({
            productId: b.product_id,
            competitors: Array.isArray(b.competitors) ? b.competitors : [],
          })),
        }

        dispatch({ type: 'LOAD_STATE', payload: loadedState })
      } catch (err) {
        console.error('Error fetching Supabase data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user])

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

  const getMonthlyObjective = (): number => {
    if (state.fixedExpenses.directGoal && state.fixedExpenses.directGoal > 0) {
      return state.fixedExpenses.directGoal
    }
    return getTotalFixedExpenses() + (state.studio.extraGoalAmount / 12)
  }

  const getAccumulatedCash = (): number => {
    const now = new Date();
    // Get next month details
    const nextMonthYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;

    return state.transactions.reduce((acc, tx) => {
      const isReal = !tx.isProjection;
      let include = isReal;
      if (tx.isProjection) {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === nextMonthYear && txDate.getMonth() === nextMonth) {
          include = true;
        }
      }
      if (include) {
        return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
      }
      return acc;
    }, 0);
  };

  const getProductMath = (productId: string): ProductMath | null => {
    const product = state.products.find(p => p.id === productId)
    if (!product) return null
    
    const isProduct = product.type === 'product'
    const prodFixed = product.productionCosts.filter(c => c.isFixed).reduce((a, c) => a + c.quantity * c.unitPrice, 0)
    const prodVariable = product.productionCosts.filter(c => !c.isFixed).reduce((a, c) => a + c.quantity * c.unitPrice, 0)
    
    const productionTotal = isProduct
      ? prodVariable + (product.estimatedUnits > 0 ? prodFixed / product.estimatedUnits : 0)
      : product.productionCosts.reduce((a, c) => a + c.quantity * c.unitPrice, 0)

    const distributionTotal = product.distributionCosts.reduce((a, c) => a + c.quantity * c.unitPrice, 0)
    const investmentPerUnit = product.estimatedUnits > 0 ? product.initialInvestment / product.estimatedUnits : 0
    const productCost = productionTotal + distributionTotal + investmentPerUnit
    const profitMargin = product.sellingPrice > 0
      ? ((product.sellingPrice - productCost) / product.sellingPrice) * 100 : 0
    const monthlyObjective = getMonthlyObjective()
    const productFixedShare = state.products.length > 0 ? monthlyObjective / state.products.length : 0
    const unitContribution = product.sellingPrice - productCost
    const unitsNeeded = unitContribution > 0 ? Math.ceil(productFixedShare / unitContribution) : 0
    return {
      productionTotal, distributionTotal, investmentPerUnit, productCost, profitMargin,
      marginStatus: getMarginStatus(profitMargin), unitContribution, productFixedShare,
      unitsNeeded, revenueNeeded: unitsNeeded * product.sellingPrice,
      pendingAmount: product.sellingPrice * product.estimatedUnits - product.amountCollected,
    }
  }

  const getProjectsTotalUtility = (): number => {
    return state.products.reduce((acc, p) => {
      const math = getProductMath(p.id)
      if (!math) return acc
      if (math.profitMargin >= 0 && math.unitContribution > 0) {
        return acc + (math.unitContribution * p.estimatedUnits)
      }
      return acc
    }, 0)
  }

  // ── Actions ────────────────────────────────────────────────
  const updateStudio = async (data: Partial<StudioConfig>) => {
    dispatch({ type: 'UPDATE_STUDIO', payload: data })
    if (!user) return

    const updateObj: any = {}
    if (data.projectName !== undefined) updateObj.project_name = data.projectName
    if (data.backgroundImageUrl !== undefined) updateObj.background_image_url = data.backgroundImageUrl
    if (data.goalBucket !== undefined) updateObj.goal_bucket = data.goalBucket
    if (data.extraGoalAmount !== undefined) updateObj.extra_goal_amount = data.extraGoalAmount
    if (data.onboardingCompleted !== undefined) updateObj.onboarding_completed = data.onboardingCompleted

    await supabase.from('profiles').update(updateObj).eq('id', user.id)
  }

  const updateFixedExpenses = async (data: Partial<FixedExpenses>) => {
    dispatch({ type: 'UPDATE_FIXED_EXPENSES', payload: data })
    if (!user) return

    const updateObj: any = {}
    if (data.housing !== undefined) updateObj.housing = data.housing
    if (data.food !== undefined) updateObj.food = data.food
    if (data.transport !== undefined) updateObj.transport = data.transport
    if (data.workshopRent !== undefined) updateObj.workshop_rent = data.workshopRent
    if (data.equipmentInstallments !== undefined) updateObj.equipment_installments = data.equipmentInstallments
    if (data.directGoal !== undefined) updateObj.direct_goal = data.directGoal

    await supabase.from('fixed_expenses').update(updateObj).eq('profile_id', user.id)

    if (data.subscriptions !== undefined) {
      await supabase.from('subscriptions').delete().eq('profile_id', user.id)
      if (data.subscriptions.length > 0) {
        await supabase.from('subscriptions').insert(
          data.subscriptions.map(s => ({
            id: s.id,
            profile_id: user.id,
            name: s.name,
            icon: s.icon,
            monthly_amount: s.monthlyAmount,
            is_active: s.isActive
          }))
        )
      }
    }
  }

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newId = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const fullProduct: Product = { ...product, id: newId, createdAt, monthlySales: [] }

    if (product.color) {
      localStorage.setItem(`la_costeadora_colors_${newId}`, product.color)
    }

    dispatch({ type: 'ADD_PRODUCT', payload: fullProduct })
    if (!user) return

    await supabase.from('products').insert({
      id: newId,
      profile_id: user.id,
      name: product.name,
      type: product.type,
      selling_price: product.sellingPrice,
      estimated_units: product.estimatedUnits,
      initial_investment: product.initialInvestment,
      amount_collected: product.amountCollected,
      created_at: createdAt
    })

    const allCosts = [
      ...product.productionCosts.map(c => ({ ...c, category: 'production' as const })),
      ...product.distributionCosts.map(c => ({ ...c, category: 'distribution' as const }))
    ]

    if (allCosts.length > 0) {
      await supabase.from('cost_items').insert(
        allCosts.map(c => ({
          id: c.id,
          product_id: newId,
          name: c.name,
          quantity: c.quantity,
          unit_price: c.unitPrice,
          category: c.category,
          affected_by_authorship: c.affectedByAuthorship,
          inventory_id: c.inventoryId,
          is_fixed: c.isFixed || false
        }))
      )
    }

    if (product.inventoryUsage && product.inventoryUsage.length > 0) {
      await supabase.from('inventory_usages').insert(
        product.inventoryUsage.map(iu => ({
          product_id: newId,
          inventory_item_id: iu.inventoryItemId,
          quantity_per_unit: iu.quantityPerUnit
        }))
      )
    }
  }

  const updateProduct = async (id: string, data: Partial<Product>) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { id, data } })
    if (!user) return

    const updateObj: any = {}
    if (data.name !== undefined) updateObj.name = data.name;
    if (data.type !== undefined) updateObj.type = data.type;
    if (data.sellingPrice !== undefined) updateObj.selling_price = data.sellingPrice;
    if (data.estimatedUnits !== undefined) updateObj.estimated_units = data.estimatedUnits;
    if (data.initialInvestment !== undefined) updateObj.initial_investment = data.initialInvestment;
    if (data.amountCollected !== undefined) updateObj.amount_collected = data.amountCollected;

    if (Object.keys(updateObj).length > 0) {
      await supabase.from('products').update(updateObj).eq('id', id)
    }

    if (data.productionCosts !== undefined) {
      await supabase.from('cost_items').delete().eq('product_id', id).eq('category', 'production')
      if (data.productionCosts.length > 0) {
        await supabase.from('cost_items').insert(
          data.productionCosts.map(c => ({
            id: c.id,
            product_id: id,
            name: c.name,
            quantity: c.quantity,
            unit_price: c.unitPrice,
            category: 'production',
            affected_by_authorship: c.affectedByAuthorship,
            inventory_id: c.inventoryId,
            is_fixed: c.isFixed || false
          }))
        )
      }
    }

    if (data.distributionCosts !== undefined) {
      await supabase.from('cost_items').delete().eq('product_id', id).eq('category', 'distribution')
      if (data.distributionCosts.length > 0) {
        await supabase.from('cost_items').insert(
          data.distributionCosts.map(c => ({
            id: c.id,
            product_id: id,
            name: c.name,
            quantity: c.quantity,
            unit_price: c.unitPrice,
            category: 'distribution',
            affected_by_authorship: c.affectedByAuthorship,
            inventory_id: c.inventoryId,
            is_fixed: c.isFixed || false
          }))
        )
      }
    }

    if (data.inventoryUsage !== undefined) {
      await supabase.from('inventory_usages').delete().eq('product_id', id)
      if (data.inventoryUsage.length > 0) {
        await supabase.from('inventory_usages').insert(
          data.inventoryUsage.map(iu => ({
            product_id: id,
            inventory_item_id: iu.inventoryItemId,
            quantity_per_unit: iu.quantityPerUnit
          }))
        )
      }
    }
  }

  const removeProduct = async (id: string) => {
    dispatch({ type: 'REMOVE_PRODUCT', payload: id })
    if (!user) return
    await supabase.from('products').delete().eq('id', id)
  }

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const newId = crypto.randomUUID()
    dispatch({ type: 'ADD_INVENTORY_ITEM', payload: { ...item, id: newId } })
    if (!user) return

    await supabase.from('inventory_items').insert({
      id: newId,
      profile_id: user.id,
      name: item.name,
      unit: item.unit,
      total_quantity: item.totalQuantity,
      max_quantity: item.maxQuantity,
      threshold: item.threshold,
      unit_cost: item.unitCost
    })
  }

  const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
    dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { id, data } })
    if (!user) return

    const updateObj: any = {}
    if (data.name !== undefined) updateObj.name = data.name
    if (data.unit !== undefined) updateObj.unit = data.unit
    if (data.totalQuantity !== undefined) updateObj.total_quantity = data.totalQuantity
    if (data.maxQuantity !== undefined) updateObj.max_quantity = data.maxQuantity
    if (data.threshold !== undefined) updateObj.threshold = data.threshold
    if (data.unitCost !== undefined) updateObj.unit_cost = data.unitCost

    await supabase.from('inventory_items').update(updateObj).eq('id', id)
  }

  const removeInventoryItem = async (id: string) => {
    dispatch({ type: 'REMOVE_INVENTORY_ITEM', payload: id })
    if (!user) return
    await supabase.from('inventory_items').delete().eq('id', id)
  }

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const newId = crypto.randomUUID()
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...tx, id: newId } })

    if (tx.type === 'income' && tx.productId) {
      const product = state.products.find(p => p.id === tx.productId)
      if (product) {
        const newCollected = product.amountCollected + tx.amount
        dispatch({ type: 'UPDATE_PRODUCT', payload: { id: tx.productId, data: { amountCollected: newCollected } } })
        if (user) {
          await supabase.from('products').update({ amount_collected: newCollected }).eq('id', tx.productId)
        }
      }
    }

    if (!user) return

    await supabase.from('transactions').insert({
      id: newId,
      profile_id: user.id,
      product_id: tx.productId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      date: tx.date,
      is_projection: tx.isProjection
    })
  }

  const removeTransaction = async (id: string) => {
    const tx = state.transactions.find(t => t.id === id)
    dispatch({ type: 'REMOVE_TRANSACTION', payload: id })

    if (tx && tx.type === 'income' && tx.productId) {
      const product = state.products.find(p => p.id === tx.productId)
      if (product) {
        const newCollected = Math.max(0, product.amountCollected - tx.amount)
        dispatch({ type: 'UPDATE_PRODUCT', payload: { id: tx.productId, data: { amountCollected: newCollected } } })
        if (user) {
          await supabase.from('products').update({ amount_collected: newCollected }).eq('id', tx.productId)
        }
      }
    }

    if (!user) return
    await supabase.from('transactions').delete().eq('id', id)
  }

  const setBenchmarkData = async (data: BenchmarkData) => {
    dispatch({ type: 'SET_BENCHMARK', payload: data })
    if (!user) return

    await supabase.from('benchmarks').upsert({
      product_id: data.productId,
      profile_id: user.id,
      competitors: data.competitors
    })
  }

  const setMonthlySale = async (
    productId: string,
    month: string,
    unitsSold: number
  ) => {
    dispatch({ type: 'SET_MONTHLY_SALE', payload: { productId, month, unitsSold } })

    if (!user) return
    try {
      await supabase.from('monthly_sales').upsert({
        product_id: productId,
        profile_id: user.id,
        month,
        units_sold: unitsSold
      }, { onConflict: 'product_id,month' })
    } catch (err) {
      console.error('Error saving monthly sale:', err)
    }
  }

  const value: FinancialContextType = {
    ...state,
    loading,
    updateStudio, updateFixedExpenses,
    addProduct, updateProduct, removeProduct,
    addInventoryItem, updateInventoryItem, removeInventoryItem,
    addTransaction, removeTransaction, setBenchmarkData, setMonthlySale,
    getProductMath, getTotalFixedExpenses, getMonthlyObjective,
    getAccumulatedCash, getMarginStatus, getStockStatus,
    getProjectsTotalUtility,
  }

  return <FinancialDataContext.Provider value={value}>{children}</FinancialDataContext.Provider>
}

export function useFinancialData(): FinancialContextType {
  const ctx = useContext(FinancialDataContext)
  if (!ctx) throw new Error('useFinancialData must be used within FinancialDataProvider')
  return ctx
}

export default FinancialDataContext
