# Score à Combo et Burst sur une Pace historique

Le vainqueur d'un Duel est désigné par le Score, et non plus par le wpm. Chaque mot juste rapporte ses caractères (espace compris), multipliés par le Combo : x1, x2 dès 5 mots justes sans aucune faute, même corrigée, x3 dès 10, x4 au plus dès 15. Un Burst double les points d'un mot sans faute d'au moins 4 lettres tapé au moins 20 % plus vite que la Pace du User : le wpm médian de ses 10 derniers Duels, figé au départ (50 wpm sans historique). À Score égal, l'accuracy départage, sinon c'est un Draw. Le Score est une fonction pure du moteur (ADR 0002), qui rejoue les Keystrokes avec les règles du Run : le front et le serveur le calculent de la même façon, et le serveur ne croit que les Keystrokes qu'il a acceptés (ADR 0003).

La vitesse reste le premier levier, puisqu'un joueur rapide tape plus de mots, mais la régularité pèse autant : un User un peu moins rapide qui ne casse pas ses Combos peut battre le favori, sans hasard ni aide au joueur mené.

## Considered Options

- **wpm seul, départagé par l'accuracy** : ce qui existait. Écarté : le plus rapide gagne à coup sûr, les Duels sont joués d'avance.
- **Pace mesurée sur le Duel en cours** : écarté. Alterner volontairement mots lents et mots rapides ferait tomber la Pace et multiplierait les Bursts.
- **Cadence absolue pour le Burst** (par exemple 100 wpm) : écarté. Elle favorise le favori, qui décroche des Bursts sans forcer, alors que l'outsider n'en voit jamais.
- **Mécaniques de rattrapage** (sprint final, bonus aléatoire, aide au joueur mené) : écartées, injustes pour le meilleur joueur et incompatibles avec la ranked.

## Consequences

- Les seuils (5/10/15 mots, x4, +20 %, 4 lettres, 50 wpm) sont des constantes nommées du moteur : les recalibrer plus tard se fera en rejouant les Duels enregistrés, qui gardent leur Pace et leur Score.
- Les Duels enregistrés avant le Score gardent leur issue d'origine ; leur wpm compte quand même dans la Pace.
- Le Burst augmente l'intérêt de truquer l'horodatage des Keystrokes dans la fenêtre que le serveur tolère (ADR 0003). La Pace historique borne le gain, et la détection de cadence inhumaine s'applique toujours.
- Le Score d'un Run solo ne sert qu'à s'entraîner : il ne compte pour rien d'autre.
