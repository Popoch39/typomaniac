# Desktop uniquement

typomaniac se joue au clavier physique : le front ne fait aucune mise en page mobile. Sous 1024 px de large, toute l'app est remplacée par un écran qui demande de passer sur ordinateur. Les écrans sont conçus pour 1280 px et plus (maquettes du style Social en 1280 × 820).

## Considered Options

- **Responsive complet** : écarté. Un clavier virtuel fausse la frappe, donc le Score et le MMR ; les écrans à deux colonnes (Queue + Friends, Classement) coûteraient une seconde mise en page pour un usage qu'on ne veut pas.
- **Bandeau d'avertissement, app utilisable** : écarté. Une app affichée mais cassée fait pire impression qu'un refus clair.
- **Blocage limité à Jouer** : écarté. Il faudrait quand même rendre mobiles le Classement et le Profil.

## Consequences

- Aucune variante `sm:` / `md:` pour replier une mise en page ; les grilles supposent la largeur desktop.
- Un Duel ne peut pas être lancé depuis un téléphone, même via un Challenge.
