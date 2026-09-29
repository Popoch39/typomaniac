# La Queue vit dans toute l'app, pas sur une page

La place d'un User dans la Queue ne tient plus à l'écran de recherche : il la rejoint par un geste et n'en sort que par Annuler, un Dodge, un Duel qui commence ou la fermeture de l'onglet qui joue. Entre-temps, il navigue et joue des Runs : la recherche se replie en Queue pill, qui flotte au-dessus de toutes les pages de cet onglet, et une Match proposal y arrive. Le Duel quitte la page Jouer pour sa propre URL, `/duel`, où mènent une Match proposal acceptée et un Challenge accepté, depuis n'importe quelle page ; un rechargement reprend le Duel par l'URL.

## Considered Options

- **La Queue liée à la page Jouer** (l'existant) : écarté. Quitter la page ou passer en Solo sortait de la Queue, donc on attendait sans rien faire, alors que l'attente va jusqu'à 30 secondes et que la Match proposal arrive de toute façon par le son et la notification.
- **Pill dans chaque onglet du User** : écarté. Il faudrait que n'importe quelle connexion puisse accepter pour une autre, alors qu'une seule joue (ADR 0007). Les autres onglets savent seulement que le User attend ailleurs.
- **Le Duel en scène par-dessus la page courante, sans URL** : écarté. La page sous la scène reste montée pendant tout le Duel, et la reprise après un rechargement passait par un drapeau en `sessionStorage` plutôt que par l'adresse.

## Consequences

- La Queue n'est plus rejointe ou quittée au montage d'un composant : ce sont des gestes explicites du User.
- La fenêtre modale de la Match proposal disparaît : la carte de recherche ou la Queue pill la portent, et Entrée accepte sans qu'aucune touche ne refuse, pour qu'une frappe ne fasse jamais un Dodge.
- Accepter une Match proposal pendant un Run abandonne ce Run, sans Result.
