# La Photo est cadrée par le navigateur, réencodée par l'API, gardée sur SeaweedFS et servie par l'API

Jusqu'ici, l'Avatar d'un User n'était que l'URL de l'image de son fournisseur OAuth, et l'app ne gardait aucun fichier. Pour la Photo, le navigateur coupe le carré que le User a cadré (1024 px au plus) et l'envoie. L'API le décode avec `Bun.Image`, ce qui refuse tout ce qui n'est pas une vraie image et efface les métadonnées (EXIF, position GPS), puis le réencode en WebP de 512 × 512. Elle le dépose sur un SeaweedFS compatible S3, via `Bun.s3`, sous une clé neuve à chaque envoi, aléatoire sous l'id du User (`<userId>/<uuid>.webp`). Elle le sert elle-même, sans Session, sur `/api/photos/<clé>`, avec un cache immuable. L'image du fournisseur reste en base : retirer sa Photo la rend.

## Considered Options

- **Dans Postgres (bytea)** : écarté. C'est plus simple, aucune infra en plus, mais des fichiers dans la base principale alourdissent ses sauvegardes, et le stockage d'objets était voulu.
- **Bucket public ou CDN devant le stockage** : écarté. L'API ne serait plus le seul point d'accès, et la publication dépendrait de la config du stockage. Le cache immuable rend le proxy peu coûteux.
- **URLs présignées** : écarté. Elles expirent, donc les listes (Leaderboard, Friends) cachent mal leurs Avatars.
- **Recadrage par sharp côté serveur** : écarté. C'est une dépendance native à faire tenir dans le binaire bun compilé et l'image distroless. `Bun.Image` est intégré à Bun, mais il ne recadre pas : le cadrage revient au navigateur.
- **Garder tel quel le fichier envoyé par le navigateur** : écarté. Rien ne garantit que les octets sont une image, ni qu'ils sont vidés de leurs métadonnées.

## Consequences

- Les variables `S3_*` sont toutes posées ou aucune. Sans elles, l'envoi d'une Photo répond 503 et le reste de l'app marche.
- Une Photo remplacée ou retirée est effacée du stockage, et un User supprimé emporte la sienne.
- Tout le trafic des Photos passe par l'API. Si elle doit s'en décharger, un CDN pourra se poser devant `/api/photos/*`, puisque la clé ne change jamais de contenu.
