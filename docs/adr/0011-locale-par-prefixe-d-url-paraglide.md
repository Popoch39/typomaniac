# Locale par préfixe d'URL, avec Paraglide

typomaniac existe en deux Locales, `fr` et `en`. Chaque URL de l'app commence par la Locale (`/en/leaderboard`, `/fr/leaderboard`), et les segments qui suivent sont en anglais dans les deux Locales. L'URL a toujours raison : un lien `/fr/…` s'ouvre en français, même dans un navigateur réglé sur l'anglais. Une URL sans préfixe redirige :

1. vers la Locale retenue par le navigateur ;
2. à défaut, vers celle de `navigator.languages` ;
3. à défaut, vers `en`.

Le choix est retenu par navigateur, comme le Theme, et seul le sélecteur le modifie. Tant que rien n'est retenu, la première visite retient la Locale de son URL. Les messages passent par Paraglide JS 2 : ils sont compilés en fonctions typées, et `en` est la Locale de base.

Les identifiants qui sortent du code (Tiers, Themes, favicons) sont en anglais, parce qu'un joueur les voit dans le DOM et sur le réseau. Un anglophone ne doit trouver aucune trace du français dans l'app livrée.

## Considered Options

- **URL unique sans préfixe, Locale seulement stockée** : écarté. On ne pourrait pas partager un lien dans une langue précise.
- **Segments traduits par Locale** (`/fr/classement`) : écarté. Il faudrait une table de correspondance, et changer de Locale obligerait à réécrire tout le chemin.
- **Locale enregistrée sur le User, en base** : écarté. Le serveur n'écrit aucun texte (pas d'email, erreurs en codes), et le Visitor a de toute façon besoin du navigateur.
- **i18next** : écarté. Il est plus lourd à l'exécution, ses clés ne sont typées que par augmentation, et le routage par préfixe serait à écrire à la main.
- **Lingui** : écarté. Ses macros demandent Babel ou SWC, alors que le front compile avec le React Compiler d'Oxc.
- **Dictionnaire maison** : écarté. Il faudrait écrire soi-même la détection, le préfixe et les pluriels.

## Consequences

- L'arbre de routes ne change pas : c'est le routeur qui ajoute et retire le préfixe (`rewrite`).
- Changer de Locale ne recharge jamais la page, pour que la WebSocket et une Queue en cours survivent. Le sélecteur est désactivé pendant le Countdown et le Duel.
- Aucun texte d'UI en dur : une règle oxlint le refuse, et un test vérifie que `en` et `fr` ont les mêmes clés.
- Les ids de Tier (`iron` … `diamond`) et de Theme (`coral` … `paper`) sont renommés en base, dans les stores persistés et dans les assets.
