# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# apps/api

API backend en [Elysia](https://elysiajs.com) sur le runtime Bun. Point d'entrée : `src/index.ts` (serveur sur le port 3000).

**Préfixe global `/api`** (`API_PREFIX`, `src/api-prefix.ts`) : `createApp` est une `new Elysia({ prefix })`, donc toute route (y compris celles des plugins montés, comme la doc) vit sous `/api` ; hors préfixe, tout répond 404. Une route se déclare sans le préfixe (`.get("/health")`). Les hooks `onRequest` voient le pathname complet : ils comparent à `` `${API_PREFIX}/…` ``.

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

`apps/api/Dockerfile`, à builder depuis la racine : `docker build -f apps/api/Dockerfile -t typomaniac-api .`. Binaire compilé dans une image distroless, dossier `drizzle/` embarqué. Variables requises à l'exécution : `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (et `PORT`, 3000 par défaut ; `CORS_ORIGIN`, origine du front, `http://localhost:5173` par défaut). En prod, poser `NODE_ENV=production` (logs JSON, HSTS) et trancher `TRUST_PROXY` selon l'hébergement.

## Logs et sécurité

Plugins dans `src/plugins/`, montés par `createApp` dans cet ordre : request-id, request-logger, security-headers, cors, api-docs, error-handler, body-limit, rate-limit, authentication. L'error-handler doit rester avant les plugins qui rejettent des requêtes.

- **Logger** : pino, créé dans `src/index.ts` (`src/logger.ts`) et injecté via `AppConfig.logger`. JSON sur stdout si `NODE_ENV=production`, sinon `pino-pretty` (transport worker, dev uniquement : il ne marche pas dans le binaire compilé). Niveau : `LOG_LEVEL`. Une ligne `request` par requête (méthode, path, status, durée, requestId). Dans un handler, utiliser `log` du contexte : il porte déjà le `requestId`.
- **Request ID** : `X-Request-Id` repris s'il est sûr (`[\w.-]{1,128}`), sinon UUID ; renvoyé dans la réponse. `requestIdOf(request)` pour le lire hors contexte (hooks d'erreur).
- **En-têtes de sécurité** : plugin maison façon helmet pour une API JSON (nosniff, CSP `default-src 'none'`, frame DENY, referrer, CORP/COOP). HSTS seulement en prod.
- **Rate limit** : plugin maison (`FixedWindowStore`, compteurs immuables : `elysia-rate-limit` v4 rejetait toutes les requêtes concurrentes proches de la limite). `RATE_LIMIT_MAX` requêtes par `RATE_LIMIT_WINDOW_MS` et par IP, 404 compris, `/api/health` exclu ; en-têtes `RateLimit-*` et `Retry-After`. En mémoire, par process : à revoir si l'API passe sur plusieurs instances. IP lue dans `X-Forwarded-For` seulement si `TRUST_PROXY=true` (`clientIp`, `src/plugins/client-ip.ts`).
- **Rate limit de Better Auth** : actif en plus du nôtre sur `/api/auth/*`, dans tous les environnements (`rateLimit.enabled` dans `authOptions`), avec ses règles par défaut (3 tentatives de connexion par 10 s et par IP). Réponse 429 au format Better Auth. Compteurs sur `FixedWindowStore` (`customStorage`, un store par instance : celui de Better Auth est une `Map` partagée par tout le module). Better Auth ne lit l'IP que dans un en-tête : le plugin `authentication` écrit celle de `clientIp` dans `x-typomaniac-client-ip` (`CLIENT_IP_HEADER`, écrasé si le client l'envoie), seul en-tête lu (`advanced.ipAddress.ipAddressHeaders`). Sans serveur (`app.handle`), Better Auth retombe sur `127.0.0.1` : un seul compteur.
- **Body** : 1 Mo max sur le `Content-Length` déclaré (`body-limit`, 413 au format API). Bun garde une limite dure de 4 Mo (`maxRequestBodySize`) qui répond un 413 vide : elle doit rester au-dessus de la nôtre.

## Auth

Better Auth, OAuth uniquement (ADR `docs/adr/0001-…`, vocabulaire User / Account / Session dans `CONTEXT.md` à la racine).

- **Instance** : `createAuth` (`src/auth.ts`) avec l'adapter Drizzle, appelé par `src/index.ts` avec l'env parsé et injecté via `AppConfig.auth`. `app.ts` ne dépend que du type (`AuthHandler`). Les options (Session, cookies, `trustedOrigins`, fournisseurs) sont dans `authOptions`, partagées avec les tests.
- **Montage** : `src/plugins/authentication.ts` route `/api/auth/*` vers le handler (`basePath` `/api/auth`). Pas de `.mount("/auth", …)` : il retire le chemin de l'URL et Better Auth route sur l'URL complète.
- **Macro `auth`** : `{ auth: true }` sur une route exige une Session ; sans Session valide, `ApiError("UNAUTHORIZED")` ; avec, `user` et `session` dans le contexte. Elle renvoie au navigateur les cookies que Better Auth rafraîchit (cache de Session, prolongation).
- **Session** : en base, 30 jours, prolongée à l'usage (au plus une fois par jour), cache de 5 min dans le cookie `session_data`. Cookies httpOnly, `SameSite=Lax` (front et API sur deux sous-domaines du même site). CORS avec `credentials: true`, `trustedOrigins` = `CORS_ORIGIN`.
- **Env** : `BETTER_AUTH_SECRET` (32 caractères min, `openssl rand -base64 32`) et `BETTER_AUTH_URL` (URL publique de l'API) obligatoires. Fournisseurs GitHub, Google et Discord (`<FOURNISSEUR>_CLIENT_ID` / `_CLIENT_SECRET`) : les deux renseignés, il est activé ; aucun (vide = absent), il est désactivé ; un seul, `parseEnv` lève une erreur et le serveur ne démarre pas. `parseEnv` en dérive `socialProviders` ; un fournisseur non configuré répond 404 à la connexion. Callback à déclarer chez le fournisseur : `<BETTER_AUTH_URL>/api/auth/callback/<provider>`.
- **Liaison de comptes** : se connecter avec un second fournisseur rattache un nouvel Account au User qui a le même email. GitHub et Google sont de confiance (`trustedProviders`) ; Discord n'est rattaché que s'il marque l'email vérifié, sinon la connexion est refusée. Le User existant doit lui-même avoir un email vérifié (`requireLocalEmailVerified`, défaut de Better Auth).
- **Schéma** : `src/database/auth-schema.ts` est généré par la CLI (`bunx auth@latest generate`, avec une config qui construit l'instance) ; le régénérer quand les options ou les plugins changent, puis `db:generate`.
- **Tests** : `betterAuth({ ...authOptions(…), database: memoryAdapter(…), plugins: [testUtils()] })`, puis `(await auth.$context).test.login({ userId })` pour obtenir le cookie d'une Session. Pour la connexion sociale et la liaison : des fournisseurs factices (`verifyIdToken` + `getUserInfo`) et `POST /api/auth/sign-in/social` avec `idToken`, qui passe par la vraie logique User / Account sans aller-retour OAuth. Toutes ces requêtes viennent de la même IP : une instance partagée par plusieurs tests de connexion désactive le rate limit de Better Auth (`rateLimit.enabled: false`), testé à part.

## OpenAPI

- `@elysiajs/openapi`, monté par `src/plugins/api-docs.ts` : spec sur `/api/openapi/json`, référence Scalar sur `/api/openapi`. **Désactivé en production** (404).
- La spec est générée depuis les schémas TypeBox des routes : toute route publique déclare son `response` et un `detail` (`summary`, `tags`). Un nouveau tag se déclare dans `documentation.tags`.
- **Endpoints Better Auth** : la route `/auth/*` est cachée (`detail.hide`) ; `api-docs` fusionne à la place, dans la réponse de `/api/openapi/json` (`onAfterHandle`), le schéma du plugin `openAPI` de Better Auth (`auth.api.generateOpenAPISchema()`, appelé côté serveur à la première requête puis mémorisé) : chemins préfixés par `/api/auth`, tous sous le tag `Auth` (avec `/api/me`), `components` (schémas User/Session/…, `securitySchemes`) ajoutés aux nôtres. Les routes HTTP du plugin (`/api/auth/open-api/generate-schema`, `/api/auth/reference`) sont dans `disabledPaths` : 404 partout. `generator`, bien que typé comme export de `better-auth/plugins`, n'existe pas au runtime : passer par le plugin.
- La page Scalar a sa propre CSP (bundle jsdelivr, styles inline), posée après `security-headers` ; la version de Scalar est épinglée (`SCALAR_VERSION`).

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
- **Exception** : les routes `/api/auth/*` répondent au format d'erreur de Better Auth (`{ message, code }`), leurs réponses ne passent pas par l'error-handler. `/api/me` et toute route protégée par la macro `auth` restent au format unifié.

## Eden Treaty

- `src/app.ts` construit l'app (`createApp`) et exporte `type App`, consommé par le front via `import type { App } from "api"` (champ `exports` du `package.json`). `src/index.ts` ne fait que migrer et `listen()`.
- Routes chaînées sur une seule expression, sinon Eden perd l'inférence.
- Le préfixe apparaît dans l'arbre Eden : le front exporte `treaty<App>(url).api` (`apps/frontend/src/api/client.ts`), les appels s'écrivent `api.health.get()`.
- `app.ts` ne doit pas importer `env.ts` : le front typecheck ce graphe de fichiers.
