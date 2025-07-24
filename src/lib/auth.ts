import { supabase } from "./supabase";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserRole(authId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user')
    .select('role')
    .eq('auth_id', authId)
    .single();
  if (error) throw error;
  return data?.role || null;
} 

/**
 * Crea un usuario autoconfirmado en Supabase Auth y lo agrega a la tabla 'user'.
 * @param email - Correo del usuario
 * @param password - Contraseña del usuario
 * @param role - Rol del usuario ('editor' o 'admin')
 * @returns El usuario creado (objeto con id, email, role)
 */
export async function createAutoconfirmedUser(email: string, password: string, role: 'editor' | 'admin') {
  // 1. Crear usuario en Auth (autoconfirmado)
  // Requiere service_role key, pero si el proyecto tiene habilitado el método admin, se puede usar:
  // @ts-ignore
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('No se pudo crear el usuario en Auth');

  // 2. Insertar en la tabla 'user'
  const { error: insertError } = await supabase
    .from('user')
    .insert({ auth_id: user.id, email, role })
    .select();
  if (insertError) throw insertError;

  return { id: user.id, email, role };
} 