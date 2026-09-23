# apps/frontend

Front React 19 + Vite 8 (React Compiler via `@rolldown/plugin-babel`). Point d'entrée : `src/main.tsx`.

## Skill obligatoire

**Avant de créer, modifier ou relire un composant, un hook ou tout code React**, invoquer le skill `vercel-react-best-practices` et appliquer ses règles. Pas d'exception pour les petites modifications.

## Quand tu as fini d'éditer du code

Lancer React Doctor avant de rendre la main, en plus de `bun run check` (lancé par le hook Stop). Corrige ce qu'il remonte, puis relance jusqu'à ce qu'il ne reste rien, ou seulement des points que tu signales explicitement à l'utilisateur.

Depuis `apps/frontend` :

```sh
bunx react-doctor@latest . -y --no-telemetry --verbose
```

- Corriger la cause dans le code : ne jamais toucher à la config react-doctor ni supprimer une règle pour faire taire un diagnostic.
- Si un fix demande une décision d'API, d'UX ou d'architecture : s'arrêter et demander.
- Pour comprendre une règle : `bunx react-doctor@latest why <fichier>:<ligne>`.
