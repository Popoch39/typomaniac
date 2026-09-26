# MMR caché distinct des TP visibles

La Ranked tient deux mesures par User, sur le modèle de League of Legends. Le MMR, un Elo caché, apparie la Queue et pèse les gains ; les TP, dans un Tier et une Division, sont le seul rang que le User voit. Un Duel bouge le MMR par l'Elo standard (K = 60 en Placement, 32 ensuite) et les TP par une base Elo de 20, ajustée par l'écart entre le MMR et le MMR qu'attend le rang affiché (400 en Fer IV, +50 par Division), bornée entre 8 et 35 (un Draw seulement sous 35 : contre un égal, il ne bouge rien). Un rang en retard sur le niveau gagne plus et perd moins, et rattrape tout seul. Toutes ces règles sont pures, dans le package `ranked`, partagées par le front et l'API.

## Considered Options

- **Un seul rating visible** (Elo ou Glicko affiché) : écarté. Un nombre nu qui baisse d'un point frustre, rien ne marque la progression, et la protection après une montée ou le plancher Fer IV fausseraient l'appariement s'ils touchaient au rating lui-même.
- **Des TP seuls, sans MMR** (gain fixe par victoire) : écarté. Rien ne permet d'apparier par niveau, et un User fort met des dizaines de Duels à quitter le bas du Classement.

## Consequences

- Le MMR n'apparaît dans aucune réponse HTTP ni message de la socket : seul le rang en sort.
- La Stake montrée au Face-off (les TP d'une victoire et d'une défaite, et le rang d'arrivée) n'en révèle pas plus sur le MMR que les TP d'un Duel terminé : ce sont les mêmes TP, connus un Duel plus tôt.
- Rang et niveau peuvent diverger un temps (protection, plancher) ; le rattrapage les recolle au fil des Duels.
- Les constantes (seed, K, base, bornes, MMR attendu par Division, fenêtre de la Queue) sont des valeurs par défaut du package, à recalibrer sur les vraies données.
