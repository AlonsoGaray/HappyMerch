/* eslint-disable @typescript-eslint/no-explicit-any */
import { Download, Eye, Star, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useEffect, useState } from "react";
import { deleteTableRowAndFile, getAllClientProducts } from "@/lib/supabase";
import { downloadCmykFromEdgeFn } from "@/lib/PanelUtils";

export function DesignsAdminPanel() {
  const [loadingClientProducts, setLoadingClientProducts] = useState(false);
  const [errorClientProducts, setErrorClientProducts] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [clientProducts, setClientProducts] = useState<any[]>([]);

  useEffect(() => {
    setLoadingClientProducts(true);
    setErrorClientProducts(null);
    getAllClientProducts()
      .then(setClientProducts)
      .catch((e) => setErrorClientProducts(e.message || "Error al cargar los productos"))
      .finally(() => setLoadingClientProducts(false));
  }, []);

  const filteredProducts = clientProducts.filter((prod) => {
    const q = search.toLowerCase();
    return (
      prod.name?.toLowerCase().includes(q) ||
      prod.last_name?.toLowerCase().includes(q) ||
      prod.email?.toLowerCase().includes(q)
    );
  });

  const handleDownload = (url: string) => {
    downloadCmykFromEdgeFn(url).catch(console.error);
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este diseño?")) return;
    try {
      await deleteTableRowAndFile("client_product", "client-products", id, true);
      setClientProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e.message || "Error al eliminar");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diseños de Clientes</CardTitle>
        <CardDescription>
          Lista de todos los productos y diseños enviados por clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o correo..."
            className="border rounded px-3 py-2 w-full max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Extracted rendering logic for client products */}
        {(() => {
          if (loadingClientProducts) {
            return <div className="text-gray-500">Cargando...</div>;
          }
          if (errorClientProducts) {
            return <div className="text-red-500">{errorClientProducts}</div>;
          }
          return (
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
                    <TableCell colSpan={7} className="text-center">
                      No hay diseños enviados aún.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((prod, idx) => (
                    <TableRow key={prod.id || idx}>
                      <TableCell>{prod.name}</TableCell>
                      <TableCell>{prod.last_name}</TableCell>
                      <TableCell className="max-w-24 break-words whitespace-pre-line">
                        {prod.email}
                      </TableCell>
                      <TableCell className="max-w-36">
                        <div className="max-h-36 overflow-y-auto whitespace-pre-line break-words">
                          {prod.comment}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-9">
                        <div className="flex items-center">
                          {prod.rating}
                          <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {prod.design ? (
                          <button
                            type="button"
                            tabIndex={0}
                            aria-label="Ver diseño ampliado"
                            className="p-0 border-none bg-transparent"
                            onClick={() => setViewImage(prod.design)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setViewImage(prod.design);
                              }
                            }}
                          >
                            <img
                              src={prod.design}
                              alt="Diseño"
                              className="w-20 h-20 object-contain border rounded cursor-pointer"
                              style={{ pointerEvents: "none" }}
                            />
                          </button>
                        ) : (
                          <span className="text-gray-400">Sin imagen</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <button
                            title="Ver diseño"
                            onClick={() => handleDownload(prod.design)}
                            className="p-1 hover:bg-gray-200 rounded"
                            disabled={!prod.design}
                          >
                            <Download className="w-5 h-5 text-blue-600" />
                          </button>
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
          );
        })()}
        {/* Popup for viewing image */}
        {viewImage && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewImage(null);
            }}
          >
            <div className="bg-white p-4 rounded shadow-lg max-w-3xl max-h-[90vh] flex flex-col items-center">
              <img
                src={viewImage}
                alt="Diseño ampliado"
                className="max-w-full max-h-[70vh] object-contain"
              />
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
  );
}
