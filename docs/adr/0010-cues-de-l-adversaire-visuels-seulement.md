# Cues de l'adversaire, visuels seulement

Le HUD du Duel annonce les Bursts, les Combos cassés et le x4 de l'adversaire, et fait apparaître les points de chacun de ses mots. L'ADR 0006 disait que les Keystrokes de l'adversaire ne produisent aucun Cue chez le User. On revient sur cette conséquence : le store du Duel dérive aussi les Cues des Keystrokes de l'adversaire avec `cuesOf`, et les diffuse sur un bus à part. Les effets visuels s'abonnent aux deux bus, les sons seulement à celui du User. Le Cue d'un mot validé porte ses points, pour que le HUD n'ait pas à les calculer.

## Considered Options

- **Diff du Score de l'adversaire côté front** : écarté pour la même raison que dans l'ADR 0006. Dire ce qu'est un Burst ou un Combo cassé, c'est de la logique de jeu, qui doit rester dans le moteur et sa couverture à 100 %.
- **Des Cues de l'adversaire sur le même bus** : écarté. Chaque réacteur de son devrait filtrer les Cues selon leur auteur, et il suffirait d'un oubli pour que le User entende les frappes de son adversaire.
- **Aucune annonce pour l'adversaire** : écarté. Le HUD retenu (B2 · Affiche) les montre.

## Consequences

- Les Cues de l'adversaire ne se calculent qu'à la réception en direct : les Keystrokes rejoués par une resync ou une reprise n'en produisent aucun.
- Ils sont horodatés à leur réception, pour qu'un Callout arrivé en retard garde toute sa durée.
- Les Cues ne sont toujours ni envoyés au serveur ni enregistrés.
