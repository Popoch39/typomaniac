# typomaniac

Contexte unique du monorepo : le vocabulaire partagé par le front et l'API.

## Language

### Identité

**User** :
Une personne connue de typomaniac, identifiée par son email. C'est la seule entité qui porte l'identité ; son Profile n'est qu'une page qui le montre, pas une entité séparée. Les autres Users ne voient que son Handle, son avatar et ses Stats, jamais son email ni son name.
_Avoid_ : compte, player, membre

**Profile** :
La page d'un User, trouvée par son Handle, que tout User connecté peut voir : son Handle, son avatar et ses Stats. Sa Duel history, ses Duel charts et ses Replays n'y figurent pas.
_Avoid_ : fiche, page perso, compte

**Handle** :
Le nom public et unique d'un User, choisi par lui avant son premier Duel et modifiable à tout moment : de 3 à 20 caractères parmi `a-z`, `0-9` et `_`, sans distinction de casse. C'est par lui qu'on trouve un User et qu'on le désigne partout dans l'app. Changer de Handle libère l'ancien ; les Friends et l'historique tiennent au User, pas au Handle.
_Avoid_ : pseudo, username, tag, name

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
Deux Users, appariés par la Queue ou par un Challenge, qui tapent le même Text en même temps, au format fixe `time` 30 s en anglais, et dont chacun obtient un Result et un Score. Le meilleur Score gagne, départagé par l'accuracy ; sinon c'est un Draw. Les Duels joués avant le Score gardent leur issue d'origine, au wpm. Un Duel se termine aussi par un Forfeit.
_Avoid_ : match, versus, 1v1, partie, race

**Queue** :
L'attente des Users qui veulent un Duel Ranked. Deux Users distincts y sont appariés quand leurs MMR sont assez proches : l'écart accepté part de ±100 et s'élargit avec l'attente, jusqu'à n'importe quel adversaire au bout de 30 secondes. Un appariement ouvre une Match proposal, il ne lance pas le Duel. Un User peut quitter la Queue à tout moment ; pendant une Match proposal, la quitter revient à la refuser. Il peut y attendre tout en lançant un Challenge : le premier qui aboutit l'emporte. Un Challenge accepté le sort de la Queue ; une Match proposal annule ses Challenges en attente, envoyés comme reçus. Pendant l'attente, il voit depuis quand il attend, combien de Users sont dans la Queue, lui compris, et l'Estimated wait.
_Avoid_ : lobby, file, matchmaking, salle d'attente

**Estimated wait** :
L'attente probable dans la Queue : la médiane des attentes des 20 derniers appariements acceptés, toutes MMR confondues, jamais plus de 30 secondes. Une Match proposal refusée ou restée sans réponse n'y compte pas. Sans appariement récent, il n'y en a pas.
_Avoid_ : ETA, temps estimé

**Match proposal** :
Les 10 secondes après un appariement de la Queue, pendant lesquelles chacun des deux Users accepte ou refuse le Duel, en voyant son adversaire et son rang. Si les deux acceptent, le Countdown part 1 seconde plus tard. Celui qui refuse ou laisse passer le temps quitte la Queue sans rien perdre ; l'autre y revient avec son attente d'origine. Pendant ce temps, les deux Users restent en ligne. Un Challenge n'en a pas : il est déjà accepté.
_Avoid_ : ready check, match trouvé, confirmation, adversaire trouvé

**Countdown** :
Les 4,5 secondes avant le départ d'un Duel, identiques pour les deux Users : le Face-off, puis le 3-2-1. La frappe y est bloquée tout du long. Il part 1 seconde après la double acceptation d'une Match proposal, ou dès l'acceptation d'un Challenge.
_Avoid_ : timer, décompte, compte à rebours

**Face-off** :
Les 1,5 premières secondes du Countdown, les deux Users face à face en plein écran : le User à gauche, son adversaire à droite, chacun avec son rang (ou « Challenge » quand le Duel n'est pas Ranked) et sa Form. Dans un Duel Ranked hors Placement, le User y voit aussi sa Stake, jamais celle de son adversaire ; elle reste visible pendant le 3-2-1. Un Promotion Duel y est mis en scène jusqu'au départ.
_Avoid_ : match trouvé, VS screen, écran de versus

**Form** :
Les 5 derniers Duels Ranked terminés d'un User, montrés au Face-off : l'issue de chacun, du plus récent au plus ancien (victoire, défaite ou Draw), et son wpm moyen sur ces Duels. Les Challenges n'y comptent pas ; sans Duel Ranked, elle est absente, jamais à zéro.
_Avoid_ : forme, stats, bilan, historique récent

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

**Duel history** :
Les Duels terminés d'un User, du plus récent au plus ancien.
_Avoid_ : match history, historique de parties

**Replay** :
La relecture d'un Duel enregistré, à partir des Keystrokes des deux Users, au rythme où ils ont tapé.
_Avoid_ : playback, rediffusion

**Duel chart** :
Le graph d'un Duel terminé, seconde par seconde, pour chacun des deux Users : son wpm cumulé, son raw de chaque seconde et ses Misses. Seuls les deux Users du Duel le voient.
_Avoid_ : graph, courbe, timeline

**Stats** :
Les agrégats des Duels terminés d'un User : son bilan (victoires, défaites, Draws), ses moyennes, ses records et sa Progression. Les Runs n'y comptent pas.
_Avoid_ : statistiques, Result, score

**Progression** :
L'évolution Duel après Duel du wpm, du raw, de l'accuracy et de la consistency d'un User. Les Duels terminés par un Forfeit n'y figurent pas, parce que leur Result ne couvre pas tout le temps.
_Avoid_ : évolution, historique, courbe

### Ranked

**Ranked** :
Le classement des Users par les Duels de la Queue : chaque Duel Ranked terminé, Forfeit et Draw compris, fait bouger le MMR et les TP des deux Users. Les Challenges et les Duels joués avant la Ranked n'y comptent pas.
_Avoid_ : compétitif, ladder, classé

**MMR** :
Le niveau caché d'un User, un Elo : il sert à l'apparier dans la Queue et à peser ses TP, et n'est jamais montré, pas même à lui. Il part de sa Pace au premier Duel Ranked. Une victoire compte 1, un Draw 0,5, une défaite 0 ; un Forfeit est une victoire pour l'adversaire.
_Avoid_ : elo, rating, cote, niveau

**TP** :
Les typing points visibles d'un User dans sa Division, de 0 à 100 : un Duel en rapporte ou en coûte entre 8 et 35 (un Draw entre 0 et 35, dans un sens ou dans l'autre), plus contre un adversaire au MMR supérieur, et plus encore quand le MMR du User dépasse ce qu'attend son rang, pour que le rang rattrape le niveau. À 100, le User monte d'une Division en gardant le surplus, sans série de promotion ; sa première défaite ensuite, si elle le fait passer sous 0, le laisse à 0 sans le faire descendre. Sinon, passer sous 0 le fait descendre à 75 dans la Division d'en dessous, jamais sous Fer IV.
_Avoid_ : LP, points, Score

**Tier** :
Le palier du rang d'un User : Fer, Bronze, Argent, Or, Platine, Diamant, chacun en quatre Divisions, puis Maître, sans Division, où les TP s'accumulent sans plafond.
_Avoid_ : ligue, rang, elo

**Division** :
L'un des quatre échelons d'un Tier, de IV (le plus bas) à I. Chacune vaut 100 TP.
_Avoid_ : palier, niveau

**Placement** :
Les 5 premiers Duels Ranked d'un User, sans Tier visible, où son MMR bouge presque deux fois plus vite. À la fin, il reçoit la Division qui correspond à son MMR, à 0 TP.
_Avoid_ : placement matches, qualifications

**Stake** :
Ce qu'un Duel Ranked peut faire aux TP d'un User, montré au Face-off : les TP qu'une victoire lui rapporterait et le rang où elle le mènerait, les TP qu'une défaite lui coûterait. Calculée par le serveur à l'appariement, par les mêmes règles que la fin du Duel, elle est exactement ce que le Duel appliquera. Pas de Stake pour un Draw, ni en Placement, ni dans un Challenge.
_Avoid_ : preview, pari, prévision

**Promotion Duel** :
Un Duel Ranked dont la victoire ferait changer un User de Tier ou le ferait entrer en Maître, que le Face-off annonce comme tel. C'est un Duel ordinaire, seul, aux mêmes règles : pas une série. Monter d'une Division sans changer de Tier n'en fait pas un.
_Avoid_ : série de promotion, promo, BO

**Classement** :
La liste des Users Ranked hors Placement, triés par Tier, Division puis TP.
_Avoid_ : leaderboard, ladder, top

### Social

**Friend** :
Un User lié à un autre par une amitié mutuelle, née d'une Friend request acceptée. Seul un Friend peut voir la Presence d'un User et lui lancer un Challenge. Chacun des deux peut y mettre fin à tout moment, sans l'accord de l'autre.
_Avoid_ : ami, contact, buddy, follower

**Friend request** :
La demande d'un User à un autre de devenir Friends. Elle attend jusqu'à ce que le destinataire l'accepte ou la refuse, ou que l'envoyeur l'annule. Un refus n'est pas signalé à l'envoyeur, qui peut redemander. Deux Friend requests croisées font directement deux Friends.
_Avoid_ : invitation, demande d'ami, invite

**Presence** :
Ce qu'un User laisse voir à ses Friends de sa disponibilité : en ligne (typomaniac ouvert, libre), en Duel, ou hors ligne. Être dans la Queue ou dans une Match proposal compte comme en ligne.
_Avoid_ : statut, online, activité

**Challenge** :
L'invitation d'un User à l'un de ses Friends, en ligne, à jouer un Duel ensemble, hors de la Queue. Elle expire au bout de 30 secondes ; l'envoyeur peut l'annuler, le destinataire l'accepter ou la refuser. Accepter lance le Countdown du Duel, qui compte comme n'importe quel autre, sauf qu'il n'est jamais Ranked : il ne touche ni au MMR ni aux TP. Un User n'a qu'un Challenge envoyé à la fois.
_Avoid_ : défi, invitation, invite, duel privé

**Activity** :
Ce qu'un User voit de ses Friends actuels : leurs Duels terminés, contre n'importe qui, et leurs nouvelles amitiés, avec n'importe qui. Elle découle des Duels et des amitiés : quand une amitié prend fin, les Activities de l'ex-Friend disparaissent. L'arrivée en ligne d'un Friend y apparaît sur le moment, sans être conservée.
_Avoid_ : feed, fil, timeline, fil d'actualité
