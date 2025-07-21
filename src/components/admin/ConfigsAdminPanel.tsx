import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { uploadLogo, getAllLogos, updateBrandingConfig, getBrandingConfig } from "@/lib/supabase"
import { SketchPicker } from 'react-color'
import type { ColorResult } from 'react-color'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion"


export function ConfigsAdminPanel() {
  // Estado para los logos
  const [logos, setLogos] = useState<{ name: string; url: string }[]>([])
  const [selectedLogo, setSelectedLogo] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  
  // Colores branding
  const [mainColor, setMainColor] = useState("#2563eb")
  const [inactiveBtnBg, setInactiveBtnBg] = useState("#e5e7eb")
  const [inactiveBtnText, setInactiveBtnText] = useState("#6b7280")
  const [activeBtnBg, setActiveBtnBg] = useState("#2563eb")
  const [activeBtnText, setActiveBtnText] = useState("#fff")
  const [colorChanged, setColorChanged] = useState(false)
  const [savingColors, setSavingColors] = useState(false)
  const [saveColorsMsg, setSaveColorsMsg] = useState("")
  
  // Cargar logos al montar
  useEffect(() => {
    async function fetchLogosAndConfig() {
      try {
        const all = await getAllLogos()
        setLogos(all)
        // Config branding
        const config = await getBrandingConfig()
        if (config) {
          if (config.logo_url && all.some(l => l.url === config.logo_url)) {
            setSelectedLogo(config.logo_url)
          } else if (all.length > 0) {
            setSelectedLogo(all[0].url)
          }
          if (config.main_color) setMainColor(config.main_color)
          if (config.inactive_btn_bg_color) setInactiveBtnBg(config.inactive_btn_bg_color)
          if (config.inactive_btn_text_color) setInactiveBtnText(config.inactive_btn_text_color)
          if (config.active_btn_bg_color) setActiveBtnBg(config.active_btn_bg_color)
          if (config.active_btn_text_color) setActiveBtnText(config.active_btn_text_color)
        } else {
          // fallback selección inicial: desde localStorage o el primero
          const saved = localStorage.getItem("selectedLogo")
          if (saved && all.some(l => l.url === saved)) {
            setSelectedLogo(saved)
          } else if (all.length > 0) {
            setSelectedLogo(all[0].url)
          }
        }
      } catch {}
    }
    fetchLogosAndConfig()
  }, [])

  // Guardar selección en localStorage
  useEffect(() => {
    if (selectedLogo) localStorage.setItem("selectedLogo", selectedLogo)
  }, [selectedLogo])

  // Subir logo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadLogo(file, file.name)
      setLogos(prev => [...prev, { name: file.name, url }])
      setSelectedLogo(url)
    } catch (err) {
      alert("Error subiendo el logo")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Guardar logo seleccionado en la tabla config
  const handleSaveLogo = async () => {
    setSaving(true)
    setSaveMsg("")
    try {
      await updateBrandingConfig({ logo_url: selectedLogo })
      setSaveMsg("¡Logo guardado correctamente!")
    } catch (err) {
      setSaveMsg("Error al guardar el logo")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(""), 2000)
    }
  }

  // Marcar como cambiado al modificar cualquier color
  const handleColorChange = (setter: (v: string) => void) => (c: ColorResult) => {
    setter(c.hex)
    setColorChanged(true)
  }

  // Guardar todos los colores juntos
  const handleSaveColors = async () => {
    setSavingColors(true)
    setSaveColorsMsg("")
    try {
      await updateBrandingConfig({
        main_color: mainColor,
        inactive_btn_bg_color: inactiveBtnBg,
        inactive_btn_text_color: inactiveBtnText,
        active_btn_bg_color: activeBtnBg,
        active_btn_text_color: activeBtnText,
      })
      setSaveColorsMsg("¡Colores guardados!")
      setColorChanged(false)
    } catch {
      setSaveColorsMsg("Error al guardar")
    } finally {
      setSavingColors(false)
      setTimeout(() => setSaveColorsMsg(""), 2000)
    }
  }

  return (
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
            </CardHeader>
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
                  {logos.map(logo => (
                    <button
                      key={logo.url}
                      className={`border rounded-lg p-1 transition ${selectedLogo === logo.url ? 'ring-4 ring-pink-300' : ''}`}
                      onClick={() => setSelectedLogo(logo.url)}
                      title={logo.name}
                    >
                      <img src={logo.url} alt={logo.name} className="h-16 w-16 object-contain" />
                    </button>
                  ))}
                  {logos.length === 0 && <span className="text-gray-400">No hay logos subidos</span>}
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
                {/* Inactive Button Background */}
                <AccordionItem value="inactive-btn-bg">
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <span>Inactive Button Background</span>
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
                      <span>Inactive Button Text</span>
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
                      <span>Active Button Background</span>
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
                      <span>Active Button Text</span>
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
              </Accordion>
              <div className="flex items-center gap-3 mt-8">
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
  )
}