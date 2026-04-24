# CLAUDE.md — IT Solutions Project Config

## Sobre este proyecto

Empresa de IT Solutions especializada en:

- SEO y Marketing Digital
- Desarrollo Web
- Desarrollo de Apps (React Native)

## Stack tecnológico

- **Frontend Web**: JavaScript, React
- **Mobile**: React Native
- **Estilos**: Tailwind CSS (preferido), CSS Modules como alternativa
- **Bundler**: Vite (web), Expo (mobile)
- **Control de versiones**: Git

---

## Skills disponibles

Antes de cualquier tarea, Claude debe verificar si aplica alguno de estos skills.
Los archivos están en la carpeta `/my-skills/` en la raíz del proyecto.

| Skill               | Ubicación                           | Cuándo usarlo                                                                         |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `frontend-design`   | `skills/frontend-design/SKILL.md`   | Componentes UI, landing pages, dashboards, cualquier interfaz web o React             |
| `ui-ux-pro-max`     | `skills/ui-ux-pro-max/SKILL.md`     | Diseño avanzado de UI, paletas de color, tipografía, sistemas de diseño, React Native |
| `using-superpowers` | `skills/using-superpowers/SKILL.md` | Leer al inicio de cada conversación para activar el flujo correcto de skills          |
| `skill-creator`     | `skills/skill-creator/SKILL.md`     | Crear, modificar o evaluar nuevos skills                                              |

> **Regla:** Si hay aunque sea un 1% de chance de que un skill aplique → leerlo ANTES de escribir cualquier código o respuesta.

---

## Reglas de código

### General

- Siempre usar **TypeScript** si el proyecto ya lo tiene configurado
- Comentar funciones complejas en **español**
- Nombrar variables y funciones en **inglés**
- Preferir **funciones puras** y componentes sin efectos secundarios innecesarios

### React (Web)

- Componentes funcionales con **hooks** (no class components)
- Un componente por archivo
- Props tipadas con TypeScript o PropTypes
- Estilos con Tailwind CSS como primera opción

### React Native (Mobile)

- Usar **Expo** como base
- Navegación con **React Navigation**
- Estado global con **Zustand** o **Context API**
- Evitar lógica de negocio dentro de componentes UI

### SEO / Marketing

- Componentes de landing page deben incluir semántica HTML correcta (`<main>`, `<section>`, `<article>`, etc.)
- Imágenes siempre con atributo `alt` descriptivo
- Rutas y slugs en **kebab-case** y en el idioma del cliente

---

## Estructura de carpetas preferida

```
proyecto/
├── my-skills/                    # Skills personales de Claude
│   ├── frontend-design/
│   │   └── SKILL.md
│   ├── ui-ux-pro-max/
│   │   └── SKILL.md
│   ├── using-superpowers/
│   │   └── SKILL.md
│   └── skill-creator/
│       └── SKILL.md
├── src/
│   ├── components/               # Componentes reutilizables
│   ├── pages/                    # Páginas / Screens
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # Llamadas a API
│   ├── utils/                    # Funciones utilitarias
│   ├── assets/                   # Imágenes, fuentes, íconos
│   └── styles/                   # Variables globales de estilos
├── public/
├── CLAUDE.md                     # Este archivo
└── README.md
```

---

## Estilo de respuestas

- Responder en **español** salvo que el código lo requiera en inglés
- Explicaciones **concisas** — sin relleno innecesario
- Cuando generes código, incluir **comentarios clave** pero no sobreexplicar lo obvio
- Si hay varias formas de hacer algo, mencionar la recomendada y **por qué**

---

## Prioridades al resolver tareas

1. ✅ Que funcione correctamente
2. 🎨 Que se vea profesional (aplicar skill de diseño si aplica)
3. ⚡ Que sea eficiente / performante
4. 📦 Que sea reutilizable y mantenible
