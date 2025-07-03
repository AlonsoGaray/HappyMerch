const NavBar = () => (
  <nav className={`flex w-full items-center justify-between bg-white shadow px-8 h-14`}>
    <div className="text-2xl font-bold text-gray-800 tracking-wide">HappyMerch</div>
    <div className="flex items-center space-x-4">
      <button className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition">Nuevo</button>
      <button className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition">Guardar</button>
      <button className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition">Producto</button>
    </div>
  </nav>
);

export default NavBar; 