import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Plus, Check, Upload } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  handleAddItemWithUpload,
  handleVisibilityToggle,
  handleDeleteItem,
  handleNameChange,
  handleBulkUpload,
} from "@/lib/PanelUtils";
import { updateTableRow } from "@/lib/supabase";
import { useGlobalData } from "@/contexts/AdminDataContext";

interface GenericAdminPanelProps {
  tableName: string;
  bucketName: string;
  searchPlaceholder: string;
  addButtonText: string;
  modalTitle: string;
  loadingText: string;
}

interface Items {
  id: string;
  name: string;
  url: string;
  visible: boolean;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
}

export function GenericAdminPanel({
  tableName,
  bucketName,
  searchPlaceholder,
  addButtonText,
  modalTitle,
  loadingText,
}: GenericAdminPanelProps) {
  const { data, refreshTable, updateItem } = useGlobalData();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCanvasEditModal, setShowCanvasEditModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Items | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [canvasEditData, setCanvasEditData] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  });
  const [newItem, setNewItem] = useState({
    image: "",
    name: "",
    visible: false,
    file: null as File | null,
  });
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [bulkVisible, setBulkVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savingCanvas, setSavingCanvas] = useState(false);

  // Obtener los datos correspondientes según la tabla
  const getTableData = () => {
    switch (tableName) {
      case "product":
        return data.products;
      case "element":
        return data.elements;
      case "background":
        return data.backgrounds;
      default:
        return [];
    }
  };

  const items = getTableData() as Items[];
  const loading = data.loading;

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (itemId: string) => {
    await handleDeleteItem(itemId, tableName, bucketName, () => {});

    await refreshTable(tableName);
  };

  const handleDeleteClick = (item: Items) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await handleDelete(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleEditClick = (item: Items) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
  };

  const handleCanvasEditClick = (item: Items) => {
    setCanvasEditData({
      width: item.width || 0,
      height: item.height || 0,
      top: item.top || 0,
      left: item.left || 0,
    });
    setEditingItemId(item.id);
    setShowCanvasEditModal(true);
  };

  const handleSaveCanvas = async () => {
    if (!editingItemId) return;
    
    setSavingCanvas(true);
    try {
      // Actualizar en la base de datos
      await updateTableRow(tableName, editingItemId, canvasEditData);
      // Actualizar el contexto local
      updateItem(tableName, editingItemId, canvasEditData);
      setShowCanvasEditModal(false);
      setEditingItemId(null);
      setCanvasEditData({ width: 0, height: 0, top: 0, left: 0 });
    } catch (error) {
      console.error("Error al guardar el canvas:", error);
    } finally {
      setSavingCanvas(false);
    }
  };

  const handleSaveName = async () => {
    if (editingItemId && editingName.trim()) {
      try {
        await handleNameChange(
          editingItemId,
          tableName,
          bucketName,
          items,
          (setItemsCallback) => {
            // Update the local data without refreshing the entire table
            setItemsCallback(items);
            // Update the context directly
            updateItem(tableName, editingItemId, { name: editingName.trim() });
          },
          editingName
        );
        setEditingItemId(null);
        setEditingName("");
      } catch (error) {
        console.error("Error al cambiar el nombre:", error);
        // Refresh table only on error to ensure consistency
        await refreshTable(tableName);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingName("");
  };

  const handleAddItem = async () => {
    await handleAddItemWithUpload({
      bucketName,
      tableName,
      setItems: () => {},
      newItem,
      setNewItem,
      setShowModal: setShowAddModal,
    });

    await refreshTable(tableName);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Obtener el nombre del archivo sin la extensión
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setNewItem((prev) => ({
        ...prev,
        file,
        image: URL.createObjectURL(file),
        name: fileName, // Establecer el nombre del archivo como nombre del item
      }));
    }
  };

  const handleVisibilityChange = async (itemId: string) => {
    try {
      const item = items.find((item) => item.id === itemId);
      if (!item) return;

      const newVisible = !item.visible;

      await handleVisibilityToggle(itemId, tableName, items, (setItemsCallback) => {
        // Update the local data without refreshing the entire table
        setItemsCallback(items);
        // Update the context directly
        updateItem(tableName, itemId, { visible: newVisible });
      });
    } catch (error) {
      console.error("Error al cambiar visibilidad:", error);
      // Refresh table only on error to ensure consistency
      await refreshTable(tableName);
    }
  };

  const handleBulkUploadFiles = async () => {
    if (bulkFiles.length === 0) return;

    setIsUploading(true);
    try {
      await handleBulkUpload({
        bucketName,
        tableName,
        files: bulkFiles,
        setItems: () => {},
        setShowModal: setShowBulkUploadModal,
        visible: bulkVisible,
      });

      await refreshTable(tableName);
      setBulkFiles([]);
      setBulkVisible(false);
    } catch (error) {
      console.error("Error en bulk upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));

    if (files.length > 0) {
      setBulkFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"));

    if (files.length > 0) {
      setBulkFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
          <Button
            className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>{loadingText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="items-center flex flex-col">
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-28 w-2h-28 object-cover rounded mb-2"
                />
                {editingName === item.name ? (
                  <div className="flex items-center space-x-1 mb-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 text-sm text-center"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveName();
                        } else if (e.key === "Escape") {
                          handleCancelEdit();
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
                  {tableName === "product" ? (
                    <Button variant="ghost" size="sm" onClick={() => handleCanvasEditClick(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
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
        </div>
      )}

      {/* Modal para agregar item */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="w-[450px]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {newItem.image && (
              <img
                src={newItem.image}
                alt="preview"
                className="h-28 w-2h-28 object-cover mx-auto"
              />
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
            <Button onClick={handleAddItem} disabled={!newItem.name || !newItem.image}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar canvas de productos */}
      {tableName === "product" && (
        <Dialog open={showCanvasEditModal} onOpenChange={setShowCanvasEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Canvas del Producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Vista previa visual */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Vista Previa del Canvas</h4>
                {(() => {
                  const currentProduct = items.find(item => item.id === editingItemId);
                  const productWidth = 600;
                  const productHeight = 600;
                  
                  const scaleX = 500 / productWidth;
                  const scaleY = 400 / productHeight;
                  const scale = Math.min(scaleX, scaleY, 1);
                  
                  const displayWidth = productWidth * scale;
                  const displayHeight = productHeight * scale;
                  
                  return (
                    <div className="space-y-3">
                      <div className="relative bg-white border rounded-lg overflow-hidden mx-auto flex items-center justify-center" 
                           style={{ width: '400px', height: '400px' }}>
                        {/* Contenedor del producto escalado */}
                        <div 
                          className="relative"
                          style={{ 
                            width: `${displayWidth}px`, 
                            height: `${displayHeight}px` 
                          }}
                        >
                          {/* Imagen del producto de fondo */}
                          <img
                            src={currentProduct?.url || ''}
                            alt="Producto"
                            className="w-full h-full object-contain"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                          />
                          {/* Canvas overlay escalado */}
                          <div
                            className="absolute border-2 border-red-500 border-dashed bg-red-100 bg-opacity-20"
                            style={{
                              width: `${canvasEditData.width * scale}px`,
                              height: `${canvasEditData.height * scale}px`,
                              left: `${canvasEditData.left * scale}px`,
                              top: `${canvasEditData.top * scale}px`,
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-red-600 text-xs font-medium">
                              Área editable
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        <p>Dimensiones del producto: {productWidth} × {productHeight}px</p>
                        <p>Escala de vista previa: {Math.round(scale * 100)}%</p>
                      </div>
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-2 text-center">
                  El rectángulo rojo muestra el área donde los usuarios podrán editar
                </p>
              </div>

              {/* Controles de edición */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="canvas-width">Ancho del Canvas</Label>
                  <Input
                    id="canvas-width"
                    type="number"
                    value={canvasEditData.width}
                    onChange={(e) => setCanvasEditData(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    placeholder="Ancho"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canvas-height">Alto del Canvas</Label>
                  <Input
                    id="canvas-height"
                    type="number"
                    value={canvasEditData.height}
                    onChange={(e) => setCanvasEditData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    placeholder="Alto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canvas-left">Posición X (Left)</Label>
                  <Input
                    id="canvas-left"
                    type="number"
                    value={canvasEditData.left}
                    onChange={(e) => setCanvasEditData(prev => ({ ...prev, left: parseInt(e.target.value) || 0 }))}
                    placeholder="Posición X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canvas-top">Posición Y (Top)</Label>
                  <Input
                    id="canvas-top"
                    type="number"
                    value={canvasEditData.top}
                    onChange={(e) => setCanvasEditData(prev => ({ ...prev, top: parseInt(e.target.value) || 0 }))}
                    placeholder="Posición Y"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCanvasEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCanvas} disabled={savingCanvas}>
                {savingCanvas ? "Guardando..." : "Guardar Canvas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
            <Button variant="destructive" onClick={confirmDelete}>
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
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arrastra y suelta archivos aquí
              </p>
              <p className="text-sm text-gray-500 mb-4">O haz clic para seleccionar archivos</p>
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
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
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
              <Switch checked={bulkVisible} onCheckedChange={setBulkVisible} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkUploadModal(false);
                setBulkFiles([]);
                setBulkVisible(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkUploadFiles}
              disabled={bulkFiles.length === 0 || isUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading
                ? "Subiendo..."
                : `Subir ${bulkFiles.length} archivo${bulkFiles.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
