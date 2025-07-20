import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Plus, Check, Upload } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { handleAddItemWithUpload, handleVisibilityToggle, handleDeleteItem, handleNameChange, handleBulkUpload } from "@/lib/PanelUtils"
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
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Items | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [newItem, setNewItem] = useState({
    image: "",
    name: "",
    visible: false,
    file: null as File | null,
  })
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [bulkVisible, setBulkVisible] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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

  const handleDelete = async (itemId: string) => {
    await handleDeleteItem(itemId, tableName, bucketName, () => {})
    
    await refreshTable(tableName)
  }

  const handleDeleteClick = (item: Items) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      await handleDelete(itemToDelete.id)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const handleEditClick = (item: Items) => {
    setEditingItemId(item.id)
    setEditingName(item.name)
  }

  const handleSaveName = async () => {
    if (editingItemId && editingName.trim()) {
      try {
        await handleNameChange(
          editingItemId,
          tableName,
          bucketName,
          items,
          () => {}, // We'll refresh the table instead
          editingName
        )
        await refreshTable(tableName)
        setEditingItemId(null)
        setEditingName("")
      } catch (error) {
        console.error("Error al cambiar el nombre:", error)
        // You could add a toast notification here
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
    setEditingName("")
  }

  const handleAddItem = async () => {
    await handleAddItemWithUpload({
      bucketName,
      tableName,
      setItems: () => {},
      newItem,
      setNewItem,
      setShowModal: setShowAddModal,
    })
    
    await refreshTable(tableName)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Obtener el nombre del archivo sin la extensión
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      setNewItem(prev => ({
        ...prev,
        file,
        image: URL.createObjectURL(file),
        name: fileName // Establecer el nombre del archivo como nombre del item
      }))
    }
  }

  const handleVisibilityChange = async (itemId: string) => {
    await handleVisibilityToggle(itemId, tableName, items, () => {})
    // Refrescar solo la tabla específica después de cambiar visibilidad
    await refreshTable(tableName)
  }

  const handleBulkUploadFiles = async () => {
    if (bulkFiles.length === 0) return
    
    setIsUploading(true)
    try {
      await handleBulkUpload({
        bucketName,
        tableName,
        files: bulkFiles,
        setItems: () => {},
        setShowModal: setShowBulkUploadModal,
        visible: bulkVisible,
      })
      
      await refreshTable(tableName)
      setBulkFiles([])
      setBulkVisible(false)
    } catch (error) {
      console.error("Error en bulk upload:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      setBulkFiles(prev => [...prev, ...files])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      setBulkFiles(prev => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index))
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
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() => setShowBulkUploadModal(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir múltiples
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
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
              {editingItemId === item.id ? (
                <div className="flex items-center space-x-1 mb-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8 text-sm text-center"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName()
                      } else if (e.key === 'Escape') {
                        handleCancelEdit()
                      }
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-green-600"
                    onClick={handleSaveName}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p 
                  className="font-semibold text-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                  onClick={() => handleEditClick(item)}
                >
                  {item.name}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Switch 
                  checked={item.visible} 
                  onCheckedChange={() => handleVisibilityChange(item.id)} 
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditClick(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600" 
                  onClick={() => handleDeleteClick(item)}
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

      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>¿Estás seguro de que quieres eliminar "{itemToDelete?.name}"?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para subida masiva de archivos */}
      <Dialog open={showBulkUploadModal} onOpenChange={setShowBulkUploadModal}>
        <DialogContent className="w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subir múltiples archivos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arrastra y suelta archivos aquí
              </p>
              <p className="text-sm text-gray-500 mb-4">
                O haz clic para seleccionar archivos
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-file-input"
              />
              <label htmlFor="bulk-file-input">
                <Button variant="outline" className="cursor-pointer">
                  Seleccionar archivos
                </Button>
              </label>
            </div>

            {/* File List */}
            {bulkFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Archivos seleccionados ({bulkFiles.length})</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {bulkFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name} 
                          className="h-8 w-8 object-cover rounded"
                        />
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visibility Toggle */}
            <div className="flex items-center space-x-2">
              <span>Visible por defecto</span>
              <Switch 
                checked={bulkVisible} 
                onCheckedChange={setBulkVisible} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkUploadModal(false)
              setBulkFiles([])
              setBulkVisible(false)
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkUploadFiles} 
              disabled={bulkFiles.length === 0 || isUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading ? 'Subiendo...' : `Subir ${bulkFiles.length} archivo${bulkFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 