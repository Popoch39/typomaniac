# Ranked en Bo3 de Rounds

Un Duel Ranked de 30 s était trop court pour qu'une victoire dise quelque chose. Un Duel Ranked se joue désormais au meilleur des trois Rounds de 30 s, chacun sur son propre Text, séparés par un Round break de 7 s ; il s'arrête dès qu'un User a gagné deux Rounds. Le Duel reste l'unité de la Ranked : une seule issue (victoire, défaite ou Draw) fait bouger le MMR et les TP, quel que soit le compte des Rounds, si bien que le package `ranked` et la Stake ne changent pas. Un Challenge garde un seul Round. Un Round nul ne compte pour personne : à égalité de Rounds après le troisième, le Score cumulé puis l'accuracy moyenne départagent, sinon c'est un Draw. Un Forfeit termine le Duel entier.

## Considered Options

- **Une série de Duels distincts** (trois Duels enchaînés, comptés ensemble) : écarté. La Stake, la Form, l'Activity et la Duel history portent sur un Duel ; une série les aurait toutes dédoublées.
- **Le Bo3 aussi pour les Challenges** : écarté. Entre Friends, un Duel court s'enchaîne d'une revanche ; la Ranked seule a besoin d'une issue plus solide.
- **Des TP pesés par l'écart de Rounds** (2-0 rapporte plus que 2-1) : écarté. La Stake du Face-off deviendrait une fourchette, et le MMR mesurerait un écart que le Score mesure déjà mal.
- **Un Round nul rejoué** : écarté. Le Duel ne serait plus borné à trois Rounds, pour un cas presque impossible.

## Consequences

- Deux formats de Duel coexistent : le HUD, le Duel end, le Replay et la Duel history les montrent tous les deux. Les Duels joués avant ont un seul Round.
- Results, Scores et Keystrokes s'enregistrent par Round. Le Result d'un Duel (Form, Pace, Progression, Stats) est la moyenne de ses Rounds ; les Records se battent sur un Round, pour qu'un Challenge et un Duel Ranked restent comparables.
- Un Duel Ranked dure jusqu'à environ 1 min 50 : un crash de l'API (ADR 0003) en perd plus, et la grâce de reconnexion court aussi pendant un Round break.
