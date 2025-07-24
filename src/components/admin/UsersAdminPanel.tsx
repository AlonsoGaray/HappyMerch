import { Edit, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { SearchInput } from "../ui/search-input";
import { supabase } from "@/lib/supabase";
import { getAllTableRows } from "@/lib/supabase";

interface User {
  id: string
  email: string
  role: string
  brand_name: string
}

const roles = ["Admin", "Editor"]

export function UsersAdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: "", role: "", password: "" })
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBrandValue, setEditBrandValue] = useState<string>("");
  const [brands, setBrands] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  console.log(users)

  const handleCreateUser = () => {
    console.log("Creating user:", newUser)
    setIsCreateUserOpen(false)
    setNewUser({ email: "", role: "", password: "" })
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      "".toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditUser = async (user: User) => {
    setEditingUserId(user.id);
    setEditBrandValue(user.brand_name);
    // Fetch brands from config table
    try {
      const configRows = await getAllTableRows("config");
      const brandNames = configRows
        .map((row: any) => row.brand_name)
        .filter((b: string | undefined) => !!b);
      setBrands(Array.from(new Set(brandNames)));
    } catch (e) {
      setBrands([]);
    }
  };

  const handleUpdateUser = async (user: User) => {
    // Aquí deberías hacer la petición para actualizar la marca del usuario en la base de datos
    // Por ahora solo actualiza el estado local
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, brand_name: editBrandValue } : u
      )
    );
    setEditingUserId(null);
    setEditBrandValue("");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditBrandValue("");
  };

  const handleDeleteUser = (userId: string) => {
    console.log("Deleting user:", userId)
  }

  const getAllUsers = async () => {
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) {
      console.error(error); // Si no es admin, no hay error, solo data vacía
    } else {
      setUsers(data)
    }
  }

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <SearchInput
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateUserOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Usuario
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table className="p-10">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "default" : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <Select value={editBrandValue} onValueChange={setEditBrandValue}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Seleccionar marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" onClick={() => handleUpdateUser(user)}>
                          <span role="img" aria-label="Confirmar">✔</span>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                          <span role="img" aria-label="Cancelar">✖</span>
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-900">{user.brand_name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {editingUserId === user.id ? null : (
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo usuario al sistema. Completa todos los campos requeridos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
                placeholder="Password"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateUser}>
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

