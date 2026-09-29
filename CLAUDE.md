# typomaniac

Monorepo Turborepo : `apps/frontend` (Vite 8, React 19), `apps/api` (Elysia sur Bun), `packages/typing-engine`, `packages/handle` (règles du Handle, pures, partagées par le front et l'API), `packages/ranked` (règles de la Ranked, pures, partagées de même), `packages/typescript-config`, `tools/loadtest`, `tools/oxlint/typomaniac` (règles oxlint maison).

## Instructions par workspace

- `apps/frontend` (React) : lire [`apps/frontend/CLAUDE.md`](apps/frontend/CLAUDE.md) avant d'y toucher. Skill `vercel-react-best-practices` obligatoire, react-doctor après chaque modif.
- `apps/api` (Elysia) : lire [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) avant d'y toucher. Tout fichier Elysia impose le skill `elysiajs`.

## Package manager : bun

- Toujours `bun` / `bunx`. Jamais `npm`, `npx`, `pnpm` ni `yarn` (`devEngines` impose bun, npm refuse de tourner).
- Ajouter une dépendance : `bun add <pkg>` (ou `bun add -d` pour une dev dep), depuis le dossier du workspace concerné.
- Le lockfile est `bun.lock` : ne jamais l'éditer à la main.

## Commandes

| Commande               | Rôle                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| `bun run dev`          | Lance les apps via turbo                                             |
| `bun run build`        | Build de tous les workspaces                                         |
| `bun run lint`         | oxlint sur tout le repo, 0 warning toléré                            |
| `bun run lint:fix`     | oxlint avec autofix                                                  |
| `bun run format`       | Formate avec oxfmt                                                   |
| `bun run format:check` | Vérifie le formatage sans écrire                                     |
| `bun run check-types`  | `tsc --noEmit` dans chaque workspace                                 |
| `bun run check`        | format:check + lint + check-types : à lancer avant de rendre la main |

Hooks Claude Code (`.claude/settings.json`) : après chaque Write/Edit, `oxfmt` + `oxlint --fix` sur le fichier (les erreurs restantes reviennent à corriger) ; à la fin de chaque tour, `bun run check` bloque tant qu'il échoue.

Hook git pre-commit via Lefthook (`lefthook.yml`, installé par le script `prepare` au `bun install`) : `oxfmt` et `oxlint --fix` sur les fichiers stagés (corrections re-stagées), puis `bun run check-types`. Ne pas le contourner avec `--no-verify`.

TypeScript : une seule version, `typescript` à la racine (dernière stable). Ne pas en ajouter dans les workspaces.

## Lint et format : oxlint, oxfmt, anti-slop

Pas d'ESLint, pas de Prettier. N'en réinstalle pas et n'ajoute pas de config `eslint.config.*` ou `.prettierrc`.

- **oxlint** : config unique à la racine, `oxlint.config.ts`. Lint lancé une seule fois depuis la racine, pas par workspace (il n'y a pas de tâche `lint` dans turbo).
- **oxfmt** : config dans `.oxfmtrc.json`. Il formate aussi le JSON et le Markdown, et trie les clés des `package.json`.
- **anti-slop** : règles oxlint de [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), vendorisées dans `tools/oxlint/anti-slop/` et chargées via `jsPlugins`. Ce code appartient au repo : on peut l'adapter, mais toute modification se note dans `tools/oxlint/anti-slop/UPSTREAM.md`.
- **typomaniac** : les règles maison, dans le workspace `tools/oxlint/typomaniac/` (jsPlugin chargé comme anti-slop, testé par `bun run test`).

### Texte d'UI en dur : `typomaniac/no-hardcoded-ui-text`

Dans le front livré (`apps/frontend/src/**/*.tsx`), la règle refuse le texte littéral en JSX (texte, `{"…"}`, template, branches d'un `? :` ou d'un `&&`) et les littéraux dans `aria-label`, `aria-valuetext`, `title`, `alt` et `placeholder`, sur un élément comme sur un composant. Tout texte passe par les messages (voir `apps/frontend/CLAUDE.md`).

- **Autorisé** : un texte dont aucun mot n'est hors liste blanche, donc la ponctuation, les nombres, les symboles et les noms propres de `properNames` (`src/no-hardcoded-ui-text.ts` : typomaniac, GitHub, Google, Discord, TP, wpm). N'y ajouter qu'un mot identique dans toutes les Locales.
- **Hors règle** (`outOfScopeFiles`, `src/ui-text-scope.ts`) : les tests et le code réservé au build de dev (pages `/dev/*`, labo du Face-off, galerie d'Auras, connexion email de dev). Un nouveau fichier de dev s'y ajoute.
- **Liste d'exceptions à vider** (`untranslatedFiles`, même fichier) : les fichiers qui ont encore du texte en dur. Chaque ticket d'extraction retire ceux qu'il traduit ; elle est vide à l'ouverture de l'anglais. Le test échoue si un fichier listé n'a plus de texte en dur : le retirer. Ne jamais y ajouter un fichier pour faire passer le lint.
- Les fichiers témoins sont dans `fixtures/ui-text/` : un cas nouveau se couvre là, avec les diagnostics attendus dans `src/no-hardcoded-ui-text.test.ts`.

`oxlint` et `@oxlint/plugins` sont épinglés à la même version exacte : les monter ensemble. De même, `oxc-transform-react` (React Compiler Rust, dans `apps/frontend`) est épinglé exact sur la plage peer de `@vitejs/plugin-react` : les monter ensemble.

Les règles oxlint du React Compiler (`react/purity`, `react/refs`, `react/immutability`…) tournent via les catégories `correctness` / `suspicious`. S'y ajoutent `react/rule-suppression`, `react/syntax` et `react/unsupported-syntax`.

### Écrire du code qui passe anti-slop

Toutes les règles sont en `error`. Les plus fréquentes :

- Pas de `unknown` en paramètre, en retour ou en alias de type ; pas de `object` en paramètre ; pas de `Record<string, unknown>` / `any` comme dictionnaire. Parser les données aux frontières (ex. schéma) plutôt que de les typer large.
- Pas de `typeof` à la volée pour affiner un type (sauf `typeof x === "undefined"`).
- Chaque `as` (hors `as const`) doit être précédé d'un commentaire `// SAFETY: <invariant>` qui justifie l'assertion. Pas de `as` en chaîne, pas d'élargissement puis ré-assertion.
- Pas de `.filter().map()` adjacents : `flatMap`, une boucle, ou `.values().filter().map().toArray()`.
- Pas de copie de l'accumulateur dans un `reduce` (spread, `Object.assign({}, acc)`, `concat`…).
- Pas de `cond ? {...} : {}` dans un spread d'objet.
- Pas de `Reflect.get` / `Reflect.apply`, pas de `vi.mock` / `jest.mock` : injecter les dépendances.
- Pas le mot `shape` dans les noms de symboles.
- Lignes vides entre déclarations top-level, avant `return` et les blocs de contrôle (autofix via `bun run lint:fix`).

Ne jamais contourner une règle avec `oxlint-disable`, en baissant sa sévérité ou avec un cast : corriger le code. Si une règle paraît vraiment inadaptée, en parler avant de toucher la config.
