import { useState } from "react";
import {
  Package,
  Palette,
  Settings,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GenericAdminPanel } from "@/components/admin/GenericAdminPanel";
import { ConfigsAdminPanel } from "@/components/admin/ConfigsAdminPanel";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { DesignsAdminPanel } from "@/components/admin/DesignsAdminPanel";

const sidebarItems = [
  { id: "diseños_clientes", label: "Diseños de Clientes", icon: Palette },
  { id: "productos", label: "Productos", icon: Package },
  { id: "elementos", label: "Elementos", icon: Palette },
  { id: "fondos", label: "Fondos", icon: BarChart3 },
  { id: "personalizacion", label: "Personalización", icon: Settings },
  { id: "usuarios", label: "Usuarios", icon: Users },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("diseños_clientes");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Extract header title logic into a variable
  let headerTitle = "";
  switch (activeSection) {
    case "diseños_clientes":
      headerTitle = "Gestión de Clientes";
      break;
    case "elementos":
      headerTitle = "Gestión de Elementos";
      break;
    case "fondos":
      headerTitle = "Gestión de Fondos";
      break;
    case "personalizacion":
      headerTitle = "Personalización de Marca";
      break;
    case "productos":
      headerTitle = "Diseños de Productos";
      break;
    default:
      headerTitle = activeSection;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-white shadow-lg border-r flex-shrink-0 transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          {!sidebarCollapsed && <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 py-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors relative group ${
                  activeSection === item.id
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600"
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
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">{headerTitle}</h2>
          </div>

          <div className="flex items-center space-x-4">
            <button
              className={`bg-blue-400 rounded-md px-4 py-2 text-base hover:bg-blue-700 transition cursor-pointer`}
              onClick={() => window.open("/edit", "_blank")}
            >
              Preview Edit
            </button>
            <button
              className={`bg-red-600 rounded-md px-4 py-2 text-base hover:bg-red-700 transition cursor-pointer`}
              onClick={async () => {
                await signOut();
                navigate("/");
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

          {activeSection === "personalizacion" && <ConfigsAdminPanel />}

          {activeSection === "usuarios" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>
                    Administra los usuarios registrados en tu plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Funcionalidad de gestión de usuarios en desarrollo...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "diseños_clientes" && <DesignsAdminPanel />}
        </main>
      </div>
    </div>
  );
}
