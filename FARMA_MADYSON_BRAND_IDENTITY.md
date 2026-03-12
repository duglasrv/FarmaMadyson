# 🎨 FARMA MADYSON — Identidad de Marca & Design System

## La Biblia Visual del Sistema

> **Este documento define el ALMA de Farma Madyson.**
> No es un sistema más. Es una experiencia de bienestar.
> Cada pixel, cada animación, cada micro-interacción debe hacer sentir al cliente que está en un lugar SEGURO, CÁLIDO y que genuinamente se preocupa por su salud y su bolsillo.

---

## 🧬 FILOSOFÍA DE MARCA

### ¿Quiénes somos?

No somos una farmacia más. No somos un catálogo frío de medicamentos. Somos el lugar **donde comienza el bienestar**. Esas palabras no son solo un slogan — son una promesa. Cada decisión de diseño debe responder a esta pregunta:

> **¿Esto hace que la persona SIENTA que su bienestar comienza aquí?**

### Los 4 Pilares de la Experiencia Farma Madyson

```
1. CONFIANZA → "Estoy en manos seguras"
   El blanco clínico, la limpieza visual, los espacios amplios.
   Como entrar a un consultorio donde todo está en orden.

2. CALIDEZ → "Aquí me tratan como persona, no como cliente"
   El ámbar dorado, las esquinas suaves, los micro-detalles.
   Como recibir un saludo cálido del farmacéutico que te conoce.

3. PROFESIONALISMO → "Saben lo que hacen"
   El púrpura profundo, la tipografía clara, la jerarquía impecable.
   Como ver el diploma del médico en la pared: te da tranquilidad.

4. ACCESIBILIDAD → "No me quieren sacar el dinero, me quieren ayudar"
   Los precios claros, los descuentos honestos, cero presión.
   Como la farmacia del barrio que te fía porque te conoce.
```

### Tono de Voz

```
SÍ: "Cuida tu salud sin preocuparte por tu bolsillo"
NO: "¡MEGA OFERTA! ¡COMPRA YA! ¡ÚLTIMAS UNIDADES!"

SÍ: "Te recomendamos" / "Para tu bienestar" / "Ideal para ti"
NO: "¡Agregar al carrito!" / "¡No te lo pierdas!"

SÍ: Cálido, cercano, profesional pero humano
NO: Agresivo, urgente, genérico, frío

El lenguaje siempre en segunda persona familiar (tú — Guatemala).
Nunca gritar. Los CTAs son invitaciones, no órdenes.
```

---

## 🎨 PALETA DE COLORES — DECODIFICADA DEL LOGO

### Análisis Psicológico del Logo

El logo de Farma Madyson ya cuenta una historia completa. Cada color tiene un propósito. El error sería usarlos todos al mismo tiempo en la web. La clave es **jerarquía cromática**: un color domina, los demás acentúan.

```
LA CÁPSULA (ámbar + teal)
├── La parte superior ÁMBAR/DORADA = CALIDEZ, cercanía, accesibilidad
├── La parte inferior TEAL = PROFESIONALISMO clínico, confianza médica
└── Juntas: "Medicina que se siente cálida y humana"

EL CORAZÓN ROJO (arriba derecha)
├── Salud cardiovascular, pero más que eso:
└── "Tu salud nos importa de corazón" — es emocional, no clínico

LA LÍNEA DE PULSO (cyan/teal)
├── Vida, vitalidad, monitoreo
└── "Estamos atentos a tu bienestar" — cuidado continuo

LAS HOJAS VERDES
├── Natural, orgánico, saludable
└── "Lo natural también sana" — conexión con bienestar integral

EL TEXTO PÚRPURA "MADYSON"
├── Sofisticación, confianza, NO es una farmacia genérica
├── Púrpura en salud = innovación + distinción (Sanofi, Nexium, UPMC)
└── "Somos diferentes, somos mejores" — posicionamiento premium accesible

EL SLOGAN MARRÓN/DORADO
├── Tierra, raíces, calidez hogareña
└── "Donde comienza el bienestar" se siente como un abrazo
```

### Paleta Primaria — Uso en Web

```css
/* ============================================
   REGLA DE ORO: 60 / 30 / 10
   60% → Blanco + Grises suaves (base limpia)
   30% → Púrpura Madyson (identidad, headings, acciones)
   10% → Ámbar/Dorado (warmth, CTAs de compra, acentos)
   ============================================ */

:root {
  /* === BASE (60%) — El Lienzo Limpio === */
  --white:              #FFFFFF;
  --snow:               #FAFBFC;    /* Fondo general de la app */
  --cloud:              #F3F4F6;    /* Fondo de secciones alternas */
  --mist:               #E5E7EB;    /* Bordes suaves, separadores */
  --silver:             #9CA3AF;    /* Texto terciario, placeholders */
  --slate:              #6B7280;    /* Texto secundario */
  --charcoal:           #374151;    /* Texto principal del body */
  --ink:                #1F2937;    /* Headings, texto importante */

  /* === PÚRPURA MADYSON (30%) — La Identidad === */
  --purple-50:          #F5F0FB;    /* Fondo de hover sutil */
  --purple-100:         #EBE1F7;    /* Fondo de badges, tags */
  --purple-200:         #D4BFF0;    /* Fondo de cards seleccionadas */
  --purple-300:         #B794E0;    /* Bordes activos */
  --purple-400:         #9B6BD0;    /* Iconos secundarios */
  --purple-500:         #7C4DBA;    /* Links, elementos interactivos */
  --purple-600:         #5B2D90;    /* ★ COLOR PRINCIPAL — Logo, headings, botón primario */
  --purple-700:         #4A2375;    /* Hover del botón primario */
  --purple-800:         #391A5A;    /* Active/pressed */
  --purple-900:         #281040;    /* Texto sobre fondo claro cuando se necesita aún más peso */

  /* === ÁMBAR DORADO (10%) — La Calidez === */
  --amber-50:           #FFFBEB;    /* Fondo de notificaciones suaves */
  --amber-100:          #FEF3C7;    /* Fondo de badge "oferta" */
  --amber-200:          #FDE68A;    /* Highlight de precio con descuento */
  --amber-300:          #FCD34D;    /* Stars de rating */
  --amber-400:          #FBBF24;    /* Badges destacados */
  --amber-500:          #F59E0B;    /* ★ CTA "Agregar al carrito" — botón de acción cálida */
  --amber-600:          #D97706;    /* Hover del CTA */
  --amber-700:          #B45309;    /* Pressed */

  /* === TEAL CLÍNICO — Acento Profesional === */
  --teal-50:            #F0FDFA;
  --teal-100:           #CCFBF1;
  --teal-200:           #99F6E4;
  --teal-400:           #2DD4BF;
  --teal-500:           #14B8A6;    /* Info badges, enlaces secundarios */
  --teal-600:           #0D9488;    /* ★ Acento clínico — categorías, info farmacéutica */
  --teal-700:           #0F766E;
  --teal-800:           #115E59;    /* Texto sobre fondo teal claro */

  /* === SEMÁNTICOS — Estados === */
  --success:            #16A34A;    /* ✓ En stock, operación exitosa */
  --success-light:      #F0FDF4;
  --warning:            #F59E0B;    /* ⚠ Stock bajo, por vencer */
  --warning-light:      #FFFBEB;
  --error:              #DC2626;    /* ✕ Sin stock, error, receta rechazada */
  --error-light:        #FEF2F2;
  --info:               #0D9488;    /* ℹ Información farmacéutica */
  --info-light:         #F0FDFA;

  /* === CORAZÓN ROJO — USO MUY LIMITADO === */
  --heart:              #BE1E2D;    /* SOLO para: ícono de favoritos, badge de "salud" */
  /* NUNCA usar rojo como color de fondo grande o botón principal */
  /* En farma, el rojo en exceso = alarma = ansiedad = lo opuesto a bienestar */
}
```

### Reglas Estrictas de Color

```
🚫 PROHIBIDO:
- Usar más de 2 colores saturados en la misma vista
- Fondos de color saturado en secciones grandes (solo blanco/snow/cloud)
- Texto blanco sobre fondo ámbar (contraste insuficiente)
- Gradientes arcoíris o multicolor
- Rojo como color de botón (excepto "eliminar" en contexto de admin)
- Negro puro (#000000) en cualquier parte — usar --ink (#1F2937)

✅ OBLIGATORIO:
- Fondo principal siempre blanco (#FFFFFF) o snow (#FAFBFC)
- El púrpura SOLO para: headings, botón primario, links, sidebar admin
- El ámbar SOLO para: botón "agregar al carrito", badges de oferta, estrellas
- El teal SOLO para: info farmacéutica, badges de categoría, links secundarios
- Máximo 2 sombras por tarjeta (sutiles, nunca oscuras)
- Bordes siempre --mist o más claros
```

---

## ✍️ TIPOGRAFÍA

### Regla: Legibilidad > Decoración

En farmacia, la gente LEE para tomar decisiones de salud. La tipografía debe ser cristalina.

```css
/* Heading Display — Para títulos que impactan */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

/* Body — Para lectura cómoda */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### Escala Tipográfica

```
Hero/Landing:     48px / 800 weight / --ink / Jakarta / tracking -0.02em
H1 (página):      32px / 700 weight / --purple-600 / Jakarta / tracking -0.01em
H2 (sección):     24px / 600 weight / --ink / Jakarta
H3 (subsección):  20px / 600 weight / --charcoal / Jakarta
H4 (card title):  16px / 600 weight / --charcoal / Jakarta

Body large:       18px / 400 weight / --charcoal / Inter / line-height 1.7
Body:             16px / 400 weight / --charcoal / Inter / line-height 1.6
Body small:       14px / 400 weight / --slate / Inter / line-height 1.5
Caption:          12px / 500 weight / --silver / Inter / letter-spacing 0.02em
Overline:         11px / 600 weight / --purple-500 / Inter / uppercase / tracking 0.08em

Precio principal: 24px / 700 weight / --ink / Jakarta
Precio descuento: 24px / 700 weight / --purple-600 / Jakarta
Precio tachado:   16px / 400 weight / --silver / Inter / line-through
```

---

## 📐 ESPACIADO & LAYOUT

### Sistema de Espaciado (base 4px)

```
--space-1:   4px    /* Micro: entre ícono y texto */
--space-2:   8px    /* Tiny: padding interno de badges */
--space-3:   12px   /* Small: gap entre elementos inline */
--space-4:   16px   /* Base: padding de botones, gap de grids */
--space-5:   20px   /* Medium: margen entre párrafos */
--space-6:   24px   /* Large: padding de cards */
--space-8:   32px   /* XL: margen entre secciones */
--space-10:  40px   /* 2XL: espaciado de secciones */
--space-12:  48px   /* 3XL: separación de bloques principales */
--space-16:  64px   /* 4XL: padding de hero sections */
--space-20:  80px   /* 5XL: separación entre secciones de página */
```

### Esquinas Redondeadas

```
--radius-sm:   6px    /* Badges, tags, inputs pequeños */
--radius-md:   10px   /* Botones, inputs, dropdowns */
--radius-lg:   16px   /* Cards de producto, modales */
--radius-xl:   20px   /* Hero cards, promo banners */
--radius-2xl:  24px   /* Feature sections, panels */
--radius-full: 9999px /* Pills, avatares, badges circulares */

FILOSOFÍA: Esquinas suaves = seguridad, confort.
Las esquinas puntiagudas se asocian con agresividad.
NUNCA usar border-radius: 0 en elementos interactivos.
```

### Sombras — Etéreas, No Pesadas

```css
/* Las sombras en Farma Madyson son como nubes suaves, no bloques oscuros */

--shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.04);
                /* Cards en reposo — apenas perceptible */

--shadow-md:    0 4px 12px rgba(91, 45, 144, 0.06),
                0 1px 3px rgba(0, 0, 0, 0.04);
                /* Cards en hover — NOTA: la sombra tiene un tinte púrpura sutil */

--shadow-lg:    0 8px 24px rgba(91, 45, 144, 0.08),
                0 2px 6px rgba(0, 0, 0, 0.04);
                /* Modales, drawers, elementos elevados */

--shadow-xl:    0 16px 48px rgba(91, 45, 144, 0.10),
                0 4px 12px rgba(0, 0, 0, 0.06);
                /* Solo hero card o carrito flotante */

/* NOTA: Las sombras tienen un tinte PÚRPURA, no negro.
   Esto las hace sentir más cálidas y conectadas con la marca. */
```

---

## 🧩 COMPONENTES — GUÍA DE DISEÑO

### Botones

```
BOTÓN PRIMARIO (acciones principales: confirmar, continuar)
├── Fondo: --purple-600 (#5B2D90)
├── Texto: blanco, 16px, 600 weight
├── Padding: 12px 24px
├── Border-radius: --radius-md (10px)
├── Shadow: --shadow-sm
├── Hover: --purple-700 + --shadow-md + scale(1.01) + transition 200ms ease
├── Active: --purple-800 + scale(0.99)
└── Disabled: opacity 0.5, cursor not-allowed

BOTÓN "AGREGAR AL CARRITO" (★ el más importante de toda la tienda)
├── Fondo: gradiente de --amber-500 → --amber-600
├── Texto: blanco, 16px, 700 weight
├── Padding: 14px 28px (más grande que otros botones)
├── Border-radius: --radius-full (pill shape)
├── Shadow: 0 4px 14px rgba(245, 158, 11, 0.30)  ← glow ámbar
├── Hover: brillo +5%, shadow más intenso, scale(1.02)
├── Active: scale(0.98), shadow disminuye
├── Ícono: ShoppingBag de lucide-react a la izquierda
├── ANIMACIÓN al hacer click:
│   1. El botón hace un "pulse" sutil (scale 1.0 → 1.05 → 1.0, 300ms)
│   2. El ícono del carrito en el header hace un "bounce" breve
│   3. Un toast/notification suave aparece: "✓ Agregado al carrito"
│       con fondo --purple-50 y borde --purple-200
└── POR QUÉ ÁMBAR: El ámbar es el color de "valor" y "acción cálida".
    No se siente agresivo como el rojo, pero genera acción como el naranja.
    Es una INVITACIÓN, no una orden.

BOTÓN SECUNDARIO (acciones alternativas)
├── Fondo: transparente
├── Borde: 1.5px solid --purple-300
├── Texto: --purple-600, 16px, 500 weight
├── Hover: fondo --purple-50, borde --purple-400
└── Active: fondo --purple-100

BOTÓN GHOST (acciones terciarias, "ver más", links)
├── Fondo: transparente
├── Texto: --purple-500, 16px, 500 weight
├── Hover: fondo --purple-50, text --purple-600
├── Underline animation: línea que crece de izquierda a derecha al hover
└── NO tiene borde
```

### Product Card — El Corazón del E-Commerce

```
ESTRUCTURA:
┌─────────────────────────────────┐
│ [Imagen del producto]           │ ← aspect-ratio: 1/1, object-fit: contain
│                                 │    fondo: --snow (#FAFBFC)
│  ♡ (favorito - arriba derecha)  │    border-radius top: --radius-lg
│                                 │
│  🏷️ -15% (badge si aplica)      │ ← posición: arriba izquierda
│                                 │    fondo: --amber-500, texto blanco
│                                 │    radius: --radius-full (pill)
├─────────────────────────────────┤
│ Categoría                       │ ← overline style, --teal-600, uppercase
│ Nombre del Producto             │ ← h4, --ink, 2 líneas max (line-clamp)
│ Laboratorio                     │ ← caption, --silver
│                                 │
│ Q 52.00  Q 65.00               │ ← precio actual (--purple-600 bold)
│                                 │    precio anterior (--silver, tachado)
│                                 │
│ ● En stock                      │ ← badge verde si hay stock
│ ○ Requiere receta               │ ← badge teal si aplica
│                                 │
│ [  🛒 Agregar al carrito  ]     │ ← botón ámbar pill, full width
└─────────────────────────────────┘

ESTILOS:
- Fondo: --white
- Border: 1px solid --mist
- Border-radius: --radius-lg (16px)
- Shadow: --shadow-sm (reposo)
- Padding: 0 (imagen) + --space-5 (contenido)

HOVER:
- Shadow → --shadow-md (transición suave 300ms)
- Imagen → scale(1.03) con overflow hidden (zoom sutil)
- Border → 1px solid --purple-200 (tinte púrpura sutil)
- TODO el card se eleva 2px (translateY(-2px))
- Transición: all 300ms cubic-bezier(0.4, 0, 0.2, 1)

FAVORITO (♡):
- Ícono Heart de lucide, --silver en reposo
- Hover: --heart (#BE1E2D), scale(1.1)
- Click: animación fill + pulse, color --heart
- Es el ÚNICO lugar donde usamos rojo en el storefront
```

### Header / Navegación

```
ESTRUCTURA:
┌────────────────────────────────────────────────────────────┐
│ 🏷️ Envío gratis en compras mayores a Q200 | Ver ofertas → │ ← top bar
├────────────────────────────────────────────────────────────┤
│ [Logo]  [🔍 Buscar medicamentos...]  [♡ 2] [🛒 3] [👤]   │ ← main bar
├────────────────────────────────────────────────────────────┤
│ Medicamentos  Nutrición  Cuidado Personal  Ofertas        │ ← nav bar
└────────────────────────────────────────────────────────────┘

TOP BAR:
- Fondo: --purple-600
- Texto: blanco, 13px, Inter
- Height: 36px
- Puede tener animación de slide para rotar mensajes
- Mensajes: ofertas, info de envío, slogan

MAIN BAR:
- Fondo: --white
- Border bottom: 1px solid --mist
- Shadow: --shadow-sm (sticky al hacer scroll)
- Logo a la izquierda (max-height: 48px)
- Search bar centrado: fondo --snow, borde --mist, radius --radius-full
  Al focus: borde --purple-300, shadow --shadow-md con tinte púrpura
  Placeholder: "¿Qué medicamento necesitas?" (--silver)
  Ícono Search: --purple-400
- Íconos derecha: --charcoal, hover --purple-600
  Badge numérico: fondo --amber-500, texto blanco, radius full, 18px

NAV BAR:
- Fondo: --white
- Links: --charcoal, 15px, 500 weight, Inter
- Hover: --purple-600, underline animation
- Active: --purple-600, font-weight 600
- "Ofertas" puede tener badge: fondo --amber-100, texto --amber-700
- Sticky: sí, pero colapsa top bar al scroll down
```

---

## ✨ ANIMACIONES & MICRO-INTERACCIONES

### Filosofía de Movimiento

```
PRINCIPIO: Las animaciones en Farma Madyson son como la respiración.
Suaves, naturales, casi imperceptibles. Nunca abruptas.

- Duration base: 200-400ms para interacciones, 500-800ms para transiciones de página
- Easing: cubic-bezier(0.4, 0, 0.2, 1) — suave en entrada Y salida
- NUNCA bounce agresivo o spring exagerado
- NUNCA animaciones que bloqueen la interacción
- Preferir opacity + transform sobre cambios de layout
- prefers-reduced-motion: respetar SIEMPRE
```

### Catálogo de Animaciones

```css
/* === FADE IN UP — Para elementos que aparecen al scroll === */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Uso: Secciones del home, cards de producto al entrar en viewport */
/* Duration: 600ms, delay escalonado 100ms entre cards */
/* Implementar con Intersection Observer o framer-motion */

/* === PULSE SUAVE — Para badge de carrito cuando se agrega === */
@keyframes gentlePulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
/* Duration: 400ms, ease-in-out */

/* === SHIMMER — Para skeleton loading === */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Skeleton: linear-gradient(90deg, --cloud, --snow, --cloud) */
/* background-size: 200% 100%, animation: shimmer 1.5s infinite */

/* === SLIDE IN — Para drawer del carrito === */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
/* Duration: 300ms, con backdrop fade 200ms */

/* === FLOAT — Para elementos decorativos del hero === */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-10px); }
}
/* Duration: 3s, ease-in-out, infinite */
/* Uso: íconos decorativos en hero section, MUY sutiles */

/* === HEARTBEAT — Para ícono de favorito al clickear === */
@keyframes heartbeat {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.2); }
  50%  { transform: scale(1); }
  75%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
/* Duration: 500ms */
```

### Transiciones de Estado Importantes

```
ADD TO CART (la interacción más importante):
1. Click en botón ámbar
2. Botón: scale(0.97) → scale(1.02) → scale(1) (300ms)
3. Texto del botón cambia brevemente: "🛒 Agregar" → "✓ Agregado!" (1.5s)
4. Badge del carrito en header: gentlePulse + número incrementa
5. Toast notification slide-in desde arriba derecha:
   "✓ [Nombre producto] agregado al carrito"
   Fondo --white, borde-izquierdo 3px --purple-500
   Auto-dismiss 3 segundos con slide-out

HOVER EN PRODUCT CARD:
- 0ms: cursor entra
- 0-300ms: shadow crece, card se eleva 2px, imagen zoom 3%
- El botón "Agregar" puede aparecer (si estaba oculto en mobile)
- Transición suave, no abrupta

SCROLL REVEAL:
- Secciones del home aparecen con fadeInUp
- Cards en grid aparecen escalonadas (stagger: 80ms entre cada una)
- Las que ya se vieron NO re-animan al scroll up
- Usar intersection observer con threshold 0.1

LOADING STATES:
- NUNCA spinner genérico girando
- Usar skeleton screens con shimmer animation
- El skeleton tiene la MISMA forma que el contenido final
- Color del skeleton: --cloud con shimmer a --snow
- Transición de skeleton a contenido: opacity fade 200ms

PAGE TRANSITIONS:
- Fade sutil entre páginas (opacity 1 → 0.97 → 1, 200ms)
- No se necesita más que eso — la velocidad es reina
```

---

## 🏠 DISEÑO DE PÁGINAS ESPECÍFICAS

### Homepage — La Primera Impresión

```
ESTRUCTURA COMPLETA:

[Top bar púrpura + mensajes rotativos]
[Header con búsqueda]
[Navegación categorías]

═══════════════════════════════════════
HERO SECTION
═══════════════════════════════════════
- Fondo: --white o gradiente ULTRA sutil (white → purple-50)
- Altura: 70vh en desktop, auto en mobile
- Layout: 2 columnas (60% texto, 40% imagen)
- Imagen: persona real sonriendo con bolsa de farmacia
  o ilustración editorial de bienestar (NO fotos genéricas de pastillas)

Texto lado izquierdo:
  [Overline] FARMA MADYSON (--purple-400, 13px, uppercase, tracking wide)
  [H1] "Tu bienestar          ← --ink, 48px, Jakarta 800
        comienza aquí"         ← "comienza" en --purple-600
  [Subtitle] "Medicamentos de calidad al mejor precio,
              con envío a tu puerta"  ← --charcoal, 18px, Inter
  [CTA] [Explorar productos →] ← botón primario púrpura
  [CTA2] [Ver ofertas]        ← botón ghost

  [Trust badges debajo, 3 en fila]:
  🚚 Envío en 24h  |  💊 +1,300 productos  |  🔒 Compra segura

- Los trust badges tienen íconos en --teal-600 y texto en --slate

═══════════════════════════════════════
CATEGORÍAS — Grid visual
═══════════════════════════════════════
- Título: "Explora nuestras categorías" (H2, centrado)
- Grid: 4-6 cards en fila (scroll horizontal en mobile)
- Cada card:
  ┌───────────────────────┐
  │   [Ícono ilustrado]   │ ← ícono de línea suave, --purple-500
  │   sobre fondo cirular │    circle fondo: --purple-50
  │                       │
  │  Nombre Categoría     │ ← 16px, 600, --ink, centrado
  │  24 productos         │ ← 13px, --silver
  └───────────────────────┘
  Fondo: --white, border: --mist, radius: --radius-xl
  Hover: border --purple-200, shadow --shadow-md

═══════════════════════════════════════
OFERTAS DESTACADAS — Franja de atención
═══════════════════════════════════════
- Fondo: --purple-50 (lavanda suave — NUNCA saturado)
- Título: "Ofertas especiales" con badge "🏷️ Ahorra"
- Grid horizontal de ProductCards (scroll en mobile)
- Botón "Ver todas las ofertas →" al final

═══════════════════════════════════════
PRODUCTOS POPULARES
═══════════════════════════════════════
- Fondo: --white
- Título: "Los más buscados"
- Grid 4 columnas de ProductCards
- FadeInUp staggered al scroll

═══════════════════════════════════════
BANNER SECUNDARIO — Servicio de recetas
═══════════════════════════════════════
- Layout: 2 columnas
- Izquierda: ilustración de persona con receta
- Derecha:
  "¿Necesitas medicamento con receta?"
  "Sube tu receta y nosotros hacemos el resto.
   Tu salud es lo primero."
  [Subir mi receta →] botón púrpura

═══════════════════════════════════════
TESTIMONIOS / CONFIANZA
═══════════════════════════════════════
- Fondo: --snow
- Título: "Miles de familias confían en nosotros"
- Cards de testimonio con avatar, nombre, estrellas, texto
- Estrellas: --amber-400
- Carousel suave o grid de 3

═══════════════════════════════════════
SLOGAN CIERRE
═══════════════════════════════════════
- Fondo: gradiente sutil --purple-600 → --purple-700
- Texto blanco, centrado:
  "Donde comienza el bienestar" (32px, Jakarta, 700)
  "Farma Madyson — Cuidamos de ti y de tu bolsillo" (16px, Inter)
- MUY limpio, mucho padding, solo texto

═══════════════════════════════════════
FOOTER
═══════════════════════════════════════
- Fondo: --ink (#1F2937)
- Texto: blanco/silver
- Columnas: Navegación, Servicio al cliente, Contacto, Legal
- Logo en blanco
- Social icons
- Badge: "Licencia Sanitaria MSPAS"
- Copyright
```

### Product Detail Page (PDP) — Donde Se Decide la Compra

```
- Fondo: --white
- Layout: 2 columnas (50/50)

IZQUIERDA — Galería:
- Imagen principal grande, radius --radius-xl
- Thumbnails debajo (4 max)
- Zoom on hover (scale 1.5 dentro de contenedor)
- Fondo de imagen: --snow

DERECHA — Info:
- Breadcrumb: Home > Categoría > Producto (--silver, links --purple-500)
- Overline: "LABORATORIO INFASA" (--teal-600, uppercase, 12px)
- H1: Nombre del producto (--ink, 28px, Jakarta 700)
- Stars: ★★★★☆ 4.2 (12 reseñas) (estrellas --amber-400)
- Badge: "● En stock" (--success) o "Requiere receta" (--teal-600)
- Separator: línea --mist

- PRECIO:
  Q 25.00                    ← --purple-600, 32px, Jakarta 800
  Q 35.00                    ← --silver, 18px, tachado (si hay descuento)
  Ahorras Q 10.00 (29%)      ← --success, 14px, badge con fondo --success-light

- IVA: "IVA incluido" o "Precio exento de IVA" (--silver, 13px)

- CANTIDAD: Selector [-] [1] [+] con bordes --mist, número --ink

- [  🛒 Agregar al carrito  ]  ← BOTÓN ÁMBAR GRANDE, full width
- [  ♡ Agregar a favoritos  ]  ← botón ghost debajo

- TABS: (shadcn Tabs)
  [Descripción] [Info Farmacéutica] [Reseñas (12)]
  
  Tab "Info Farmacéutica" es CLAVE — diferenciador:
  ┌──────────────────────────────────────┐
  │ Principio activo:  Amoxicilina       │
  │ Concentración:     500mg             │
  │ Forma:             Cápsula           │
  │ Vía:               Oral              │
  │ Grupo terapéutico: Antibiótico       │
  │ Reg. Sanitario:    PF-41979          │
  ├──────────────────────────────────────┤
  │ ⚠️ Contraindicaciones               │
  │ ℹ️ Efectos secundarios              │
  │ 📋 Condiciones de almacenamiento    │
  └──────────────────────────────────────┘
  Fondo: --teal-50, border: --teal-200
  Esto NO lo tiene nadie en Guatemala.
  Es el diferenciador de experiencia.
```

### Checkout — Confianza Máxima

```
FILOSOFÍA: El checkout es el momento de MÁXIMA ansiedad.
Todo debe transmitir: "Estás seguro aquí".

- Fondo: --snow (ligeramente off-white, se siente más cálido)
- Header simplificado: solo logo + "Checkout seguro 🔒"
- Progress bar: 3 pasos con dots conectados por línea
  Paso activo: dot --purple-600
  Paso completado: dot --success + check
  Paso pendiente: dot --mist

- Sidebar derecho FIJO: resumen del pedido
  Card con fondo --white, border --mist, shadow --shadow-sm
  Lista de items: miniatura + nombre + cantidad + precio
  Subtotal, IVA (desglosado), Envío, TOTAL
  Total en 24px, --purple-600, bold
  Debajo: "🔒 Transacción segura" (--silver, 13px)

- Trust badges al fondo:
  🔒 Datos encriptados
  💊 Productos con registro sanitario
  📦 Seguimiento de tu pedido
  Fondo: --purple-50, radius --radius-xl
```

---

## 🖥️ ADMIN DASHBOARD — Diseño Profesional Clínico

```
FILOSOFÍA: El admin NO necesita ser sexy. Necesita ser CLARO.
Un farmacéutico o dueño de negocio necesita ver datos rápido.

SIDEBAR:
- Fondo: --ink (#1F2937) con gradiente sutil a --purple-900
- Logo en blanco, pequeño arriba
- Items: íconos --silver + texto 14px --silver
- Item hover: fondo rgba(255,255,255,0.05), texto blanco
- Item activo: fondo --purple-600/20%, texto blanco, borde izquierdo 3px --purple-400
- Colapsable a solo íconos (64px width)

TOPBAR:
- Fondo: --white
- Breadcrumb + título de página a la izquierda
- Notificaciones (bell) + perfil a la derecha
- Badge de notificaciones: --amber-500

CONTENT AREA:
- Fondo: --snow
- Cards: --white, radius --radius-lg, shadow --shadow-sm
- Tables: header --cloud, rows alternadas --snow/--white
- Botones de acción: purpura primario, secondary para cancelar

STATS CARDS (dashboard):
┌─────────────────┐
│ 📦 Pedidos Hoy  │
│     12          │ ← 32px, --ink, bold
│ +3 vs ayer      │ ← 13px, --success
│ ─── mini chart  │ ← sparkline --purple-300
└─────────────────┘
Fondo: --white, border-top 3px --purple-500 (o --teal-500, --amber-500 según tipo)
```

---

## 📱 RESPONSIVE — Mobile First

```
BREAKPOINTS:
- mobile: 0 - 639px
- tablet: 640px - 1023px
- desktop: 1024px - 1279px
- wide: 1280px+

MOBILE ESPECÍFICO:
- Header: logo centrado, search colapsable, íconos compactos
- Bottom nav bar FIJA: 🏠 Home | 🔍 Buscar | ♡ Favoritos | 🛒 Carrito | 👤 Cuenta
  Fondo: --white, shadow up, 60px height
  Ícono activo: --purple-600
  Badge carrito: --amber-500

- Product cards en grid 2 columnas
- Botón "Agregar al carrito" siempre visible (no solo en hover)
- PDP: imagen full width arriba, info debajo (single column)
- Checkout: single column, sidebar se convierte en accordion
- Touch targets: mínimo 44x44px en TODOS los botones
```

---

## 🔑 REGLAS FINALES PARA COPILOT/AI

```
1. BLANCO ES EL REY — El 60% de la pantalla debe ser blanco/snow/cloud.
   Si una sección se siente "pesada" visualmente, añade más espacio blanco.

2. PURPLE PARA IDENTIDAD — Es el color de Madyson. Headers, botones primarios,
   links, sidebar del admin. Pero NUNCA fondos grandes púrpura saturado.
   Solo gradientes MUY suaves (white → purple-50).

3. ÁMBAR PARA ACCIÓN — "Agregar al carrito" es SIEMPRE ámbar.
   Badges de oferta son ámbar. Estrellas son ámbar.
   Es el color que dice "esto te beneficia, tómalo".

4. TEAL PARA INFORMACIÓN MÉDICA — Todo lo clínico/farmacéutico:
   badges de categoría médica, tab de info farmacéutica, datos técnicos.
   Dice "esto es serio y profesional".

5. ESQUINAS SUAVES SIEMPRE — Mínimo 6px en todo.
   Cards: 16px. Pills/badges: full round. Hero sections: 20px+.
   Las esquinas suaves = seguridad = bienestar.

6. ANIMACIONES COMO RESPIRACIÓN — Suaves, 200-400ms, ease-in-out.
   FadeInUp para entradas. Hover transitions en 300ms.
   El botón de carrito tiene una micro-celebración al click.
   NADA de bounce, shake o flash agresivo.

7. SOMBRAS CON TINTE PÚRPURA — Las sombras no son grises/negras.
   Tienen un sutil tinte de purple-600 (rgba(91, 45, 144, 0.06-0.10)).
   Esto conecta cada sombra con la marca subconscientemente.

8. IMÁGENES REALES Y CÁLIDAS — No fotos de stock genéricas de pastillas.
   Personas sonriendo, familias, farmacéuticos amables.
   Si no hay fotos: ilustraciones editoriales con paleta de marca.

9. PRECIO SIEMPRE VISIBLE Y CLARO — Precio actual grande en purple-600.
   Precio anterior tachado en silver. Ahorro en badge success.
   NUNCA esconder el precio. NUNCA confundir con decoración.

10. EL SLOGAN ES SAGRADO — "Donde comienza el bienestar" debe aparecer
    en: hero, footer, emails, confirmación de pedido.
    Es la PROMESA. Todo lo que diseñamos la cumple.
```

---

> **RECUERDA**: Farma Madyson no compite por ser la farmacia más barata.
> Compite por ser la farmacia que te hace **sentir** que tu bienestar importa.
> Eso se comunica en cada pixel, cada transición, cada palabra.
> Si algo se siente frío, genérico o agresivo — no es Madyson. Cámbialo.
