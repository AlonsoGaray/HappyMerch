import { useState } from "react"
import {
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  Users,
  BarChart3,
  Eye,
  Upload,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GenericAdminPanel } from "@/components/admin/GenericAdminPanel"
import { AdminDataProvider } from "@/contexts/AdminDataContext"
import { Switch } from "@/components/ui/switch"

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "productos", label: "Productos", icon: Package },
  { id: "elementos", label: "Elementos", icon: Palette },
  { id: "fondos", label: "Fondos", icon: BarChart3 },
  { id: "personalizacion", label: "Personalización", icon: Settings },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "configuracion", label: "Configuración", icon: Settings },
]

const stats = [
  { title: "Total Productos", value: "156", change: "+12%", icon: Package },
  { title: "Productos Activos", value: "89", change: "+5%", icon: Eye },
  { title: "Ventas del Mes", value: "$12,450", change: "+18%", icon: BarChart3 },
  { title: "Usuarios Registrados", value: "2,341", change: "+7%", icon: Users },
]

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <AdminDataProvider>
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
                {activeSection === "dashboard"
                  ? "Dashboard"
                  : activeSection === "productos"
                    ? "Gestión de Productos"
                    : activeSection === "elementos"
                      ? "Gestión de Elementos"
                      : activeSection === "fondos"
                        ? "Gestión de Fondos"
                        : activeSection === "personalizacion"
                          ? "Personalización de Marca"
                          : activeSection}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:block">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                              <p className="text-sm text-green-600">{stat.change}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm">Producto "Tote Bag Premium" actualizado</p>
                        <span className="text-xs text-gray-500 ml-auto">Hace 2 horas</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm">Nuevo usuario registrado</p>
                        <span className="text-xs text-gray-500 ml-auto">Hace 4 horas</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm">Configuración de colores modificada</p>
                        <span className="text-xs text-gray-500 ml-auto">Hace 1 día</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
              <div className="space-y-6">
                <Tabs defaultValue="branding" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="branding">Marca</TabsTrigger>
                    <TabsTrigger value="colors">Colores</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                  </TabsList>

                  <TabsContent value="branding" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Logotipo de la Marca</CardTitle>
                        <CardDescription>Sube y gestiona el logotipo principal de tu tienda</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center space-x-6">
                          <div className="flex-shrink-0">
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH9qs8Kuu1e5Ewf9MD1OdTMFeMsbUF54n6-Z272xTVgVNfkivgr46_kyKGcKjmJYF_XUtTDXPMCciT84uAJUbtXXWGgRtmwW12YC7eLS9pBIYJo-evK8hPs7Dq81xCwKHB0DjF32YIUaeuQ_k1M8iXTHsb5k9-HVDG0EpL"
                              alt="Logotipo de la Marca"
                              className="h-24 w-24 rounded-lg object-cover"
                            />
                          </div>
                          <div>
                            <Button>
                              <Upload className="mr-2 h-4 w-4" />
                              Cambiar Logotipo
                            </Button>
                            <p className="text-sm text-gray-500 mt-2">
                              Formatos soportados: PNG, JPG, SVG. Tamaño máximo: 2MB
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="colors" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Paleta de Colores</CardTitle>
                        <CardDescription>Personaliza los colores principales de tu tienda</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color Primario
                            </label>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-600 rounded border"></div>
                              <input
                                type="color"
                                defaultValue="#2563eb"
                                className="w-12 h-8 border rounded cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color Secundario
                            </label>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gray-600 rounded border"></div>
                              <input
                                type="color"
                                defaultValue="#4b5563"
                                className="w-12 h-8 border rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="layout" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configuración de Layout</CardTitle>
                        <CardDescription>Ajusta la disposición y comportamiento de tu tienda</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Mostrar Barra de Navegación</p>
                              <p className="text-sm text-gray-500">Mostrar u ocultar la barra de navegación principal</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Modo Oscuro</p>
                              <p className="text-sm text-gray-500">Habilitar el modo oscuro para los usuarios</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
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

            {activeSection === "analytics" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>Métricas y estadísticas de tu tienda</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Panel de analytics en desarrollo...</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "configuracion" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración General</CardTitle>
                    <CardDescription>Ajustes generales del sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Configuraciones generales en desarrollo...</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </AdminDataProvider>
  )
}
