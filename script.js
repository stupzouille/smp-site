/* ==========================================================================
   SMP — Scripts boutique
   1. ⚙️ CONFIG CENTRALISÉE  ← nom de la monnaie, IP, Discord, Packs (à éditer ici)
   2. Rendu des cartes « Pack de monnaie » depuis la config
   3. Bouton « Copier l'IP » + notification toast
   4. Statut serveur (nombre de joueurs connectés, live)
   5. Pétales animés dans la bannière
   6. Année automatique dans le footer
   7. Garde-fou boutons « Acheter »
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     1. ⚙️ CONFIG — TOUT SE RÈGLE ICI
     --------------------------------------------------------------------------
     Le NOM de la monnaie est défini une seule fois (CONFIG.currency.name) et
     se propage partout : titres, cartes, textes marqués data-currency dans le
     HTML. Le jour où le nom est tranché, tu ne changes QUE cette ligne.
     ========================================================================== */
  var CONFIG = {

    /* ---- 💰 MONNAIE VIRTUELLE ---- */
    currency: {
      name:   'Pétales',   // ⚠️ PLACEHOLDER — NOM À DÉFINIR (cf. cahier des charges §5)
      short:  'Pétales',   // forme courte affichée sous les compteurs
      icon:   '🌸'         // emoji/icône de la monnaie (remplaçable par une <img> plus tard)
    },

    /* ---- 🌐 SERVEUR ---- */
    server: {
      ip:      'mochismp.fr',                 // ⚠️ À DÉFINIR — domaine .fr du nouveau SMP
      discord: 'https://discord.gg/mochismp',    // ⚠️ À DÉFINIR — invitation Discord
      showStatus:  true,                        // affiche le nombre de joueurs connectés (live)
      statusHost:  '',                          // laisse vide = utilise `ip` ci-dessus. Sinon force un hôte:port (ex. 'play.serveur.fr:25565')
      refreshMs:   60000                        // rafraîchissement du compteur (60 s)
    },

    /* ---- 🎁 PACKS VENDUS SUR LA BOUTIQUE ----
       amount   : quantité de base de monnaie
       bonus    : pourcentage de bonus offert (0 = aucun)
       price    : prix en euros (string libre, ex. '4.99')
       featured : true = carte mise en avant (bordure dégradée + ruban)
       tag      : texte du petit ruban en haut à droite
       payUrl   : lien de paiement (Tebex, Stripe, PayPal…). Vide = « bientôt ».
    */
    packs: [
      { id: 'pack-recharge',   name: 'Pack Recharge',   amount: 150,   bonus: 0,  price: '1.99',  tag: 'Recharge',  payUrl: '' },
      { id: 'pack-decouverte', name: 'Pack Découverte', amount: 500,   bonus: 0,  price: '4.99',  tag: 'Starter',   payUrl: '' },
      { id: 'pack-aventurier', name: 'Pack Aventurier', amount: 1200,  bonus: 10, price: '9.99',  tag: 'Bonus +10%', payUrl: '' },
      { id: 'pack-guerrier',   name: 'Pack Guerrier',   amount: 2500,  bonus: 15, price: '19.99', tag: 'Populaire',  featured: true, payUrl: '' },
      { id: 'pack-seigneur',   name: 'Pack Seigneur',   amount: 6000,  bonus: 20, price: '39.99', tag: 'Bonus +20%', payUrl: '' },
      { id: 'pack-legende',    name: 'Pack Légende',    amount: 15000, bonus: 25, price: '89.99', tag: 'Le meilleur', payUrl: '' }
    ]
  };

  /* Petit utilitaire : formate un nombre avec des espaces (1 320 → « 1 320 ») */
  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* ==========================================================================
     2. RENDU DES PACKS
     Injecte les cartes dans #packs-grid et propage le nom de la monnaie
     partout où un élément porte l'attribut data-currency.
     ========================================================================== */
  var CUR = CONFIG.currency;

  // 2a. Propage le nom de la monnaie dans tous les textes marqués
  document.querySelectorAll('[data-currency]').forEach(function (el) {
    el.textContent = CUR.name;
  });
  document.querySelectorAll('[data-currency-icon]').forEach(function (el) {
    el.textContent = CUR.icon;
  });

  // 2b. Construit les cartes de Packs
  var grid = document.getElementById('packs-grid');
  if (grid) {
    CONFIG.packs.forEach(function (p) {
      var bonusCoins = Math.round(p.amount * (p.bonus / 100));
      var total = p.amount + bonusCoins;

      var card = document.createElement('article');
      card.className = 'card' + (p.featured ? ' card--featured' : '');

      var ribbon = p.tag
        ? '<div class="card__ribbon' + (p.featured ? ' card__ribbon--hot' : '') + '">' + p.tag + '</div>'
        : '';

      var bonusBadge = p.bonus > 0
        ? '<span class="pack__bonus">🎉 +' + p.bonus + '% offerts</span>'
        : '<span class="pack__bonus pack__bonus--none">Sans bonus</span>';

      var breakdown = p.bonus > 0
        ? '<p class="pack__breakdown">' + fmt(p.amount) + ' + <strong>' + fmt(bonusCoins) + ' bonus</strong></p>'
        : '<p class="pack__breakdown">Pack de démarrage</p>';

      card.innerHTML =
        ribbon +
        '<div class="card__icon" aria-hidden="true">' + CUR.icon + '</div>' +
        '<h4 class="card__title">' + p.name + '</h4>' +
        '<div class="pack__amount">' +
          '<span class="pack__coin-icon" aria-hidden="true">' + CUR.icon + '</span>' +
          '<span class="pack__coins">' + fmt(total) + '</span>' +
          '<span class="pack__currency">' + CUR.short + '</span>' +
        '</div>' +
        breakdown +
        bonusBadge +
        '<div class="card__footer">' +
          '<p class="price">' + p.price + ' <span>€</span></p>' +
          '<a class="btn btn--buy" href="' + (p.payUrl || '#') + '" data-product="' + p.id + '">Acheter</a>' +
        '</div>';

      grid.appendChild(card);
    });
  }

  /* ==========================================================================
     3. COPIER L'IP + toast
     Fonctionne pour TOUS les boutons possédant un attribut data-ip.
     ========================================================================== */
  var toast = document.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var input = document.createElement('textarea');
      input.value = text;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy') ? resolve() : reject();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(input);
      }
    });
  }

  // Injecte l'IP de la config dans les éléments qui l'affichent / la copient
  document.querySelectorAll('[data-ip-text]').forEach(function (el) {
    el.textContent = CONFIG.server.ip;
  });
  document.querySelectorAll('[data-ip]').forEach(function (btn) {
    if (btn.getAttribute('data-ip') === '') btn.setAttribute('data-ip', CONFIG.server.ip);
    btn.addEventListener('click', function () {
      var ip = btn.getAttribute('data-ip') || CONFIG.server.ip;
      copyText(ip).then(
        function () { showToast('🌸 IP copiée : ' + ip); },
        function () { showToast('Copie impossible - IP : ' + ip); }
      );
    });
  });

  // Liens Discord issus de la config
  document.querySelectorAll('[data-discord]').forEach(function (a) {
    a.href = CONFIG.server.discord;
  });

  /* ==========================================================================
     4. STATUT SERVEUR — nombre de joueurs connectés (live)
     --------------------------------------------------------------------------
     Le site est statique (GitHub Pages) : on interroge une API publique de
     statut Minecraft (api.mcstatus.io, CORS ouvert) côté navigateur.
     Tant que l'IP est un placeholder / le serveur hors ligne, on affiche
     proprement « Serveur hors ligne ». Ça s'activera tout seul quand l'IP
     pointera vers un vrai serveur en ligne.
     ========================================================================== */
  (function () {
    if (!CONFIG.server.showStatus) return;

    var host = CONFIG.server.statusHost || CONFIG.server.ip;
    var pill = document.getElementById('serverStatus');
    var text = document.getElementById('serverStatusText');
    var counters = document.querySelectorAll('[data-player-count]');

    function setState(cls, label, count) {
      if (pill) {
        pill.hidden = false;
        pill.classList.remove('is-online', 'is-offline');
        if (cls) pill.classList.add(cls);
      }
      if (text) text.textContent = label;
      counters.forEach(function (el) { el.textContent = count; });
    }

    function refresh() {
      fetch('https://api.mcstatus.io/v2/status/java/' + encodeURIComponent(host), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.online) {
            var on  = (d.players && typeof d.players.online === 'number') ? d.players.online : 0;
            var max = (d.players && typeof d.players.max === 'number') ? d.players.max : null;
            var noun = on >= 2 ? 'joueurs' : 'joueur';
            setState('is-online', on + (max ? ' / ' + max : '') + ' ' + noun + ' en ligne', on);
          } else {
            setState('is-offline', 'Serveur hors ligne', '—');
          }
        })
        .catch(function () {
          setState('is-offline', 'Statut indisponible', '—');
        });
    }

    refresh();
    var ms = CONFIG.server.refreshMs;
    if (ms && ms >= 10000) setInterval(refresh, ms);
  })();

  /* ==========================================================================
     5. PÉTALES DE CERISIER (décoratif)
     ========================================================================== */
  var PETAL_COUNT = 16;
  var petalsBox = document.getElementById('petals');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (petalsBox && !reduceMotion) {
    var tones = ['#ffcfe4', '#ffb0d3', '#ffe6f1', '#ff85bd'];
    for (var i = 0; i < PETAL_COUNT; i++) {
      var petal = document.createElement('span');
      var size = 8 + Math.random() * 10;
      petal.className = 'petal';
      petal.style.left = (Math.random() * 100) + '%';
      petal.style.width = size + 'px';
      petal.style.height = size + 'px';
      petal.style.background = tones[Math.floor(Math.random() * tones.length)];
      petal.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
      petal.style.animationDuration = (7 + Math.random() * 9).toFixed(1) + 's';
      petal.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
      petalsBox.appendChild(petal);
    }
  }

  /* ==========================================================================
     6. ANNÉE DU FOOTER
     ========================================================================== */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ==========================================================================
     7. GARDE-FOU BOUTONS « ACHETER » (packs sans lien de paiement)
     Les liens vivent dans CONFIG.packs[].payUrl. Tant qu'un lien est vide,
     le bouton n'ouvre rien et prévient l'acheteur.
     ========================================================================== */
  document.querySelectorAll('[data-product]').forEach(function (link) {
    var url = link.getAttribute('href');

    if (url && url !== '#') {
      link.target = '_blank';
      link.rel = 'noopener';
      return;
    }

    link.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('🛠️ Boutique bientôt disponible - passe sur le Discord !');
    });
  });
})();
