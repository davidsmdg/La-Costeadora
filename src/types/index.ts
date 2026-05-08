// ============================================================
// LA COSTEADORA – Tipos Globales
// Master PRD: Studio Financiero para emprendedores creativos
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';

export type MarginStatus = 'healthy' | 'warning' | 'critical';
// healthy  → margen > 60%
// warning  → margen 40%–60%
// critical → margen < 40%

export type StockStatus = 'ok' | 'low' | 'critical';
// ok       → stock > 50%
// low      → stock 20%–50%
// critical → stock < 20%

export type GoalBucket = 'travel' | 'equipment' | 'savings';

export type ProjectType = 'product' | 'custom'; // Catálogo vs. Proyecto a medida

// ─── Materiales / Costos ─────────────────────────────────────

export interface CostItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category: 'production' | 'distribution' | 'investment';
  /** Si es true, muestra borde ámbar ⭐ en la UI. No afecta el cálculo de costo. */
  affectedByAuthorship: boolean;
  /** Referencia opcional al item de inventario global */
  inventoryId?: string;
}

// ─── Inventario Global ───────────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;            // 'kg', 'litros', 'unidades', etc.
  totalQuantity: number;   // Stock actual
  maxQuantity: number;     // Stock máximo (para calcular %)
  threshold: number;       // Cantidad mínima antes de alerta
  unitCost: number;        // Costo por unidad
}

// ─── Producto / Proyecto ──────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  type: ProjectType;
  sellingPrice: number;
  estimatedUnits: number;
  initialInvestment: number;
  productionCosts: CostItem[];
  distributionCosts: CostItem[];
  /** Monto ya cobrado (anticipos + pagos recibidos) */
  amountCollected: number;
  createdAt: string;       // ISO date string
  /** Materiales del inventario global usados en este producto */
  inventoryUsage?: InventoryUsage[];
}

export interface InventoryUsage {
  inventoryItemId: string;
  quantityPerUnit: number; // Cuánto material se usa por unidad producida
}

// ─── Costos Fijos ────────────────────────────────────────────

export interface FixedExpenses {
  // Personales (Onboarding Pantalla 2)
  housing: number;    // 🏠 Techo y Servicios
  food: number;       // ☕ Comida y Mercado
  transport: number;  // 🚌 Transporte y Movimiento

  // Negocio (Onboarding Pantalla 3)
  subscriptions: Subscription[];
  workshopRent: number;
  equipmentInstallments: number;
}

export interface Subscription {
  id: string;
  name: string;         // 'Adobe CC', 'Canva', 'Spotify', etc.
  icon: string;         // Emoji o URL de icono
  monthlyAmount: number;
  isActive: boolean;
}

// ─── Transacciones / Diario Financiero ───────────────────────

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string;            // ISO date string
  productId?: string;      // Vinculado a un proyecto (opcional)
  isProjection?: boolean;  // true = evento futuro proyectado
}

export type TransactionCategory =
  | 'materiales'
  | 'viaticos'
  | 'anticipo'
  | 'cobro_final'
  | 'suscripcion'
  | 'taller'
  | 'equipo'
  | 'personal'
  | 'otro';

// ─── Configuración de Onboarding / Studio ────────────────────

export interface StudioConfig {
  projectName: string;
  backgroundImageUrl: string | null;  // Foto del taller del usuario
  goalBucket: GoalBucket | null;
  extraGoalAmount: number;            // Meta extra (viaje, equipo, ahorro)
  onboardingCompleted: boolean;
}

// ─── Competidores (Radar de Mercado) ─────────────────────────

export interface Competitor {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface BenchmarkData {
  productId: string;
  competitors: Competitor[];
}

// ─── Matemáticas calculadas (derivadas del estado) ───────────
// Estos NO se almacenan; se calculan en hooks/contexto.

export interface ProductMath {
  productionTotal: number;
  distributionTotal: number;
  investmentPerUnit: number;
  productCost: number;
  profitMargin: number;     // porcentaje 0–100
  marginStatus: MarginStatus;
  unitContribution: number;
  productFixedShare: number;
  unitsNeeded: number;
  revenueNeeded: number;
  pendingAmount: number;    // sellingPrice * estimatedUnits - amountCollected
}

// ─── Estado Global ───────────────────────────────────────────

export interface FinancialState {
  studio: StudioConfig;
  fixedExpenses: FixedExpenses;
  products: Product[];
  inventoryItems: InventoryItem[];
  transactions: Transaction[];
  benchmarks: BenchmarkData[];
}

// ─── Contexto (shape del Context API) ────────────────────────

export interface FinancialContextType extends FinancialState {
  // Studio
  updateStudio: (data: Partial<StudioConfig>) => void;

  // Fixed expenses
  updateFixedExpenses: (data: Partial<FixedExpenses>) => void;

  // Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  removeInventoryItem: (id: string) => void;

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;

  // Benchmarks
  setBenchmarkData: (data: BenchmarkData) => void;

  // Computed helpers
  getProductMath: (productId: string) => ProductMath | null;
  getTotalFixedExpenses: () => number;
  getMonthlyObjective: () => number;
  getAccumulatedCash: () => number;
  getMarginStatus: (margin: number) => MarginStatus;
  getStockStatus: (item: InventoryItem) => StockStatus;
}
