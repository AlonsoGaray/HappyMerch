import { uploadFileToBucket, updateTableRow } from "@/lib/supabase"

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