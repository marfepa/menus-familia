# 🥑 Planificador de Menús Familiar & Lista de la Compra

Una aplicación web moderna, ágil y visual diseñada para planificar menús semanales de comidas y cenas en familia, organizar recetas favoritas y generar de forma automática e inteligente la lista de la compra clasificada por secciones de supermercado.

---

## ✨ Características Principales

1. **📅 Planificador Semanal Interactivo**:
   - Vista de calendario de Lunes a Domingo con casillas diferenciadas para **Comida (Almuerzo)** y **Cena**.
   - Asignación rápida de recetas del catálogo familiar o platos libres.
   - **✨ Generar menú**: encadena sobras (batch cooking), cenas rápidas, gluten-light y tuppers de oficina. Modos: semana completa, solo cenas o solo tuppers L–V. Copia la semana anterior.
   - Navegación fluida entre semanas (semana actual, anterior, siguiente o por fecha).

2. **🛒 Lista de la Compra Inteligente**:
   - Consolidación y suma automática de ingredientes a partir del menú semanal.
   - Agrupación por **pasillos y departamentos del supermercado** (Frutería, Carnicería, Pescadería, Lácteos, Despensa, Panadería, Congelados, Otros).
   - Despensa “ya lo tengo”, raciones de casa y modo súper (checks grandes). Checklist en el lineal.
   - Posibilidad de añadir productos extra manualmente (limpieza, café, etc.).
   - **Botón de compartir para WhatsApp** con formato estructurado y emojis.
   - Modo de impresión limpia para papel o PDF.

3. **📖 Recetario Familiar Completo**:
   - Catálogo inicial de más de 12 recetas mediterráneas y familiares listas para usar.
   - Creación y edición guiada de recetas con raciones, tiempos, dificultad, etiquetas e ingredientes categorizados.
   - Vista detallada de recetas con **escalado dinámico de raciones** e instrucciones paso a paso.
   - Marcador de recetas favoritas familiares.

4. **💾 Copias de Seguridad & Privacidad**:
   - Persistencia local inmediata en el navegador (funciona 100% offline).
   - Exportación e importación de copias de seguridad en formato `.json` (recetas, semanas, listas, despensa y raciones).
   - PWA instalable en el móvil (Añadir a pantalla de inicio).

---

## 🚀 Despliegue en Vercel a través de GitHub

Para desplegar la aplicación en Vercel y tener tu propia URL accesible desde cualquier móvil, tablet o PC con actualizaciones automáticas:

### 1. Inicializar Git y subir a GitHub

1. Crea un nuevo repositorio en [GitHub](https://github.com/new) con el nombre `menus-familia` (público o privado).
2. En tu terminal (dentro de esta carpeta), ejecuta:

```bash
git init
git add .
git commit -m "feat: planificador de menus y lista de compras familiar"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/menus-familia.git
git push -u origin main
```

*(Sustituye `TU_USUARIO` por tu usuario de GitHub).*

### 2. Importar en Vercel

1. Entra en [Vercel Dashboard](https://vercel.com/new).
2. Selecciona **"Add New... -> Project"** e importa tu repositorio `menus-familia`.
3. Vercel detectará la configuración de **Next.js** automáticamente. Pulsa **Deploy**.
4. ¡Listo! En menos de 1 minuto tendrás tu enlace `.vercel.app`.

### 3. Actualizaciones continuas
Cada vez que realices cambios en este proyecto y hagas:
```bash
git add .
git commit -m "nuevos cambios"
git push
```
Vercel desplegará automáticamente la nueva versión en tiempo real.

---

## 💻 Ejecución en Local

Para probar o usar la aplicación en tu ordenador local:

```bash
# Instalar dependencias (ya instaladas)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript).
- **Estilos & UI**: [Tailwind CSS](https://tailwindcss.com/) y [Lucide Icons](https://lucide.dev/).
- **Efectos**: Canvas Confetti.
- **Despliegue**: Optimizado para [Vercel](https://vercel.com/).
