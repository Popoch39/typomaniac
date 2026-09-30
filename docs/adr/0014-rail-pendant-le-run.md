# Pendant le Run, la barre latérale se replie en Rail au lieu de se retirer

Amende l'ADR 0013. Pendant qu'un Run solo est tapé, la barre latérale ne sort plus de la fenêtre (le Retrait) : elle se replie en Rail, comme sous 1440 px de large. Ses libellés partent, ses icônes restent, toujours cliquables. Sa largeur passe de la barre entière à celle du Rail en un mouvement (GSAP, 0,3 s), et revient au Result. Sous 1440 px, elle est déjà le Rail et ne bouge pas.

La barre qui disparaissait entièrement faisait perdre ses repères au User : la nav et l'attente dans la Queue n'étaient plus visibles pendant le Run. Le Rail en garde l'essentiel pour environ 68 px, et le Text récupère presque toute la place que prenait la barre entière.

## Considered Options

- **Garder le Retrait** : écarté, pour la raison ci-dessus.
- **Rail estompé** : écarté, comme dans l'ADR 0013. Un Rail net, sans libellés, ne gêne pas la lecture du Text.

## Consequences

- Le terme « Retrait » disparaît du glossaire : le Rail couvre les deux cas.
- Le Rail reste cliquable pendant le Run : aller sur une autre page laisse le Run inachevé, comme avant le Retrait.
