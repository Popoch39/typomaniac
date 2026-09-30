# La barre latérale se replie en Rail sous 1440 px et se retire pendant le Run

L'ADR 0009 garde l'app desktop uniquement, sans mise en page mobile, mais une barre latérale de 256 px ne laissait pas assez de place aux pages sur les écrans de 1024 à 1366 px. Sur Jouer, les cartes s'écrasaient (à 1024 px, les cartes latérales faisaient 177 px, et les textes en débordaient) et la page défilait de 27 px en 1280 × 720. Sous 1440 px de large, la barre devient donc un Rail d'environ 68 px. Il garde toutes ses entrées, sous forme d'icônes nommées dans un tooltip. C'est la largeur de la fenêtre seule qui décide : pas de bouton, pas de réglage. Pendant qu'un Run solo est tapé, la barre ne s'estompe plus à 30 % : elle sort de la fenêtre (Retrait) et le Text prend toute la largeur. Elle revient au Result. Amendé par l'ADR 0014 : pendant le Run, elle se replie en Rail au lieu de se retirer.

## Considered Options

- **Barre masquée derrière un bouton, ou tiroir au survol** : écarté. La nav et l'attente dans la Queue doivent rester visibles sur toutes les pages, et un tiroir passerait par-dessus la page qu'on regarde.
- **Largeur + bouton pour replier à la main** : écarté. C'est un réglage de plus pour un seul cas, celui des écrans étroits, que la largeur tranche déjà.
- **Seuil à 1280 ou 1366 px** : écarté. À 1366 px, la barre entière fait encore déborder la carte Duel entre amis, et à 1280 × 720 la page défile. 1440 px est la première largeur où tout tient avec la barre entière. En Rail, une fenêtre de 1280 px retrouve les cartes de 1440.
- **Rail et fondu pendant le Run** : écarté. Le Rail estompé occupait encore la place du Text et restait dans le champ de vision.

## Consequences

- L'ADR 0009 tient toujours : pas de variantes `sm:` / `md:` de mise en page. Le Rail est un état de la barre lu par `matchMedia` (`useSidebarRail`), et les cartes de Jouer s'adaptent à leur propre largeur (container queries) : elles tiennent dès 1024 px, et Jouer ne défile pas au-dessus de 720 px de haut.
- Franchir 1440 px en redimensionnant la fenêtre bascule d'un coup, sans animation. Seul le Retrait est animé (GSAP, 0,3 s), et il est instantané sous mouvement réduit.
- Dans le Rail, défier un Friend passe par Friends, et le rang du User par son Profil : le Rail n'a ni Défier ni carte du User.
