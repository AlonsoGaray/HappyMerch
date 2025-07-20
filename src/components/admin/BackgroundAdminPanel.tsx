import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Plus } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "../ui/input"
import { handleAddItemWithUpload, handleFileChangeGeneric, handleVisibilityToggle } from "@/lib/PanelUtils"
import { getTableRows } from "@/lib/supabase"

const TABLE_NAME="background"

export function BackgroundAdminPanel() {
  const [backgrounds, setBackgrounds] = useState<any[]>([])
  const [backgroundSearchTerm, setBackgroundSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBackground, setNewBackground] = useState({
    image: "",
    name: "",
    visible: false,
    file: null as File | null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        setLoading(true)
        const data = await getTableRows(TABLE_NAME)
        setBackgrounds(data)
      } catch (error) {
        console.error("Error loading backgrounds:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBackgrounds()
  }, [])

  const filteredBackgrounds = backgrounds.filter((background) =>
    background.name.toLowerCase().includes(backgroundSearchTerm.toLowerCase()),
  )

  const deleteBackground = (backgroundId: number) => {
    setBackgrounds((prev) => prev.filter((bg) => bg.id !== backgroundId))
  }

  const handleAddBackground = async () => {
    await handleAddItemWithUpload({
      bucketName: "backgrounds",
      tableName: TABLE_NAME,
      setItems: setBackgrounds,
      newItem: newBackground,
      setNewItem: setNewBackground,
      setShowModal: setShowAddModal,
    })
  }

  const handleFileChange = handleFileChangeGeneric(setNewBackground)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando fondos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <SearchInput
            placeholder="Buscar fondos..."
            value={backgroundSearchTerm}
            onChange={setBackgroundSearchTerm}
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Fondo
        </Button>
      </div>
      {/* Backgrounds Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredBackgrounds.map((background) => (
          <Card key={background.id}>
            <CardContent className="items-center flex flex-col">
              <img src={background.url} alt={background.name} className="h-24 w-24 object-cover rounded mb-2" />
              <p className="font-semibold text-center">{background.name}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Switch checked={background.visible} onCheckedChange={() => handleVisibilityToggle(background.id, TABLE_NAME, backgrounds, setBackgrounds)} />
                <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteBackground(background.id)}><Trash2 className="h-4 w-4" /></Button>
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
            {newBackground.image && (
              <img src={newBackground.image} alt="preview" className="h-28 w-2h-28 object-cover mx-auto" />
            )}
            <div className="flex items-center space-x-2">
              <span>Nombre</span>
              <Input
                placeholder="Nombre del producto"
                value={newBackground.name}
                onChange={(e) => setNewBackground((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span>Visible</span>
              <Switch checked={newBackground.visible} onCheckedChange={(v) => setNewBackground((prev) => ({ ...prev, visible: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button onClick={handleAddBackground} disabled={!newBackground.name || !newBackground.image}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 