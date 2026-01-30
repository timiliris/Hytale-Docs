# HytaleDocs

Documentación y wiki de la comunidad para [Hytale](https://hytale.com), el próximo juego de Hypixel Studios.

**Sitio en vivo:** [hytale-docs.com](https://hytale-docs.com)

## Características

- **Multilingüe** - Soporte completo para inglés, francés y español (En proceso)
- **Documentación** - Guías completas para jugabilidad, modding, servidores y API
- **Herramientas Interactivas** - Calculadora de servidor, generador de proyectos, validador de JSON
- **Modo Oscuro/Claro** - Soporte de temas con detección de preferencias del sistema
- **Optimizado para SEO** - Sitemap, datos estructurados, meta etiquetas
- **Responsivo** - Diseño adaptado a dispositivos móviles

## Tecnologías

- [Next.js 16](https://nextjs.org/) - Framework de React
- [TypeScript](https://www.typescriptlang.org/) - Seguridad de tipos
- [Tailwind CSS](https://tailwindcss.com/) - Estilización
- [shadcn/ui](https://ui.shadcn.com/) - Componentes de interfaz de usuario
- [next-intl](https://next-intl-docs.vercel.app/) - Internacionalización
- [MDX](https://mdxjs.com/) - Contenido de documentación

## Primeros Pasos

### Requisitos Previos

- Node.js >= 20.9.0
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/timiliris/Hytale-Docs.git
# Clonar el repositorio español
git clone https://github.com/KANEKICODE/Hytale-Docs-Spanish.git

# Luego de clonar el repositorio accede al directorio
cd Hytale-Docs
# en caso de que clones el español
cd Hytale-Docs-Spanish

# Instalar dependencias
npm install

# Ejecutar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver el sitio.

### Compilación (Build)

```bash
npm run build
npm start
```

## Estructura del Proyecto

```
src/
├── app/                  # Router de Next.js
│   ├── [locale]/         # Páginas localizadas
│   │   ├── docs/         # Páginas de documentación
│   │   ├── tools/        # Herramientas interactivas
│   │   ├── privacy/      # Política de privacidad
│   │   └── terms/        # Términos de uso
│   ├── sitemap.ts        # Sitemap dinámico
│   └── robots.ts         # Robots.txt
├── components/           # Componentes de React
│   ├── homepage/         # Secciones de la página de inicio
│   ├── layout/           # Barra de navegación, pie de página, barra lateral
│   ├── mdx/              # Componentes MDX
│   ├── seo/              # Datos estructurados JSON-LD
│   └── ui/               # Componentes de shadcn/ui
├── content/              # Archivos de documentación MDX
│   └── docs/
│       ├── en/           # Documentación en inglés
│       ├── es/           # Documentación en español
│       └── fr/           # Documentación en francés
├── i18n/                 # Configuración de internacionalización
├── lib/                  # Utilidades
└── messages/             # Archivos de traducción
    ├── en.json
    ├── es.json
    └── fr.json
```

## Contribuir

¡Las contribuciones son bienvenidas! Siéntete libre de:

1. Hacer un Fork del repositorio
2. Crear una rama para tu característica (`git checkout -b feature/increible-caracteristica`)
3. Confirmar tus cambios (`git commit -m 'Añadir característica increíble'`)
4. Subir la rama (`git push origin feature/increible-caracteristica`)
5. Abrir un Pull Request

### Añadir Documentación

La documentación se escribe en formato MDX. Añade nuevos archivos en `content/docs/[locale]/`.

## Licencia

Este proyecto utiliza un enfoque de **licencia dual**:

| Componente             | Licencia                       | Resumen                                                                    |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| **Código Fuente**      | [Elastic License 2.0](LICENSE) | Ver, hacer fork, contribuir. No se permite hostear un servicio competidor. |
| **Documentación**      | [CC BY-NC-SA 4.0](LICENSE)     | Compartir y adaptar con atribución. No comercial.                          |
| **Marcas Registradas** | Todos los derechos reservados  | El nombre y logo "HytaleDocs" están protegidos.                            |

**PUEDES:**

- Ver y estudiar el código fuente
- Hacer un fork del proyecto para contribuir con mejoras
- Usar la documentación para fines personales/educativos

**NO PUEDES:**

- Hostear un servicio competidor usando esta base de código
- Usar el código o contenido para fines comerciales
- Usar el nombre/marca de HytaleDocs sin permiso

Consulta el archivo [LICENSE](LICENSE) completo para más detalles.

## Aviso Legal

HytaleDocs es un proyecto de la comunidad y **no está afiliado, respaldado ni conectado con Hypixel Studios o Riot Games**. Hytale es una marca registrada de Hypixel Studios.

---

Hecho con ❤️ por la comunidad de Hytale
