# Nginx

There are **two** nginx configs with different jobs. Both matter only in the **production** stack (`docker-compose.yml`); dev uses neither. Context: [ARCHITECTURE.md](../ARCHITECTURE.md#runtime-topology-dev-vs-prod).

## 1. Reverse proxy — `nginx/nginx.conf` (the `nginx` service, port 3000)

Owns host port `3000` and forwards everything to the backend container (which exposes no host port).

```nginx
server {
    listen 3000;
    server_name localhost;

    location / {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- `proxy_pass http://backend:3000` resolves `backend` via Docker DNS on `app-network`.
- Upgrade/Connection headers make it WebSocket-ready (not used today, but future-proof).
- This is why the browser can call `http://localhost:3000/notes` in prod even though the backend has no published port — it's hitting this proxy, which forwards in-network.

## 2. SPA static server — `frontend/nginx.conf` (baked into the frontend image, port 80)

Serves the built React app and handles client-side routing.

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA fallback: unknown paths return index.html so react-router can handle them
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-cache fingerprinted assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Never cache the HTML entry
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

- **SPA fallback** (`try_files … /index.html`) is essential: a deep link like `/notes/abc` must return `index.html` so the client router renders the right page instead of a 404.
- **Caching split**: hashed static assets are immutable for a year; `index.html` is never cached so new deploys are picked up immediately.
- Copied into the image at `/etc/nginx/conf.d/default.conf` by `frontend/Dockerfile`.

## Request routing in production

```
Browser ──GET /────────────────► frontend nginx :80  → dist/index.html + assets
Browser ──fetch /notes ─────────► reverse-proxy nginx :3000 → backend:3000
```

The two are independent servers on different ports; the SPA's API base (`VITE_API_URL`, default `http://localhost:3000`) points at the reverse proxy. See [ENV_VARS.md](../ENV_VARS.md).

## Editing

Treat these as infrastructure — **don't modify unless explicitly asked** (root [CLAUDE.md](../../CLAUDE.md)). If you add API paths that need proxying under a prefix, or new asset types, update the relevant config here and note it in this doc.
