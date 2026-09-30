# La Best Run est gardée par le serveur, une par réglage, recalculée depuis ses Keystrokes

Jusqu'ici, une Run ne laissait rien derrière elle : ni le serveur ni le navigateur ne la gardaient. Pour le Ghost de la carte Entraînement, le serveur garde désormais la Best Run de chaque User pour chaque réglage (Mode, durée ou nombre de mots, Language) : sa Seed, sa Word list version et ses Keystrokes. À la fin d'une Run, le client envoie ces trois éléments et le réglage. Le serveur reconstruit le Text, rejoue les Keystrokes avec le typing-engine (ADR 0002) et en tire le Result. Il ne garde la Run que si son wpm dépasse celui de la Best Run du réglage. Le wpm annoncé par le client n'est jamais lu.

## Considered Options

- **Dans le localStorage du navigateur** : écarté. La Best Run ne suivrait pas le User d'un appareil à l'autre, et la perdre en vidant le navigateur la rendrait sans valeur. Le seul gain, un Ghost pour le Visitor, n'a pas été retenu.
- **Toutes les Runs** : écarté. Le volume croît à chaque Run pour un seul besoin, la meilleure, et les Stats excluent les Runs.
- **Croire le Result envoyé par le client** : écarté. Le moteur est pur et partagé, donc recalculer ne coûte presque rien et coupe court à une Best Run forgée.

## Consequences

- Une Best Run se rejoue toujours sur son Text d'origine : les anciennes Word list versions doivent rester disponibles, comme pour les Replays.
- Un réglage qui n'existe plus côté client laisse sa Best Run en base, sans qu'elle soit lue.
- Envoyer une Run coûte une requête par Run terminée d'un User, même quand elle ne bat rien.
