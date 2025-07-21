import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { getTableRows, getBrandingConfig, getAllLogos } from "@/lib/supabase"

interface GlobalData {
  products: any[]
  elements: any[]
  backgrounds: any[]
  config: any | null
  logos: { name: string; url: string }[]
  loading: boolean
  error: string | null
}

interface GlobalDataContextType {
  data: GlobalData
  refreshData: () => Promise<void>
  refreshTable: (tableName: string) => Promise<void>
  updateItem: (tableName: string, itemId: string, updates: { name?: string; visible?: boolean }) => void
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined)

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GlobalData>({
    products: [],
    elements: [],
    backgrounds: [],
    config: null,
    logos: [],
    loading: true,
    error: null
  })

  const loadAllData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const [products, elements, backgrounds, config, logos] = await Promise.all([
        getTableRows('product'),
        getTableRows('element'),
        getTableRows('background'),
        getBrandingConfig(),
        getAllLogos()
      ])

      setData({
        products,
        elements,
        backgrounds,
        config,
        logos,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading global data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar los datos'
      }))
    }
  }

  const refreshData = async () => {
    await loadAllData()
  }

  const refreshTable = async (tableName: string) => {
    try {
      const newData = await getTableRows(tableName)
      setData(prev => ({
        ...prev,
        [tableName === 'product' ? 'products' : 
         tableName === 'element' ? 'elements' : 
         tableName === 'background' ? 'backgrounds' : 'products']: newData
      }))
    } catch (error) {
      console.error(`Error refreshing ${tableName}:`, error)
    }
  }

  const updateItem = (tableName: string, itemId: string, updates: { name?: string; visible?: boolean }) => {
    setData(prev => {
      const tableKey = tableName === 'product' ? 'products' : 
                      tableName === 'element' ? 'elements' : 
                      tableName === 'background' ? 'backgrounds' : 'products'
      
      const currentArray = prev[tableKey as keyof GlobalData] as any[]
      if (!currentArray) return prev
      
      return {
        ...prev,
        [tableKey]: currentArray.map((item: any) => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      }
    })
  }

  useEffect(() => {
    loadAllData()
  }, [])

  return (
    <GlobalDataContext.Provider value={{ data, refreshData, refreshTable, updateItem }}>
      {children}
    </GlobalDataContext.Provider>
  )
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext)
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider')
  }
  return context
} 