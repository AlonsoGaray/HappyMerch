import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Plus } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { handleAddItemWithUpload, handleFileChangeGeneric, handleVisibilityToggle } from "@/lib/PanelUtils"
import { useAdminData } from "@/contexts/AdminDataContext"

interface GenericAdminPanelProps {
  tableName: string
  bucketName: string
  searchPlaceholder: string
  addButtonText: string
  modalTitle: string
  loadingText: string
}

interface Items {
  id: string
  name: string
  url: string
  visible: boolean
}

export function GenericAdminPanel({
  tableName,
  bucketName,
  searchPlaceholder,
  addButtonText,
  modalTitle,
  loadingText
}: GenericAdminPanelProps) {
  const { data, refreshTable } = useAdminData()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({
    image: "",
    name: "",
    visible: false,
    file: null as File | null,
  })

  // Obtener los datos correspondientes según la tabla
  const getTableData = () => {
    switch (tableName) {
      case 'product':
        return data.products
      case 'element':
        return data.elements
      case 'background':
        return data.backgrounds
      default:
        return []
    }
  }

  const items = getTableData() as Items[]
  const loading = data.loading

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const deleteItem = (itemId: string) => {
  }

  const handleAddItem = async () => {
    await handleAddItemWithUpload({
      bucketName,
      tableName,
      setItems: () => {}, // No necesitamos setItems aquí
      newItem,
      setNewItem,
      setShowModal: setShowAddModal,
    })
    // Refrescar solo la tabla específica después de agregar
    await refreshTable(tableName)
  }

  const handleFileChange = handleFileChangeGeneric(setNewItem)

  const handleVisibilityChange = async (itemId: string) => {
    await handleVisibilityToggle(itemId, tableName, items, () => {})
    // Refrescar solo la tabla específica después de cambiar visibilidad
    await refreshTable(tableName)
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {addButtonText}
        </Button>
      </div>
      
      {/* Items Grid */}
      {loading ?
        <div className="flex items-center justify-center h-64">
          <p>{loadingText}</p>
        </div>
      :
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="items-center flex flex-col">
              <img src={item.url} alt={item.name} className="h-24 w-24 object-cover rounded mb-2" />
              <p className="font-semibold text-center">{item.name}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Switch 
                  checked={item.visible} 
                  onCheckedChange={() => handleVisibilityChange(item.id)} 
                />
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600" 
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      {/* Modal para agregar item */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="w-[450px]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {newItem.image && (
              <img src={newItem.image} alt="preview" className="h-28 w-2h-28 object-cover mx-auto" />
            )}
            <div className="flex items-center space-x-2">
              <span>Nombre</span>
              <Input
                placeholder="Nombre del item"
                value={newItem.name}
                onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span>Visible</span>
              <Switch 
                checked={newItem.visible} 
                onCheckedChange={(v) => setNewItem((prev) => ({ ...prev, visible: v }))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={!newItem.name || !newItem.image}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 