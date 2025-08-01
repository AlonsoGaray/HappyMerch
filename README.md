# HappyMerch

Una aplicación web para personalización de productos con canvas editable.

## Características

### Edición de Canvas de Productos

La aplicación ahora incluye una funcionalidad avanzada para editar el área de canvas de cada producto. Esto permite definir exactamente dónde los usuarios pueden colocar elementos en cada producto.

#### Cómo usar la edición de canvas:

1. **Acceder al panel de administración**
   - Ve a la sección "Productos" en el panel de administración
   - Haz clic en el botón de editar (ícono de lápiz) en cualquier producto

2. **Editar el canvas**
   - Se abrirá un modal con una vista previa visual del producto
   - El rectángulo rojo muestra el área editable actual
   - Puedes ajustar:
     - **Ancho del Canvas**: El ancho del área editable en píxeles
     - **Alto del Canvas**: El alto del área editable en píxeles
     - **Posición X (Left)**: La posición horizontal del canvas
     - **Posición Y (Top)**: La posición vertical del canvas

3. **Posiciones predefinidas**
   - El modal incluye botones para posiciones comunes:
     - Esquina superior izquierda
     - Esquina superior derecha
     - Centro superior
     - Ancho completo

4. **Vista previa en tiempo real**
   - La vista previa se actualiza automáticamente mientras cambias los valores
   - Esto te permite ver exactamente cómo se verá el área editable

#### Campos del Canvas:

- **width**: Ancho del área editable en píxeles
- **height**: Alto del área editable en píxeles
- **top**: Posición vertical desde la parte superior
- **left**: Posición horizontal desde la izquierda

#### Ejemplo de uso:

Para un producto como una cartuchera, podrías configurar:
- **width**: 200px
- **height**: 150px
- **top**: 50px
- **left**: 100px

Esto crearía un área editable de 200x150 píxeles posicionada 50px desde arriba y 100px desde la izquierda de la imagen del producto.

## Instalación

```bash
npm install
npm run dev
```

## Tecnologías utilizadas

- React
- TypeScript
- Fabric.js (para el canvas)
- Supabase (base de datos)
- Tailwind CSS
