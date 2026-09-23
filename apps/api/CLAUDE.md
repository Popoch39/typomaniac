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

`apps/api/Dockerfile`, à builder depuis la racine : `docker build -f apps/api/Dockerfile -t typomaniac-api .`. Binaire compilé dans une image distroless, dossier `drizzle/` embarqué. Variables requises à l'exécution : `DATABASE_URL` (et `PORT`, 3000 par défaut).
