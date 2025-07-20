import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Plus } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { handleAddItemWithUpload, handleFileChangeGeneric, handleVisibilityToggle } from "@/lib/PanelUtils"
import { getTableRows } from "@/lib/supabase"

const TABLE_NAME="product"

export function ProductAdminPanel() {
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    image: "",
    name: "",
    visible: false,
    file: null as File | null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const data = await getTableRows(TABLE_NAME)
        setProducts(data)
      } catch (error) {
        console.error("Error loading backgrounds:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const deleteProduct = (productId: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const handleAddProduct = async () => {
    await handleAddItemWithUpload({
      bucketName: "products",
      tableName: TABLE_NAME,
      setItems: setProducts,
      newItem: newProduct,
      setNewItem: setNewProduct,
      setShowModal: setShowAddModal,
    })
  }

  const handleFileChange = handleFileChangeGeneric(setNewProduct)

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
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>
      {/* Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="items-center flex flex-col">
              <img src={product.url} alt={product.url} className="h-24 w-24 object-cover rounded mb-2" />
              <p className="font-semibold text-center">{product.name}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Switch checked={product.visible} onCheckedChange={() => handleVisibilityToggle(product.id, TABLE_NAME, products, setProducts)} />
                <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
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
            {newProduct.image && (
              <img src={newProduct.image} alt="preview" className="h-28 w-2h-28 object-cover mx-auto" />
            )}
            <div className="flex items-center space-x-2">
              <span>Nombre</span>
              <Input
                placeholder="Nombre del producto"
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span>Visible</span>
              <Switch checked={newProduct.visible} onCheckedChange={(v) => setNewProduct((prev) => ({ ...prev, visible: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.image}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}