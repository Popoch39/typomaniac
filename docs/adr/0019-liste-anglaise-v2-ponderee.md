# La liste anglaise v2 : 1 000 mots pondérés par fréquence, la règle de tirage dans la Word list version

Avec les 200 mots de la Word list version 1 anglaise, tous aussi probables, un Duel revoyait les mêmes mots au bout de quelques Rounds. La version 2 a 1 000 mots : les mots de SCOWL (sizes 10 et 20, orthographe américaine) en `[a-z]` de 2 à 10 lettres, hors listes vulgaires et injurieuses de SCOWL, hors curation à la main, classés par leurs occurrences dans Google Books Ngram depuis 2000. Ils sont pondérés par fréquence : les 100 premiers pèsent 4, les 300 suivants 2, les 600 derniers 1. Un mot ne revient qu'une fois trois autres tirés. Ce poids et cette règle font partie de la Word list version : la version 1 garde son tirage uniforme, sans deux fois le même mot de suite, et redonne exactement ses Texts. Le script qui construit la liste vit dans `tools/word-list`.

## Considered Options

- **Tirage uniforme sur 1 000 mots** : écarté. Les mots rares sortiraient aussi souvent que « the », et le Text ne se lirait plus comme de l'anglais.
- **Fréquence brute** (loi de Zipf) : écarté. Les dix premiers mots feraient un quart du Text : facile, répétitif.
- **Un poids continu par mot** (racine ou log des occurrences) : écarté. Plus fin, mais un nombre par mot à figer, pour une différence que trois poids entiers rendent déjà.
- **Une « version du tirage » à part de la Word list version** : écarté. Un concept, une colonne et une migration de plus, alors que la Word list version est déjà enregistrée sur chaque Duel, Round et Best Run.
- **Moby Words seul** (domaine public) : écarté. Environ 900 mots uniques, datés, sans occurrences.
- **wordfreq, Wiktionary, OpenSubtitles** : écartés, données en CC BY-SA ; **google-10000-english et `count_1w.txt` de Norvig** : écartés, dérivés du corpus Web 1T sous licence LDC.

## Consequences

- Deux notices partent avec la liste, dans `THIRD-PARTY-NOTICES.md` et en commentaire gardé dans le bundle : la permission de SCOWL (Kevin Atkinson) et le crédit CC BY 3.0 de Google Books Ngram.
- La version courante se déclare à la main au lieu de suivre la dernière version connue. Une nouvelle version part d'abord sans être courante, puis le devient une fois que chaque client la connaît : un onglet ouvert sur l'ancien front recevrait sinon un Duel qu'il ne peut pas construire. L'API accepte une Best Run sur toute version connue du moteur.
- Les Best Runs et les Records d'avant restent : un Text de la version 2 est un peu plus facile à lire (les mots courants reviennent), un peu plus varié à taper.
