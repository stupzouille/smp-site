# 🌸 SMP — Site & Boutique de Packs

Site vitrine + boutique du nouveau serveur Minecraft SMP.
**La DA (thème rose/sakura) est reprise telle quelle de `MochiSMPSite` et sera retravaillée plus tard.**

> ⚠️ Plusieurs valeurs sont des **placeholders à définir** : nom du projet, nom de la
> monnaie, domaine `.fr`, invitation Discord. Elles sont toutes signalées et centralisées.

## Contenu

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure (header, boutique de Packs, sidebar, footer) |
| `style.css` | Thème rose/blanc repris de MochiSMPSite + styles des cartes Packs |
| `script.js` | **Config centralisée** + rendu des Packs, copier l'IP, pétales |
| `assets/` | Logo, bannière et avatars (repris de MochiSMPSite) |

Aucune dépendance, aucun build : ouvre `index.html` dans un navigateur.

## 💰 Monnaie virtuelle vendue en Packs

Conformément au cahier des charges (§5), la monnaie payante est vendue **sous forme de
Packs** sur la boutique. Tout se règle en haut de `script.js` dans l'objet **`CONFIG`** :

```js
var CONFIG = {
  currency: {
    name:  'Pétales',   // ⚠️ NOM À DÉFINIR — change-le ICI, il se propage partout
    short: 'Pétales',
    icon:  '🌸'
  },
  server: {
    ip:      'monserveur.fr',              // ⚠️ domaine .fr à définir
    discord: 'https://discord.gg/xxxxxxx'  // ⚠️ invitation à définir
  },
  packs: [
    { id:'pack-decouverte', name:'Pack Découverte', amount:500,   bonus:0,  price:'4.99',  ... },
    { id:'pack-aventurier', name:'Pack Aventurier', amount:1200,  bonus:10, price:'9.99',  ... },
    { id:'pack-guerrier',   name:'Pack Guerrier',   amount:2500,  bonus:15, price:'19.99', featured:true, ... },
    { id:'pack-seigneur',   name:'Pack Seigneur',   amount:6000,  bonus:20, price:'39.99', ... },
    { id:'pack-legende',    name:'Pack Légende',    amount:15000, bonus:25, price:'89.99', ... }
  ]
};
```

- **Nom de la monnaie** → une seule ligne (`currency.name`). Il se propage à tous les
  textes marqués `data-currency` dans le HTML, aux titres et aux cartes.
- **Bonus** → le total affiché sur la carte = `amount + amount × bonus%`
  (ex. Pack Guerrier : 2 500 + 15 % = **2 875**).
- **Ajouter / retirer un Pack** → ajoute ou enlève une entrée dans `packs`. La carte
  se génère automatiquement.

### Récapitulatif des Packs par défaut

| Pack | Base | Bonus | Total crédité | Prix |
| --- | --- | --- | --- | --- |
| Recharge | 150 | — | 150 | 1.99 € |
| Découverte | 500 | — | 500 | 4.99 € |
| Aventurier | 1 200 | +10 % | 1 320 | 9.99 € |
| Guerrier ⭐ | 2 500 | +15 % | 2 875 | 19.99 € |
| Seigneur | 6 000 | +20 % | 7 200 | 39.99 € |
| Légende | 15 000 | +25 % | 18 750 | 89.99 € |

## 👥 Joueurs connectés (live)

Le nombre de joueurs en ligne s'affiche automatiquement (pastille dans le hero +
ligne « Connectés » de la sidebar). Le site étant statique, il interroge l'API
publique **api.mcstatus.io** côté navigateur, à partir de `CONFIG.server.ip`.

- Réglages dans `CONFIG.server` : `showStatus` (on/off), `statusHost` (forcer un
  `hote:port` différent de l'IP affichée), `refreshMs` (intervalle, défaut 60 s).
- Tant que l'IP est un placeholder ou le serveur hors ligne, la pastille affiche
  **« Serveur hors ligne »**. Elle s'activera d'elle-même quand l'IP pointera vers
  un vrai serveur en ligne.

## Configurer les liens de paiement

Renseigne `payUrl` de chaque pack dans `CONFIG.packs` (Tebex, Stripe, PayPal,
CraftingStore…). Tant qu'un `payUrl` est vide, le bouton « Acheter » affiche
« Boutique bientôt disponible » au lieu d'ouvrir un lien.

```js
{ id:'pack-guerrier', ..., payUrl:'https://ton-serveur.tebex.io/package/1234567' }
```

## Liaison boutique ➔ joueur

La livraison est prévue **automatique via le pseudo/UUID Minecraft** (cf. cahier des
charges §5). Côté front, on demande le pseudo au paiement ; la synchronisation réelle
(crédit du solde en jeu) se fera côté serveur/plugin, non couvert par ce site statique.

---

Site non affilié à Mojang AB ou Microsoft.
