# Le Leaderboard se pagine au curseur, sans numéros de page

Le Leaderboard se lit par pages de 25 Places. Une page se demande après ou avant une ligne, par son curseur (opaque : la clé de la ligne dans l'ordre du Leaderboard, `<step>:<tp>:<userId>`, en base64url), jamais par un OFFSET ni un numéro de page. La barre montre Première page, Précédente, Suivante et « Places 26 à 50 sur 9 603 ». La page du User (`?at=me`, depuis « Ta place ») est celle qui commence au multiple de 25 d'avant sa Place. On la trouve sans OFFSET : la Place du User se compte sur l'index, puis on lit les lignes au-dessus de lui (keyset vers le haut) et celles d'en dessous (keyset vers le bas).

Le tri porte sur une colonne générée, `ranked_rating.ladder_step` (`stepOf` du paquet `ranked` en SQL, STORED), et sur un index partiel `(ladder_step, tp, user_id) WHERE placements_played >= 5`, lu à l'envers pour aller des meilleurs aux moins bons. Chaque page est un parcours d'index sans tri, quel que soit l'endroit du Leaderboard ; la Place et le total sont des comptages sur ce même index. Le filtre des requêtes est écrit en littéral (`placements_played >= 5`), jamais en paramètre, sans quoi Postgres ne sait pas que l'index partiel le couvre. À rang égal, le User d'id le plus grand passe devant (avant : le plus petit) : un index tout dans le même sens compare la clé d'un bloc, `(ladder_step, tp, user_id) < (…)`.

## Considered Options

- **OFFSET et numéros de page** : écarté. Aller loin coûte de plus en plus cher, et une page lue pendant qu'un Duel se termine peut sauter ou doubler une ligne.
- **Fenêtre centrée sur le User** : écartée. Les pages ne tomberaient plus sur 1, 26, 51… et ne seraient plus celles qu'on atteint en cliquant Suivante depuis le début.
- **Index sur l'expression du step** : écarté au profit de la colonne générée. Chaque requête aurait dû réécrire l'expression à l'identique pour que l'index serve.

## Consequences

- Pas de lien direct vers « la page 7 » : l'URL garde un curseur (`?after=`, `?before=`), ou `?at=me`.
- Les Places d'une page se comptent à la lecture. Si des Users bougent entre deux pages, une page lue au curseur peut ne plus commencer pile sur un multiple de 25 ; sa Place de départ reste juste.
- Un curseur qui ne mène plus à aucune ligne ramène à la première page.
