# Cues dérivés du moteur par une fonction pure

Les sons (et plus tard les effets visuels) réagissent aux Cues : ce qu'un Keystroke vient de provoquer (Hit, Miss, Erase, mot validé, Combo qui monte ou casse, Burst). Les Cues sont dérivés par une fonction pure de `typing-engine`, qui compare l'état du Run et le Score avant et après un Keystroke. Le moteur garde ses signatures (ADR 0002). Côté front, les stores du Run et du Duel rangent les Cues du dernier Keystroke, un bus les diffuse hors de React, et chaque réacteur (son, puis visuel) s'y abonne sans connaître les autres.

## Considered Options

- **`applyKeystroke` qui renvoie aussi des événements** : écarté. Ça change le contrat partagé avec le serveur. Et le Score est calculé à part, donc les événements de Combo et de Burst y manqueraient.
- **Diff côté front** : écarté. C'est de la logique de jeu (qu'est-ce qu'une faute, quand le Combo casse) hors du moteur, et hors de sa couverture à 100 %.
- **Réagir directement aux touches dans les composants** : écarté. Chaque effet redécouvrirait les règles du jeu, et un son de Combo ou de Burst serait impossible sans elles.

## Consequences

- Un nouvel effet (son de Combo, animation de Burst) n'ajoute qu'un abonné au bus, et au besoin une nouvelle sorte de Cue dans le moteur.
- Les Keystrokes de l'adversaire ne produisent aucun Cue chez le User.
- Les Cues ne sont ni envoyés au serveur ni enregistrés : ils se recalculent à partir des Keystrokes.
