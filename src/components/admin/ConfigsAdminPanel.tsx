import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Upload, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uploadLogo, updateBrandingConfig, deleteLogo, createBrandingConfig, uploadWelcomeImage, deleteWelcomeImage } from "@/lib/supabase";
import { useGlobalData } from "@/contexts/AdminDataContext";
import { SketchPicker } from "react-color";
import type { ColorResult } from "react-color";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "../ui/dialog";
import { supabase } from "@/lib/supabase";

const FONT_OPTIONS = [
  { value: "font-anton", label: "Anton" },
  { value: "font-apricotsy", label: "Apricotsy" },
  { value: "font-baloo-2", label: "Baloo 2" },
  { value: "font-bebas-neue", label: "Bebas Neue" },
  { value: "font-brittany-signature", label: "Brittany Signature" },
  { value: "font-bubblegum-sans", label: "Bubblegum Sans" },
  { value: "font-bungee", label: "Bungee" },
  { value: "font-chewy", label: "Chewy" },
  { value: "font-clementine-sketch", label: "Clementine" },
  { value: "font-comic-neue", label: "Comic Neue" },
  { value: "font-courier", label: "Courier" },
  { value: "font-fredoka", label: "Fredoka" },
  { value: "font-genty", label: "Genty" },
  { value: "font-georgia", label: "Georgia" },
  { value: "font-gloria-hallelujah", label: "Gloria Hallelujah" },
  { value: "font-great-vibes", label: "Great Vibes" },
  { value: "font-hello-honey", label: "Hello Honey" },
  { value: "font-henny-penny", label: "Henny Penny" },
  { value: "font-junglefe", label: "Junglefe" },
  { value: "font-league-spartan", label: "League Spartan" },
  { value: "font-lobster", label: "Lobster" },
  { value: "font-lovelo", label: "Lovelo" },
  { value: "font-luckiest-guy", label: "Luckiest Guy" },
  { value: "font-magilio", label: "Magilio" },
  { value: "font-montserrat", label: "Montserrat" },
  { value: "font-neon-tubes", label: "Neon" },
  { value: "font-oswald", label: "Oswald" },
  { value: "font-pacifico", label: "Pacifico" },
  { value: "font-playfair", label: "Playfair Display" },
  { value: "font-playlist-script", label: "Playlist Script" },
  { value: "font-selima", label: "Selima" },
  { value: "font-shadow", label: "Shadows Into Light" },
  { value: "font-spicy-rice", label: "Spicy Rice" },
  { value: "font-sunset-club", label: "Sunset Club" },
  { value: "font-verdana", label: "Verdana" },
  { value: "font-wedges", label: "Wedges" },
];

export function ConfigsAdminPanel() {
  const { data, refreshData, selectConfig } = useGlobalData();
  const [selectedLogo, setSelectedLogo] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [mainColor, setMainColor] = useState<string>(data.config?.main_color || "#2563eb");
  const [inactiveBtnBg, setInactiveBtnBg] = useState<string>(
    data.config?.inactive_btn_bg_color || "#e5e7eb"
  );
  const [inactiveBtnText, setInactiveBtnText] = useState<string>(
    data.config?.inactive_btn_text_color || "#6b7280"
  );
  const [activeBtnBg, setActiveBtnBg] = useState<string>(
    data.config?.active_btn_bg_color || "#2563eb"
  );
  const [activeBtnText, setActiveBtnText] = useState<string>(
    data.config?.active_btn_text_color || "#fff"
  );
  const [welcomeBtnColor, setWelcomeBtnColor] = useState<string>(data.config?.welcome_button_color || "#fff");
  const [welcomeBtnTextColor, setWelcomeBtnTextColor] = useState<string>(data.config?.welcome_button_text_color || "#000");
  const [welcomeTitleColor, setWelcomeTitleColor] = useState<string>(data.config?.welcome_title_color || "#000");
  const [welcomeSubtitleColor, setWelcomeSubtitleColor] = useState<string>(data.config?.welcome_subtitle_color || "#666");
  const [colorChanged, setColorChanged] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [saveColorsMsg, setSaveColorsMsg] = useState("");
  const [fontSelections, setFontSelections] = useState<{
    welcome_title_font: string;
    welcome_subtitle_font: string;
    welcome_button_font: string;
    tab_button_font: string;
  }>({
    welcome_title_font: "",
    welcome_subtitle_font: "",
    welcome_button_font: "",
    tab_button_font: "",
  });
  const [initialFontSelections, setInitialFontSelections] = useState({
    welcome_title_font: "",
    welcome_subtitle_font: "",
    welcome_button_font: "",
    tab_button_font: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState<string>(data.config?.id || "");
  const [showNewConfigModal, setShowNewConfigModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingConfig, setCreatingConfig] = useState(false);
  const [createError, setCreateError] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [savingUser, setSavingUser] = useState(false);
  const [userSaveMsg, setUserSaveMsg] = useState("");
  const [userSaveError, setUserSaveError] = useState("");
  const [selectedWelcomeImage, setSelectedWelcomeImage] = useState<string>("");
  const [uploadingWelcomeImage, setUploadingWelcomeImage] = useState(false);
  const [savingWelcomeImage, setSavingWelcomeImage] = useState(false);
  const [saveWelcomeImageMsg, setSaveWelcomeImageMsg] = useState("");
  const [welcomeImageSearchTerm, setWelcomeImageSearchTerm] = useState("");
  const welcomeImageInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedConfigId with context config
  useEffect(() => {
    if (data.config?.id && data.config?.id !== selectedConfigId) {
      setSelectedConfigId(data.config.id);
    }
  }, [data.config?.id]);

  // Cuando cambia el select, actualizar el contexto
  const handleConfigSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedConfigId(id);
    selectConfig(id);
  };

  const handleCreateConfig = async () => {
    if (!newBrandName.trim()) {
      setCreateError("El nombre de la marca es requerido");
      return;
    }
    setCreatingConfig(true);
    setCreateError("");
    try {
      const newConfig = await createBrandingConfig(newBrandName.trim());
      await refreshData();
      setSelectedConfigId(newConfig.id);
      selectConfig(newConfig.id);
      setShowNewConfigModal(false);
      setNewBrandName("");
    } catch (err: any) {
      setCreateError(err.message || "Error al crear la configuración");
    } finally {
      setCreatingConfig(false);
    }
  };

  useEffect(() => {
    if (data.config?.logo_url === "") {
      setSelectedLogo("");
    } else if (data.config?.logo_url && data.logos.some((l) => l.url === data.config.logo_url)) {
      setSelectedLogo(data.config.logo_url);
    } else if (data.logos.length > 0) {
      setSelectedLogo(data.logos[0].url);
    }
    if (data.config?.main_color) setMainColor(data.config.main_color);
    if (data.config?.inactive_btn_bg_color) setInactiveBtnBg(data.config.inactive_btn_bg_color);
    if (data.config?.inactive_btn_text_color)
      setInactiveBtnText(data.config.inactive_btn_text_color);
    if (data.config?.active_btn_bg_color) setActiveBtnBg(data.config.active_btn_bg_color);
    if (data.config?.active_btn_text_color) setActiveBtnText(data.config.active_btn_text_color);
    if (data.config?.welcome_button_color) setWelcomeBtnColor(data.config.welcome_button_color);
    if (data.config?.welcome_button_text_color) setWelcomeBtnTextColor(data.config.welcome_button_text_color);
    if (data.config?.welcome_title_color) setWelcomeTitleColor(data.config.welcome_title_color);
    if (data.config?.welcome_subtitle_color) setWelcomeSubtitleColor(data.config.welcome_subtitle_color);
    if (data.config?.welcome_image === "") {
      setSelectedWelcomeImage("");
    } else if (data.config?.welcome_image && data.welcomeImages?.some((img) => img.url === data.config.welcome_image)) {
      setSelectedWelcomeImage(data.config.welcome_image);
    } else if (data.welcomeImages?.length > 0) {
      setSelectedWelcomeImage(data.welcomeImages[0].url);
    }
    setFontSelections({
      welcome_title_font: data.config?.welcome_title_font || "",
      welcome_subtitle_font: data.config?.welcome_subtitle_font || "",
      welcome_button_font: data.config?.welcome_button_font || "",
      tab_button_font: data.config?.tab_button_font || "",
    });
    setInitialFontSelections({
      welcome_title_font: data.config?.welcome_title_font || "",
      welcome_subtitle_font: data.config?.welcome_subtitle_font || "",
      welcome_button_font: data.config?.welcome_button_font || "",
      tab_button_font: data.config?.tab_button_font || "",
    });
  }, [data.config, data.logos]);

  // Subir logo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadLogo(file, file.name);
      await refreshData(); // refresca logos y config
    } catch (err) {
      console.error("Error uploading logo:", err);
      alert("Error subiendo el logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveLogo = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      await updateBrandingConfig(data.config.id, { logo_url: selectedLogo });
      setSaveMsg("¡Logo guardado correctamente!");
    } catch (err) {
      console.error("Error uploading logo:", err);
      setSaveMsg("Error al guardar el logo");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2000);
    }
  };

  const handleDeleteLogo = async () => {
    if (!selectedLogo) return;

    const logoToDelete = data.logos.find((logo) => logo.url === selectedLogo);
    if (!logoToDelete) return;

    if (!confirm(`¿Estás seguro de que quieres eliminar el logo "${logoToDelete.name}"?`)) {
      return;
    }

    try {
      await deleteLogo(logoToDelete.name);

      if (data.config.logo_url === selectedLogo) {
        await updateBrandingConfig(data.config.id, { logo_url: "" });
      }
      await refreshData();
      setSelectedLogo("");
    } catch (err) {
      console.error("Error uploading logo:", err);
      alert("Error al eliminar el logo");
    }
  };

  // Welcome Image functions
  const handleUploadWelcomeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingWelcomeImage(true);
    try {
      await uploadWelcomeImage(file, file.name);
      await refreshData(); // refresca welcome images y config
    } catch (err) {
      console.error("Error uploading welcome image:", err);
      alert("Error subiendo la imagen de bienvenida");
    } finally {
      setUploadingWelcomeImage(false);
      if (welcomeImageInputRef.current) welcomeImageInputRef.current.value = "";
    }
  };

  const handleSaveWelcomeImage = async () => {
    setSavingWelcomeImage(true);
    setSaveWelcomeImageMsg("");
    try {
      await updateBrandingConfig(data.config.id, { welcome_image: selectedWelcomeImage });
      setSaveWelcomeImageMsg("¡Imagen de bienvenida guardada correctamente!");
    } catch (err) {
      console.error("Error saving welcome image:", err);
      setSaveWelcomeImageMsg("Error al guardar la imagen de bienvenida");
    } finally {
      setSavingWelcomeImage(false);
      setTimeout(() => setSaveWelcomeImageMsg(""), 2000);
    }
  };

  const handleDeleteWelcomeImage = async () => {
    if (!selectedWelcomeImage) return;

    const imageToDelete = data.welcomeImages.find((image) => image.url === selectedWelcomeImage);
    if (!imageToDelete) return;

    if (!confirm(`¿Estás seguro de que quieres eliminar la imagen "${imageToDelete.name}"?`)) {
      return;
    }

    try {
      await deleteWelcomeImage(imageToDelete.name);

      if (data.config.welcome_image === selectedWelcomeImage) {
        await updateBrandingConfig(data.config.id, { welcome_image: "" });
      }
      await refreshData();
      setSelectedWelcomeImage("");
    } catch (err) {
      console.error("Error deleting welcome image:", err);
      alert("Error al eliminar la imagen de bienvenida");
    }
  };

  const handleColorChange = (setter: (v: string) => void) => (c: ColorResult) => {
    setter(c.hex);
    setColorChanged(true);
  };

  const handleSaveColors = async () => {
    setSavingColors(true);
    setSaveColorsMsg("");
    try {
      await updateBrandingConfig(data.config.id, {
        main_color: mainColor,
        inactive_btn_bg_color: inactiveBtnBg,
        inactive_btn_text_color: inactiveBtnText,
        active_btn_bg_color: activeBtnBg,
        active_btn_text_color: activeBtnText,
        welcome_button_color: welcomeBtnColor,
        welcome_button_text_color: welcomeBtnTextColor,
        welcome_title_color: welcomeTitleColor,
        welcome_subtitle_color: welcomeSubtitleColor,
      });
      setSaveColorsMsg("¡Colores guardados!");
      setColorChanged(false);
    } catch {
      setSaveColorsMsg("Error al guardar");
    } finally {
      setSavingColors(false);
      setTimeout(() => setSaveColorsMsg(""), 2000);
    }
  };

  const handleFontChange = (fontType: keyof typeof fontSelections, value: string) => {
    setFontSelections((prev) => ({ ...prev, [fontType]: value }));
  };

  const fontChanged = Object.keys(fontSelections).some(
    (key) =>
      fontSelections[key as keyof typeof fontSelections] !==
      initialFontSelections[key as keyof typeof initialFontSelections]
  );

  const logoChanged = selectedLogo !== (data.config?.logo_url || "");
  const welcomeImageChanged = selectedWelcomeImage !== (data.config?.welcome_image || "");

  // Obtener usuarios al montar
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.rpc('get_all_users');
      if (!error && data) {
        setUsers(data);
      }
    }
    fetchUsers();
  }, []);

  // Sincronizar usuario seleccionado con config
  useEffect(() => {
    if (data.config?.user_id) {
      setSelectedUserId(data.config.user_id);
    } else {
      setSelectedUserId("");
    }
  }, [data.config?.user_id]);

  // Cuando cambia el usuario, solo actualiza el select, no guarda
  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
    setUserSaveMsg("");
    setUserSaveError("");
  };

  // Guardar usuario seleccionado en config
  const handleSaveUser = async () => {
    if (selectedUserId === undefined || !data.config?.id) return;
    setSavingUser(true);
    setUserSaveMsg("");
    setUserSaveError("");
    try {
      console.log("selectedUserId", selectedUserId)
      await updateBrandingConfig(data.config.id, { user_id: selectedUserId === "" ? null : selectedUserId });
      setUserSaveMsg("Usuario guardado correctamente");
    } catch (err: any) {
      if (err?.message?.includes("duplicate") || err?.message?.includes("unique")) {
        setUserSaveError("Este usuario ya está asignado a otra configuración.");
      } else {
        setUserSaveError("Error al guardar el usuario");
      }
    } finally {
      setSavingUser(false);
      setTimeout(() => {
        setUserSaveMsg("");
        setUserSaveError("");
      }, 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de configuración en la parte superior */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2 items-center flex-col lg:flex-row">
          <div className="flex flex-col items-center gap-2">
            <label htmlFor="config-select" className="font-semibold text-lg">
              Seleccionar configuración:
            </label>
            <select
              id="config-select"
              value={selectedConfigId}
              onChange={handleConfigSelect}
              className="border rounded p-2 min-w-[200px]"
              >
              {data.configs.map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.brand_name}
                </option>
              ))}
            </select>
          </div>
          {/* Select de usuario */}
          <div className="flex flex-col items-center gap-2">
            <label htmlFor="user-select" className="ml-4 font-semibold text-lg">
              Usuario:
            </label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={handleUserSelect}
              className="border rounded p-2 min-w-[200px]"
              disabled={savingUser}
              >
              <option value="">Sin usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="ml-2"
            onClick={handleSaveUser}
            disabled={savingUser}
            >
            {savingUser ? "Guardando..." : "Guardar usuario"}
          </Button>
          {/* Botón para agregar nueva configuración usando DialogTrigger */}
          <Dialog open={showNewConfigModal} onOpenChange={setShowNewConfigModal}>
            <DialogTrigger asChild>
              <Button className="ml-2">
                + Nueva configuración
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-transparent shadow-none border-none p-0 max-w-xs">
              <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Nueva configuración</DialogTitle>
                </DialogHeader>
                <input
                  type="text"
                  placeholder="Nombre de la marca"
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  className="border rounded p-2"
                  autoFocus
                />
                {createError && <span className="text-red-600 text-sm">{createError}</span>}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewConfigModal(false);
                      setNewBrandName("");
                      setCreateError("");
                    }}
                    disabled={creatingConfig}
                    type="button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleCreateConfig}
                    disabled={creatingConfig}
                    type="button"
                  >
                    {creatingConfig ? "Creando..." : "Crear"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          {userSaveMsg && <span className="text-green-600 text-sm ml-2">{userSaveMsg}</span>}
          {userSaveError && <span className="text-red-600 text-sm ml-2">{userSaveError}</span>}
        </div>
      </div>
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="welcome-page">Welcome Page</TabsTrigger>
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="texts">Texto</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <input
                  type="text"
                  placeholder="Buscar por nombre"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded p-2"
                />
                {/* El select de configuración se ha movido a la parte superior */}
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir nuevo logotipo"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteLogo}
                  disabled={!selectedLogo || selectedLogo === ""}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>
              {/* Lista de logos */}
              <div className="mt-6">
                <div className="mb-2 font-semibold">Logos disponibles:</div>
                <div className="flex gap-4 flex-wrap">
                  <div className="text-center">
                    <button
                      className={`border rounded-lg p-1 transition ${
                        selectedLogo === "" ? "ring-4 ring-pink-300" : ""
                      }`}
                      onClick={() => setSelectedLogo("")}
                      title="No usar logotipo"
                    >
                      <span className="h-16 w-16 flex items-center justify-center">Vacío</span>
                    </button>
                    <div className="mt-1">Vacío</div>
                  </div>

                  {data.logos
                    .filter((logo) => logo.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((logo) => {
                      const formattedName = logo.name.replace(/_/g, " ").replace(/\.[^/.]+$/, "");
                      return (
                        <div key={logo.url} className="text-center">
                          <button
                            className={`border rounded-lg p-1 transition ${
                              selectedLogo === logo.url ? "ring-4 ring-pink-300" : ""
                            }`}
                            onClick={() => setSelectedLogo(logo.url)}
                            title={formattedName}
                          >
                            <img
                              src={logo.url}
                              alt={formattedName}
                              className="h-16 w-16 object-contain"
                            />
                          </button>
                          <div className="mt-1">{formattedName}</div>
                        </div>
                      );
                    })}
                  {data.logos.length === 0 && (
                    <span className="text-gray-400">No hay logos subidos</span>
                  )}
                </div>
              </div>
              {/* Botón para guardar logo seleccionado en la tabla config */}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleSaveLogo}
                  disabled={!logoChanged || saving}
                >
                  {saving ? "Guardando..." : "Guardar como logo principal"}
                </Button>
                {saveMsg && <span className="text-sm text-gray-600">{saveMsg}</span>}
              </div>
            </CardContent>
                     </Card>
         </TabsContent>

         <TabsContent value="welcome-page" className="space-y-6">
           <Card>
             <CardContent className="space-y-6">
               <div className="flex items-center space-x-6">
                 <input
                   type="text"
                   placeholder="Buscar por nombre"
                   value={welcomeImageSearchTerm}
                   onChange={(e) => setWelcomeImageSearchTerm(e.target.value)}
                   className="border rounded p-2"
                 />
                 <Button onClick={() => welcomeImageInputRef.current?.click()} disabled={uploadingWelcomeImage}>
                   <Upload className="mr-2 h-4 w-4" />
                   {uploadingWelcomeImage ? "Subiendo..." : "Subir nueva imagen de bienvenida"}
                 </Button>
                 <Button
                   variant="destructive"
                   onClick={handleDeleteWelcomeImage}
                   disabled={!selectedWelcomeImage || selectedWelcomeImage === ""}
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
                 <input
                   ref={welcomeImageInputRef}
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={handleUploadWelcomeImage}
                 />
               </div>
               {/* Lista de imágenes de bienvenida */}
               <div className="mt-6">
                 <div className="mb-2 font-semibold">Imágenes de bienvenida disponibles:</div>
                 <div className="flex gap-4 flex-wrap">
                   <div className="text-center">
                     <button
                       className={`border rounded-lg p-1 transition ${
                         selectedWelcomeImage === "" ? "ring-4 ring-pink-300" : ""
                       }`}
                       onClick={() => setSelectedWelcomeImage("")}
                       title="No usar imagen de bienvenida"
                     >
                       <span className="h-16 w-16 flex items-center justify-center">Vacío</span>
                     </button>
                     <div className="mt-1">Vacío</div>
                   </div>

                   {data.welcomeImages
                     .filter((image) => image.name.toLowerCase().includes(welcomeImageSearchTerm.toLowerCase()))
                     .map((image) => {
                       const formattedName = image.name.replace(/_/g, " ").replace(/\.[^/.]+$/, "");
                       return (
                         <div key={image.url} className="text-center">
                           <button
                             className={`border rounded-lg p-1 transition ${
                               selectedWelcomeImage === image.url ? "ring-4 ring-pink-300" : ""
                             }`}
                             onClick={() => setSelectedWelcomeImage(image.url)}
                             title={formattedName}
                           >
                             <img
                               src={image.url}
                               alt={formattedName}
                               className="h-16 w-16 object-contain"
                             />
                           </button>
                           <div className="mt-1">{formattedName}</div>
                         </div>
                       );
                     })}
                   {data.welcomeImages.length === 0 && (
                     <span className="text-gray-400">No hay imágenes de bienvenida subidas</span>
                   )}
                 </div>
               </div>
               {/* Botón para guardar imagen seleccionada en la tabla config */}
               <div className="mt-4 flex items-center gap-3">
                 <Button
                   className="bg-blue-600 text-white hover:bg-blue-700"
                   onClick={handleSaveWelcomeImage}
                   disabled={!welcomeImageChanged || savingWelcomeImage}
                 >
                   {savingWelcomeImage ? "Guardando..." : "Guardar como imagen de bienvenida principal"}
                 </Button>
                 {saveWelcomeImageMsg && <span className="text-sm text-gray-600">{saveWelcomeImageMsg}</span>}
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {/* Main Color */}
                <AccordionItem value="main-color">
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <span>Color Principal</span>
                      <span
                        className="w-6 h-6 rounded border ml-2"
                        style={{ background: mainColor }}
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <SketchPicker
                      color={mainColor}
                      onChange={handleColorChange(setMainColor)}
                      presetColors={[]}
                    />
                  </AccordionContent>
                </AccordionItem>
                {/* Pagina de bienvenida (Accordion padre) */}
                <AccordionItem value="welcome-page">
                  <AccordionTrigger>
                    <span>Pagina de bienvenida</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* Welcome Button Color */}
                    <AccordionItem value="welcome-button-color" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Color del botón</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: welcomeBtnColor }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={welcomeBtnColor}
                          onChange={handleColorChange(setWelcomeBtnColor)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    {/* Welcome Text Color */}
                    <AccordionItem value="welcome-text-color" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Color del texto de bienvenida</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: welcomeBtnTextColor }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={welcomeBtnTextColor}
                          onChange={handleColorChange(setWelcomeBtnTextColor)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <div className="mt-4 ml-4">
                      <button
                        className="px-5 min-h-9 rounded-lg font-bold text-base"
                        style={{
                          background: welcomeBtnColor,
                          color: welcomeBtnTextColor,
                        }}
                        disabled
                      >
                        Ejemplo botón bienvenida
                      </button>
                    </div>
                    {/* Welcome Title Color */}
                    <AccordionItem value="welcome-title-color" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Color del título</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: welcomeTitleColor }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={welcomeTitleColor}
                          onChange={handleColorChange(setWelcomeTitleColor)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    {/* Welcome Subtitle Color */}
                    <AccordionItem value="welcome-subtitle-color" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Color del subtítulo</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: welcomeSubtitleColor }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={welcomeSubtitleColor}
                          onChange={handleColorChange(setWelcomeSubtitleColor)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </AccordionContent>
                </AccordionItem>
                {/* Pestañas de edición (Accordion padre) */}
                <AccordionItem value="tab-editing">
                  <AccordionTrigger>
                    <span>Pestañas de edición</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* Inactive Button Background */}
                    <AccordionItem value="inactive-btn-bg" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Background boton inactivo tab</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: inactiveBtnBg }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={inactiveBtnBg}
                          onChange={handleColorChange(setInactiveBtnBg)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    {/* Inactive Button Text */}
                    <AccordionItem value="inactive-btn-text" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Texto boton inactivo tab</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: inactiveBtnText }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={inactiveBtnText}
                          onChange={handleColorChange(setInactiveBtnText)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <div className="mt-4 ml-4">
                      <button
                        className="px-5 min-h-9 rounded-lg font-bold text-base"
                        style={{
                          background: inactiveBtnBg,
                          color: inactiveBtnText,
                        }}
                        disabled
                      >
                        Ejemplo inactivo
                      </button>
                    </div>
                    {/* Active Button Background */}
                    <AccordionItem value="active-btn-bg" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Background boton activo tab</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: activeBtnBg }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={activeBtnBg}
                          onChange={handleColorChange(setActiveBtnBg)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    {/* Active Button Text */}
                    <AccordionItem value="active-btn-text" className="ml-4">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Texto boton inactivo tab</span>
                          <span
                            className="w-6 h-6 rounded border ml-2"
                            style={{ background: activeBtnText }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <SketchPicker
                          color={activeBtnText}
                          onChange={handleColorChange(setActiveBtnText)}
                          presetColors={[]}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <div className="mt-4 ml-4">
                      <button
                        className="px-5 min-h-9 rounded-lg font-bold text-base border-2 border-black"
                        style={{
                          background: activeBtnBg,
                          color: activeBtnText,
                        }}
                        disabled
                      >
                        Ejemplo activo
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="flex items-center gap-3 mt-8 justify-start">
                <Button
                  onClick={handleSaveColors}
                  disabled={!colorChanged || savingColors}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {savingColors ? "Guardando..." : "Guardar configuración"}
                </Button>
                {saveColorsMsg && <span className="text-sm text-gray-600">{saveColorsMsg}</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="texts">
          <Card>
            <CardContent>
              <div className="flex flex-col gap-3">
                {/* Font Selection Inputs */}
                {[
                  { id: "welcome_title_font", label: "Título de bienvenida" },
                  { id: "welcome_subtitle_font", label: "Subtítulo de bienvenida" },
                  { id: "welcome_button_font", label: "Botón de bienvenida" },
                  { id: "tab_button_font", label: "Botones de pestaña" },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center gap-3">
                    <label htmlFor={id} className="font-semibold">
                      {label}
                    </label>
                    <select
                      id={id}
                      className="border rounded p-2"
                      value={fontSelections[id as keyof typeof fontSelections] || ""}
                      onChange={(e) =>
                        handleFontChange(id as keyof typeof fontSelections, e.target.value)
                      }
                    >
                      <option value="">Fuente no seleccionada</option>
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {/* Save Button */}
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    onClick={async () => {
                      try {
                        const updates = {
                          welcome_title_font: fontSelections.welcome_title_font,
                          welcome_subtitle_font: fontSelections.welcome_subtitle_font,
                          welcome_button_font: fontSelections.welcome_button_font,
                          tab_button_font: fontSelections.tab_button_font,
                        };
                        await updateBrandingConfig(
                          data.config.id,
                          updates
                        );
                        setSaveMsg("Configuración guardada correctamente");
                        setInitialFontSelections(updates); // Actualiza el estado inicial tras guardar
                      } catch (error) {
                        console.error("Error uploading logo:", error);
                        setSaveMsg("Error al guardar la configuración");
                      }
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={!fontChanged}
                  >
                    Guardar configuración
                  </Button>
                  {saveMsg && <span className="text-sm text-gray-600">{saveMsg}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
