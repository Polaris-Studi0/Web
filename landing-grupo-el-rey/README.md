# Landing page — Almacenes El Rey

Landing estática, responsive y sin proceso de compilación. Incluye las diez sedes, un único WhatsApp con etiquetas para n8n/IA, atención general, Instagram, geolocalización y comparación de rutas en carro con OSRM/OpenStreetMap (sin API key).

## Configuración antes de publicar

Abre `app.js` y cambia al principio:

- `whatsappNumber`: número único en formato internacional, solo dígitos (por ejemplo `573001234567`).
- `instagramUrl`: URL completa del perfil oficial.

Las coordenadas incluidas son aproximaciones iniciales basadas en las direcciones suministradas. Deben validarse físicamente o con los enlaces “Cómo llegar” antes de publicar.

## Probar localmente

La geolocalización funciona en `localhost` o en un sitio con HTTPS. Desde esta carpeta:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

## Despliegue

Sube `index.html`, `styles.css` y `app.js` a cualquier hosting estático (Cloudflare Pages, GitHub Pages, Netlify, Vercel o el hosting actual). No requiere variables secretas, API key ni servidor propio.

## Contexto enviado a WhatsApp

Cada conversación incluye etiquetas fáciles de extraer en n8n:

```text
[ORIGEN:WEB] [SEDE:robledo-aures] [METODO_SELECCION:MANUAL]
```

Para atención general usa `SEDE:general`; al escoger por rutas usa `METODO_SELECCION:CERCANIA_RUTA`.

## Uso responsable del servicio gratuito

La página hace una sola consulta de matriz de rutas a OSRM cuando el visitante solicita su sede cercana. Si el servicio público falla o tarda más de 12 segundos, ordena las sedes por distancia aproximada y lo indica claramente. Para alto tráfico conviene desplegar una instancia propia de OSRM o contratar un proveedor compatible.
