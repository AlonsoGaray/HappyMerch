import { uploadFileToBucket, updateTableRow, deleteTableRowAndFile, renameFileInBucket, uploadFilesInBulk } from "@/lib/supabase"

export function handleFileChangeGeneric(setNewItem: (cb: (prev: any) => any) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewItem((prev: any) => ({ ...prev, file }))
      const reader = new FileReader()
      reader.onload = (ev) => {
        setNewItem((prev: any) => ({ ...prev, image: ev.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }
}

export async function handleAddItemWithUpload({
  bucketName,
  tableName,
  setItems,
  newItem,
  setNewItem,
  setShowModal,
  requiredFields = ["name", "file"],
}: {
  bucketName: string,
  tableName: string,
  setItems: (cb: (prev: any[]) => any[]) => void,
  newItem: any,
  setNewItem: (item: any) => void,
  setShowModal: (open: boolean) => void,
  requiredFields?: string[],
}) {
  for (const field of requiredFields) {
    if (!newItem[field]) return
  }
  try {
    const file = newItem.file
    const record = await uploadFileToBucket({
      bucketName,
      file,
      fileName: newItem.name ?? file.name,
      tableName,
      visible: newItem.visible ?? false,
    })
    setItems((prev) => [...prev, record])
    setShowModal(false)
    setNewItem({ image: "", name: "", visible: false, file: null })
  } catch (err) {
    // Puedes agregar manejo de error aquí
    alert("Error al subir el archivo o guardar el registro")
    console.error(err)
  }
}

export async function handleBulkUpload({
  bucketName,
  tableName,
  files,
  setItems,
  setShowModal,
  visible = false,
}: {
  bucketName: string,
  tableName: string,
  files: File[],
  setItems: (cb: (prev: any[]) => any[]) => void,
  setShowModal: (open: boolean) => void,
  visible?: boolean,
}) {
  if (files.length === 0) return
  
  try {
    const records = await uploadFilesInBulk({
      bucketName,
      files,
      tableName,
      visible,
    })
    
    setItems((prev) => [...prev, ...records])
    setShowModal(false)
  } catch (err) {
    // Puedes agregar manejo de error aquí
    alert("Error al subir los archivos o guardar los registros")
    console.error(err)
  }
}

export const handleVisibilityToggle = async <T extends { id: string; visible: boolean }>(
  itemId: string,
  tableName: string,
  items: T[],
  setItems: (cb: (prev: T[]) => T[]) => void
) => {
  try {
    const item = items.find(item => item.id === String(itemId))
    if (!item) return
    
    const newVisible = !item.visible
    // Update in database
    await updateTableRow(tableName, itemId, { visible: newVisible })
    
    // Update local state
    setItems(prev => prev.map(item => 
      item.id === String(itemId) ? { ...item, visible: newVisible } : item
    ))
  } catch (error) {
    console.error(`Error updating ${tableName} visibility:`, error)
  }
}

export const handleNameChange = async <T extends { id: string; name: string }>(
  itemId: string,
  tableName: string,
  bucketName: string,
  items: T[],
  setItems: (cb: (prev: T[]) => T[]) => void,
  newName: string
) => {
  try {
    const item = items.find(item => item.id === String(itemId))
    if (!item) return
    
    if (!newName.trim()) {
      console.error("El nombre no puede estar vacío")
      return
    }

    const oldName = item.name
    const trimmedNewName = newName.trim()
    
    // If the name hasn't changed, don't do anything
    if (oldName === trimmedNewName) return
    
    // Update in database
    await updateTableRow(tableName, itemId, { name: trimmedNewName })
    
    // Rename file in bucket
    await renameFileInBucket(
      bucketName,
      tableName,
      itemId,
      oldName,
      trimmedNewName
    )
    
    // Update local state
    setItems(prev => prev.map(item => 
      item.id === String(itemId) ? { ...item, name: trimmedNewName } : item
    ))
  } catch (error) {
    console.error(`Error updating ${tableName} name:`, error)
  }
}

export const handleDeleteItem = async <T extends { id: string; name: string }>(
  itemId: string,
  tableName: string,
  bucketName: string,
  setItems: (cb: (prev: T[]) => T[]) => void
) => {
  try {
    // Delete from database and storage
    await deleteTableRowAndFile(tableName, bucketName, itemId)
    
    // Update local state
    setItems(prev => prev.filter(item => item.id !== String(itemId)))
  } catch (error) {
    console.error(`Error deleting ${tableName} item:`, error)
    alert("Error al eliminar el elemento")
  }
}

