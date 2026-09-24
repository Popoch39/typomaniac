# apps/frontend

Front React 19 + Vite 8 (React Compiler via `@rolldown/plugin-babel`). Point d'entrée : `src/main.tsx`.

## Skill obligatoire

**Avant de créer, modifier ou relire un composant, un hook ou tout code React**, invoquer le skill `vercel-react-best-practices` et appliquer ses règles. Pas d'exception pour les petites modifications.

## Architecture

- **Routing** : TanStack Router en file-based (`src/routes/`, plugin Vite, `autoCodeSplitting`). `src/routeTree.gen.ts` est généré (ignoré par oxlint/oxfmt), ne pas l'éditer. Un fichier de route ne déclare que `Route` ; ses composants vivent dans `src/pages/` (sinon `react/only-export-components` casse, et exporter le composant depuis la route désactive le code-splitting).
- **État serveur** : React Query, jamais dans Zustand. Chaque ressource expose des `queryOptions()` dans `src/api/<ressource>.ts`, appels via le client Eden `api` et `unwrap` (`src/api/client.ts`) qui lève une `ApiError`. Les loaders font `context.queryClient.ensureQueryData(opts)`, les composants `useSuspenseQuery(opts)`. Exception : un élément d'appoint qui ne doit jamais faire attendre ce qui l'entoure (`RealtimeConnection`, qui lit le User) lit via `useQuery` et n'affiche rien tant qu'il n'a pas de données. Après une action, invalider via les `queryKey` des `queryOptions`, jamais des clés recopiées. `defaultPreloadStaleTime: 0` : le cache est géré par Query.
- **Connexion temps réel** (ADR 0007) : `src/stores/connection-store.ts`, la WebSocket de l'app (`api.duel`), une par onglet, ouverte par `RealtimeConnection` (monté dans `RootLayout`, lit le User via `useQuery` : il ne fait jamais attendre la page) dès qu'une Session existe, refermée à la déconnexion, rouverte seule si elle coupe (1 s, doublé à chaque échec, 8 s au plus). Elle tient la place du User (`place`, poussée par le serveur : exception à « état serveur dans React Query », qui vaut pour HTTP) et diffuse les messages (`onServerMessage`) ; `sendToServer` envoie. Le store du Duel s'y branche : `enter` / `exit` quand Duel s'affiche ou non (prendre la place : `join-queue` ou `resume-duel` ; la quitter : `leave-queue` ou `leave-duel`), `claim` pour la reprendre depuis l'écran « ouvert dans un autre onglet ». Elle tient aussi les Friends (`friends`, null jusqu'au `friends-snapshot` de chaque socket, oublié à la perte) : la Presence de chacun (`presences`, un Friend absent est hors ligne) et `requestsReceived`, que lit le badge du header ; `friendsAfter` applique les messages (logique pure, testée). `LiveFriendLists` (monté dans `RootLayout`) invalide `FRIEND_QUERY_KEYS` quand un message dit que les listes ont changé (`changesFriendLists` : snapshot, Friend request reçue ou partie, Friend ajouté ou retiré) ; `FriendPresence` affiche la pastille sur `/friends`.
- **Types de l'API** : `import type { App } from "api"` (dépendance workspace). Même version d'`elysia` que l'API.
- **État client** : Zustand dans `src/stores/`, `create<T>()(...)`. **Jamais** de destructuring du store (`const { a, b } = useStore()`) ni d'appel sans sélecteur : le composant s'abonne alors à tout le store et re-render à chaque changement. Un sélecteur atomique par valeur (`const a = useStore((s) => s.a)`), et `useShallow` seulement si un sélecteur doit renvoyer un objet ou un tableau.
- **Composants SRC (Single Responsibility Component)** : **toujours**. Un composant = une responsabilité (afficher, orchestrer, gérer un état ou un effet), pour rester refactorable. Dès qu'un composant mélange plusieurs rôles ou qu'un bloc de JSX a sa propre logique, l'extraire dans son propre composant (ou la logique dans un hook). Un composant par fichier.
- **Env** : toute variable `VITE_*` passe par le schéma de `src/env.ts` (voir `.env.example`).
- **Imports** : toujours via l'alias `@/` (→ `src/`, résolu par `resolve.tsconfigPaths` de Vite), jamais en relatif.

## UI : Tailwind v4 + shadcn/ui

- Config dans `components.json` : style `base-lyra` (primitives **Base UI**, pas Radix), couleur `neutral`, icônes `lucide-react` (le preset impose phosphor : toujours `lucide`). Fusion de classes via le paquet `cn` (officiel shadcn, remplace `clsx` + `tailwind-merge`) : `import { cn } from "cn"`. Le thème (variables CSS, police JetBrains Mono via `@fontsource-variable`) vit dans `src/index.css`.
- Ajouter un composant : `bunx shadcn@latest add <nom>` depuis `apps/frontend`. Le code généré dans `src/components/ui/` appartient au repo : le corriger jusqu'à ce qu'il passe `bun run check` et react-doctor, sans jamais l'exclure du lint. Cas typique : les `cva` exportés à côté du composant partent dans `<nom>-variants.ts` (voir `button-variants.ts`) à cause de `react/only-export-components`.
- Un lien stylé en bouton : `<Button nativeButton={false} render={<Link to="…" />}>` (API `render` de Base UI, pas `asChild`).
- **Thème** : implémentation de la [doc shadcn Vite](https://ui.shadcn.com/docs/dark-mode/vite). `ThemeProvider` (`src/components/theme-provider.tsx`, monté dans `main.tsx`) pose `.light` / `.dark` sur `<html>` et persiste `light` / `dark` / `system` sous la clé localStorage `vite-ui-theme` ; `useTheme()` et le contexte vivent dans `theme-context.ts` ; `ModeToggle` est le menu du header. Le script inline de `index.html` pose la classe avant le premier rendu : changer la clé ou les valeurs impose de modifier les deux.

## Quand tu as fini d'éditer du code

Lancer React Doctor avant de rendre la main, en plus de `bun run check` (lancé par le hook Stop). Corrige ce qu'il remonte, puis relance jusqu'à ce qu'il ne reste rien, ou seulement des points que tu signales explicitement à l'utilisateur.

Depuis `apps/frontend` :

```sh
bunx react-doctor@latest . -y --no-telemetry --verbose
```

- Corriger la cause dans le code : ne jamais toucher à la config react-doctor ni supprimer une règle pour faire taire un diagnostic.
- Si un fix demande une décision d'API, d'UX ou d'architecture : s'arrêter et demander.
- Pour comprendre une règle : `bunx react-doctor@latest why <fichier>:<ligne>`.
