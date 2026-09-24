# Moteur de frappe pur et déterministe, partagé front/API

Les règles d'un Run vivent dans un package TypeScript pur (`packages/typing-engine`), sans React ni horloge : génération du Text, application des Keystrokes, calcul du Result. Le Text est dérivé d'une Seed et d'une Language, et le Result est recalculé à partir du log de Keystrokes horodatés. On prépare ainsi le Duel dès le Run solo : deux joueurs reçoivent la même Seed, et le serveur peut rejouer les Keystrokes pour valider un Result, au lieu de croire le chiffre envoyé par le navigateur.

## Considered Options

- **État du Run dans React (store ou hook)** : écarté. C'était plus rapide pour le solo, mais il aurait fallu tout réécrire pour le Duel, et le serveur n'aurait eu aucun moyen de vérifier un Result.
- **Text envoyé tel quel par le serveur** : écarté. Il faudrait un aller-retour réseau pour chaque Run solo. La Seed suffit, puisque les listes de mots sont embarquées dans le package.

## Consequences

- Modifier une liste de mots change le Text de toutes les Seeds existantes : il faudra versionner les listes quand des Results seront persistés.
- Le moteur reçoit l'heure de chaque Keystroke et ne la lit jamais lui-même.
- La couverture de tests du package est imposée à 100 %.
