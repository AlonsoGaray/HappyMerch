export interface CanvasItem {
    id: number;
    src: string;
    x: number;
    y: number;
  }
  
export type UserRole = 'admin' | 'editor' | 'user';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
}
  