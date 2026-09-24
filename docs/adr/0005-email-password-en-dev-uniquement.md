# Email et mot de passe en dev uniquement

Un Duel oppose deux Users distincts : pour le tester seul, il faut pouvoir ouvrir plusieurs Users sans passer par un fournisseur OAuth. Hors production, Better Auth active donc l'email/mot de passe, sans vérification de l'email ni aucun envoi (`emailAndPassword.enabled = !isProduction`). Le front n'affiche le formulaire que sous `import.meta.env.DEV`, et Vite le retire du build de prod. En production, `/api/auth/sign-up/email` et `/api/auth/sign-in/email` sont dans `disabledPaths` et répondent 404 : l'ADR 0001 reste la règle.

## Considered Options

- **Comptes seedés** : écarté, créer les comptes à la volée depuis le formulaire suffit et n'ajoute pas de script.
- **Flag d'env dédié** : écarté, `NODE_ENV` décide déjà de ce qui est réservé au dev (doc de l'API, HSTS) ; une variable de plus pourrait être oubliée en prod.

## Consequences

- Deux Users en même temps demandent deux navigateurs, ou une fenêtre privée : un seul cookie de Session par hôte.
- Un User créé par email a un email non vérifié : une connexion OAuth avec la même adresse ne s'y rattache pas (`requireLocalEmailVerified`).
- Le rate limit de Better Auth s'applique aussi à ces routes (3 tentatives par 10 s et par IP).
