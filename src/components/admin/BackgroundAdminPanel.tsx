// --- NUEVO COMPONENTE DE ADMINISTRACIÓN DE FONDOS ---
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Plus } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "../ui/input"
import { handleAddItemWithUpload, handleFileChangeGeneric } from "@/lib/PanelUtils"

const initialBackgrounds = [
  {
    id: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGtEO96OE2gC8ehlLkQm18C_xz1x1rMsZ-8e1tGMkn6U83qc1MSfdubXS0VIEDZA_WGo5Zx4X0YUxABBYpzCNsCbEovc2BJhxrRE6_eqwY7rTuaNKABfHixSuuZi4R6fmB3S4fVWkbPQivOUM-zGGAAYOaLEdCK5Zha0HVNxc-aIGuqVgQatdt-QcMZlHNg4lwYNHs-6uUXo7Uu2nKk0b4aAdYZUUhpy7sb4f4HicSk4qrkOxch-FN8wHEsEsOJ9ZsaNNWmnYeJAJR",
    name: "Fondo Abstracto Azul",
    visible: true,
  },
  {
    id: 2,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAo2vW3Ws628A-OefRVJgY5fTUNQBY4rpMQMdIIif9dE8NitFfURiOf7FbkeXni2lmSocIsHBwMGBSpTFbyvRIVA3tk_w2Vl_ISRDGQypmL6GCf8pDKRYZ6tmhj_dQuIrBF9MNkdxA2LgyRDOyMCkw5bza5oGOlPVlO5N5l7ZLm2IHOBg7CRKlrfQVMiKkZibwNKLaQue3bw_j3Ij1ikb2yVh7DudrXdWvhre5eH1rIlyXwbniLjy2hv4I2cC8jUfBEw0CdH3jjTFJ9",
    name: "Textura Papel Vintage",
    visible: false,
  },
  {
    id: 3,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBZmLiiaB9CIMOfO2IyGaZxFcLX3JZyQdHCDgXzFQlswjHLF6q1gKvrRkenxrIPZsIT6UPaE8p7dB_G2xv7l_RokISDWQH4Hd4aNe3GT3BtqU62jcSGX6WHq_p-zRPq_mvw-5EvrrhmGNyFcBjLnehJBJI0zFNgnb_KKtLL257KWrEed-mplchliZ84ehhTrWUQIJmXnvZP6AVq9UW8ln1gNRrldeZKWN5Kv3Yj2AUX0lsbAg6t3A1H3Eb_q-syfMM0--2oLWuTLAGl",
    name: "Gradiente Sunset",
    visible: true,
  },
]

export function BackgroundAdminPanel() {
  const [backgrounds, setBackgrounds] = useState(initialBackgrounds)
  const [backgroundSearchTerm, setBackgroundSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBackground, setNewBackground] = useState({
    image: "",
    name: "",
    visible: false,
    file: null as File | null,
  })

  const filteredBackgrounds = backgrounds.filter((background) =>
    background.name.toLowerCase().includes(backgroundSearchTerm.toLowerCase()),
  )

  const toggleBackgroundVisibility = (backgroundId: number) => {
    setBackgrounds((prev) =>
      prev.map((bg) => (bg.id === backgroundId ? { ...bg, visible: !bg.visible } : bg))
    )
  }

  const deleteBackground = (backgroundId: number) => {
    setBackgrounds((prev) => prev.filter((bg) => bg.id !== backgroundId))
  }

  const handleAddBackground = async () => {
    await handleAddItemWithUpload({
      bucketName: "backgrounds",
      tableName: "background",
      setItems: setBackgrounds,
      newItem: newBackground,
      setNewItem: setNewBackground,
      setShowModal: setShowAddModal,
    })
  }

  const handleFileChange = handleFileChangeGeneric(setNewBackground)

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
              <img src={background.image} alt={background.name} className="h-24 w-24 object-cover rounded mb-2" />
              <p className="font-semibold text-center">{background.name}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Switch checked={background.visible} onCheckedChange={() => toggleBackgroundVisibility(background.id)} />
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