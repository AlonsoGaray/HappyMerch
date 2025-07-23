import { useState } from "react"
import {
  Package,
  Palette,
  Settings,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GenericAdminPanel } from "@/components/admin/GenericAdminPanel"
import { ConfigsAdminPanel } from "@/components/admin/ConfigsAdminPanel"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useEffect } from "react"
import { deleteTableRowAndFile, getAllClientProducts } from "@/lib/supabase"
import { signOut } from "@/lib/auth"
import { useNavigate } from "react-router-dom"

const sidebarItems = [
  { id: "diseños_clientes", label: "Diseños de Clientes", icon: Palette },
  { id: "productos", label: "Productos", icon: Package },
  { id: "elementos", label: "Elementos", icon: Palette },
  { id: "fondos", label: "Fondos", icon: BarChart3 },
  { id: "personalizacion", label: "Personalización", icon: Settings },
  { id: "usuarios", label: "Usuarios", icon: Users },
]

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("diseños_clientes")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [clientProducts, setClientProducts] = useState<any[]>([])
  const [loadingClientProducts, setLoadingClientProducts] = useState(false)
  const [errorClientProducts, setErrorClientProducts] = useState<string | null>(null)
  const [search, setSearch] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);

  useEffect(() => {
    if (activeSection === "diseños_clientes") {
      setLoadingClientProducts(true)
      setErrorClientProducts(null)
      getAllClientProducts()
        .then(setClientProducts)
        .catch(e => setErrorClientProducts(e.message || "Error al cargar los productos"))
        .finally(() => setLoadingClientProducts(false))
    }
  }, [activeSection])

  // Filtered products
  const filteredProducts = clientProducts.filter(prod => {
    const q = search.toLowerCase();
    return (
      prod.name?.toLowerCase().includes(q) ||
      prod.last_name?.toLowerCase().includes(q) ||
      prod.email?.toLowerCase().includes(q)
    );
  });

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este diseño?")) return;
    try {
      await deleteTableRowAndFile("client_product", "client-products", id);
      setClientProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e.message || "Error al eliminar");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div
          className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white shadow-lg border-r flex-shrink-0 transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b">
            {!sidebarCollapsed && <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>}
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="ml-auto">
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 py-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors relative group ${
                    activeSection === item.id ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : "text-gray-600"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800 capitalize">
                {activeSection === "diseños_clientes"
                    ? "Gestión de Clientes"
                    : activeSection === "elementos"
                      ? "Gestión de Elementos"
                      : activeSection === "fondos"
                        ? "Gestión de Fondos"
                        : activeSection === "personalizacion"
                          ? "Personalización de Marca"
                          : activeSection === "productos"
                            ? "Diseños de Productos"
                            : activeSection}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className={`bg-blue-400 rounded-md px-4 py-2 text-base hover:bg-blue-700 transition cursor-pointer`}
                onClick={() => window.open('/edit', '_blank')}
              >
                Preview Edit
              </button>
              <button
                className={`bg-red-600 rounded-md px-4 py-2 text-base hover:bg-red-700 transition cursor-pointer`}
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {activeSection === "productos" && (
              <GenericAdminPanel
                tableName="product"
                bucketName="products"
                searchPlaceholder="Buscar productos..."
                addButtonText="Agregar Producto"
                modalTitle="Agregar Producto"
                loadingText="Cargando productos..."
              />
            )}

            {activeSection === "elementos" && (
              <GenericAdminPanel
                tableName="element"
                bucketName="elements"
                searchPlaceholder="Buscar elementos..."
                addButtonText="Agregar Elemento"
                modalTitle="Agregar Elemento"
                loadingText="Cargando elementos..."
              />
            )}

            {activeSection === "fondos" && (
              <GenericAdminPanel
                tableName="background"
                bucketName="backgrounds"
                searchPlaceholder="Buscar fondos..."
                addButtonText="Agregar Fondo"
                modalTitle="Agregar Fondo"
                loadingText="Cargando fondos..."
              />
            )}

            {activeSection === "personalizacion" && (
              <ConfigsAdminPanel />
            )}

            {activeSection === "usuarios" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>Administra los usuarios registrados en tu plataforma</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Funcionalidad de gestión de usuarios en desarrollo...</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "diseños_clientes" && (
              <Card>
                <CardHeader>
                  <CardTitle>Diseños de Clientes</CardTitle>
                  <CardDescription>Lista de todos los productos y diseños enviados por clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Buscar por nombre, apellido o correo..."
                      className="border rounded px-3 py-2 w-full max-w-md"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  {loadingClientProducts ? (
                    <div className="text-gray-500">Cargando...</div>
                  ) : errorClientProducts ? (
                    <div className="text-red-500">{errorClientProducts}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Apellido</TableHead>
                          <TableHead className="max-w-24">Email</TableHead>
                          <TableHead>Comentario</TableHead>
                          <TableHead className="max-w-9">Rating</TableHead>
                          <TableHead>Diseño</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">No hay diseños enviados aún.</TableCell>
                          </TableRow>
                        ) : (
                          filteredProducts.map((prod, idx) => (
                            <TableRow key={prod.id || idx}>
                              <TableCell>{prod.name}</TableCell>
                              <TableCell>{prod.last_name}</TableCell>
                              <TableCell className="max-w-24 break-words whitespace-pre-line">{prod.email}</TableCell>
                              <TableCell className="max-w-36">
                                <div className="max-h-36 overflow-y-auto whitespace-pre-line break-words">
                                  {prod.comment}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-9">
                                <div className="flex items-center">
                                  {prod.rating}<Star className="w-4 h-4 text-yellow-300 fill-yellow-300"/>
                                </div>
                              </TableCell>
                              <TableCell>
                                {prod.design ? (
                                  <img
                                    src={prod.design}
                                    alt="Diseño"
                                    className="w-20 h-20 object-contain border rounded cursor-pointer"
                                    onClick={() => setViewImage(prod.design)}
                                  />
                                ) : (
                                  <span className="text-gray-400">Sin imagen</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <button
                                    title="Ver diseño"
                                    onClick={() => setViewImage(prod.design)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                    disabled={!prod.design}
                                  >
                                    <Eye className="w-5 h-5 text-blue-600" />
                                  </button>
                                  <button
                                    title="Eliminar"
                                    onClick={() => handleDelete(prod.id)}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                  {/* Popup for viewing image */}
                  {viewImage && (
                    <div
                      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10"
                      onClick={e => {
                        // Solo cerrar si el click es en el fondo, no en el modal
                        if (e.target === e.currentTarget) setViewImage(null);
                      }}
                    >
                      <div className="bg-white p-4 rounded shadow-lg max-w-3xl max-h-[90vh] flex flex-col items-center">
                        <img src={viewImage} alt="Diseño ampliado" className="max-w-full max-h-[70vh] object-contain" />
                        <button
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => setViewImage(null)}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
  )
}
