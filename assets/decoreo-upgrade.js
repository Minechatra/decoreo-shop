(function () {
  var sheetEndpointFallback = "https://script.google.com/macros/s/AKfycbxWaj09M4eGiJAt4zrNDNp8OZ02GizZ8EDnU9riu9F7XfchRlUyk7Eg4c9rsinZEd3K/exec";
  patchCurrency();
  normalizeCurrencyText();
  normalizePageText();
  watchCurrencyText();
  enhanceImages();
  retryPendingOrders();
  enhanceProductCards();
  addHomepageTrustSection();
  var productRoot = document.querySelector(".single-product");
  if (productRoot) {
    var productMeta = readProduct();
    document.body.classList.add("dx-product-page");
    syncProductMeta(productMeta);
    trackMetaViewContent(productMeta);
    addTrustStrip(productRoot);
    addPhotoReviews(productRoot, productMeta);
    polishDescription(productRoot, productMeta);
    watchLegacyCheckout(productRoot);
  }

  function enhanceImages() {
    document.querySelectorAll("img").forEach(function (image) {
      image.loading = image.closest(".slider-container") ? "eager" : "lazy";
      image.decoding = "async";
      if (!image.getAttribute("alt")) image.setAttribute("alt", "DECOREO matelas premium");
    });
  }

  function patchCurrency() {
    if (!window.Dotshop) return;
    ["currency", "customerCurrency"].forEach(function (key) {
      if (window.Dotshop[key]) {
        window.Dotshop[key].code = "MAD";
        window.Dotshop[key].symbol = "DH";
      }
    });
  }

  function normalizeCurrencyText() {
    document.querySelectorAll(".product-price, .single-price, .price, .currency-value").forEach(function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var textNode = walker.nextNode();

      while (textNode) {
        var clean = textNode.nodeValue
          .replace(/د\.م\.?/g, "DH")
          .replace(/\s*DH/g, " DH")
          .replace(/\s{2,}/g, " ");

        if (clean !== textNode.nodeValue) {
          textNode.nodeValue = clean;
        }

        textNode = walker.nextNode();
      }
    });
  }

  function watchCurrencyText() {
    if (!document.body) return;
    new MutationObserver(function () {
      patchCurrency();
      normalizeCurrencyText();
      normalizePageText();
      enhanceProductCards();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function normalizePageText() {
    document.querySelectorAll(".notice-bar .fr-view").forEach(function (node) {
      if (node.dataset.dxNoticeClean === "true") return;
      node.dataset.dxNoticeClean = "true";
      node.innerHTML = "<p><strong>Offre speciale :</strong> Livraison gratuite + essai 20j</p>";
    });

    document.querySelectorAll(".single-submit, .checkout button[type='submit'], .checkout-section button[type='submit']").forEach(function (button) {
      var text = button.textContent.trim().toLowerCase();
      if (!text || text === "envoi..." || text === "commander maintenant") return;
      button.textContent = "Commander maintenant";
    });

  }

  function enhanceProductCards() {
    document.querySelectorAll(".products-style-1 .product-item").forEach(function (card) {
      if (card.dataset.dxCardEnhanced) return;
      card.dataset.dxCardEnhanced = "true";

      var before = Number((card.querySelector(".product-price .before .value") || {}).textContent || 0);
      var after = Number((card.querySelector(".product-price .after .value") || {}).textContent || 0);
      var title = card.querySelector(".product-title");
      var titleText = title ? title.textContent.toLowerCase() : "";
      var price = card.querySelector(".product-price");
      var button = card.querySelector(".product-actions .button");

      card.querySelectorAll(".dx-discount-badge").forEach(function (badge) {
        badge.remove();
      });

      if (title) {
        var titleLink = title.querySelector("a");
        if (titleLink && !titleLink.dataset.dxOriginalTitle) {
          titleLink.dataset.dxOriginalTitle = titleLink.textContent.trim();
          titleLink.textContent = getProductTitle(titleText);
        }
      }

      if (title && !card.querySelector(".dx-card-eyebrow")) {
        var eyebrow = document.createElement("div");
        eyebrow.className = "dx-card-eyebrow";
        eyebrow.textContent = getProductEyebrow(titleText);
        title.insertAdjacentElement("beforebegin", eyebrow);
      }

      if (before && after && before > after && price && !card.querySelector(".dx-card-saving")) {
        var saving = document.createElement("div");
        saving.className = "dx-card-saving";
        saving.textContent = "Economisez " + (before - after) + " DH";
        price.insertAdjacentElement("afterend", saving);
      }

      if (button) {
        button.textContent = "Voir le modele";
      }
    });
  }

  function getProductEyebrow(title) {
    if (title.includes("elite")) return "Matelas premium + 2 oreillers";
    if (title.includes("diamond")) return "Matelas + surmatelas integre";
    if (title.includes("cloud")) return "Matelas soutien ferme";
    return "Matelas premium";
  }

  function getProductTitle(title) {
    if (title.includes("elite")) return "Elite Sleep";
    if (title.includes("diamond")) return "Diamond Sleep";
    if (title.includes("cloud")) return "Cloud Premium";
    return "Noble Sleep";
  }

  function addTrustStrip(root) {
    if (document.querySelector(".dx-trust")) return;
    var strip = document.createElement("div");
    strip.className = "dx-trust";
    strip.innerHTML = [
      "<article><span class='dx-trust-icon'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M3 7h10v8H3z'></path><path d='M13 10h4l3 3v2h-7z'></path><circle cx='7' cy='17' r='2'></circle><circle cx='17' cy='17' r='2'></circle></svg></span><strong>Paiement a la livraison</strong></article>",
      "<article><span class='dx-trust-icon'><svg viewBox='0 0 24 24' aria-hidden='true'><rect x='4' y='5' width='16' height='15' rx='2'></rect><path d='M8 3v4M16 3v4M4 10h16M8 14l3 3 5-5'></path></svg></span><strong>Essai 20 nuits</strong></article>",
      "<article><span class='dx-trust-icon'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z'></path><path d='M9 12l2 2 4-4'></path></svg></span><strong>Garantie 10 ans</strong></article>"
    ].join("");
    root.insertAdjacentElement("afterend", strip);
  }

  function addPhotoReviews(root, product) {
    if (document.querySelector(".dx-photo-reviews")) return;
    var reviews = getPhotoReviews(product);
    if (!reviews.length) return;

    var section = document.createElement("section");
    section.className = "dx-photo-reviews";
    section.innerHTML = [
      "<div class='dx-photo-reviews-head'>",
      "<span>Avis clients</span>",
      "<strong>Photos apres livraison</strong>",
      "</div>",
      "<div class='dx-photo-reviews-grid'>",
      reviews.slice(0, 5).map(renderPhotoReview).join(""),
      "</div>"
    ].join("");

    var trust = document.querySelector(".dx-trust");
    (trust || root).insertAdjacentElement("afterend", section);
  }

  function addConversionDescription(root, product) {
    if (document.querySelector(".dx-convert-desc")) return;
    var story = getProductStory(product.name || document.title || "");
    var section = document.createElement("section");
    section.className = "dx-convert-desc";
    section.innerHTML = [
      "<div class='dx-cd-head'>",
      "<span>Pourquoi il convertit</span>",
      "<h2>", escapeHtml(story.title), "</h2>",
      "<p>", escapeHtml(story.summary), "</p>",
      "</div>",
      "<div class='dx-cd-pain-grid'>",
      story.pains.map(renderPainCard).join(""),
      "</div>",
      "<div class='dx-cd-split'>",
      renderLayerVisual(story),
      "<div class='dx-cd-benefits'>",
      "<span>Ce que vous ressentez</span>",
      "<h3>", escapeHtml(story.feelTitle), "</h3>",
      story.benefits.map(renderBenefit).join(""),
      "</div>",
      "</div>",
      "<div class='dx-cd-proof'>",
      story.specs.map(renderSpec).join(""),
      "</div>"
    ].join("");

    var trust = document.querySelector(".dx-trust");
    (trust || root).insertAdjacentElement("afterend", section);
  }

  function renderPainCard(item) {
    return [
      "<article>",
      "<b>", escapeHtml(item.icon), "</b>",
      "<strong>", escapeHtml(item.title), "</strong>",
      "<small>", escapeHtml(item.text), "</small>",
      "</article>"
    ].join("");
  }

  function renderBenefit(item) {
    return [
      "<article>",
      "<b>", escapeHtml(item.title), "</b>",
      "<p>", escapeHtml(item.text), "</p>",
      "</article>"
    ].join("");
  }

  function renderSpec(item) {
    return [
      "<article>",
      "<strong>", escapeHtml(item.value), "</strong>",
      "<span>", escapeHtml(item.label), "</span>",
      "</article>"
    ].join("");
  }

  function renderLayerVisual(story) {
    return [
      "<div class='dx-cd-layers' aria-label='Composition du matelas'>",
      "<div class='dx-layer-heading'>",
      "<span>Composition</span>",
      "<h3>", escapeHtml(story.layerTitle), "</h3>",
      "</div>",
      "<div class='dx-exploded-wrap'>",
      "<div class='dx-exploded' aria-hidden='true'>",
      story.layers.map(function (layer, index) {
        return [
          "<div class='dx-exploded-layer dx-exploded-", index + 1, "'>",
          "<b>", index + 1, "</b>",
          "</div>"
        ].join("");
      }).join(""),
      "</div>",
      "<div class='dx-layer-stack'>",
      story.layers.map(function (layer, index) {
        return [
          "<div class='dx-layer dx-layer-", index + 1, "'>",
          "<i>", index + 1, "</i>",
          "<strong>", escapeHtml(layer.title), "</strong>",
          "<small>", escapeHtml(layer.text), "</small>",
          "</div>"
        ].join("");
      }).join(""),
      "</div>",
      "</div>",
      "</div>"
    ].join("");
  }

  function getProductStory(name) {
    var key = normalizeReviewKey(name);
    var base = {
      title: "Un matelas pense pour mieux dormir, pas juste pour etre beau.",
      summary: "Moins de pression, meilleur maintien, commande simple avec paiement a la livraison.",
      feelTitle: "Confort stable, nuit apres nuit",
      layerTitle: "4 zones simples a comprendre",
      pains: [
        { icon: "01", title: "Dos fatigue", text: "Soutien plus stable pour garder le corps mieux aligne." },
        { icon: "02", title: "Nuits chaudes", text: "Tissu respirant pour une sensation plus fraiche." },
        { icon: "03", title: "Sommeil coupe", text: "Meilleure independence de couchage pour dormir a deux." }
      ],
      benefits: [
        { title: "Accueil confortable", text: "La surface absorbe les points de pression sans effet trop mou." },
        { title: "Maintien du corps", text: "Le coeur du matelas aide a soutenir dos, hanches et epaules." },
        { title: "Achat sans stress", text: "Vous commandez, on confirme par telephone, vous payez a la livraison." }
      ],
      layers: [
        { title: "Tissu respirant", text: "Contact doux et propre." },
        { title: "Accueil confort", text: "Premiere sensation plus agreable." },
        { title: "Soutien central", text: "Base stable pour le corps." },
        { title: "Finition durable", text: "Tenue propre dans le temps." }
      ],
      specs: [
        { value: "Livraison", label: "gratuite" },
        { value: "Paiement", label: "a la livraison" },
        { value: "Appel", label: "confirmation" }
      ]
    };

    if (key.includes("cloud")) {
      base.title = "Pour ceux qui veulent un soutien ferme sans compliquer le choix.";
      base.summary = "Cloud Premium vise les dos qui demandent plus de maintien, avec une sensation mi-ferme et une base haute densite.";
      base.feelTitle = "Ferme, propre, rassurant";
      base.layerTitle = "Structure ferme 28 cm";
      base.layers = [
        { title: "Couverture lavable", text: "Zippable en option." },
        { title: "Accueil mi-ferme", text: "Confort direct, sans s'enfoncer." },
        { title: "Mousse haute densite", text: "Soutien cible du dos." },
        { title: "Base extra-ferme", text: "Stabilite et tenue." }
      ];
      base.specs.unshift({ value: "28 cm", label: "hauteur" }, { value: "Extra-ferme", label: "soutien" });
      return base;
    }

    if (key.includes("noble")) {
      base.title = "Moelleux au premier contact, soutien equilibre en profondeur.";
      base.summary = "Noble Sleep combine mousse HR a memoire de forme, confort enveloppant et maintien mi-ferme.";
      base.feelTitle = "Doux, mais pas faible";
      base.layerTitle = "Mousse HR 30 cm";
      base.layers = [
        { title: "Tissu hypoallergenique", text: "Respirant et ultra-doux." },
        { title: "Memoire de forme", text: "Epouse les courbes du corps." },
        { title: "3 couches HR35", text: "Confort adaptatif." },
        { title: "Base mi-ferme", text: "Maintien equilibre." }
      ];
      base.specs.unshift({ value: "30 cm", label: "hauteur" }, { value: "Moelleux", label: "accueil" });
      return base;
    }

    if (key.includes("diamond")) {
      base.title = "Le choix premium avec surmatelas integre pour plus d'accueil.";
      base.summary = "Diamond Sleep ajoute un surmatelas integre a un coeur ressorts ensaches + mousse HR pour un confort hotel plus enveloppant.";
      base.feelTitle = "Accueil ultra-doux, soutien stable";
      base.layerTitle = "Surmatelas integre 32 cm";
      base.layers = [
        { title: "Tissu stretch", text: "Toucher propre et premium." },
        { title: "Surmatelas integre", text: "Accueil plus moelleux." },
        { title: "Mousse HR + memoire", text: "Reduction des points de pression." },
        { title: "Ressorts ensaches", text: "7 zones et moins de mouvements." }
      ];
      base.specs.unshift({ value: "32 cm", label: "hauteur" }, { value: "7 zones", label: "confort" });
      return base;
    }

    if (key.includes("elite")) {
      base.title = "Confort premium, soutien semi-ferme, plus 2 oreillers inclus.";
      base.summary = "Elite Sleep vise un sommeil plus stable avec ressorts ensaches, mousse HR 35 KG et accueil douillet.";
      base.feelTitle = "Premium sans prise de tete";
      base.layerTitle = "Ressorts + mousse HR 32 cm";
      base.layers = [
        { title: "Tissu stretch premium", text: "Hypoallergenique et antibacterien." },
        { title: "Accueil douillet", text: "Ouate + mousse pour plus de confort." },
        { title: "Mousse HR 35 KG", text: "Memoire de forme encapsulee." },
        { title: "Ressorts ensaches", text: "Soutien 7 zones, mouvements limites." }
      ];
      base.specs.unshift({ value: "32 cm", label: "hauteur" }, { value: "2 oreillers", label: "inclus" });
      return base;
    }

    return base;
  }

  function getPhotoReviews(product) {
    var all = window.DECOREO_PHOTO_REVIEWS || {};
    var key = normalizeReviewKey(product.name || document.title || "");
    return all[key] || all.default || [];
  }

  function normalizeReviewKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function renderPhotoReview(review) {
    var name = escapeHtml(review.name || "Client DECOREO");
    var city = escapeHtml(review.city || "");
    var text = escapeHtml(review.text || "");
    var image = escapeHtml(review.image || "");
    var alt = escapeHtml(review.alt || "Photo client DECOREO");

    return [
      "<article class='dx-photo-review'>",
      "<div class='dx-photo-review-media'><img src='", image, "' alt='", alt, "' loading='lazy' decoding='async'></div>",
      "<div class='dx-photo-review-stars' aria-label='5 etoiles'>5/5</div>",
      "<p>", text, "</p>",
      "<footer><strong>", name, "</strong>", city ? "<span>" + city + "</span>" : "", "</footer>",
      "</article>"
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function addHomepageTrustSection() {
    if (!document.querySelector(".products-style-1") || document.querySelector(".dx-home-trust")) return;
    var productSection = document.querySelector(".products-list-section");
    if (!productSection) return;

    var section = document.createElement("section");
    section.className = "dx-home-trust";
    section.innerHTML = [
      "<div class='dx-home-trust-inner'>",
      "<div class='dx-home-trust-head'>",
      "<span>Pourquoi commander chez DECOREO ?</span>",
      "<strong>Simple, rassurant, sans paiement en ligne.</strong>",
      "</div>",
      "<div class='dx-home-trust-grid'>",
      "<article><b>01</b><strong>Commande confirmee par appel</strong><small>Notre equipe vous contacte avant preparation.</small></article>",
      "<article><b>02</b><strong>Paiement a la livraison</strong><small>Aucune carte bancaire necessaire sur le site.</small></article>",
      "<article><b>03</b><strong>Livraison gratuite</strong><small>Partout au Maroc, avec suivi clair.</small></article>",
      "<article><b>04</b><strong>Essai 20 nuits</strong><small>Testez le confort chez vous avant de decider.</small></article>",
      "</div>",
      "</div>"
    ].join("");
    productSection.insertAdjacentElement("afterend", section);
  }

  function polishDescription(root) {
    function apply() {
      root.querySelectorAll(".single-description, .product-description").forEach(function (node) {
        node.classList.add("dx-description");
      });
    }

    apply();
    new MutationObserver(apply).observe(root, { childList: true, subtree: true });
  }

  function watchLegacyCheckout(root) {
    var product = readProduct();

    function attach() {
      var forms = root.querySelectorAll(".checkout-section form, .checkout form, form.checkout-form");
      forms.forEach(function (form) {
        if (form.dataset.dxAttached) return;
        form.dataset.dxAttached = "true";

        form.addEventListener("submit", function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          submitOrder(form, product);
        }, true);
      });

      root.querySelectorAll(".checkout-section button, .checkout button, .single-submit").forEach(function (button) {
        if (button.dataset.dxAttached) return;
        button.dataset.dxAttached = "true";

        button.addEventListener("click", function (event) {
          var form = button.closest("form") || root.querySelector(".checkout-section form, .checkout form, form.checkout-form");
          if (!form) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          submitOrder(form, product);
        }, true);
      });
    }

    attach();
    new MutationObserver(attach).observe(root, { childList: true, subtree: true });
  }

  function submitOrder(form, product) {
    if (form.dataset.dxBusy === "true") return;
    form.dataset.dxBusy = "true";
    var button = form.querySelector("button[type='submit'], .single-submit") || document.querySelector(".single-submit");
    var status = getStatusNode(form);
    var order = collectOrder(form, product);
    var endpoint = (window.DECOREO_SHEET_WEB_APP_URL || sheetEndpointFallback).trim();
    var confirmationMessage = "Merci, votre commande a bien ete recue. Notre equipe vous contactera rapidement pour confirmation.";

    // Lock the action on the first click so double taps cannot create two orders.
    setButton(button, true);

    var invalidField = getInvalidVisibleField(form);
    if (invalidField) {
      invalidField.focus();
      showStatus(status, "error", "Complete les champs obligatoires pour envoyer la commande.");
      setButton(button, false);
      form.dataset.dxBusy = "false";
      return;
    }

    saveBackup(order);
    savePendingOrder(order);
    showStatus(status, "ok", confirmationMessage);

    if (endpoint) {
      syncPendingOrder(order.order_id, endpoint);
    }

    // Open the confirmation page without waiting for Google Sheets.
    setTimeout(function () {
      completeOrder(form, order);
    }, 0);
  }

  function getPendingOrders() {
    try {
      var value = JSON.parse(localStorage.getItem("decoreo_orders_pending") || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function storePendingOrders(records) {
    try {
      localStorage.setItem("decoreo_orders_pending", JSON.stringify(records));
    } catch (error) {}
  }

  function savePendingOrder(order) {
    var records = getPendingOrders();
    if (records.some(function (record) { return record.order && record.order.order_id === order.order_id; })) return;
    records.push({ order: order, attempts: 0, next_retry_at: 0 });
    storePendingOrders(records);
  }

  function syncPendingOrder(orderId, endpoint) {
    var records = getPendingOrders();
    var record = records.find(function (item) { return item.order && item.order.order_id === orderId; });
    if (!record || Number(record.next_retry_at || 0) > Date.now()) return;

    // Avoid a duplicate retry while a keepalive request survives navigation.
    record.attempts = Number(record.attempts || 0) + 1;
    record.next_retry_at = Date.now() + 60000;
    storePendingOrders(records);

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(record.order)
    }).then(function () {
      storePendingOrders(getPendingOrders().filter(function (item) {
        return !item.order || item.order.order_id !== orderId;
      }));
    }).catch(function () {
      var pending = getPendingOrders();
      var failed = pending.find(function (item) { return item.order && item.order.order_id === orderId; });
      if (failed) failed.next_retry_at = Date.now() + 15000;
      storePendingOrders(pending);
    });
  }

  function retryPendingOrders() {
    var endpoint = (window.DECOREO_SHEET_WEB_APP_URL || sheetEndpointFallback).trim();
    if (!endpoint) return;
    getPendingOrders().forEach(function (record) {
      if (!record.order || !record.order.order_id) return;
      if (Number(record.next_retry_at || 0) > Date.now()) return;
      syncPendingOrder(record.order.order_id, endpoint);
    });
  }

  function trackMetaEvent(name, params) {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", name, params || {});
  }

  function trackMetaViewContent(product) {
    trackMetaEvent("ViewContent", {
      content_name: product.name || document.title || "DECOREO",
      content_category: "Matelas",
      currency: "MAD",
      value: Number(product.price) || undefined
    });
  }

  function trackMetaPurchase(order) {
    trackMetaEvent("Purchase", {
      content_name: order.produit || document.title || "DECOREO",
      content_category: "Matelas",
      currency: "MAD",
      value: Number(order.prix) || undefined
    });
  }

  function completeOrder(form, order) {
    try {
      sessionStorage.setItem("decoreo_last_order", JSON.stringify(order));
      localStorage.setItem("decoreo_last_order", JSON.stringify(order));
    } catch (error) {}

    form.reset();
    var params = new URLSearchParams();
    if (order.produit) params.set("product", order.produit);
    if (order.prix) params.set("price", order.prix);
    window.location.replace("thank-you.html" + (params.toString() ? "?" + params.toString() : ""));
  }

  function collectOrder(form, product) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key || "field"] = value;
    });

    var quantity = document.querySelector(".single-product input[name*='quantity'], .single-product .quantity input");

    return {
      order_id: createOrderId(),
      created_at: new Date().toISOString(),
      status: "Nouveau",
      produit: product.name,
      prix: product.price,
      taille: getSelectedSize() || pick(data, ["taille", "size", "variant"]),
      nom: pick(data, ["name", "nom", "full_name", "first_name"]),
      telephone: pick(data, ["phone", "telephone", "tel"]),
      adresse: pick(data, ["address", "adresse", "city", "ville"]),
      quantite: quantity ? quantity.value : pick(data, ["quantity", "quantite"]),
      details: JSON.stringify(data),
      page: location.href
    };
  }

  function createOrderId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "DX-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function readProduct() {
    var fallback = { name: document.title || "DECOREO", price: "" };
    var scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (var i = 0; i < scripts.length; i += 1) {
      try {
        var data = JSON.parse(scripts[i].textContent);
        if (data && (data["@type"] === "ProductGroup" || data.hasVariant)) {
          var first = data.hasVariant && data.hasVariant[0];
          return {
            name: data.name || fallback.name,
            price: first && first.offers ? first.offers.price : ""
          };
        }
      } catch (error) {}
    }
    return fallback;
  }

  function syncProductMeta(product) {
    if (!product || !product.name) return;
    document.title = product.name;
    [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]'
    ].forEach(function (selector) {
      var tag = document.querySelector(selector);
      if (tag) tag.setAttribute("content", product.name);
    });
  }

  function pick(data, keys) {
    for (var i = 0; i < keys.length; i += 1) {
      var match = Object.keys(data).find(function (key) {
        return key.toLowerCase().includes(keys[i]);
      });
      if (match && data[match]) return data[match];
    }
    return "";
  }

  function getSelectedSize() {
    var checked = document.querySelector(".single-product input[type='radio']:checked");
    if (!checked) return "";

    var label = checked.id ? document.querySelector("label[for='" + checked.id + "']") : null;
    label = label || checked.closest("label") || checked.nextElementSibling;
    return label ? label.textContent.trim() : checked.value || "";
  }

  function getStatusNode(form) {
    var node = form.querySelector(".dx-order-status");
    if (!node) {
      node = document.createElement("div");
      node.className = "dx-order-status";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      var submit = form.querySelector("button[type='submit'], .single-submit");
      if (submit && submit.parentNode) {
        submit.insertAdjacentElement("afterend", node);
      } else {
        form.appendChild(node);
      }
    }
    return node;
  }

  function getInvalidVisibleField(form) {
    var fields = Array.from(form.querySelectorAll("input[required], select[required], textarea[required]"));
    if (!fields.length) {
      fields = Array.from(form.querySelectorAll("input, select, textarea")).filter(isCustomerField);
    }

    return fields.find(function (field) {
      var value = field.type === "checkbox" || field.type === "radio" ? field.checked : String(field.value || "").trim();
      return isVisibleField(field) && !value;
    });
  }

  function isVisibleField(field) {
    return !field.disabled && field.type !== "hidden" && Boolean(field.offsetWidth || field.offsetHeight || field.getClientRects().length);
  }

  function isCustomerField(field) {
    var name = String(field.name || "").toLowerCase();
    var placeholder = String(field.getAttribute("placeholder") || "").toLowerCase();
    var type = String(field.type || "").toLowerCase();

    if (!isVisibleField(field)) return false;
    if (["button", "submit", "reset", "hidden"].includes(type)) return false;
    if (["id", "quantity", "extra_payload"].includes(name)) return false;

    return /name|nom|first|phone|tel|telephone|address|adresse|city|ville/.test(name + " " + placeholder);
  }

  function showStatus(node, type, message) {
    node.className = "dx-order-status " + type;
    node.textContent = message;
  }

  function setButton(button, busy) {
    if (!button) return;
    button.disabled = busy;
    if (!button.dataset.dxText) button.dataset.dxText = button.textContent;
    button.textContent = busy ? "Envoi..." : button.dataset.dxText;
  }

  function saveBackup(order) {
    var key = "decoreo_orders_backup";
    var orders;
    try {
      orders = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(orders)) orders = [];
    } catch (error) {
      orders = [];
    }
    if (orders.some(function (item) { return item.order_id === order.order_id; })) return;
    orders.push(order);
    try {
      localStorage.setItem(key, JSON.stringify(orders));
    } catch (error) {}
  }
})();
