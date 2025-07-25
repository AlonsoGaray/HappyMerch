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
  try {
    const res = await fetch('https://fuhdflljcbjcnhppccyr.supabase.co/functions/v1/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
      const errorText = await res.text(); // puedes parsear .json() si sabes que viene JSON
      console.error('Error:', errorText);
      alert(errorText);
      return;
    }

    const data = await res.json();
    console.log('Usuario creado:', data);
    alert('✅ Usuario creado correctamente');
  } catch (err) {
    console.error('Error de red o inesperado:', err);
    alert('❌ Error inesperado al crear usuario');
  }
} 