# Better Auth, OAuth uniquement, un seul User

L'authentification repose sur Better Auth, avec GitHub, Google et Discord comme seuls moyens de connexion : pas d'email/mot de passe, donc aucun mot de passe stocké ni email à envoyer (vérification, reset). Deux Accounts dont l'email est vérifié par le fournisseur se rattachent automatiquement au même User. Le User est la table `user` de Better Auth, et les futurs champs métier s'y ajoutent (`additionalFields`) plutôt que dans une entité profil séparée : on accepte ce couplage à la lib pour garder un seul modèle d'identité.

## Considered Options

- **Email + mot de passe** : écarté, il impose un fournisseur d'email et la gestion des mots de passe pour un gain faible face à trois fournisseurs OAuth.
- **Profil séparé (User d'auth + entité métier liée 1-1)** : écarté pour l'instant, une seule entité suffit tant qu'il n'y a pas de champs métier. À reconsidérer si le profil doit survivre à un changement de lib d'auth.

## Consequences

- Les routes `/api/auth/*` répondent au format d'erreur de Better Auth, pas au format unifié de l'API.
- Ajouter l'email/mot de passe plus tard implique d'ajouter un envoi d'email.
