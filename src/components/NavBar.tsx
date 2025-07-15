import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/auth";

const NavBar = () => {
  const navigate = useNavigate();
  
  return (
  <nav className="flex w-full items-center justify-between bg-white shadow px-8 h-14">
    <img className="h-fit max-h-10" src="/Logo.svg" alt="logo" />
    <div className="flex items-center space-x-4">
      <button className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition">Nuevo</button>
      <button className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition">Guardar</button>
      <button className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition">Producto</button>
      
      <button
        className="bg-red-600 rounded-md px-4 py-2 text-base hover:bg-red-700 transition"
        onClick={async () => {
          await signOut();
          navigate('/');
        }}
      >
        Cerrar sesión
      </button>
    </div>
  </nav>
)};

export default NavBar; 