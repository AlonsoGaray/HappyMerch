import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { getTableRows } from "@/lib/supabase"

interface AdminData {
  products: any[]
  elements: any[]
  backgrounds: any[]
  loading: boolean
  error: string | null
}

interface AdminDataContextType {
  data: AdminData
  refreshData: () => Promise<void>
  refreshTable: (tableName: string) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData>({
    products: [],
    elements: [],
    backgrounds: [],
    loading: true,
    error: null
  })

  const loadAllData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const [products, elements, backgrounds] = await Promise.all([
        getTableRows('product'),
        getTableRows('element'),
        getTableRows('background')
      ])

      setData({
        products,
        elements,
        backgrounds,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
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

  useEffect(() => {
    loadAllData()
  }, [])

  return (
    <AdminDataContext.Provider value={{ data, refreshData, refreshTable }}>
      {children}
    </AdminDataContext.Provider>
  )
}

export function useAdminData() {
  const context = useContext(AdminDataContext)
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminDataProvider')
  }
  return context
} 