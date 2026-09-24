# Une WebSocket pour toute l'app, plusieurs connexions par User

La WebSocket du Duel devient la connexion temps réel de toute l'app : un User connecté l'ouvre dès qu'il a un onglet typomaniac ouvert, quelle que soit la page. Elle porte la Queue et le Duel comme avant, et en plus la Presence de ses Friends, les Challenges et l'arrivée des Friend requests. Un User peut avoir plusieurs connexions à la fois (plusieurs onglets) : toutes reçoivent la Presence, les Friend requests et les Challenges, mais une seule joue : celle qui a rejoint la Queue ou accepté le Challenge. Une autre connexion peut reprendre ce Duel, comme une reconnexion. La Presence se déduit de l'état en mémoire (ADR 0003) : au moins une connexion, dans un Duel ou non.

## Considered Options

- **Deux sockets, une « sociale » et une de Duel** : écarté. Il faudrait synchroniser entre les deux ce que le serveur sait déjà en un seul endroit (qui est connecté, qui est dans la Queue ou en Duel), et un Challenge accepté passerait de l'une à l'autre.
- **Garder le remplacement de connexion** (une nouvelle connexion ferme la précédente) : écarté. Avec une socket ouverte sur toutes les pages, ouvrir un deuxième onglet couperait le premier, même en Run solo.
- **Polling HTTP de la Presence et des Challenges** : écarté. Un Challenge expire en 30 secondes : il doit arriver tout de suite.

## Consequences

- Un redéploiement coupe la Presence de tout le monde, en plus des Duels en cours ; les clients se reconnectent.
- Passer à plusieurs instances imposera de sortir aussi la Presence de la mémoire (ADR 0003).
- Les Friend requests et les Friends restent en base et passent par des routes HTTP ; la socket ne fait que pousser leurs changements aux connexions ouvertes.
