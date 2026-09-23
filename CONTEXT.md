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
