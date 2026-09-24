# Duel serveur-autoritaire en mémoire

Le serveur fait foi pendant un Duel. Il reçoit les Keystrokes de chaque User et les rejoue avec le moteur (ADR 0002) : les deux Results et l'issue sont calculés par lui, jamais crus sur parole. Chaque Keystroke reste daté par le navigateur, pour que les stats reflètent le vrai rythme malgré la latence, mais le serveur borne cette horloge : un Keystroke daté avant le départ, après son arrivée, avant le précédent ou après la fin (plus une tolérance réseau) est rejeté, et le client fautif reçoit l'état qui fait foi. Tout l'état temps réel (Queue, Duels en cours, délais de reconnexion) vit en mémoire dans le process de l'API, sur une seule instance ; seuls les Duels terminés sont écrits en base, avec leur Seed, leur Language, leur Word list version et leurs Keystrokes.

## Considered Options

- **Relais pur avec Result déclaratif** : le serveur relaie les Keystrokes et chaque client envoie son Result en fin de Duel. Écarté : n'importe qui peut envoyer un faux Result, et plus tard un faux Elo.
- **Horodatage serveur des Keystrokes** : le serveur date chaque Keystroke à son arrivée. Écarté : la gigue réseau fausse le wpm et surtout la consistency, et pénalise les connexions lentes.
- **État partagé dans Redis** : Queue et Duels dans Redis, avec pub-sub entre instances. Écarté pour l'instant : une instance suffit, et Redis ajouterait un service à opérer pour aucun gain actuel.

## Consequences

- Un redéploiement ou un crash de l'API annule les Duels en cours, sans les enregistrer.
- Passer à plusieurs instances imposera de sortir cet état de la mémoire (Redis ou sticky sessions), comme le rate limit actuel.
- Un tricheur peut encore dater ses Keystrokes de façon plausible mais fausse, dans la fenêtre que le serveur tolère ; une cadence soutenue inhumaine est traitée à part, par un Forfeit.
- Les listes de mots doivent être versionnées : sans Word list version, un changement de liste rendrait les Duels enregistrés impossibles à rejouer.
