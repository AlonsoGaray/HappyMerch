import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Plus } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "../ui/input"
import { handleAddItemWithUpload, handleFileChangeGeneric, handleVisibilityToggle } from "@/lib/PanelUtils"
import { getTableRows } from "@/lib/supabase"

const TABLE_NAME="element"

export function ElementAdminPanel() {
  const [elements, setElements] = useState<any[]>([])
  const [elementSearchTerm, setElementSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newElement, setNewElement] = useState({
    image: "",
    name: "",
    visible: false,
    file: null as File | null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadElements = async () => {
      try {
        setLoading(true)
        const data = await getTableRows(TABLE_NAME)
        setElements(data)
      } catch (error) {
        console.error("Error loading backgrounds:", error)
      } finally {
        setLoading(false)
      }
    }

    loadElements()
  }, [])
  const filteredElements = elements.filter((element) =>
    element.name.toLowerCase().includes(elementSearchTerm.toLowerCase()),
  )

  const deleteElement = (elementId: number) => {
    setElements((prev) => prev.filter((el) => el.id !== elementId))
  }

  const handleAddElement = async () => {
    await handleAddItemWithUpload({
      bucketName: "elements",
      tableName: TABLE_NAME,
      setItems: setElements,
      newItem: newElement,
      setNewItem: setNewElement,
      setShowModal: setShowAddModal,
    })
  }

  const handleFileChange = handleFileChangeGeneric(setNewElement)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <SearchInput
            placeholder="Buscar elementos..."
            value={elementSearchTerm}
            onChange={setElementSearchTerm}
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Elemento
        </Button>
      </div>
      {/* Elements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredElements.map((element) => (
          <Card key={element.id}>
            <CardContent className="items-center flex flex-col">
              <img src={element.image} alt={element.name} className="h-24 w-24 object-cover rounded mb-2" />
              <p className="font-semibold text-center">{element.name}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Switch checked={element.visible} onCheckedChange={() => handleVisibilityToggle(element.id, TABLE_NAME, elements, setElements)} />
                <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteElement(element.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para agregar producto */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="w-[450px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {newElement.image && (
              <img src={newElement.image} alt="preview" className="h-28 w-2h-28 object-cover mx-auto" />
            )}
            <div className="flex items-center space-x-2">
              <span>Nombre</span>
              <Input
                placeholder="Nombre del producto"
                value={newElement.name}
                onChange={(e) => setNewElement((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span>Visible</span>
              <Switch checked={newElement.visible} onCheckedChange={(v) => setNewElement((prev) => ({ ...prev, visible: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button onClick={handleAddElement} disabled={!newElement.name || !newElement.image}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}