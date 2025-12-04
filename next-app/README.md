## Hybrid Next + Vite Runtime

This `next-app/` directory hosts the SEO-focused Next.js 16 build. The legacy Vite SPA remains at the repo root. A small middleware layer (see `middleware.ts`) rewrites any routes that are not yet implemented in Next to the running Vite server, so both apps can coexist until each screen is ported.

### Development workflow

1. **Start the Vite app** (legacy experience):

	```bash
	npm run dev
	```

	This runs on [http://localhost:8081](http://localhost:8081).

2. **Start the Next app** in a separate terminal:

	```bash
	cd next-app
	cp .env.example .env.local # set LEGACY_APP_ORIGIN if needed
	npm install
	npm run dev
	```

	By default the Next dev server runs on [http://localhost:3000](http://localhost:3000). Unported routes are transparently proxied to the Vite dev server defined by `LEGACY_APP_ORIGIN`.

### Environment variables

| Variable | Description |
| --- | --- |
| `LEGACY_APP_ORIGIN` | Base URL where the Vite SPA is running. Required for the middleware rewrite (e.g., `http://localhost:8081` in development, `https://app.petskub.com` in production). |

### Adding native Next routes

`middleware.ts` tracks which paths are handled by Next via the `nativeRoutes` array. Add any newly ported route (e.g., `"/help"`) to the list so that the middleware stops proxying that path to the Vite origin.

### Production deployment strategy

1. Deploy the Vite build as usual (Netlify, Vercel Static, etc.).
2. Deploy `next-app` separately (e.g., Vercel). Set `LEGACY_APP_ORIGIN` to the publicly reachable URL of the Vite deployment.
3. Next will serve any ported routes with full SSR/SEO benefits and transparently rewrite all remaining paths to the legacy host.

When all routes are migrated you can remove the middleware entirely and retire the Vite deployment.
