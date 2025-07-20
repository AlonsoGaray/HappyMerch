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

