import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file to a Supabase storage bucket, generates a public (never-expiring) URL,
 * and saves a record in the specified table with the file name, URL, and visibility.
 *
 * @param bucketName - The name of the Supabase storage bucket
 * @param file - The file to upload (File or Blob)
 * @param fileName - The name to save the file as in the bucket
 * @param tableName - The name of the table to insert the record into
 * @param visible - Boolean value for the 'visible' field
 * @returns The inserted record from the table, or throws an error on failure
 *
 * The table must have at least the columns: 'name' (string), 'url' (string), and 'visible' (boolean).
 * The generated URL is public and does not expire.
 */
export async function uploadFileToBucket({
  bucketName,
  file,
  fileName,
  tableName,
  visible
}: {
  bucketName: string;
  file: File | Blob;
  fileName: string;
  tableName: string;
  visible: boolean;
}) {
  // 1. Upload to bucket
  const { data: _uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, { upsert: true });
  if (uploadError) throw uploadError;

  // 2. Url without expiration
  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  const url = publicUrlData?.publicUrl;
  if (!url) throw new Error('No se pudo obtener la URL pública del archivo');

  // 3. Save in table
  const { data: insertData, error: insertError } = await supabase
    .from(tableName)
    .insert([{ name: fileName, url, visible }])
    .select()
    .single();
  if (insertError) throw insertError;

  return insertData;
}

/**
 * Retrieves all rows from a specified table in Supabase.
 *
 * @param tableName - The name of the table to query
 * @returns An array of all rows from the table, or throws an error on failure
 */
export async function getTableRows<T = any>(tableName: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) throw error;
  
  return data || [];
}

/**
 * Updates the 'name' and/or 'visible' fields of a row in a specified table.
 *
 * @param tableName - The name of the table to update
 * @param id - The ID of the row to update
 * @param updates - Object containing the fields to update (name and/or visible)
 * @returns The updated row, or throws an error on failure
 */
export async function updateTableRow<T = any>(
  tableName: string,
  id: string,
  updates: {
    name?: string;
    visible?: boolean;
  }
): Promise<T> {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
}

/**
 * Deletes a row from a table and the corresponding file from a storage bucket.
 *
 * @param tableName - The name of the table to delete the row from
 * @param bucketName - The name of the storage bucket to delete the file from
 * @param id - The ID of the row to delete
 * @returns The deleted row data, or throws an error on failure
 */
export async function deleteTableRowAndFile<T = any>(
  tableName: string,
  bucketName: string,
  id: string
): Promise<T> {
  // 1. First, get the row data to extract the file name
  const { data: rowData, error: fetchError } = await supabase
    .from(tableName)
    .select('name')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;
  if (!rowData?.name) throw new Error('No se encontró el nombre del archivo en la fila');

  // 2. Delete the file from storage bucket
  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .remove([rowData.name]);
  
  if (storageError) throw storageError;

  // 3. Delete the row from the table
  const { data: deletedRow, error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id)
    .select()
    .single();
  
  if (deleteError) throw deleteError;

  return deletedRow;
}

/**
 * Renames a file in a storage bucket and updates the corresponding database record.
 *
 * @param bucketName - The name of the storage bucket
 * @param tableName - The name of the table containing the file record
 * @param id - The ID of the row to update
 * @param oldName - The current file name in the bucket
 * @param newName - The new file name for the bucket
 * @returns The updated row data, or throws an error on failure
 */
export async function renameFileInBucket<T = any>(
  bucketName: string,
  tableName: string,
  id: string,
  oldName: string,
  newName: string
): Promise<T> {
  // 1. Move/rename the file directly in the bucket
  const { data: _moveData, error: moveError } = await supabase.storage
    .from(bucketName)
    .move(oldName, newName);
  
  if (moveError) throw moveError;

  // 2. Get the new public URL
  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(newName);
  const newUrl = publicUrlData?.publicUrl;
  if (!newUrl) throw new Error('No se pudo obtener la nueva URL pública del archivo');

  // 3. Update the database record with new name and URL
  const { data: updateData, error: updateError } = await supabase
    .from(tableName)
    .update({ name: newName, url: newUrl })
    .eq('id', id)
    .select()
    .single();
  
  if (updateError) throw updateError;

  return updateData;
}

