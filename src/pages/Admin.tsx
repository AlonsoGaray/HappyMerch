import { useNavigate } from 'react-router-dom';
import { signOut } from '../lib/auth';

export default function AdminPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Page</h1>
        <p className="text-gray-300 mb-4">Bienvenido, administrador.</p>
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          onClick={() => navigate('/edit')}
        >
          Ir a Editor
        </button>
        <button
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors mt-4"
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
} 