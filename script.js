/* ==========================================================================
   AERA SRP — Scripts boutique
   1. ⚙️ CONFIG CENTRALISÉE  ← nom de la monnaie, IP, Discord, Packs (à éditer ici)
   2. Rendu des cartes « Pack de monnaie » depuis la config
   3. Bouton « Copier l'IP » + notification toast
   4. Statut serveur (nombre de joueurs connectés, live)
   5. Ciel étoilé animé dans la bannière
   6. Année automatique dans le footer
   7. Achat : saisie du pseudo + redirection Stripe (backend du bot)
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
      name:   'Étoiles',   // nom de la monnaie — se propage partout
      short:  'Étoiles',   // forme courte affichée sous les compteurs
      icon:   '✦'          // icône de la monnaie (remplaçable par une <img> plus tard)
    },

    /* ---- 🌐 SERVEUR ---- */
    server: {
      ip:      'play.aerasrp.fr',
      discord: 'https://discord.gg/yZ88ZS6T3e',  // invitation Discord AERA SRP
      showStatus:  true,                        // affiche le nombre de joueurs connectés (live)
      statusHost:  '',                          // laisse vide = utilise `ip` ci-dessus. Sinon force un hôte:port (ex. 'play.serveur.fr:25565')
      refreshMs:   60000                        // rafraîchissement du compteur (60 s)
    },

    /* ---- 💳 PAIEMENT ---- */
    payments: {
      // URL publique du serveur de paiement du bot (voir AeraSRP/payments/).
      // ⚠️ À DÉFINIR (ex. 'https://bot.monserveur.fr'). Vide = boutons « Acheter »
      // en mode « boutique bientôt disponible » (aucun paiement déclenché).
      apiBase: ''
    },

    /* ---- 🎁 PACKS VENDUS SUR LA BOUTIQUE ----
       amount   : quantité de base d'Étoiles
       bonus    : pourcentage de bonus offert (0 = aucun) -> total = amount + bonus
       price    : prix en euros (string libre, ex. '4.99')
       icon     : icône de la carte (phase de lune) ; défaut = icône de la monnaie
       featured : true = carte mise en avant (bordure dégradée améthyste)
       tag      : texte du petit ruban en haut à droite
       payUrl   : lien de paiement direct (si pas de backend). Vide = « bientôt ».

       ⚠️ Les `id` et les TOTAUX doivent rester synchro avec le catalogue serveur
       (AeraSRP/payments/catalog.js) — c'est lui qui fait foi pour le prix payé.
    */
    packs: [
      { id: 'pack-croissant-de-lune',  name: 'Croissant de Lune',   amount: 150,   bonus: 0,  price: '1.99',  icon: '🌙', tag: 'Recharge',    payUrl: '' },
      { id: 'pack-premier-quartier',   name: 'Premier Quartier',    amount: 500,   bonus: 0,  price: '4.99',  icon: '🌓', tag: 'Starter',     payUrl: '' },
      { id: 'pack-pleine-lune',        name: 'Pleine Lune',         amount: 1200,  bonus: 10, price: '9.99',  icon: '🌕', tag: 'Bonus +10%',  payUrl: '' },
      { id: 'pack-aura-crepusculaire', name: 'Aura Crépusculaire',  amount: 2500,  bonus: 15, price: '19.99', icon: '🌌', tag: 'Populaire',   featured: true, payUrl: '' },
      { id: 'pack-eclipse-amethyste',  name: "Éclipse d'Améthyste", amount: 6000,  bonus: 20, price: '39.99', icon: '🌘', tag: 'Bonus +20%',  payUrl: '' },
      { id: 'pack-supernova',          name: 'Supernova',           amount: 15000, bonus: 25, price: '89.99', icon: '💫', tag: 'Le meilleur', payUrl: '' }
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
        '<div class="card__icon" aria-hidden="true">' + (p.icon || CUR.icon) + '</div>' +
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
        function () { showToast('✦ IP copiée : ' + ip); },
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
     5. CIEL ÉTOILÉ (décoratif)
     Étoiles scintillantes réparties dans la bannière. Quelques-unes sont
     dorées, en rappel de la monnaie. Pour en ajouter/retirer : STAR_COUNT.
     ========================================================================== */
  var STAR_COUNT = 70;
  var starsBox = document.getElementById('stars');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (starsBox && !reduceMotion) {
    for (var i = 0; i < STAR_COUNT; i++) {
      var star = document.createElement('span');
      var size = 1 + Math.random() * 2.6;
      // 1 étoile sur 5 est dorée (couleur des Étoiles)
      star.className = 'star' + (Math.random() < 0.2 ? ' star--gold' : '');
      star.style.left = (Math.random() * 100) + '%';
      star.style.top = (Math.random() * 100) + '%';
      star.style.width = size.toFixed(1) + 'px';
      star.style.height = size.toFixed(1) + 'px';
      star.style.animationDuration = (2.2 + Math.random() * 4).toFixed(1) + 's';
      star.style.animationDelay = (-Math.random() * 6).toFixed(1) + 's';
      starsBox.appendChild(star);
    }
  }

  /* ==========================================================================
     6. ANNÉE DU FOOTER
     ========================================================================== */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ==========================================================================
     7. ACHAT — pseudo + redirection Stripe (via le backend du bot)
     --------------------------------------------------------------------------
     • CONFIG.payments.apiBase renseigné → clic « Acheter » ouvre la modale de
       saisie du pseudo, puis POST {apiBase}/checkout, puis redirection Stripe.
     • Sinon, si le pack a un payUrl → lien direct (compat Tebex/PayPal…).
     • Sinon → message « bientôt disponible ».
     Gère aussi le retour de Stripe (?achat=succes|annule).
     ========================================================================== */
  (function () {
    var API = (CONFIG.payments && CONFIG.payments.apiBase) ? CONFIG.payments.apiBase.replace(/\/+$/, '') : '';
    var IGN_RE = /^[A-Za-z0-9_]{3,16}$/;

    var packById = {};
    CONFIG.packs.forEach(function (p) { packById[p.id] = p; });

    var modal    = document.getElementById('buyModal');
    var mPack    = document.getElementById('buyModalPack');
    var mInput   = document.getElementById('buyModalIgn');
    var mError   = document.getElementById('buyModalError');
    var mConfirm = document.getElementById('buyModalConfirm');
    var mCancel  = document.getElementById('buyModalCancel');
    var current  = null;

    function openModal(pack) {
      current = pack;
      if (mError)  mError.textContent = '';
      if (mPack)   mPack.textContent = pack.name + ' — ' + pack.price + ' €';
      if (mInput)  mInput.value = (function () { try { return localStorage.getItem('smp_ign') || ''; } catch (e) { return ''; } })();
      if (mConfirm){ mConfirm.disabled = false; mConfirm.textContent = 'Payer'; }
      if (modal)   modal.hidden = false;
      if (mInput)  mInput.focus();
    }
    function closeModal() { if (modal) modal.hidden = true; current = null; }

    function submit() {
      if (!current) return;
      var ign = (mInput ? mInput.value : '').trim();
      var core = ign.charAt(0) === '.' ? ign.slice(1) : ign; // tolère un préfixe Bedrock '.'
      if (!IGN_RE.test(core)) {
        if (mError) mError.textContent = 'Pseudo invalide (3–16 caractères : lettres, chiffres, _).';
        return;
      }
      if (mConfirm) { mConfirm.disabled = true; mConfirm.textContent = 'Redirection…'; }
      fetch(API + '/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: current.id, ign: ign })
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d && res.d.url) {
            try { localStorage.setItem('smp_ign', ign); } catch (e) { /* ignore */ }
            window.location.href = res.d.url;
          } else {
            throw new Error(res.d && res.d.error ? res.d.error : 'Erreur inconnue.');
          }
        })
        .catch(function (err) {
          if (mError) mError.textContent = err.message || 'Paiement momentanément indisponible.';
          if (mConfirm) { mConfirm.disabled = false; mConfirm.textContent = 'Payer'; }
        });
    }

    if (mConfirm) mConfirm.addEventListener('click', submit);
    if (mCancel)  mCancel.addEventListener('click', closeModal);
    if (mInput)   mInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    if (modal)    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal && !modal.hidden) closeModal(); });

    document.querySelectorAll('[data-product]').forEach(function (link) {
      var pack = packById[link.getAttribute('data-product')];
      var url  = link.getAttribute('href');

      if (API && pack) {                       // backend configuré → modale pseudo
        link.addEventListener('click', function (e) { e.preventDefault(); openModal(pack); });
        return;
      }
      if (url && url !== '#') {                 // pas de backend, mais un lien direct
        link.target = '_blank';
        link.rel = 'noopener';
        return;
      }
      link.addEventListener('click', function (e) {   // rien de configuré
        e.preventDefault();
        showToast('🛠️ Boutique bientôt disponible - passe sur le Discord !');
      });
    });

    // Retour de Stripe : ?achat=succes | annule
    try {
      var params = new URLSearchParams(window.location.search);
      var achat = params.get('achat');
      if (achat === 'succes')      showToast('✅ Paiement reçu ! Tes ' + CUR.name + ' arrivent en jeu.');
      else if (achat === 'annule') showToast('Paiement annulé — aucun montant débité.');
      if (achat) {
        params.delete('achat');
        var qs = params.toString();
        history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
      }
    } catch (e) { /* URLSearchParams indisponible : on ignore */ }
  })();
})();
