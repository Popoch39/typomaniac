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
La suite de mots à taper pendant un Run ou un Duel, entièrement déterminée par une Seed, une Language et une Word list version. Rejouer un Run, c'est retaper le même Text.
_Avoid_ : prompt, phrase, quote

**Seed** :
Le nombre qui fixe un Text : même Seed, même Language et même Word list version donnent toujours le même Text.

**Language** :
La langue dans laquelle un Text est tiré : français (sans accents) ou anglais.

**Word list version** :
Une édition figée de la liste de mots d'une Language. Changer la liste crée une nouvelle version, et les anciennes restent disponibles : un Duel enregistré se rejoue toujours sur son Text d'origine. Un nouveau Run ou Duel utilise la version courante.
_Avoid_ : dictionnaire, révision, version du Text

**Mode** :
Ce qui termine un Run : `time`, au bout d'une durée ; `words`, après un nombre de mots.

**Keystroke** :
Une frappe horodatée pendant un Run ou un Duel : un caractère, un retour arrière ou la suppression d'un mot. Un Run ou un Duel se rejoue entièrement à partir de ses Keystrokes.
_Avoid_ : input, touche

**Cue** :
Ce qu'un Keystroke vient de provoquer dans un Run ou un Duel : une frappe juste (Hit), une faute (Miss), un effacement (Erase), un mot validé, un Combo qui monte de palier ou qui casse, un Burst. Un Keystroke peut en provoquer plusieurs, ou aucun. Les sons et les effets visuels réagissent aux Cues, jamais aux touches.
_Avoid_ : event, feedback, trigger

**Result** :
Les statistiques d'un Run terminé, calculées à partir de ses Keystrokes : wpm, raw, accuracy, consistency et le décompte des caractères.
_Avoid_ : stats, score (le Score est autre chose)

**wpm** :
La vitesse utile : caractères des mots justes (espaces compris), divisés par 5, par minute. Le mot en cours à la fin d'un Run compte pour ses lettres justes.

**raw** :
La vitesse brute : tous les caractères tapés, justes ou faux, divisés par 5, par minute.

**accuracy** :
La part de frappes de caractères justes. Une faute corrigée reste une faute.

**consistency** :
La régularité du raw d'une seconde à l'autre, de 0 à 100.

### Duel

**Duel** :
Deux Users qui tapent le même Text en même temps, au format fixe `time` 30 s en anglais, et dont chacun obtient un Result et un Score. Le meilleur Score gagne, départagé par l'accuracy ; sinon c'est un Draw. Les Duels joués avant le Score gardent leur issue d'origine, au wpm. Un Duel se termine aussi par un Forfeit.
_Avoid_ : match, versus, 1v1, partie, race

**Queue** :
L'attente des Users qui veulent un Duel. Les deux premiers Users distincts qui y attendent sont appariés ; un User peut la quitter tant qu'il n'est pas apparié.
_Avoid_ : lobby, file, matchmaking, salle d'attente

**Countdown** :
Les 3 secondes entre l'appariement et le départ d'un Duel, identiques pour les deux Users. La frappe y est bloquée.
_Avoid_ : timer, décompte, compte à rebours

**Forfeit** :
La fin d'un Duel perdu par abandon : départ volontaire, absence prolongée après une déconnexion, ou frappe à une cadence inhumaine. L'adversaire gagne.
_Avoid_ : abandon, ragequit, disqualification

**Draw** :
L'issue d'un Duel où les deux Users ont le même Score et la même accuracy : aucun ne gagne.
_Avoid_ : égalité, nul, tie

**Score** :
Les points d'un User dans un Duel ou un Run : chaque mot juste rapporte ses caractères (espace compris), multipliés par son Combo, et doublés par un Burst. Un mot validé faux ne rapporte rien ; le mot en cours à la fin du temps rapporte ses lettres justes. Il désigne le vainqueur d'un Duel, départagé par l'accuracy ; dans un Run, il ne sert qu'à s'entraîner.
_Avoid_ : points, Result

**Combo** :
Le nombre de mots justes d'affilée tapés sans aucune faute, même corrigée. Il multiplie les points : x1, x2 dès 5 mots, x3 dès 10, x4 au plus dès 15. Une faute le casse dès qu'elle est tapée ; le mot, corrigé, repart à x1. Revenir corriger un mot validé faux ne le rétablit pas.
_Avoid_ : streak, série, chaîne

**Burst** :
Un mot juste sans faute, d'au moins 4 lettres, tapé au moins 20 % plus vite que la Pace du User, chronométré de l'espace qui le précède (ou du départ, pour le premier mot) à la frappe qui le valide (sa dernière lettre, pour le dernier mot d'un Run `words`). Ses points sont doublés. Le mot en cours à la fin du temps n'en est jamais un.
_Avoid_ : perfect, crit, rush

**Pace** :
La cadence de référence d'un User pour le Burst, figée au départ : le wpm médian de ses 10 derniers Duels, ou de ceux qu'il a s'il en a moins ; 50 wpm sans aucun Duel, et pour un Visitor. Elle vient de l'historique, pas du Duel en cours, pour qu'alterner mots lents et rapides ne rapporte rien.
_Avoid_ : moyenne, niveau, cadence
