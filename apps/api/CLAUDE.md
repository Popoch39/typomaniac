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

Plugins dans `src/plugins/`, montés par `createApp` dans cet ordre : request-id, request-logger, security-headers, cors, error-handler, rate-limit.

- **Logger** : pino, créé dans `src/index.ts` (`src/logger.ts`) et injecté via `AppConfig.logger`. JSON sur stdout si `NODE_ENV=production`, sinon `pino-pretty` (transport worker, dev uniquement : il ne marche pas dans le binaire compilé). Niveau : `LOG_LEVEL`. Une ligne `request` par requête (méthode, path, status, durée, requestId). Dans un handler, utiliser `log` du contexte : il porte déjà le `requestId`.
- **Request ID** : `X-Request-Id` repris s'il est sûr (`[\w.-]{1,128}`), sinon UUID ; renvoyé dans la réponse. `requestIdOf(request)` pour le lire hors contexte (hooks d'erreur).
- **En-têtes de sécurité** : plugin maison façon helmet pour une API JSON (nosniff, CSP `default-src 'none'`, frame DENY, referrer, CORP/COOP). HSTS seulement en prod.
- **Erreurs** : les erreurs inattendues répondent `500 { error, requestId }` sans message ni stack (loggés côté serveur). 404, validation et parse gardent la réponse d'Elysia.
- **Rate limit** : `elysia-rate-limit` **v4** (la v5 exige Elysia 2), `RATE_LIMIT_MAX` requêtes par `RATE_LIMIT_WINDOW_MS` et par IP, `/health` exclu. Store maison `FixedWindowStore` : le `DefaultContext` de la lib renvoie un compteur mutable partagé et met en 429 toutes les requêtes concurrentes. Store en mémoire, par process : à revoir si l'API passe sur plusieurs instances. IP lue dans `X-Forwarded-For` seulement si `TRUST_PROXY=true`.
- **Body** : 1 Mo max (`maxRequestBodySize` dans `listen`), 413 au-delà.

## Eden Treaty

- `src/app.ts` construit l'app (`createApp`) et exporte `type App`, consommé par le front via `import type { App } from "api"` (champ `exports` du `package.json`). `src/index.ts` ne fait que migrer et `listen()`.
- Routes chaînées sur une seule expression, sinon Eden perd l'inférence.
- `app.ts` ne doit pas importer `env.ts` : le front typecheck ce graphe de fichiers.
