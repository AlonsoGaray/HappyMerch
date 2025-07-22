import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { uploadLogo, updateBrandingConfig, updateTableRow } from "@/lib/supabase"
import { useGlobalData } from "@/contexts/AdminDataContext"
import { SketchPicker } from 'react-color'
import type { ColorResult } from 'react-color'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion"

const FONT_OPTIONS = [
  { value: "font-pacifico", label: "Pacifico" },
  { value: "font-anton", label: "Anton" },
  { value: "font-lobster", label: "Lobster" },
  { value: "font-oswald", label: "Oswald" },
  { value: "font-shadow", label: "Shadows Into Light" },
  { value: "font-playfair", label: "Playfair Display" },
  { value: "font-montserrat", label: "Montserrat" },
  { value: "font-verdana", label: "Verdana" },
  { value: "font-courier", label: "Courier" },
  { value: "font-georgia", label: "Georgia" },
];


export function ConfigsAdminPanel() {
  const { data, refreshData } = useGlobalData();
  const [selectedLogo, setSelectedLogo] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [mainColor, setMainColor] = useState<string>(data.config?.main_color || "#2563eb");
  const [inactiveBtnBg, setInactiveBtnBg] = useState<string>(data.config?.inactive_btn_bg_color || "#e5e7eb");
  const [inactiveBtnText, setInactiveBtnText] = useState<string>(data.config?.inactive_btn_text_color || "#6b7280");
  const [activeBtnBg, setActiveBtnBg] = useState<string>(data.config?.active_btn_bg_color || "#2563eb");
  const [activeBtnText, setActiveBtnText] = useState<string>(data.config?.active_btn_text_color || "#fff");
  const [colorChanged, setColorChanged] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [saveColorsMsg, setSaveColorsMsg] = useState("");
  const [fontSelections, setFontSelections] = useState<{
    welcome_title_font: string;
    welcome_subtitle_font: string;
    welcome_button_font: string;
    tab_button_font: string;
    nav_button_font: string;
  }>({
    welcome_title_font: '',
    welcome_subtitle_font: '',
    welcome_button_font: '',
    tab_button_font: '',
    nav_button_font: '',
  });

  useEffect(() => {
    if (data.config?.logo_url && data.logos.some(l => l.url === data.config.logo_url)) {
      setSelectedLogo(data.config.logo_url);
    } else if (data.logos.length > 0) {
      setSelectedLogo(data.logos[0].url);
    }
    if (data.config?.main_color) setMainColor(data.config.main_color);
    if (data.config?.inactive_btn_bg_color) setInactiveBtnBg(data.config.inactive_btn_bg_color);
    if (data.config?.inactive_btn_text_color) setInactiveBtnText(data.config.inactive_btn_text_color);
    if (data.config?.active_btn_bg_color) setActiveBtnBg(data.config.active_btn_bg_color);
    if (data.config?.active_btn_text_color) setActiveBtnText(data.config.active_btn_text_color);
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
      await updateBrandingConfig({ logo_url: selectedLogo });
      await refreshData();
      setSaveMsg("¡Logo guardado correctamente!");
    } catch (err) {
      setSaveMsg("Error al guardar el logo");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2000);
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
      await updateBrandingConfig({
        main_color: mainColor,
        inactive_btn_bg_color: inactiveBtnBg,
        inactive_btn_text_color: inactiveBtnText,
        active_btn_bg_color: activeBtnBg,
        active_btn_text_color: activeBtnText,
      });
      await refreshData();
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="texts">Texto</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <img
                    src={selectedLogo}
                    alt="Logotipo de la Marca"
                    className="h-24 w-24 rounded-lg object-contain border"
                  />
                </div>
                <div>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Subiendo..." : "Subir nuevo logotipo"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
              </div>
              {/* Lista de logos */}
              <div className="mt-6">
                <div className="mb-2 font-semibold">Logos disponibles:</div>
                <div className="flex gap-4 flex-wrap">
                  {data.logos.map(logo => (
                    <button
                      key={logo.url}
                      className={`border rounded-lg p-1 transition ${selectedLogo === logo.url ? 'ring-4 ring-pink-300' : ''}`}
                      onClick={() => setSelectedLogo(logo.url)}
                      title={logo.name}
                    >
                      <img src={logo.url} alt={logo.name} className="h-16 w-16 object-contain" />
                    </button>
                  ))}
                  {data.logos.length === 0 && <span className="text-gray-400">No hay logos subidos</span>}
                </div>
              </div>
              {/* Botón para guardar logo seleccionado en la tabla config */}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={handleSaveLogo}
                  disabled={!selectedLogo || saving}
                >
                  {saving ? "Guardando..." : "Guardar como logo principal"}
                </Button>
                {saveMsg && <span className="text-sm text-gray-600">{saveMsg}</span>}
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
                      <span className="w-6 h-6 rounded border ml-2" style={{ background: mainColor }} />
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
                {/* Pestañas de edición (Accordion padre) */}
                <AccordionItem value="tab-editing">
                  <AccordionTrigger>
                    <span>Pestañas de edición</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* Inactive Button Background */}
                    <AccordionItem value="inactive-btn-bg">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Background boton inactivo tab</span>
                          <span className="w-6 h-6 rounded border ml-2" style={{ background: inactiveBtnBg }} />
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
                    <AccordionItem value="inactive-btn-text">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Texto boton inactivo tab</span>
                          <span className="w-6 h-6 rounded border ml-2" style={{ background: inactiveBtnText }} />
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
                    <div className="mt-4">
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
                    <AccordionItem value="active-btn-bg">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Background boton activo tab</span>
                          <span className="w-6 h-6 rounded border ml-2" style={{ background: activeBtnBg }} />
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
                    <AccordionItem value="active-btn-text">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span>Texto boton inactivo tab</span>
                          <span className="w-6 h-6 rounded border ml-2" style={{ background: activeBtnText }} />
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
                    <div className="mt-4">
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
              <div className="flex items-center gap-3 mt-8 justify-end">
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
                  { id: 'welcome_title_font', label: 'Título de bienvenida' },
                  { id: 'welcome_subtitle_font', label: 'Subtítulo de bienvenida' },
                  { id: 'welcome_button_font', label: 'Botón de bienvenida' },
                  { id: 'tab_button_font', label: 'Botones de pestaña' },
                  { id: 'nav_button_font', label: 'Botones de navegación' }
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center gap-3">
                    <label htmlFor={id} className="font-semibold">{label}</label>
                    <select
                      id={id}
                      className="border rounded p-2"
                      value={fontSelections[id as keyof typeof fontSelections]}
                      onChange={(e) => handleFontChange(id as keyof typeof fontSelections, e.target.value)}
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>{font.label}</option>
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
                          nav_button_font: fontSelections.nav_button_font,
                        };
                        await updateTableRow('config', '5e46ee3c-1885-4257-b486-ff225603d3f2', updates);
                        setSaveMsg('Configuración guardada correctamente');
                      } catch (error) {
                        setSaveMsg('Error al guardar la configuración');
                      }
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
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
  )
}