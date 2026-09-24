# typomaniac

Contexte unique du monorepo : le vocabulaire partagé par le front et l'API.

## Language

### Identité

**User** :
Une personne connue de typomaniac, identifiée par son email. C'est la seule entité qui porte l'identité et le profil ; il n'existe pas de profil séparé.
_Avoid_ : compte, player, membre, profil

**Account** :
Le lien entre un User et un fournisseur OAuth (GitHub, Google, Discord). Un User peut en avoir plusieurs ; deux Accounts dont l'email est vérifié par le fournisseur se rattachent au même User.
_Avoid_ : provider, identité, login

**Visitor** :
Une personne qui utilise typomaniac sans Session. Elle peut jouer ; se connecter la fait devenir un User.
_Avoid_ : anonyme, invité, guest

**Session** :
La preuve qu'un User est connecté sur un navigateur donné, portée par un cookie httpOnly.
_Avoid_ : token, login

### Jeu

**Run** :
Une tentative solo de frappe sur un Text, jouée par un Visitor ou un User, qui se termine par un Result.
_Avoid_ : test, partie, game, race

**Text** :
La suite de mots à taper pendant un Run, entièrement déterminée par une Seed et une Language. Rejouer un Run, c'est retaper le même Text.
_Avoid_ : prompt, phrase, quote

**Seed** :
Le nombre qui fixe un Text : même Seed et même Language donnent toujours le même Text.

**Language** :
La liste de mots dans laquelle un Text est tiré : français (sans accents) ou anglais.

**Mode** :
Ce qui termine un Run : `time`, au bout d'une durée ; `words`, après un nombre de mots.

**Keystroke** :
Une frappe horodatée pendant un Run : un caractère, un retour arrière ou la suppression d'un mot. Un Run se rejoue entièrement à partir de ses Keystrokes.
_Avoid_ : input, touche

**Result** :
Les statistiques d'un Run terminé, calculées à partir de ses Keystrokes : wpm, raw, accuracy, consistency et le décompte des caractères.
_Avoid_ : score, stats

**wpm** :
La vitesse utile : caractères des mots justes (espaces compris), divisés par 5, par minute. Le mot en cours à la fin d'un Run compte pour ses lettres justes.

**raw** :
La vitesse brute : tous les caractères tapés, justes ou faux, divisés par 5, par minute.

**accuracy** :
La part de frappes de caractères justes. Une faute corrigée reste une faute.

**consistency** :
La régularité du raw d'une seconde à l'autre, de 0 à 100.

**Duel** :
Deux Users qui tapent le même Text en même temps. Pas encore construit.
_Avoid_ : match, versus, 1v1
