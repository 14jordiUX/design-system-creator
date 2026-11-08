# Web: Design System Creator

Código de la web. Tú no necesitas tocar nada de aquí: para verla, abre **`Abrir la web.html`** en la carpeta principal.

## Para Claude (o quien la mantenga)

- Vite + React + Tailwind v4 + componentes de shadcn/ui (en `src/components/ui`, copiados del repositorio oficial).
- Lee los sistemas en tiempo de compilación desde `../base/` y `../systems/*/` (`system.json` + `tokens/*.tokens.json`).
- Se compila en un único HTML que funciona con doble clic, sin servidor:

```
cd web
npm install
npm run build            # genera dist/index.html
cp dist/index.html "../Abrir la web.html"
```

- `npm run dev` abre la versión de desarrollo; `npm run typecheck` revisa tipos.
- Rutas: `#/` biblioteca, `#/nuevo` cuestionario, `#/s/<id>` modo cliente, `#/s/<id>/editar` modo editor, `#/s/<id>/prototipos/<slug>` prototipos, `#/p/<id>/<slug>` prototipo a pantalla completa (sin la web alrededor).
