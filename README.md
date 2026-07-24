# ✦ AERA SRP — Site & Boutique

Site vitrine + boutique du serveur Minecraft **AERA SRP**.

- **IP du serveur :** `play.aerasrp.fr`
- **Discord :** [discord.gg/yZ88ZS6T3e](https://discord.gg/yZ88ZS6T3e)
- **Édition :** Java & Bedrock (crossplay)
- **Monnaie virtuelle :** **Étoiles**, vendues par **Packs**

**DA : lunaire / crépuscule** — nuit violette, améthyste, accents dorés pour les Étoiles.

> ⚠️ Reste à fournir : le **logo** (`assets/logo.png`).

## Contenu

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure (header, boutique de Packs, sidebar, footer, modale d'achat) |
| `style.css` | DA lunaire : fond nuit, cartes en verre, lueurs améthyste |
| `script.js` | **Config centralisée** + rendu des Packs, copier l'IP, ciel étoilé, achat |
| `assets/` | Logo et avatars du staff |

Aucune dépendance, aucun build : ouvre `index.html` dans un navigateur.

## Images à fournir

- `assets/logo.png` — logo « AERA SRP ». S'il est absent, le titre texte prend le relais
  (le site reste parfaitement fonctionnel).
- **Bannière** : pas de bannière finale pour l'instant — le hero est un **dégradé lunaire
  100 % CSS** avec ciel étoilé animé. Pour ajouter la bannière plus tard : dépose-la dans
  `assets/banner.png` et décommente la ligne `url("assets/banner.png")` dans `.hero__bg`
  (`style.css`).

## ✦ Monnaie & Packs

Tout se règle en haut de `script.js` dans l'objet **`CONFIG`** :

```js
currency: { name: 'Étoiles', short: 'Étoiles', icon: '✦' },
server:   { ip: 'play.aerasrp.fr', discord: 'https://discord.gg/xxxxxxx', ... },
payments: { apiBase: '' },   // URL du backend de paiement (voir plus bas)
```

Le **nom de la monnaie** est défini une seule fois et se propage partout (titres, cartes,
textes marqués `data-currency`).

### Packs par défaut

| Pack | Base | Bonus | Total crédité | Prix |
| --- | --- | --- | --- | --- |
| 🌙 Croissant de Lune | 150 | — | 150 | 1.99 € |
| 🌓 Premier Quartier | 500 | — | 500 | 4.99 € |
| 🌕 Pleine Lune | 1 200 | +10 % | 1 320 | 9.99 € |
| 🌌 Aura Crépusculaire ⭐ | 2 500 | +15 % | 2 875 | 19.99 € |
| 🌘 Éclipse d'Améthyste | 6 000 | +20 % | 7 200 | 39.99 € |
| 💫 Supernova | 15 000 | +25 % | 18 750 | 89.99 € |

> ⚠️ Les `id` et les **totaux** doivent rester synchro avec le catalogue serveur
> `../AeraSRP/payments/catalog.js` — c'est **lui** qui fait foi pour le prix réellement payé.

## 👥 Joueurs connectés (live)

Le nombre de joueurs en ligne s'affiche automatiquement (pastille dans le hero + ligne
« Connectés » de la sidebar), via l'API publique **api.mcstatus.io** interrogée depuis le
navigateur à partir de `CONFIG.server.ip`. Si le serveur est hors ligne, la pastille
affiche « Serveur hors ligne ».

Réglages : `showStatus`, `statusHost`, `refreshMs` dans `CONFIG.server`.

## 💳 Paiement (Stripe via le bot)

Le tunnel de paiement vit dans le **bot** (`../AeraSRP/payments/`, guide complet dans
`../AeraSRP/PAYMENTS.md`). Côté site, une seule ligne à renseigner :

```js
payments: { apiBase: 'https://<ton-domaine-bot>' }  // vide = boutons « bientôt »
```

Quand elle est renseignée, « Acheter » ouvre une **modale de saisie du pseudo**, appelle
`POST {apiBase}/checkout`, puis redirige vers **Stripe**. Après paiement, le bot crédite
les Étoiles en jeu via le pont WebSocket. Le prix et le montant crédité sont **définis
côté serveur** (le site n'envoie qu'un `packId` + le pseudo).

---

Site non affilié à Mojang AB ou Microsoft.
