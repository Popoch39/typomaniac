# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# apps/api

API backend en [Elysia](https://elysiajs.com) sur le runtime Bun. Point d'entrée : `src/index.ts` (serveur sur le port 3000).

## Skill Elysia obligatoire

**Avant de créer, modifier ou relire un fichier qui utilise Elysia** (routes, plugins, handlers, schémas de validation, config du serveur), invoquer le skill `elysiajs`. Pas d'exception pour les petites modifications : l'API d'Elysia évolue vite et le skill porte les patterns à jour.

## Commandes

Depuis `apps/api` :

| Commande              | Rôle                                                           |
| --------------------- | -------------------------------------------------------------- |
| `bun run dev`         | Lance le serveur en watch (`src/index.ts`)                     |
| `bun run test`        | `bun test`                                                     |
| `bun run build`       | Binaire compilé dans `dist/server`                             |
| `bun run check-types` | `tsc --noEmit`                                                 |
| `bun run db:generate` | `drizzle-kit generate` : SQL de migration dans `drizzle/`      |
| `bun run db:migrate`  | Applique les migrations (même migrator Bun.SQL que le serveur) |

Lint et format se lancent depuis la racine du monorepo (voir le `CLAUDE.md` racine).

## Base de données

- Postgres + Drizzle, driver `drizzle-orm/bun-sql`. Schéma : `src/database/schema.ts`, client : `src/database/client.ts`.
- Postgres de dev : `docker compose up -d db` depuis la racine (port hôte **5434**, identifiants dans `.env` racine, voir `.env.example`).
- Config de l'api : `apps/api/.env` (voir `.env.example`), validée au démarrage par `src/parse-env.ts`. Toute nouvelle variable passe par ce schéma.
- Migrations : `db:generate` après chaque changement de schéma, fichiers SQL versionnés. Le serveur les applique au démarrage, avant `listen()`. Pas de `drizzle-kit push` ni `drizzle-kit migrate` (pas de driver Node installé).
- `drizzle-typebox` pour dériver les modèles Elysia du schéma. `@sinclair/typebox` est épinglé à la version qu'utilise Elysia : les monter ensemble.

## Image de prod

`apps/api/Dockerfile`, à builder depuis la racine : `docker build -f apps/api/Dockerfile -t typomaniac-api .`. Binaire compilé dans une image distroless, dossier `drizzle/` embarqué. Variables requises à l'exécution : `DATABASE_URL` (et `PORT`, 3000 par défaut ; `CORS_ORIGIN`, origine du front, `http://localhost:5173` par défaut). En prod, poser `NODE_ENV=production` (logs JSON, HSTS) et trancher `TRUST_PROXY` selon l'hébergement.

## Logs et sécurité

Plugins dans `src/plugins/`, montés par `createApp` dans cet ordre : request-id, request-logger, security-headers, cors, error-handler, body-limit, rate-limit. L'error-handler doit rester avant les plugins qui rejettent des requêtes.

- **Logger** : pino, créé dans `src/index.ts` (`src/logger.ts`) et injecté via `AppConfig.logger`. JSON sur stdout si `NODE_ENV=production`, sinon `pino-pretty` (transport worker, dev uniquement : il ne marche pas dans le binaire compilé). Niveau : `LOG_LEVEL`. Une ligne `request` par requête (méthode, path, status, durée, requestId). Dans un handler, utiliser `log` du contexte : il porte déjà le `requestId`.
- **Request ID** : `X-Request-Id` repris s'il est sûr (`[\w.-]{1,128}`), sinon UUID ; renvoyé dans la réponse. `requestIdOf(request)` pour le lire hors contexte (hooks d'erreur).
- **En-têtes de sécurité** : plugin maison façon helmet pour une API JSON (nosniff, CSP `default-src 'none'`, frame DENY, referrer, CORP/COOP). HSTS seulement en prod.
- **Rate limit** : plugin maison (`FixedWindowStore`, compteurs immuables : `elysia-rate-limit` v4 rejetait toutes les requêtes concurrentes proches de la limite). `RATE_LIMIT_MAX` requêtes par `RATE_LIMIT_WINDOW_MS` et par IP, 404 compris, `/health` exclu ; en-têtes `RateLimit-*` et `Retry-After`. En mémoire, par process : à revoir si l'API passe sur plusieurs instances. IP lue dans `X-Forwarded-For` seulement si `TRUST_PROXY=true`.
- **Body** : 1 Mo max sur le `Content-Length` déclaré (`body-limit`, 413 au format API). Bun garde une limite dure de 4 Mo (`maxRequestBodySize`) qui répond un 413 vide : elle doit rester au-dessus de la nôtre.

## Erreurs

Toute erreur sort au même format, défini dans `src/errors.ts` et réexporté par `app.ts` pour le front (`import type { ApiErrorBody } from "api"`) :

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "…",
    "requestId": "…",
    "details": [{ "path": "/name", "message": "…" }]
  }
}
```

- Codes : `BAD_REQUEST` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `PAYLOAD_TOO_LARGE` 413, `VALIDATION_FAILED` 422, `TOO_MANY_REQUESTS` 429, `INTERNAL_SERVER_ERROR` 500. Un nouveau cas se déclare dans `ERRORS`.
- Dans un handler ou un service : `throw new ApiError("FORBIDDEN", "message lisible")`. Le message part au client : jamais de détail interne.
- L'error-handler traduit aussi les erreurs d'Elysia (route inconnue, JSON invalide, validation avec `details`) et un `throw status(409, …)` (code déduit du status, payload ignoré). Une réponse qui viole son propre schéma est un 500.
- Tout le reste devient `INTERNAL_SERVER_ERROR` générique ; les 5xx sont loggés avec stack et `requestId`.
- Un `return status(…)` n'est **pas** une erreur pour Elysia : il ne passe pas par l'error-handler. Pour une erreur, `throw`.

## Eden Treaty

- `src/app.ts` construit l'app (`createApp`) et exporte `type App`, consommé par le front via `import type { App } from "api"` (champ `exports` du `package.json`). `src/index.ts` ne fait que migrer et `listen()`.
- Routes chaînées sur une seule expression, sinon Eden perd l'inférence.
- `app.ts` ne doit pas importer `env.ts` : le front typecheck ce graphe de fichiers.
