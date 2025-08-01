import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { getTableRows, getAllLogos, getAllWelcomeImages, getAllBrandingConfigs, getUserByAuthId } from "@/lib/supabase"
import { getCurrentUser } from '../lib/auth';

interface GlobalData {
  products: any[]
  elements: any[]
  backgrounds: any[]
  configs: any[] // todas las configs
  config: any | null // config seleccionada
  logos: { name: string; url: string }[]
  welcomeImages: { name: string; url: string }[]
  loading: boolean
  error: string | null
}

interface GlobalDataContextType {
  data: GlobalData
  refreshData: () => Promise<void>
  refreshTable: (tableName: string) => Promise<void>
  updateItem: (tableName: string, itemId: string, updates: { name?: string; visible?: boolean }) => void
  selectConfig: (id: string) => void
  setConfigGlobal: (configObj: any) => void
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined)

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GlobalData>({
    products: [],
    elements: [],
    backgrounds: [],
    configs: [],
    config: null,
    logos: [],
    welcomeImages: [],
    loading: true,
    error: null
  })

  const loadAllData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const [products, elements, backgrounds, configs, logos, welcomeImages] = await Promise.all([
        getTableRows('product'),
        getTableRows('element'),
        getTableRows('background'),
        getAllBrandingConfigs(),
        getAllLogos(),
        getAllWelcomeImages()
      ])

      // Obtener usuario logueado
      let user = null;
      let userId = null;
      try {
        user = await getCurrentUser();
        if (user) userId = await getUserByAuthId(user.id);
      } catch {}

      let newConfig = null;
      setData(prev => {
        if (userId) {
          newConfig = configs.find(c => c.user_id === userId.id) || null;
        } else if (prev.config && configs.length > 0) {
          newConfig = configs.find(c => c.id === prev.config.id) || (configs.length > 0 ? configs[0] : null);
        } else {
          newConfig = configs.length > 0 ? configs[0] : null;
        }
        return {
          ...prev,
          products,
          elements,
          backgrounds,
          configs,
          config: newConfig,
          logos,
          welcomeImages,
          loading: false,
          error: null
        };
      });
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

  // Seleccionar config por id
  const selectConfig = (id: string) => {
    setData(prev => {
      const config = prev.configs.find(c => c.id === id) || null;
      return { ...prev, config };
    });
  }

  // Setear config directamente
  const setConfigGlobal = (configObj: any) => {
    setData(prev => ({ ...prev, config: configObj }));
  }

  useEffect(() => {
    loadAllData()
  }, [])

  return (
    <GlobalDataContext.Provider value={{ data, refreshData, refreshTable, updateItem, selectConfig, setConfigGlobal }}>
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