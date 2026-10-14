(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const byId = (id) => document.getElementById(id);
  const DiscordConfig = {
    userId: "1555098532099129446",
    guildId: "1558467366197928116",
    inviteCode: "6QXWDapWC"
  };
  const VapidConfig = { publicKey: "BOx4HmJmw39v03_r_TbOA6OwSg-LIMmYjq1jYyKNGHgmCN4g4Z6q03Rmg7XOfJxJqSX140NRKJpJ-rf-2WX2IVs" };
  const state = {
    user: null, session: null, conversation: null, messageUnsubscribe: null,
    adminConversationUnsubscribe: null, adminMessageUnsubscribe: null, selectedAdminConversation: null, selectedAdminOrder: null,
    currentFilter: "all", products: [], adminProducts: [], settings: null, authMode: "login",
    adminConversations: [], countdownTimer: null, maintenanceEnd: null,
    productCountdownTimer: null, pushRegistration: null, activePromo: null,
    siteStats: [], promoCodes: [], unreadMessages: [], changelog: [],
    clientConversationUnsubscribe: null, changelogUnsubscribe: null, notificationMessagesUnsubscribe: null,
    notificationPollTimer: null, recoveryMode: false, portfolioProjects: [], partners: [], partnerImageFile: null,
    portfolioImages: [], productImages: [], discordData: null, discordSocket: null, discordHeartbeat: null,
    discordReconnect: null, statsObserver: null, clientConversations: [],
    adminMessageIndex: [], pendingInitialMessage: "", pendingInitialSubject: "other",
    pendingOrderProduct: null, profileBannerFile: null, portfolioFilter: "all"
  };
  const orderStages = ["requested", "discussion", "awaiting_payment", "in_progress", "testing", "delivered"];
  const categoryLabels = { roblox: "Roblox", discord: "Discord", graphisme: "Graphisme", coaching: "Coaching", strategy: "Stratégie" };
  // Demo shop: only Coaching Lua — other services come from Supabase admin
  const graphicServiceIds = {};
  const demoServiceFallbacks = [
    {
      id: "local-coaching-lua",
      name: "Coaching Lua",
      description: "Accompagnement personnalisé en Lua / Luau (Roblox) — 20 € / heure.",
      category: "coaching",
      price: "20",
      images: [],
      stock_status: "available",
      active: true,
      is_featured: true,
      local: true
    }
  ];
  const graphicPortfolioFallbacks = []; // Portfolio items come from Supabase only
  const defaultLegalText = {
    legal_notice: "Icare Studio présente des services de développement Roblox et Discord, de coaching et de stratégie de communication.\n\nContact : https://discord.com/users/1555098532099129446 (@i.lsn1).\n\nHébergement du site : Netlify. Les services de base de données et d’authentification sont fournis par Supabase.",
    legal_terms: "L’accès au site est proposé à titre informatif et peut être interrompu pour maintenance. L’utilisateur s’engage à fournir des informations exactes, à respecter les droits des tiers et à ne pas détourner les formulaires, le chat ou les services du site.\n\nLes contenus et réalisations présentés restent soumis aux droits de leurs auteurs et titulaires respectifs. Toute réutilisation nécessite une autorisation préalable lorsqu’elle est requise.",
    legal_sales: "Les pages de services présentent des offres indicatives. Le périmètre, les délais, le prix, les éventuelles révisions et les droits de livraison sont convenus individuellement avant tout démarrage, par écrit. Les modalités de paiement sont convenues individuellement. Le soutien aux projets peut s’effectuer via OnParticipe (https://www.onparticipe.fr/c/icarestudio). Une demande sur le site ne déclenche aucun paiement.\n\nLe droit de rétractation légal de 14 jours demeure applicable lorsqu’il est prévu par la loi. Pour un service ou contenu numérique personnalisé, la perte de ce droit ne peut intervenir que dans les conditions légales de l’article L.221-28 du Code de la consommation, notamment après exécution complète et avec les accords et reconnaissances requis. Elle n’est pas automatique au dépôt d’une demande.",
    legal_privacy: "Les données de compte (adresse e-mail et nom affiché), messages de support et informations de suivi sont traités pour fournir l’espace client et répondre aux demandes. Elles sont stockées dans Supabase et ne sont pas vendues.\n\nLes données sont conservées pendant la durée nécessaire au suivi de la relation et aux obligations applicables. Vous pouvez demander l’accès, la rectification ou la suppression de vos données en contactant Icare via Discord. L’authentification est assurée par Supabase ; les demandes de mot de passe passent par leur mécanisme sécurisé.\n\nLes notifications Push ne sont activées qu’après votre autorisation et peuvent être désactivées dans les réglages de votre navigateur."
  };

  function toast(message, kind = "success") {
    const element = document.createElement("div");
    element.className = `toast${kind === "error" ? " error" : ""}`;
    element.textContent = message;
    byId("toast-region").append(element);
    window.setTimeout(() => element.remove(), 4200);
  }

  function appendPaymentNote(container) {
    const note = document.createElement("p");
    note.className = "product-payment-note";
    note.innerHTML = `<a href="https://www.onparticipe.fr/c/icarestudio" target="_blank" rel="noopener noreferrer">${escapeHtml(window.IcareI18n.t("support.button"))}</a> — <span>${escapeHtml(window.IcareI18n.t("shop.payment") || window.IcareI18n.t("shop.paypal"))}</span>`;
    container.append(note);
  }

  function errorMessage(error, fallback = "Une erreur est survenue.") {
    console.error(error);
    toast(error?.message || fallback, "error");
  }

  function isAdmin(user = state.user) {
    return user?.app_metadata?.role === "admin";
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
  }

  function closeDialog(dialog) {
    if (dialog.open) dialog.close();
  }


  function isLocalId(id) {
    if (!id || typeof id !== "string") return true;
    if (id.startsWith("local-")) return true;
    // UUID v4-ish
    return !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat(document.documentElement.lang || "fr", {
      day: "numeric", month: "short", year: "numeric"
    }).format(new Date(value));
  }

  function toLocalDateTimeInput(value) {
    const date = new Date(value);
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function removeLegalPlaceholders(value) {
    const placeholder = /à renseigner|doit être complété|doivent être complétées|to be (?:provided|completed|filled)|placeholder/i;
    return String(value || "").split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph && !placeholder.test(paragraph))
      .join("\n\n");
  }

  function setupNavigation() {
    byId("menu-button").addEventListener("click", () => {
      const nav = $(".desktop-nav");
      const open = nav.classList.toggle("open");
      byId("menu-button").setAttribute("aria-expanded", String(open));
    });
    $$("[data-page-link]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToPage(link.dataset.pageLink, link.dataset.legalTarget);
      $(".desktop-nav").classList.remove("open");
      byId("menu-button").setAttribute("aria-expanded", "false");
    }));
    window.addEventListener("hashchange", () => setActivePage(location.hash.slice(1) || "home"));
    setActivePage(location.hash.slice(1) || "home");
    byId("current-year").textContent = "2026";
    byId("language-select")?.addEventListener("change", (event) => window.IcareI18n.setLanguage(event.target.value));
    byId("copy-discord").addEventListener("click", copyDiscord);
    const isMobileNotificationLayout = () => window.matchMedia("(max-width: 760px)").matches;
    const notificationWrap = byId("notification-bell")?.closest(".notification-wrap");
    const closeNotificationMenu = () => {
      const menu = byId("notification-menu");
      if (!menu || menu.hidden) return;
      menu.hidden = true;
      byId("notification-bell")?.setAttribute("aria-expanded", "false");
      placeNotificationMenu(menu, false);
    };
    const ensureNotificationBackdrop = () => {
      let backdrop = byId("notification-backdrop");
      if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "notification-backdrop";
        backdrop.className = "notification-backdrop";
        backdrop.hidden = true;
        backdrop.setAttribute("aria-hidden", "true");
        document.body.append(backdrop);
      }
      if (!backdrop.dataset.bound) {
        backdrop.dataset.bound = "1";
        backdrop.addEventListener("click", closeNotificationMenu);
      }
      return backdrop;
    };
    const placeNotificationMenu = (menu, open) => {
      if (!menu || !notificationWrap) return;
      const backdrop = ensureNotificationBackdrop();
      const mobile = isMobileNotificationLayout();
      if (open && mobile) {
        // Escape topbar backdrop-filter containing block so fixed = viewport
        if (menu.parentElement !== document.body) document.body.append(menu);
        backdrop.hidden = false;
        backdrop.classList.add("is-open");
        backdrop.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      } else {
        if (menu.parentElement === document.body) notificationWrap.append(menu);
        backdrop.hidden = true;
        backdrop.classList.remove("is-open");
        backdrop.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    };
    window.IcarePlaceNotificationMenu = placeNotificationMenu;
    byId("notification-bell").addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = byId("notification-menu");
      const open = menu.hidden;
      placeNotificationMenu(menu, open);
      menu.hidden = !open;
      byId("notification-bell").setAttribute("aria-expanded", String(open));
      if (open) refreshNotifications();
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest(".notification-wrap") || event.target.closest("#notification-menu") || event.target.closest("#notification-backdrop")) return;
      const menu = byId("notification-menu");
      if (!menu || menu.hidden) return;
      menu.hidden = true;
      byId("notification-bell").setAttribute("aria-expanded", "false");
      placeNotificationMenu(menu, false);
    });
    window.addEventListener("resize", () => {
      const menu = byId("notification-menu");
      if (!menu) return;
      placeNotificationMenu(menu, !menu.hidden);
    });
    byId("notifications-mark-read").addEventListener("click", markAllNotificationsRead);
    document.addEventListener("icare:languagechange", () => {
      renderProducts();
      renderPortfolioProjects();
      renderPartners();
      renderNotifications();
      updateSeoMetadata();
      renderLegalContent();
      renderOrderConsentCopy();
      if (state.siteStats.length) renderSiteStats();
      renderOrderTimeline(state.conversation?.order_status || "requested");
      renderClientPageState();
      if (state.settings) setAvailability(state.settings.availability || "open");
      if (state.settings.hero_banner_url) applyHeroBanner(state.settings.hero_banner_url);
      if (state.settings.language_flags && window.IcareI18n?.applyCustomFlags) window.IcareI18n.applyCustomFlags(state.settings.language_flags);
      updateDiscordStatus(state.discordData);
    });
    byId("client-signin").addEventListener("click", openAuth);
    byId("client-new-request").addEventListener("click", () => openChat({ newRequest: true }));
    byId("client-signout").addEventListener("click", async () => {
      try {
        await window.IcareSupabase.signOut();
        await syncSession(null);
        toast(document.documentElement.lang === "en" ? "Signed out." : "Déconnexion réussie.");
      } catch (error) {
        errorMessage(error, "Impossible de se déconnecter.");
      }
    });
    $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => closeDialog(button.closest("dialog"))));
    $$("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    }));
  }

  function navigateToPage(page, legalTarget = "") {
    const allowedPages = new Set(["home", "portfolio", "partners", "shop", "client", "legal"]);
    const nextPage = allowedPages.has(page) ? page : "home";
    if (location.hash === `#${nextPage}`) setActivePage(nextPage, legalTarget);
    else {
      location.hash = nextPage;
      if (legalTarget) window.setTimeout(() => byId(legalTarget)?.scrollIntoView({ behavior: "smooth", block: "start" }), 450);
    }
  }

  function setActivePage(page, legalTarget = "") {
    const allowedPages = new Set(["home", "portfolio", "partners", "shop", "client", "legal"]);
    const activePage = allowedPages.has(page) ? page : "home";
    $$(".spa-page").forEach((section) => {
      section.hidden = section.dataset.page !== activePage;
    });
    $$("[data-page-link]").forEach((link) => {
      if (link.dataset.pageLink === activePage) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    updateSeoMetadata(activePage);
    if (activePage === "client" && state.user && !isAdmin()) loadClientLatestConversation();
    if (legalTarget) window.setTimeout(() => byId(legalTarget)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function updateSeoMetadata(page = location.hash.slice(1) || "home") {
    const english = document.documentElement.lang === "en";
    const pageTitles = english
      ? { home: "", portfolio: "Portfolio", partners: "Partners", shop: "Shop / Services", client: "Client space", legal: "Legal information" }
      : { home: "", portfolio: "Portfolio", partners: "Partenaires", shop: "Boutique / Services", client: "Espace client", legal: "Informations légales" };
    const baseTitle = state.settings?.meta_title?.trim() || "Icare Studio — Always Building";
    const title = page === "home" ? baseTitle : `${pageTitles[page] || pageTitles.home} — ${baseTitle}`;
    const description = state.settings?.meta_description?.trim() || document.querySelector('meta[name="description"]').content;
    const keywords = state.settings?.keywords?.trim() || document.querySelector('meta[name="keywords"]').content;
    const siteUrl = normalizeSiteUrl(state.settings?.site_url) || window.location.origin;
    const ogImage = safeImageUrl(state.settings?.og_image || "") || new URL("./icon.svg", siteUrl).href;
    const canonical = new URL("/", `${siteUrl}/`).href;

    document.title = title;
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[name="keywords"]').content = keywords;
    document.querySelector('meta[property="og:title"]').content = title;
    document.querySelector('meta[property="og:description"]').content = description;
    document.querySelector('meta[property="og:image"]').content = ogImage;
    document.querySelector('meta[property="og:url"]').content = canonical;
    document.querySelector('meta[name="twitter:title"]').content = title;
    document.querySelector('meta[name="twitter:description"]').content = description;
    document.querySelector('meta[name="twitter:image"]').content = ogImage;
    document.querySelector("#canonical-url").href = canonical;
    const organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Icare Studio",
      url: canonical,
      logo: new URL("./icon.svg", siteUrl).href,
      sameAs: ["https://discord.gg/6QXWDapWC"]
    };
    byId("organization-jsonld").textContent = JSON.stringify(organization);
  }

  function normalizeSiteUrl(value) {
    const candidate = safeImageUrl(value || "");
    return candidate ? candidate.replace(/\/+$/, "") : "";
  }

  function setAvailability(value) {
    const messages = {
      open: window.IcareI18n.t("availability.open"),
      limited: window.IcareI18n.t("availability.limited"),
      closed: window.IcareI18n.t("availability.closed")
    };
    $(".availability span").textContent = messages[value] || messages.open;
    $(".availability i").style.background = value === "closed" ? "#d88a91" : value === "limited" ? "#e9b55d" : "";
    $(".availability i").style.boxShadow = value === "open" ? "" : "none";
    $(".hero-footnote").lastElementChild.textContent = messages[value] || window.IcareI18n.t("hero.status");
  }

  function productCategoryName(category) {
    const names = {
      roblox: { fr: "Roblox", en: "Roblox" },
      discord: { fr: "Discord", en: "Discord" },
      graphisme: { fr: "Graphisme", en: "Graphic design" },
      coaching: { fr: "Coaching", en: "Coaching" },
      strategy: { fr: "Stratégie", en: "Strategy" }
    };
    return names[category]?.[document.documentElement.lang] || names[category]?.fr || categoryLabels[category] || category;
  }

  function numericPrice(value) {
    const match = String(value ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    return match ? match[0] : "";
  }

  function formatHourlyPrice(value) {
    const amount = numericPrice(value);
    if (!amount) return String(value || "");
    return `${amount} ${window.IcareI18n.hourlySuffix()}`;
  }

  function orderStatusLabel(status) {
    const labels = {
      requested: { fr: "Demandé", en: "Requested" },
      discussion: { fr: "En discussion", en: "In discussion" },
      awaiting_payment: { fr: "En attente de paiement", en: "Awaiting payment" },
      in_progress: { fr: "En développement", en: "In development" },
      testing: { fr: "En test", en: "Testing" },
      delivered: { fr: "Livré", en: "Delivered" }
    };
    return labels[status]?.[document.documentElement.lang] || labels.requested.fr;
  }

  function renderOrderTimeline(status, root = byId("order-timeline")) {
    const currentStage = Math.max(0, orderStages.indexOf(status || "requested"));
    const labels = {
      requested: { fr: "Demandé", en: "Requested" },
      discussion: { fr: "En discussion", en: "In discussion" },
      awaiting_payment: { fr: "En attente de paiement", en: "Awaiting payment" },
      in_progress: { fr: "En cours", en: "In progress" },
      testing: { fr: "En test", en: "Testing" },
      delivered: { fr: "Livré", en: "Delivered" }
    };
    $$("[data-order-step]", root).forEach((step, index) => {
      step.textContent = labels[step.dataset.orderStep]?.[document.documentElement.lang] || labels.requested.fr;
      step.classList.toggle("complete", index < currentStage);
      step.classList.toggle("current", index === currentStage);
      step.setAttribute("aria-current", index === currentStage ? "step" : "false");
    });
  }

  function countdownText(date) {
    const remaining = new Date(date).getTime() - Date.now();
    if (remaining <= 0) return document.documentElement.lang === "en" ? "Available now" : "Disponible maintenant";
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return document.documentElement.lang === "en"
      ? `Available in ${days}d ${hours}h ${minutes}m`
      : `Disponible dans ${days} j ${hours} h ${minutes} min`;
  }

  function applyPercentage(priceText, percentage) {
    const match = String(priceText).match(/^\s*([$£€]?)(\d+(?:[.,]\d{1,2})?)(\s*(?:€|EUR|USD|£|\$)?)\s*$/i);
    if (!match) return null;
    const amount = Number(match[2].replace(",", "."));
    if (!Number.isFinite(amount)) return null;
    const discounted = amount * (1 - percentage / 100);
    const value = new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 2 }).format(discounted);
    return { oldPrice: priceText.trim(), newPrice: `${match[1]}${value}${match[3]}` };
  }

  function createProductCard(product) {
    const card = document.createElement("article");
    card.className = `product-card${product.is_featured ? " featured" : ""}${product.is_promo ? " on-promo" : ""}`;
    card.dataset.category = product.category;
    const top = document.createElement("div");
    top.className = "product-top";
    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = productCategoryName(product.category);
    const stock = document.createElement("span");
    stock.className = `stock-badge ${product.stock_status}`;
    const statusLabels = {
      available: { fr: "● Disponible", en: "● Available" },
      soldout: { fr: "● Complet", en: "● Full" },
      upcoming: { fr: "● Bientôt", en: "● Coming soon" }
    };
    stock.textContent = statusLabels[product.stock_status]?.[document.documentElement.lang] || statusLabels.available.fr;
    top.append(category, stock);
    if (product.is_featured) {
      const featured = document.createElement("span");
      featured.className = "featured-badge";
      featured.textContent = document.documentElement.lang === "en" ? "⭐ Top Choice" : "⭐ En vedette";
      top.append(featured);
    }
    if (product.is_promo) {
      const promo = document.createElement("span");
      promo.className = "promo-badge";
      promo.textContent = product.promo || (document.documentElement.lang === "en" ? "🏷️ Promotion" : "🏷️ Promotion");
      top.append(promo);
    }
    const couponPrice = state.activePromo
      ? applyPercentage(product.price, state.activePromo.discount_percent)
      : null;
    if (state.activePromo) {
      const couponBadge = document.createElement("span");
      couponBadge.className = "shop-code-badge";
      couponBadge.textContent = `${state.activePromo.code} −${state.activePromo.discount_percent}%`;
      top.append(couponBadge);
    }
    const title = document.createElement("h3");
    title.textContent = product.name;
    const images = getProductImages(product);
    let cover = null;
    if (images.length) {
      cover = document.createElement("img");
      cover.className = "product-cover";
      cover.src = images[0];
      cover.alt = `${product.name} — image de couverture`;
      cover.loading = "lazy";
    }
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;
    const features = document.createElement("ul");
    features.className = "product-features";
    if (product.features && Array.isArray(product.features)) {
      product.features.forEach((feature) => {
        const li = document.createElement("li");
        li.textContent = feature;
        features.append(li);
      });
    }
    const metadata = document.createElement("div");
    metadata.className = "product-metadata";
    if (product.estimated_duration) {
      const duration = document.createElement("span");
      duration.className = "product-duration";
      duration.textContent = `⏱ ${product.estimated_duration}`;
      metadata.append(duration);
    }
    const countdown = document.createElement("p");
    countdown.className = "product-countdown";
    if (product.stock_status === "upcoming" && product.release_at) {
      countdown.dataset.release = product.release_at;
      countdown.textContent = countdownText(product.release_at);
    }
    const bottom = document.createElement("div");
    bottom.className = "product-bottom";
    const price = document.createElement("span");
    price.className = "product-price";
    const formatPrice = (priceText) => formatHourlyPrice(priceText);
    if (couponPrice) {
      const originalPrice = document.createElement("del");
      originalPrice.textContent = formatPrice(couponPrice.oldPrice);
      price.append(originalPrice, document.createTextNode(" "));
      price.append(document.createTextNode(formatPrice(couponPrice.newPrice)));
    } else if (product.is_promo && product.original_price) {
      const originalPrice = document.createElement("del");
      originalPrice.textContent = formatPrice(product.original_price);
      price.append(originalPrice, document.createTextNode(" "));
      price.append(document.createTextNode(formatPrice(product.price)));
    } else {
      price.append(document.createTextNode(formatPrice(product.price)));
    }
    const order = document.createElement("button");
    order.type = "button";
    order.className = "product-order";
    order.textContent = product.stock_status === "upcoming"
      ? (document.documentElement.lang === "en" ? "Notify me ↗" : "Me prévenir ↗")
      : (document.documentElement.lang === "en" ? "Get in touch ↗" : "Commander ↗");
    order.disabled = product.stock_status === "soldout";
    order.addEventListener("click", () => startOrder(product));
    const details = document.createElement("button");
    details.type = "button";
    details.className = "product-details-button";
    details.textContent = document.documentElement.lang === "en" ? "Details ↗" : "Détails ↗";
    details.addEventListener("click", () => showProductDetails(product));
    bottom.append(price, details, order);
    card.append(top);
    if (cover) card.append(cover);
    card.append(title, description);
    if (features.children.length > 0) card.append(features);
    if (metadata.children.length > 0) card.append(metadata);
    card.append(countdown);
    card.append(bottom);
    return card;
  }

  function getProductImages(product) {
    return (Array.isArray(product.images) ? product.images : [])
      .map(safeImageUrl)
      .filter(Boolean);
  }

  function showProductDetails(product) {
    const detail = byId("product-detail");
    const images = getProductImages(product);
    const imageGallery = images.length
      ? `<div class="product-gallery"><img id="product-main-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)} — image 1 sur ${images.length}"><div class="product-thumbnails">${images.map((image, index) => `<button type="button" data-product-gallery-index="${index}" aria-label="${document.documentElement.lang === "en" ? "Show image" : "Afficher l’image"} ${index + 1}"><img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} — miniature ${index + 1}"></button>`).join("")}</div></div>`
      : "";
    const price = escapeHtml(formatHourlyPrice(product.price || ""));
    const original = product.original_price ? escapeHtml(formatHourlyPrice(product.original_price)) : "";
    detail.innerHTML = `${imageGallery}<div class="dialog-kicker">${escapeHtml(productCategoryName(product.category))}</div><h2>${escapeHtml(product.name)}</h2><p class="product-description">${escapeHtml(product.description)}</p><p class="product-detail-price">${product.is_promo && product.original_price ? `<del>${original}</del> ` : ""}${price}</p><p class="product-payment-note"><span>${escapeHtml(window.IcareI18n.t("shop.paypal"))}</span></p><button id="product-detail-order" class="button button-primary" type="button">${document.documentElement.lang === "en" ? "Get in touch ↗" : "Commander ↗"}</button>`;
    const thumbnails = [...detail.querySelectorAll("[data-product-gallery-index]")];
    const showImage = (button) => {
      const index = Number(button.dataset.productGalleryIndex);
      const image = byId("product-main-image");
      image.src = images[index];
      image.alt = `${product.name} — image ${index + 1} sur ${images.length}`;
      thumbnails.forEach((thumbnail) =>
        thumbnail.setAttribute("aria-current", String(thumbnail === button))
      );
    };
    thumbnails.forEach((button) => button.addEventListener("click", () => showImage(button)));
    byId("product-detail-order").addEventListener("click", () => {
      closeDialog(byId("product-dialog"));
      startOrder(product);
    });
    byId("product-detail-order").disabled = product.stock_status === "soldout";
    openDialog(byId("product-dialog"));
  }

  function renderProductImagePreview() {
    const preview = byId("product-images-preview");
    renderImageEntryEditor(preview, state.productImages, byId("product-name").value.trim() || "Produit");
  }

  function updateProductStructuredData() {
    const products = state.products.filter((product) => product.active).map((product) => {
      const offer = parseProductOffer(product.price);
      return {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: getProductImages(product),
        category: productCategoryName(product.category),
        ...(offer ? { offers: { "@type": "Offer", price: offer.price, priceCurrency: offer.currency, availability: product.stock_status === "soldout" ? "https://schema.org/OutOfStock" : product.stock_status === "upcoming" ? "https://schema.org/PreOrder" : "https://schema.org/InStock" } } : {})
      };
    });
    byId("products-jsonld").textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": products });
  }

  function parseProductOffer(priceText) {
    const match = String(priceText || "").match(/(\d+(?:[.,]\d{1,2})?)\s*(€|EUR|USD|\$|£)?/i);
    if (!match) return null;
    const currency = match[2]?.toUpperCase();
    const priceCurrency = currency === "€" || currency === "EUR" ? "EUR"
      : currency === "£" ? "GBP"
        : currency === "$" || currency === "USD" ? "USD" : "";
    if (!priceCurrency) return null;
    return { price: Number(match[1].replace(",", ".")).toFixed(2), currency: priceCurrency };
  }

  function renderProducts() {
    const grid = byId("products-grid");
    const term = byId("product-search").value.trim().toLocaleLowerCase();
    const visible = state.products.filter((product) => {
      const matchesCategory = state.currentFilter === "all" || product.category === state.currentFilter;
      const text = `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase();
      return matchesCategory && text.includes(term);
    }).sort((a, b) =>
      Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) ||
      Number(Boolean(b.is_promo)) - Number(Boolean(a.is_promo)) ||
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    grid.replaceChildren(...visible.map(createProductCard));
    byId("empty-products").hidden = visible.length !== 0;
    const noActiveProducts = state.products.length === 0;
    $("p", byId("empty-products")).textContent = window.IcareI18n.t(noActiveProducts ? "services.empty" : "services.noResults");
    $("span", byId("empty-products")).textContent = window.IcareI18n.t(noActiveProducts ? "services.emptySub" : "services.noResultsSub");
    $$("[data-release]", grid).forEach((element) => {
      element.textContent = countdownText(element.dataset.release);
    });
  }

  function defaultDemoProducts() {
    const hidden = (() => { try { return JSON.parse(localStorage.getItem("icare-hidden-local-products") || "[]"); } catch { return []; } })();
    return demoServiceFallbacks.filter((p) => !hidden.includes(p.id)).map((p) => ({ ...p }));
  }

  async function loadProducts() {
    try {
      const remote = await window.IcareSupabase.getProducts();
      // Only inject local Coaching Lua demo if no remote products at all (or none active coaching)
      const demos = defaultDemoProducts();
      state.products = remote.length ? remote : demos;
      // If remote exists but user still wants demo coaching when empty coaching: keep remote only
      if (!remote.length && !demos.length) state.products = [];
      renderProducts();
      updateProductStructuredData();
    } catch (error) {
      state.products = defaultDemoProducts();
      renderProducts();
      updateProductStructuredData();
      if (window.IcareSupabase.configured) errorMessage(error, "Impossible de charger la boutique.");
    }
  }

  function setupProductFilters() {
    byId("category-filters").addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.currentFilter = button.dataset.category;
      $$(".filter-chip").forEach((item) => item.classList.toggle("active", item === button));
      renderProducts();
    });
    byId("product-search").addEventListener("input", renderProducts);
    byId("apply-promo-code").addEventListener("click", applyShopPromoCode);
    byId("shop-promo-code").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyShopPromoCode();
      }
    });
  }

  function safeImageUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function imageEntries(urls) {
    return (Array.isArray(urls) ? urls : []).map(safeImageUrl).filter(Boolean)
      .map((url) => ({ url, file: null, preview: url }));
  }

  function releaseImagePreviews(entries) {
    entries.forEach((entry) => {
      if (entry.file && entry.preview) URL.revokeObjectURL(entry.preview);
    });
  }

  function queueImageFiles(files, entries, render) {
    const selected = [...files];
    const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
    const invalid = selected.find((file) => !acceptedTypes.has(file.type) || file.size > 8 * 1024 * 1024);
    if (invalid) {
      toast(`${invalid.name} : format non pris en charge ou fichier supérieur à 8 Mo.`, "error");
      return;
    }
    selected.forEach((file) => entries.push({ file, url: "", preview: URL.createObjectURL(file) }));
    render();
  }

  function installImagePicker(inputId, entries, render) {
    const input = byId(inputId);
    const dropzone = input.closest(".image-dropzone");
    input.addEventListener("change", () => {
      queueImageFiles(input.files, entries, render);
      input.value = "";
    });
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("drag-over");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("drag-over");
      queueImageFiles(event.dataTransfer.files, entries, render);
    });
  }

  function renderImageEntryEditor(container, entries, label) {
    container.replaceChildren(...entries.map((entry, index) => {
      const row = document.createElement("div");
      row.className = "portfolio-image-row";
      row.draggable = true;
      row.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", String(index));
        event.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragover", (event) => {
        event.preventDefault();
        row.classList.add("drag-target");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drag-target"));
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        row.classList.remove("drag-target");
        const from = Number(event.dataTransfer.getData("text/plain"));
        if (!Number.isInteger(from) || from < 0 || from >= entries.length || from === index) return;
        const [moved] = entries.splice(from, 1);
        entries.splice(index, 0, moved);
        renderImageEntryEditor(container, entries, label);
      });
      const image = document.createElement("img");
      image.src = entry.preview || entry.url;
      image.alt = `${label} — aperçu ${index + 1}`;
      const caption = document.createElement("span");
      caption.textContent = `${index === 0 ? "Couverture · " : `Image ${index + 1} · `}${entry.file?.name || entry.url}`;
      const actions = document.createElement("span");
      actions.className = "admin-list-actions";
      [["↑", index - 1], ["↓", index + 1], ["×", -1]].forEach(([text, target]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "small-admin-button";
        button.textContent = text;
        button.setAttribute("aria-label", text === "×" ? `Retirer l’image ${index + 1}` : `Déplacer l’image ${index + 1}`);
        button.disabled = text === "↑" && index === 0 || text === "↓" && index === entries.length - 1;
        button.addEventListener("click", () => {
          if (target === -1) {
            releaseImagePreviews([entries[index]]);
            entries.splice(index, 1);
          } else {
            [entries[index], entries[target]] = [entries[target], entries[index]];
          }
          render();
        });
        if (index > 0) {
          const cover = document.createElement("button");
          cover.type = "button";
          cover.className = "small-admin-button";
          cover.textContent = "Couverture";
          cover.addEventListener("click", () => {
            const [selected] = entries.splice(index, 1);
            entries.unshift(selected);
            renderImageEntryEditor(container, entries, label);
          });
          actions.append(cover);
        }
        actions.append(button);
      });
      row.append(image, caption, actions);
      return row;
    }));
  }

  async function uploadImageEntries(entries, bucket) {
    const ownerId = state.user?.id;
    if (!ownerId || !isAdmin()) throw new Error("Connectez-vous avec un compte administrateur pour envoyer des images.");
    const urls = [];
    for (const entry of entries) {
      urls.push(entry.file
        ? await window.IcareSupabase.uploadPublicImage(entry.file, bucket, ownerId)
        : entry.url);
    }
    return urls;
  }

  function portfolioCategory(project) {
    const explicit = String(project.category || "").toLowerCase();
    if (["web", "gaming", "graphisme"].includes(explicit)) return explicit;
    const haystack = `${project.title || ""} ${(project.tags || []).join(" ")} ${project.description || ""}`.toLowerCase();
    if (/graphis|design visuel|logo|banni[eè]re|miniature|identit|charte|youtube|discord banner|\bda\b/.test(haystack)) return "graphisme";
    if (/roblox|lua|gaming|jeu|game/.test(haystack)) return "gaming";
    return "web";
  }

  async function loadPortfolioProjects(includeDrafts = false) {
    try {
      const remote = await window.IcareSupabase.getPortfolioProjects(includeDrafts);
      const hasGraphisme = remote.some((project) => portfolioCategory(project) === "graphisme");
      const hiddenPf = (() => { try { return JSON.parse(localStorage.getItem("icare-hidden-local-portfolio") || "[]"); } catch { return []; } })();
      const localPf = graphicPortfolioFallbacks.filter((p) => !hiddenPf.includes(p.id));
      state.portfolioProjects = hasGraphisme ? remote : [...remote, ...localPf];
      renderPortfolioProjects();
      if (isAdmin()) renderAdminPortfolio();
    } catch (error) {
      const hiddenPf2 = (() => { try { return JSON.parse(localStorage.getItem("icare-hidden-local-portfolio") || "[]"); } catch { return []; } })();
      state.portfolioProjects = graphicPortfolioFallbacks.filter((p) => !hiddenPf2.includes(p.id));
      renderPortfolioProjects();
      if (isAdmin()) renderAdminPortfolio();
      if (window.IcareSupabase.configured) errorMessage(error, "Impossible de charger le portfolio.");
    }
  }

  function renderPortfolioProjects() {
    const grid = byId("portfolio-grid");
    if (!grid) return;
    const projects = state.portfolioProjects.filter((project) => {
      if (!project.active && !project.local) return false;
      const category = portfolioCategory(project);
      return state.portfolioFilter === "all" || category === state.portfolioFilter;
    });
    byId("empty-portfolio").hidden = projects.length > 0;
    grid.replaceChildren(...projects.map((project) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "portfolio-card";
      card.setAttribute("aria-label", `Voir le projet ${project.title}`);
      const imageUrl = safeImageUrl(project.images?.[0] || "");
      if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = `${project.title} — image de couverture du projet`;
        image.loading = "lazy";
        card.append(image);
      } else {
        const cover = document.createElement("span");
        cover.className = "portfolio-cover-fallback";
        cover.textContent = "i.";
        card.append(cover);
      }
      const content = document.createElement("span");
      content.className = "portfolio-card-content";
      const tags = document.createElement("span");
      tags.className = "portfolio-tags";
      tags.textContent = (project.tags || []).join(" · ");
      const title = document.createElement("strong");
      title.textContent = project.title;
      const description = document.createElement("span");
      description.textContent = project.description;
      content.append(tags, title, description);
      card.append(content);
      card.addEventListener("click", () => showPortfolioDetails(project));
      return card;
    }));
    window.IcarePortfolioProjects = projects;
  }

  function showPortfolioDetails(project) {
    const detail = byId("portfolio-detail");
    const images = (project.images || []).map(safeImageUrl).filter(Boolean);
    const gallery = images.length
      ? `<div class="portfolio-gallery"><img id="portfolio-main-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(project.title)} — image 1"><div class="portfolio-thumbnails">${images.map((image, index) => `<button type="button" data-gallery-index="${index}" aria-label="Afficher l’image ${index + 1}"><img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)} — miniature ${index + 1}"></button>`).join("")}</div></div>`
      : "";
    const tags = (project.tags || []).map((tag) => `<span class="portfolio-tag">${escapeHtml(tag)}</span>`).join("");
    const facts = [
      ["Valeur du projet", project.project_value],
      ["Coût financier / ressources", project.project_cost],
      ["Temps de réalisation", project.duration],
      ["Difficultés rencontrées", project.challenges],
      ["Solutions apportées", project.solutions]
    ].filter(([, value]) => value);
    const safeProjectLink = (value) => {
      if (!value) return "";
      try {
        const url = new URL(value);
        return ["https:", "http:"].includes(url.protocol) ? url.href : "";
      } catch {
        return "";
      }
    };
    const links = [
      ["Voir la démo", safeProjectLink(project.demo_url)],
      ["Code source", safeProjectLink(project.source_url)]
    ].filter(([, href]) => href);
    detail.innerHTML = `${gallery}<div class="dialog-kicker">${tags}</div><h2>${escapeHtml(project.title)}</h2><p class="portfolio-description">${escapeHtml(project.description)}</p>${links.length ? `<div class="portfolio-project-links">${links.map(([label, href]) => `<a class="button button-outline" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join("")}</div>` : ""}${facts.map(([label, value]) => `<section class="portfolio-detail-block"><h3>${escapeHtml(label)}</h3><p>${escapeHtml(value)}</p></section>`).join("")}`;
    detail.querySelectorAll("[data-gallery-index]").forEach((button) => button.addEventListener("click", () => {
      const mainImage = byId("portfolio-main-image");
      const index = Number(button.dataset.galleryIndex);
      mainImage.src = images[index];
      mainImage.alt = `${project.title} — image ${index + 1}`;
    }));
    openDialog(byId("portfolio-dialog"));
  }

  function setupPortfolioGallery() {
    installImagePicker("portfolio-image-files", state.portfolioImages, renderPortfolioImageEditor);
  }

  function setupPortfolioFilters() {
    byId("portfolio-filters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-portfolio-category]");
      if (!button) return;
      state.portfolioFilter = button.dataset.portfolioCategory;
      $$("#portfolio-filters .filter-chip").forEach((item) => item.classList.toggle("active", item === button));
      renderPortfolioProjects();
    });
  }

  function renderPortfolioImageEditor() {
    renderImageEntryEditor(byId("portfolio-images-list"), state.portfolioImages, byId("portfolio-title").value.trim() || "Projet");
  }

  async function startOrder(product) {
    state.pendingInitialSubject = ["discord", "roblox", "coaching", "graphisme"].includes(product.category) ? product.category : "other";
    state.pendingOrderProduct = product;
    if (!state.user) {
      openAuth();
      toast(document.documentElement.lang === "en" ? "Sign in to send your request." : "Connectez-vous pour envoyer votre demande.");
      return;
    }
    byId("order-title").textContent = document.documentElement.lang === "en" ? "Your request" : "Votre demande";
    byId("order-product-summary").textContent = `${product.name} · ${formatHourlyPrice(product.price)}`;
    byId("order-form").reset();
    byId("order-terms-accepted").setCustomValidity("Veuillez cocher la case d’acceptation des CGV et de renoncement au droit de rétractation pour continuer.");
    byId("order-terms-warning").hidden = true;
    byId("order-submit").disabled = true;
    openDialog(byId("order-dialog"));
  }

  async function applyShopPromoCode() {
    const code = byId("shop-promo-code").value.trim().toUpperCase();
    const feedback = byId("shop-promo-feedback");
    state.activePromo = null;
    renderProducts();
    feedback.className = "muted";
    if (!code) {
      feedback.textContent = document.documentElement.lang === "en" ? "Enter a promo code." : "Saisissez un code promo.";
      return;
    }
    try {
      const promo = await window.IcareSupabase.validatePromoCode(code);
      if (!promo) {
        feedback.classList.add("promo-invalid");
        feedback.textContent = document.documentElement.lang === "en" ? "This code is invalid or expired." : "Ce code est invalide ou expiré.";
        return;
      }
      state.activePromo = promo;
      feedback.classList.add("promo-valid");
      feedback.textContent = document.documentElement.lang === "en"
        ? `${promo.code} applied · ${promo.discount_percent}% off (confirmed with your order)`
        : `${promo.code} appliqué · ${promo.discount_percent} % (confirmé lors de la commande)`;
      renderProducts();
    } catch (error) {
      feedback.classList.add("promo-invalid");
      errorMessage(error, "Impossible de vérifier ce code.");
    }
  }

  async function loadChangelog() {
    const container = byId("changelog-list");
    try {
      const entries = await window.IcareSupabase.getChangelog();
      state.changelog = entries;
      const seenKey = getChangelogSeenKey();
      if (!localStorage.getItem(seenKey)) {
        localStorage.setItem(seenKey, entries[0]?.created_at || new Date().toISOString());
      }
      renderNotifications();
      if (!entries.length) {
        container.innerHTML = `<p class="muted">${escapeHtml(document.documentElement.lang === "en" ? "No updates yet. Check back soon." : "Pas encore de mise à jour. Revenez bientôt.")}</p>`;
        return;
      }
      container.innerHTML = entries.map((entry) => `
        <article class="changelog-item">
          <time class="changelog-date" datetime="${escapeHtml(entry.created_at)}">${escapeHtml(formatDate(entry.created_at))}</time>
          <div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.body)}</p></div>
        </article>`).join("");
    } catch (error) {
      state.changelog = [];
      container.innerHTML = `<p class="muted">${escapeHtml(document.documentElement.lang === "en" ? "Journal is temporarily unavailable." : "Le journal est momentanément indisponible.")}</p>`;
      if (window.IcareSupabase.configured) errorMessage(error, "Impossible de charger le journal.");
    }
  }

  function getChangelogSeenKey() {
    return "icare-changelog-seen";
  }

  function getChangelogUnread() {
    const seenAt = localStorage.getItem(getChangelogSeenKey());
    if (!seenAt) return [];
    return state.changelog.filter((entry) => new Date(entry.created_at).getTime() > new Date(seenAt).getTime());
  }

  async function refreshNotifications() {
    try {
      state.unreadMessages = state.user
        ? await window.IcareSupabase.getUnreadMessages(state.user.id, isAdmin())
        : [];
      renderNotifications();
      if (state.user && !isAdmin()) renderClientPageState();
    } catch (error) {
      console.error("Unable to load unread messages.", error);
    }
  }

  function renderNotifications() {
    const list = byId("notification-list");
    if (!list) return;
    const unreadChangelog = getChangelogUnread();
    const notifications = [
      ...state.unreadMessages.map((message) => ({ type: "message", id: message.id, message })),
      ...unreadChangelog.map((entry) => ({ type: "changelog", id: entry.id, entry }))
    ].sort((a, b) => {
      const dateA = a.type === "message" ? a.message.created_at : a.entry.created_at;
      const dateB = b.type === "message" ? b.message.created_at : b.entry.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    const count = notifications.length;
    const badge = byId("notification-count");
    badge.hidden = count === 0;
    badge.textContent = count > 9 ? "9+" : String(count);
    byId("notification-bell").classList.toggle("has-notifications", count > 0);
    if (!count) {
      const empty = document.createElement("p");
      empty.className = "muted notification-empty";
      empty.textContent = document.documentElement.lang === "en" ? "No new notifications." : "Aucune nouvelle notification.";
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(...notifications.slice(0, 20).map((notification) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "notification-item";
      if (notification.type === "message") {
        const message = notification.message;
        const title = isAdmin()
          ? (document.documentElement.lang === "en" ? "New client message" : "Nouveau message client")
          : (document.documentElement.lang === "en" ? "New message from Icare" : "Nouveau message d’Icare");
        button.innerHTML = `<strong>${title}</strong><span>${escapeHtml(message.content.slice(0, 90))}</span><time>${escapeHtml(formatDate(message.created_at))}</time>`;
        button.addEventListener("click", () => openMessageNotification(message));
      } else {
        button.innerHTML = `<strong>${escapeHtml(notification.entry.title)}</strong><span>${escapeHtml(notification.entry.body.slice(0, 90))}</span><time>${escapeHtml(formatDate(notification.entry.created_at))}</time>`;
        button.addEventListener("click", () => openChangelogNotification(notification.entry));
      }
      return button;
    }));
  }

  async function openMessageNotification(message) {
    try {
      await window.IcareSupabase.markMessagesRead([message.id]);
      await refreshNotifications();
      const menu = byId("notification-menu");
      menu.hidden = true;
      byId("notification-bell").setAttribute("aria-expanded", "false");
      window.IcarePlaceNotificationMenu?.(menu, false);
      if (isAdmin()) {
        await loadAdminInbox();
        openAdmin();
        const conversation = state.adminConversations.find((item) => item.id === message.conversation_id);
        if (conversation) await selectAdminConversation(conversation);
      } else {
        const conversations = await window.IcareSupabase.getUserConversations(state.user.id);
        const conversation = conversations.find((item) => item.id === message.conversation_id);
        if (conversation) {
          await showConversation(conversation);
          openDialog(byId("chat-dialog"));
        }
      }
    } catch (error) {
      errorMessage(error, "Impossible d’ouvrir cette notification.");
    }
  }

  function openChangelogNotification(entry) {
    const newest = state.changelog[0];
    if (newest) localStorage.setItem(getChangelogSeenKey(), newest.created_at);
    renderNotifications();
    const menu = byId("notification-menu");
    menu.hidden = true;
    byId("notification-bell").setAttribute("aria-expanded", "false");
    window.IcarePlaceNotificationMenu?.(menu, false);
    byId("journal").scrollIntoView({ behavior: "smooth" });
  }

  async function markAllNotificationsRead() {
    try {
      await window.IcareSupabase.markMessagesRead(state.unreadMessages.map((message) => message.id));
      if (state.changelog.length) localStorage.setItem(getChangelogSeenKey(), state.changelog[0].created_at);
      await refreshNotifications();
    } catch (error) {
      errorMessage(error, "Impossible de marquer les notifications comme lues.");
    }
  }

  function startNotificationRealtime() {
    state.notificationMessagesUnsubscribe?.();
    state.notificationMessagesUnsubscribe = null;
    if (state.user && window.IcareSupabase.configured) {
      state.notificationMessagesUnsubscribe = window.IcareSupabase.subscribeToMessagesFeed(
        refreshNotifications,
        (error) => console.error("Message notification subscription failed.", error)
      );
    }
    if (!state.changelogUnsubscribe && window.IcareSupabase.configured) {
      state.changelogUnsubscribe = window.IcareSupabase.subscribeToChangelog(
        async () => {
          await loadChangelog();
          await refreshNotifications();
        },
        (error) => console.error("Changelog notification subscription failed.", error)
      );
    }
    if (!state.notificationPollTimer) {
      state.notificationPollTimer = window.setInterval(async () => {
        await loadChangelog();
        await refreshNotifications();
        if (isAdmin() && byId("admin-dialog").open) await loadAdminInbox();
        else if (state.user && state.conversation && byId("chat-dialog").open) await refreshActiveOrderStatus();
      }, 60000);
    }
  }

  async function refreshActiveOrderStatus() {
    try {
      const conversations = await window.IcareSupabase.getUserConversations(state.user.id);
      const updated = conversations.find((conversation) => conversation.id === state.conversation.id);
      if (!updated) return;
      state.conversation = { ...state.conversation, ...updated };
      renderOrderTimeline(state.conversation.order_status);
      renderClientPageState();
      const status = state.conversation.status === "closed"
        ? (document.documentElement.lang === "en" ? "Request closed" : "Demande clôturée")
        : (document.documentElement.lang === "en" ? "Request in progress" : "Demande en cours");
      byId("chat-request-status").textContent = `${status} · ${formatDate(state.conversation.created_at)}`;
    } catch (error) {
      console.error("Unable to refresh order status.", error);
    }
  }

  async function loadSettings() {
    try {
      state.settings = await window.IcareSupabase.getSettings();
      if (!state.settings) {
        renderLegalContent();
        return;
      }
      updateSeoMetadata();
      renderLegalContent();
      renderProfileBanner();
      setAvailability(state.settings.availability || "open");
      if (state.settings.hero_banner_url) applyHeroBanner(state.settings.hero_banner_url);
      if (state.settings.language_flags && window.IcareI18n?.applyCustomFlags) window.IcareI18n.applyCustomFlags(state.settings.language_flags);
      document.documentElement.style.setProperty("--accent", state.settings.accent_color || "#94baff");
      const maintenance = state.settings.maintenance_enabled;
      document.body.classList.toggle("maintenance-mode", Boolean(maintenance));
      byId("public-content").hidden = Boolean(maintenance);
      byId("maintenance-screen").hidden = !maintenance;
      if (maintenance) {
        byId("maintenance-title").textContent = state.settings.maintenance_title || window.IcareI18n.t("maintenance.title");
        byId("maintenance-message").textContent = state.settings.maintenance_message || window.IcareI18n.t("maintenance.message");
        state.maintenanceEnd = state.settings.maintenance_end;
        startMaintenanceCountdown();
      }
    } catch (error) {
      if (window.IcareSupabase.configured) errorMessage(error, "Impossible de charger les réglages du site.");
    }
  }

  function renderLegalContent() {
    const settings = state.settings || {};
    for (const key of Object.keys(defaultLegalText)) {
      const container = byId(`${key.replaceAll("_", "-")}-content`);
      if (!container) continue;
      const i18nKey = ({ legal_notice: "legal.notice.body", legal_terms: "legal.terms.body", legal_sales: "legal.sales.body", legal_privacy: "legal.privacy.body" })[key];
      const i18nBody = i18nKey ? window.IcareI18n.t(i18nKey) : "";
      const fallback = (i18nBody && i18nBody !== i18nKey) ? i18nBody : defaultLegalText[key];
      const text = removeLegalPlaceholders(settings[key] || fallback);
      const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
      container.replaceChildren(...paragraphs.map((content) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = content;
        return paragraph;
      }));
    }

    const updatedAt = settings.legal_updated_at;
    byId("legal-updated-label").hidden = !updatedAt;
    byId("legal-updated-at").textContent = updatedAt
      ? new Intl.DateTimeFormat(document.documentElement.lang || "fr", { dateStyle: "long" }).format(new Date(`${updatedAt}T00:00:00`))
      : "";
    const legalFields = {
      "legal-business-status": "legal_business_status",
      "legal-registration": "legal_registration",
      "legal-address": "legal_address",
      "legal-email": "legal_email",
      "legal-director": "legal_director",
      "legal-mediator": "legal_mediator"
    };
    for (const [id, field] of Object.entries(legalFields)) {
      const value = settings[field]?.trim() || "";
      byId(id).textContent = value;
      $$(`[data-legal-field="${field}"]`).forEach((node) => { node.hidden = !value; });
    }
  }

  function renderOrderConsentCopy() {
    const wrap = byId("order-consent-wrap")?.querySelector("span");
    if (wrap) {
      wrap.textContent = document.documentElement.lang === "en"
        ? "If a service contract is concluded, I expressly request that work on this personalized digital service begin before the withdrawal period ends and acknowledge that I may lose the right of withdrawal once the service has been fully performed, where Article L.221-28 of the French Consumer Code applies."
        : "Si un contrat de prestation est conclu, je demande expressément le commencement de l’exécution de cette prestation numérique personnalisée avant la fin du délai de rétractation et reconnais qu’une fois le service pleinement exécuté, je pourrai perdre mon droit de rétractation dans les conditions de l’article L.221-28 du Code de la consommation.";
    }
    const terms = byId("order-terms-accepted")?.closest("label")?.querySelector("span");
    if (terms) {
      const salesHref = "#legal";
      terms.innerHTML = `${escapeHtml(window.IcareI18n.t("order.terms")).replace("CGV", `<a href="${salesHref}" data-page-link="legal" data-legal-target="legal-sales">CGV</a>`)}`;
      terms.querySelector("a")?.addEventListener("click", (event) => {
        event.preventDefault();
        closeDialog(byId("order-dialog"));
        navigateToPage("legal", "legal-sales");
      });
    }
  }

  function startMaintenanceCountdown() {
    if (state.countdownTimer) clearInterval(state.countdownTimer);
    const render = () => {
      const output = byId("maintenance-countdown");
      if (!state.maintenanceEnd) {
        output.textContent = "";
        return;
      }
      const total = new Date(state.maintenanceEnd).getTime() - Date.now();
      if (total <= 0) {
        output.textContent = document.documentElement.lang === "en" ? "Coming back shortly" : "Retour imminent";
        return;
      }
      const days = Math.floor(total / 86400000);
      const hours = Math.floor((total % 86400000) / 3600000);
      const minutes = Math.floor((total % 3600000) / 60000);
      const seconds = Math.floor((total % 60000) / 1000);
      output.textContent = `${days}j ${hours}h ${minutes}m ${seconds}s`;
    };
    render();
    state.countdownTimer = window.setInterval(render, 1000);
  }

  function setupStats() {
    state.statsObserver?.disconnect();
    state.statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        const target = Number(node.dataset.target);
        const suffix = node.dataset.suffix || "";
        const started = performance.now();
        const animate = (time) => {
          const progress = Math.min((time - started) / 1100, 1);
          node.textContent = `${Math.floor(target * (1 - (1 - progress) ** 3))}${suffix}`;
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        state.statsObserver.unobserve(node);
      });
    }, { threshold: .6 });
    $$(".counter", byId("numbers-grid")).forEach((counter) => state.statsObserver.observe(counter));
  }

  async function loadSiteStats() {
    try {
      state.siteStats = await window.IcareSupabase.getSiteStats();
    } catch (error) {
      state.siteStats = [];
      if (window.IcareSupabase.configured) errorMessage(error, "Impossible de charger les statistiques.");
    }
    renderSiteStats();
  }

  function renderSiteStats() {
    const language = document.documentElement.lang === "en" ? "en" : "fr";
    const grid = byId("numbers-grid");
    const sortedStats = state.siteStats.slice().sort((a, b) => a.sort_order - b.sort_order);
    if (!sortedStats.length) {
      const empty = document.createElement("p");
      empty.className = "muted stats-empty";
      empty.textContent = language === "en"
        ? "No statistics have been published yet."
        : "Aucune statistique n’a encore été publiée.";
      grid.replaceChildren(empty);
    } else {
      const items = sortedStats.map((stat) => {
        const item = document.createElement("div");
        item.className = "number-item";
        const value = document.createElement("strong");
        const valueText = String(stat.value ?? "");
        const numeric = /^\d+$/.test(valueText);
        value.className = numeric ? "counter" : "";
        value.dataset.target = numeric ? valueText : "";
        value.dataset.suffix = stat.suffix || "";
        value.textContent = numeric ? `0${stat.suffix || ""}` : `${valueText}${stat.suffix || ""}`;
        const label = document.createElement("span");
        label.textContent = stat[`label_${language}`] || stat.label_fr || "";
        item.append(value, label);
        return item;
      });
      grid.replaceChildren(...items);
    }
    setupStats();
    renderAdminStats();
  }

  function renderAdminStats() {
    const list = byId("admin-stats-list");
    if (!list) return;
    list.replaceChildren(...state.siteStats.map((stat) => {
      const row = document.createElement("div");
      row.className = "admin-list-item";
      const summary = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = stat.label_fr || stat.key;
      const detail = document.createElement("span");
      detail.textContent = `${stat.value}${stat.suffix || ""} · ${stat.label_fr}`;
      summary.append(title, detail);
      const actions = document.createElement("div");
      actions.className = "admin-list-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "small-admin-button";
      edit.textContent = "Modifier";
      edit.addEventListener("click", () => fillStatsForm(stat));
      actions.append(edit);
      row.append(summary, actions);
      return row;
    }));
    if (!state.siteStats.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Aucune statistique enregistrée.";
      list.append(empty);
    }
  }

  function fillStatsForm(stat) {
    byId("stats-original-key").value = stat.key;
    byId("stats-key").value = stat.key;
    byId("stats-value").value = stat.value;
    byId("stats-suffix").value = stat.suffix || "";
    byId("stats-label-fr").value = stat.label_fr;
    byId("stats-label-en").value = stat.label_en;
    byId("stats-order").value = stat.sort_order;
    byId("stats-delete").disabled = false;
  }

  function setupProductCountdown() {
    if (state.productCountdownTimer) clearInterval(state.productCountdownTimer);
    state.productCountdownTimer = window.setInterval(() => {
      $$("[data-release]", byId("products-grid")).forEach((element) => {
        element.textContent = countdownText(element.dataset.release);
      });
    }, 60000);
  }

  function updateDiscordStatus(data) {
    state.discordData = data || null;
    const language = document.documentElement.lang === "en" ? "en" : "fr";
    const statusNames = {
      online: { fr: "En ligne", en: "Online" }, idle: { fr: "Absent", en: "Away" },
      dnd: { fr: "Ne pas déranger", en: "Do not disturb" }, offline: { fr: "Hors ligne", en: "Offline" }
    };
    const user = data?.discord_user;
    const presence = statusNames[data?.discord_status]?.[language];
    const unavailable = language === "en" ? "Presence unavailable" : "Présence indisponible";
    byId("discord-presence").textContent = "@i.lsn1";
    byId("discord-status").textContent = presence || unavailable;
    byId("discord-indicator").className = `discord-indicator ${presence ? data.discord_status : "offline"}`;
    byId("discord-indicator").title = presence || unavailable;

    const activities = Array.isArray(data?.activities) ? data.activities : [];
    const activity = activities.find((item) => item.type !== 4);
    byId("discord-activity").textContent = activity
      ? `${language === "en" ? "Currently" : "Actuellement"} ${activity.name}${activity.details ? ` · ${activity.details}` : ""}`
      : "";
    const customStatus = activities.find((item) => item.type === 4)?.state || "";
    byId("discord-focus").textContent = customStatus.toLocaleLowerCase() === "always building" ? "—" : customStatus || "—";

    if (user) {
      byId("discord-avatar").src = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;
      const flags = user.public_flags || 0;
      const knownFlags = [[1, "Staff"], [2, "Partner"], [4, "HypeSquad"], [8, "Bug Hunter"], [64, "Bravery"], [128, "Brilliance"], [256, "Balance"], [512, "Early Supporter"], [16384, "Active Developer"]];
      byId("discord-badges").textContent = knownFlags.filter(([flag]) => (flags & flag) === flag).map(([, label]) => label).join(" · ") || "Discord";
    } else {
      byId("discord-avatar").src = "./icon.svg";
      byId("discord-badges").textContent = "—";
    }
    renderProfileBanner();
    byId("discord-link").href = `https://discord.com/users/${DiscordConfig.userId}`;
    byId("footer-discord").href = `https://discord.com/users/${DiscordConfig.userId}`;
  }

  function discordBannerUrl(data = state.discordData) {
    const bannerHash = data?.discord_user?.banner;
    if (!bannerHash) return "";
    const extension = bannerHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/banners/${data.discord_user.id}/${bannerHash}.${extension}?size=1024`;
  }

  function renderProfileBanner() {
    const banner = byId("discord-banner-image");
    const useCustom = state.settings?.profile_banner_mode === "custom" && state.settings?.profile_banner_url;
    const url = useCustom ? safeImageUrl(state.settings.profile_banner_url) : discordBannerUrl();
    if (url) {
      banner.src = url;
      banner.hidden = false;
    } else {
      banner.removeAttribute("src");
      banner.hidden = true;
    }
  }

  function renderProfileBannerEditor() {
    const mode = $('input[name="profile-banner-mode"]:checked')?.value || "discord";
    const preview = byId("profile-banner-preview");
    byId("profile-banner-upload").hidden = mode !== "custom";
    let source = mode === "custom"
      ? state.profileBannerFile ? URL.createObjectURL(state.profileBannerFile) : safeImageUrl(state.settings?.profile_banner_url || "")
      : discordBannerUrl();
    if (source) {
      if (preview.dataset.objectUrl && preview.dataset.objectUrl !== source) URL.revokeObjectURL(preview.dataset.objectUrl);
      if (source.startsWith("blob:")) preview.dataset.objectUrl = source;
      else delete preview.dataset.objectUrl;
      preview.src = source;
      preview.hidden = false;
    } else {
      if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
      delete preview.dataset.objectUrl;
      preview.removeAttribute("src");
      preview.hidden = true;
    }
  }

  function setupProfileBannerAdmin() {
    $$('input[name="profile-banner-mode"]').forEach((radio) => radio.addEventListener("change", renderProfileBannerEditor));
    byId("profile-banner-file").addEventListener("change", () => {
      state.profileBannerFile = byId("profile-banner-file").files[0] || null;
      if (state.profileBannerFile &&
          (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(state.profileBannerFile.type) ||
          state.profileBannerFile.size > 8 * 1024 * 1024)) {
        state.profileBannerFile = null;
        byId("profile-banner-file").value = "";
        toast("Format d’image non pris en charge ou fichier supérieur à 8 Mo.", "error");
      }
      renderProfileBannerEditor();
    });
    byId("profile-banner-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const mode = $('input[name="profile-banner-mode"]:checked').value;
      const submit = byId("profile-banner-form").querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        let bannerUrl = state.settings?.profile_banner_url || null;
        if (mode === "custom") {
          if (state.profileBannerFile) {
            bannerUrl = await window.IcareSupabase.uploadPublicImage(state.profileBannerFile, "banners", state.user.id);
          }
          if (!safeImageUrl(bannerUrl || "")) throw new Error("Sélectionnez une image personnalisée avant de l’enregistrer.");
        } else {
          bannerUrl = null;
        }
        state.settings = await window.IcareSupabase.saveSettings({
          ...(state.settings || {}),
          profile_banner_mode: mode,
          profile_banner_url: bannerUrl
        });
        const previewUrl = byId("profile-banner-preview").dataset.objectUrl;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        state.profileBannerFile = null;
        byId("profile-banner-file").value = "";
        renderProfileBanner();
        renderProfileBannerEditor();
        toast("Bannière de profil enregistrée.");
      } catch (error) {
        errorMessage(error, "Impossible d’enregistrer la bannière.");
      } finally {
        submit.disabled = false;
      }
    });
  }

  async function loadAccountDeletionRequests() {
    if (!isAdmin()) return;
    const list = byId("admin-deletion-requests");
    try {
      const requests = await window.IcareSupabase.getGdprRequests();
      if (!requests.length) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "Aucune demande de suppression de compte.";
        list.replaceChildren(empty);
        return;
      }
      list.replaceChildren(...requests.map((request) => {
        const row = document.createElement("article");
        row.className = "admin-list-item";
        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = request.profile?.display_name || request.email || request.profile?.email || request.user_id;
        const meta = document.createElement("span");
        meta.textContent = `${request.profile?.email || request.email || "E-mail indisponible"} · ${formatDate(request.created_at)} · ${request.status || "pending"}`;
        details.append(name, meta);
        const actions = document.createElement("div");
        actions.className = "admin-list-actions";
        const status = document.createElement("select");
        status.setAttribute("aria-label", "Statut de la demande RGPD");
        for (const [value, label] of [["pending", "À traiter"], ["completed", "Traitée"], ["rejected", "Refusée"]]) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          option.selected = value === request.status;
          status.append(option);
        }
        status.addEventListener("change", async () => {
          try {
            await window.IcareSupabase.setAccountDeletionRequestStatus(request.id, status.value);
            request.status = status.value;
            toast("Statut de la demande RGPD mis à jour.");
          } catch (error) {
            errorMessage(error, "Impossible de mettre à jour cette demande RGPD.");
          }
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "small-admin-button";
        remove.textContent = "Supprimer";
        remove.addEventListener("click", async () => {
          if (!window.confirm("Supprimer définitivement cette demande RGPD ?")) return;
          try {
            await window.IcareSupabase.deleteGdprRequest(request.id);
            toast("Demande RGPD supprimée.");
            await loadAccountDeletionRequests();
          } catch (error) {
            errorMessage(error, "Impossible de supprimer cette demande RGPD.");
          }
        });
        actions.append(status, remove);
        row.append(details, actions);
        return row;
      }));
    } catch (error) {
      errorMessage(error, "Impossible de charger les demandes RGPD.");
    }
  }

  async function loadDiscordProfile() {
    if (!/^\d{17,20}$/.test(DiscordConfig.userId)) {
      updateDiscordStatus(null);
      return;
    }
    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${DiscordConfig.userId}`);
      if (!response.ok) throw new Error(`Lanyard HTTP ${response.status}`);
      const { data } = await response.json();
      if (!data) throw new Error("Lanyard returned no profile data.");
      updateDiscordStatus(data);
    } catch (error) {
      updateDiscordStatus(null);
      console.error("Unable to load Discord presence.", error);
    }
  }

  async function loadDiscordGuild() {
    const numberFormat = new Intl.NumberFormat(document.documentElement.lang || "fr");
    const [widgetResult, inviteResult] = await Promise.allSettled([
      fetch(`https://discord.com/api/guilds/${DiscordConfig.guildId}/widget.json`).then(async (response) => {
        if (!response.ok) throw new Error(`Discord widget API HTTP ${response.status}`);
        return response.json();
      }),
      fetch(`https://discord.com/api/v10/invites/${DiscordConfig.inviteCode}?with_counts=true`).then(async (response) => {
        if (!response.ok) throw new Error(`Discord invite API HTTP ${response.status}`);
        return response.json();
      })
    ]);
    const widget = widgetResult.status === "fulfilled" ? widgetResult.value : null;
    const invite = inviteResult.status === "fulfilled" ? inviteResult.value : null;
    const guild = invite?.guild;

    if (!widget && !invite) {
      console.error("Unable to load Discord server information.", {
        widget: widgetResult.reason,
        invite: inviteResult.reason
      });
      return;
    }

    byId("guild-name").textContent = widget?.name || guild?.name || "Icare Studio";
    byId("guild-description").textContent = guild?.description ||
      (document.documentElement.lang === "en" ? "Join the Icare Studio community." : "Retrouvez la communauté Icare Studio sur Discord.");
    if (guild?.icon && guild.id) {
      const extension = guild.icon.startsWith("a_") ? "gif" : "png";
      byId("guild-icon").src = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${extension}?size=256`;
    }
    const memberCount = invite?.approximate_member_count ?? invite?.profile?.member_count;
    const onlineCount = widget?.presence_count ?? invite?.approximate_presence_count;
    byId("guild-members").textContent = Number.isFinite(memberCount) ? numberFormat.format(memberCount) : "—";
    byId("guild-online").textContent = Number.isFinite(onlineCount) ? numberFormat.format(onlineCount) : "—";
    if (widgetResult.status === "rejected") console.error("Unable to load Discord online member count.", widgetResult.reason);
    if (inviteResult.status === "rejected") console.error("Unable to load Discord member count and server details.", inviteResult.reason);
  }

  function connectDiscordPresence() {
    if (!/^\d{17,20}$/.test(DiscordConfig.userId) || state.discordSocket) return;
    const socket = new WebSocket("wss://api.lanyard.rest/socket");
    state.discordSocket = socket;
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DiscordConfig.userId } }));
    });
    socket.addEventListener("message", (event) => {
      let packet;
      try {
        packet = JSON.parse(event.data);
      } catch (error) {
        console.error("Invalid Lanyard WebSocket packet.", error);
        return;
      }
      if (packet.op === 1) {
        if (state.discordHeartbeat) clearInterval(state.discordHeartbeat);
        state.discordHeartbeat = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
        }, packet.d.heartbeat_interval);
      } else if (packet.op === 0 && packet.d) {
        updateDiscordStatus(packet.d);
      }
    });
    socket.addEventListener("close", () => {
      if (state.discordSocket !== socket) return;
      state.discordSocket = null;
      if (state.discordHeartbeat) clearInterval(state.discordHeartbeat);
      state.discordHeartbeat = null;
      updateDiscordStatus(null);
      state.discordReconnect = window.setTimeout(connectDiscordPresence, 30000);
    });
    socket.addEventListener("error", (error) => console.error("Lanyard WebSocket error.", error));
  }

  async function copyDiscord() {
    try {
      await navigator.clipboard.writeText("i.lsn1");
      toast(document.documentElement.lang === "en" ? "Discord username copied." : "Pseudo Discord copié.");
    } catch (error) {
      errorMessage(error, document.documentElement.lang === "en" ? "Unable to copy the username." : "Impossible de copier le pseudo.");
    }
  }

  function openAuth() {
    openDialog(byId("auth-dialog"));
    renderAuth();
  }

  function renderClientPageState() {
    const stateNode = byId("client-page-state");
    const invitation = byId("client-invitation");
    const dashboard = byId("client-dashboard");
    const english = document.documentElement.lang === "en";
    invitation.hidden = Boolean(state.user);
    dashboard.hidden = !state.user;
    if (!state.user || isAdmin()) {
      byId("client-order-timeline").hidden = true;
      if (stateNode) stateNode.textContent = "";
      if (!state.user) renderClientConversations();
      return;
    }
    stateNode.textContent = state.conversation
      ? `${english ? "Request" : "Demande"} ${orderStatusLabel(state.conversation.order_status || "requested")} · ${english ? "created" : "créée le"} ${formatDate(state.conversation.created_at)}`
      : window.IcareI18n.t("client.noRequests");
    byId("client-order-timeline").hidden = !state.conversation;
    if (state.conversation) renderOrderTimeline(state.conversation.order_status || "requested", byId("client-order-timeline"));
    const paymentLink = byId("client-payment-link");
    paymentLink.href = state.conversation?.paypal_payment_url || "#";
    paymentLink.hidden = !state.conversation?.paypal_payment_url;
    byId("client-account-name").textContent = state.user.user_metadata?.display_name || state.user.email || "";
    byId("client-account-email").textContent = state.user.email || "";
    const verified = Boolean(state.user.email_confirmed_at);
    byId("client-account-status").textContent = verified ? "Membre vérifié" : "E-mail non vérifié";
    byId("client-account-role").textContent = isAdmin() ? "Administrateur" : state.clientConversations.some((item) => item.status === "open") ? "Client actif" : "Membre";
    byId("client-account-created").textContent = state.user.created_at ? formatDate(state.user.created_at) : "Non disponible";
    const provider = state.user.app_metadata?.provider || state.user.identities?.[0]?.provider || "email";
    byId("client-account-provider").textContent = provider === "email" ? "E-mail et mot de passe" : provider;
    byId("client-account-security").textContent = provider === "email" ? "Mot de passe protégé · réinitialisable par e-mail" : `Connexion sécurisée via ${provider}`;
    renderClientProjects();
    const unreadCount = state.unreadMessages.filter((message) => state.clientConversations.some((conversation) => conversation.id === message.conversation_id)).length;
    const unread = byId("client-unread-count");
    unread.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
    unread.hidden = unreadCount === 0;
    renderClientConversations();
  }

  function renderClientProjects() {
    const list = byId("client-projects-list");
    const conversations = state.clientConversations;
    if (!conversations.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Aucune demande ou commande enregistrée.";
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(...conversations.map((conversation) => {
      const card = document.createElement("article");
      card.className = "client-project-card";
      const heading = document.createElement("div");
      heading.className = "client-project-heading";
      const title = document.createElement("h3");
      title.textContent = conversation.order_consent_product || `Demande · ${conversation.subject || "Autre"}`;
      const status = document.createElement("span");
      status.className = "client-project-status";
      status.textContent = orderStatusLabel(conversation.order_status || "requested");
      heading.append(title, status);
      const facts = document.createElement("p");
      facts.className = "client-project-facts";
      facts.textContent = `Coût indicatif : ${conversation.order_price || "À confirmer"} · Demande : ${formatDate(conversation.created_at)} · Délai estimé : ${conversation.order_eta || "À convenir"}`;
      const timeline = document.createElement("ol");
      timeline.className = "order-timeline compact-order-timeline";
      timeline.setAttribute("aria-label", "Progression du projet");
      for (const step of orderStages) {
        const item = document.createElement("li");
        item.dataset.orderStep = step;
        item.textContent = orderStatusLabel(step);
        timeline.append(item);
      }
      renderOrderTimeline(conversation.order_status || "requested", timeline);
      const open = document.createElement("button");
      open.type = "button";
      open.className = "text-button";
      open.textContent = "Ouvrir la conversation ↗";
      open.addEventListener("click", async () => {
        try {
          await showConversation(conversation);
          openDialog(byId("chat-dialog"));
        } catch (error) {
          errorMessage(error, "Impossible d’ouvrir la conversation.");
        }
      });
      card.append(heading, facts, timeline, open);
      return card;
    }));
  }

  function renderClientConversations() {
    const list = byId("client-conversations");
    if (!list) return;
    list.replaceChildren(...state.clientConversations.map((conversation) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `client-conversation${state.conversation?.id === conversation.id ? " selected" : ""}`;
      const title = document.createElement("strong");
      title.textContent = `${conversation.subject ? conversation.subject[0].toUpperCase() + conversation.subject.slice(1) : "Demande"} · ${orderStatusLabel(conversation.order_status)}`;
      const date = document.createElement("time");
      date.dateTime = conversation.updated_at || conversation.created_at;
      date.textContent = formatMessageTimestamp(conversation.updated_at || conversation.created_at);
      button.append(title, date);
      button.addEventListener("click", async () => {
        try {
          await showConversation(conversation);
          openDialog(byId("chat-dialog"));
        } catch (error) {
          errorMessage(error, "Impossible d’ouvrir cette conversation.");
        }
      });
      return button;
    }));
  }

  function renderAuth() {
    const loggedIn = Boolean(state.user);
    byId("auth-form").hidden = loggedIn || state.recoveryMode;
    byId("auth-toggle").hidden = loggedIn || state.recoveryMode;
    byId("forgot-password").hidden = loggedIn || state.recoveryMode || state.authMode !== "login";
    byId("password-reset-form").hidden = !state.recoveryMode;
    byId("auth-user-panel").hidden = !loggedIn || state.recoveryMode;
    byId("auth-title").textContent = window.IcareI18n.t("auth.title");
    byId("auth-description").hidden = loggedIn || state.recoveryMode;
    byId("auth-user-email").textContent = state.user?.email || "";
    byId("open-admin").hidden = !isAdmin();
    byId("admin-button").hidden = !isAdmin();
    byId("auth-name-field").hidden = state.authMode !== "signup";
    byId("auth-submit").textContent = state.authMode === "signup"
      ? window.IcareI18n.t("auth.signup")
      : window.IcareI18n.t("auth.login");
    byId("auth-toggle").textContent = state.authMode === "signup"
      ? window.IcareI18n.t("auth.loginPrompt")
      : window.IcareI18n.t("auth.signupPrompt");
  }

  async function syncSession(session) {
    const previousUserId = state.user?.id;
    state.session = session;
    state.user = session?.user || null;
    if (previousUserId !== state.user?.id) {
      state.conversation = null;
      state.clientConversations = [];
    }
    renderAuth();
    renderClientPageState();
    if (!state.user) {
      state.conversation = null;
      state.messageUnsubscribe?.();
      state.messageUnsubscribe = null;
      state.adminMessageUnsubscribe?.();
      state.adminMessageUnsubscribe = null;
      state.clientConversationUnsubscribe?.();
      state.clientConversationUnsubscribe = null;
      state.adminConversationUnsubscribe?.();
      state.adminConversationUnsubscribe = null;
      startNotificationRealtime();
      renderNotifications();
      return;
    }
    if (isAdmin()) {
      state.clientConversationUnsubscribe?.();
      state.clientConversationUnsubscribe = null;
      await loadAdminProducts();
    }
    else {
      await loadClientLatestConversation();
      state.clientConversationUnsubscribe?.();
      state.clientConversationUnsubscribe = window.IcareSupabase.subscribeToConversations(
        (payload) => {
          if (payload.new?.id === state.conversation?.id) {
            state.conversation = { ...state.conversation, ...payload.new };
            state.clientConversations = state.clientConversations.map((conversation) =>
              conversation.id === payload.new.id ? { ...conversation, ...payload.new } : conversation
            );
            renderOrderTimeline(state.conversation.order_status);
            renderClientPageState();
          }
        },
        (error) => console.error("Client order status subscription failed.", error)
      );
    }
    startNotificationRealtime();
    await refreshNotifications();
    if (!isAdmin() && previousUserId !== state.user.id && state.pendingOrderProduct) {
      closeDialog(byId("auth-dialog"));
      byId("order-product-summary").textContent = `${state.pendingOrderProduct.name} · ${formatHourlyPrice(state.pendingOrderProduct.price)}`;
      openDialog(byId("order-dialog"));
    }
    if (previousUserId !== state.user?.id && state.user) {
      if (isAdmin()) {
        console.log("Admin session restored, showing admin panel");
      } else {
        console.log("User session restored, redirecting to client space");
        navigateToPage("client");
      }
    }
  }

  async function loadClientLatestConversation() {
    if (!state.user || isAdmin()) return;
    try {
      state.clientConversations = await window.IcareSupabase.getUserConversations(state.user.id);
      if (!state.conversation || !state.clientConversations.some((item) => item.id === state.conversation.id)) {
        state.conversation = state.clientConversations[0] || null;
      } else {
        state.conversation = state.clientConversations.find((item) => item.id === state.conversation.id);
      }
      renderClientPageState();
    } catch (error) {
      errorMessage(error, "Impossible de charger le suivi de vos demandes.");
    }
  }

  function setupAuth() {
    byId("account-button").addEventListener("click", () => navigateToPage("client"));
    byId("admin-button").addEventListener("click", openAdmin);
    byId("hero-contact").addEventListener("click", () => state.user ? openChat() : openAuth());
    byId("contact-chat").addEventListener("click", () => state.user ? openChat() : openAuth());
    byId("maintenance-login").addEventListener("click", openAuth);
    byId("client-open-chat").addEventListener("click", () => openChat());
    byId("client-reset-password").addEventListener("click", async () => {
      const email = state.user?.email;
      if (!email) {
        toast("Aucune adresse e-mail n’est associée à ce compte.", "error");
        return;
      }
      try {
        const redirectTo = `${window.location.origin}${window.location.pathname}?reset=1`;
        await window.IcareSupabase.sendPasswordReset(email, redirectTo);
        toast("Un lien de réinitialisation a été envoyé à l’adresse du compte.");
      } catch (error) {
        errorMessage(error, "Impossible d’envoyer le lien de réinitialisation.");
      }
    });
    byId("client-export-data").addEventListener("click", async () => {
      if (!state.user) return;
      try {
        const conversations = await window.IcareSupabase.getUserConversations(state.user.id);
        const exported = await Promise.all(conversations.map(async (conversation) => ({
          id: conversation.id,
          subject: conversation.subject,
          status: conversation.status,
          order_status: conversation.order_status,
          product: conversation.order_consent_product,
          indicative_price: conversation.order_price,
          estimated_timeline: conversation.order_eta,
          details: conversation.order_details,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          messages: (await window.IcareSupabase.getMessages(conversation.id)).map((message) => ({
            content: message.content,
            sent_at: message.created_at,
            sent_by_account: message.sender_id === state.user.id,
            read_at: message.read_at
          }))
        })));
        const data = {
          exported_at: new Date().toISOString(),
          account: {
            email: state.user.email,
            display_name: state.user.user_metadata?.display_name || null,
            created_at: state.user.created_at,
            email_verified: Boolean(state.user.email_confirmed_at)
          },
          conversations: exported
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `icare-donnees-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        errorMessage(error, "Impossible de préparer l’export de vos données.");
      }
    });
    byId("client-request-deletion").addEventListener("click", async () => {
      if (!state.user || !window.confirm("Envoyer une demande de suppression de votre compte à Icare ? Votre compte ne sera pas supprimé automatiquement.")) return;
      const button = byId("client-request-deletion");
      button.disabled = true;
      try {
        await window.IcareSupabase.requestAccountDeletion(state.user.id);
        button.textContent = "Demande de suppression envoyée";
        toast("Votre demande a été transmise à l’administrateur.");
      } catch (error) {
        button.disabled = false;
        errorMessage(error, "Impossible d’envoyer la demande de suppression.");
      }
    });
    byId("review-open").addEventListener("click", () => {
      if (!state.user) {
        openAuth();
        toast(document.documentElement.lang === "en" ? "Sign in to leave a review." : "Connectez-vous pour laisser un avis.");
      } else openDialog(byId("review-dialog"));
    });
    byId("auth-toggle").addEventListener("click", () => {
      state.authMode = state.authMode === "signup" ? "login" : "signup";
      renderAuth();
    });
    byId("forgot-password").addEventListener("click", async () => {
      const email = byId("auth-email").value.trim();
      if (!byId("auth-email").reportValidity() || !email) {
        byId("auth-email").focus();
        return;
      }
      try {
        const redirectTo = `${window.location.origin}${window.location.pathname}?reset=1`;
        await window.IcareSupabase.sendPasswordReset(email, redirectTo);
        toast(document.documentElement.lang === "en" ? "If an account exists, a reset link has been sent." : "Si ce compte existe, un lien de réinitialisation a été envoyé.");
      } catch (error) {
        errorMessage(error, "Impossible d’envoyer le lien de réinitialisation.");
      }
    });
    byId("password-reset-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await window.IcareSupabase.updatePassword(byId("new-password").value);
        state.recoveryMode = false;
        byId("password-reset-form").reset();
        renderAuth();
        closeDialog(byId("auth-dialog"));
        history.replaceState(null, "", window.location.pathname);
        toast(document.documentElement.lang === "en" ? "Your password has been updated." : "Votre mot de passe a été mis à jour.");
      } catch (error) {
        errorMessage(error, "Impossible de mettre à jour le mot de passe.");
      }
    });
    byId("auth-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = byId("auth-email").value.trim();
      const password = byId("auth-password").value;
      const button = byId("auth-submit");
      button.disabled = true;
      try {
        if (state.authMode === "signup") {
          const result = await window.IcareSupabase.signUp(email, password, byId("auth-name").value.trim());
          if (!result.session) toast(document.documentElement.lang === "en" ? "Check your email to confirm your account." : "Consultez votre e-mail pour confirmer votre compte.");
          else toast(document.documentElement.lang === "en" ? "Account created." : "Compte créé.");
        } else {
          const result = await window.IcareSupabase.signIn(email, password);
          await syncSession(result.session);
          toast(document.documentElement.lang === "en" ? "Signed in." : "Connexion réussie.");
          closeDialog(byId("auth-dialog"));
          if (isAdmin(result.session?.user || result.user)) openAdmin();
          else navigateToPage("client");
        }
      } catch (error) {
        console.error("Authentication error details:", error);
        console.error("Error message:", error?.message);
        console.error("Error status:", error?.status);
        errorMessage(error, document.documentElement.lang === "en" ? "Authentication failed." : "Échec de l'authentification.");
      } finally {
        button.disabled = false;
      }
    });
    byId("auth-signout").addEventListener("click", async () => {
      try {
        await window.IcareSupabase.signOut();
        await syncSession(null);
        toast(document.documentElement.lang === "en" ? "Signed out." : "Déconnexion réussie.");
      } catch (error) {
        errorMessage(error, "Impossible de se déconnecter.");
      }
    });
    byId("open-chat").addEventListener("click", () => {
      closeDialog(byId("auth-dialog"));
      openChat();
    });
    byId("open-admin").addEventListener("click", () => {
      closeDialog(byId("auth-dialog"));
      openAdmin();
    });
    if (!window.IcareSupabase.configured) return;
    window.IcareSupabase.getSession().then((session) => syncSession(session)).catch((error) => errorMessage(error, "Impossible de restaurer la session."));
    window.IcareSupabase.client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        state.recoveryMode = true;
        state.authMode = "login";
        openAuth();
        renderAuth();
      }
      window.setTimeout(() => syncSession(session), 0);
    });
    if (new URLSearchParams(window.location.search).has("reset")) {
      window.IcareSupabase.getSession().then((session) => {
        if (session) {
          state.recoveryMode = true;
          openAuth();
          renderAuth();
        }
      }).catch((error) => errorMessage(error, "Impossible de vérifier la session de réinitialisation."));
    }
  }

  function formatMessageTimestamp(value) {
    const date = new Date(value);
    const now = new Date();
    const time = new Intl.DateTimeFormat(document.documentElement.lang || "fr", { hour: "2-digit", minute: "2-digit" }).format(date);
    if (date.toDateString() === now.toDateString()) {
      return document.documentElement.lang === "en" ? `Today at ${time}` : `Aujourd’hui à ${time}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return document.documentElement.lang === "en" ? `Yesterday at ${time}` : `Hier à ${time}`;
    }
    const dateText = new Intl.DateTimeFormat(document.documentElement.lang || "fr", { day: "numeric", month: "short", year: "numeric" }).format(date);
    return document.documentElement.lang === "en" ? `${dateText} at ${time}` : `${dateText} à ${time}`;
  }

  async function openChat(options = {}) {
    if (!state.user) {
      openAuth();
      return;
    }
    openDialog(byId("chat-dialog"));
    try {
      const conversations = await window.IcareSupabase.getUserConversations(state.user.id);
      state.clientConversations = conversations;
      renderClientPageState();
      if (options.newRequest || !conversations.length) {
        if (options.newRequest && !options.orderIntent) {
          state.pendingInitialMessage = "";
          state.pendingInitialSubject = "other";
          state.pendingOrderProduct = null;
          byId("order-consent").required = false;
        }
        state.conversation = null;
        state.messageUnsubscribe?.();
        state.messageUnsubscribe = null;
        byId("conversation-chat").hidden = true;
        byId("first-contact-panel").hidden = false;
        byId("first-contact-subject").value = state.pendingInitialSubject;
        byId("first-contact-message").value = state.pendingInitialMessage;
        byId("first-contact-count").textContent = String(state.pendingInitialMessage.length);
        byId("order-consent").checked = false;
        byId("order-consent-wrap").hidden = !state.pendingOrderProduct;
        byId("order-consent").required = Boolean(state.pendingOrderProduct);
        return;
      }
      const conversation = options.conversation || conversations[0];
      await showConversation(conversation);
      if (state.pendingInitialMessage) {
        byId("chat-input").value = state.pendingInitialMessage;
        byId("chat-character-count").textContent = String(state.pendingInitialMessage.length);
        state.pendingInitialMessage = "";
      }
    } catch (error) {
      errorMessage(error, "Impossible de charger le chat.");
    }
  }

  async function showConversation(conversation) {
    state.conversation = conversation;
    byId("first-contact-panel").hidden = true;
    byId("conversation-chat").hidden = false;
    renderClientPageState();
    const closed = conversation.status === "closed";
    const status = closed
      ? (document.documentElement.lang === "en" ? "Request closed" : "Demande clôturée")
      : (document.documentElement.lang === "en" ? "Request in progress" : "Demande en cours");
    byId("chat-request-status").textContent = `${status} · ${formatDate(conversation.created_at)}`;
    byId("chat-input").disabled = closed;
    byId("chat-form").querySelector("button[type='submit']").disabled = closed;
    byId("new-request").hidden = !closed;
    renderOrderTimeline(conversation.order_status || "requested");
    const paymentLink = byId("client-payment-link");
    paymentLink.href = conversation.paypal_payment_url || "#";
    paymentLink.hidden = !conversation.paypal_payment_url;
    byId("chat-messages").replaceChildren();
    let messages = await window.IcareSupabase.getMessages(conversation.id);
    const unreadIds = messages.filter((message) => message.sender_id !== state.user.id && !message.read_at).map((message) => message.id);
    if (unreadIds.length) {
      await window.IcareSupabase.markMessagesRead(unreadIds);
      const readAt = new Date().toISOString();
      messages = messages.map((message) => unreadIds.includes(message.id) ? { ...message, read_at: readAt } : message);
      await refreshNotifications();
    }
    messages.forEach(renderChatMessage);
    state.messageUnsubscribe?.();
    state.messageUnsubscribe = window.IcareSupabase.subscribeToMessages(
      conversation.id,
      async (message) => {
        if (message.sender_id !== state.user.id && !message.read_at && byId("chat-dialog").open) {
          await window.IcareSupabase.markMessagesRead([message.id]);
          message.read_at = new Date().toISOString();
          await refreshNotifications();
        }
        const existing = $(`[data-message-id="${CSS.escape(message.id)}"]`, byId("chat-messages"));
        if (existing && message.sender_id === state.user.id) {
          const status = $(".message-read-status", existing);
          if (status) status.textContent = message.read_at ? "Lu" : "Reçu";
        } else {
          renderChatMessage(message);
        }
      },
      (error) => console.error("Chat realtime subscription failed.", error)
    );
    byId("chat-messages").scrollTop = byId("chat-messages").scrollHeight;
  }

  function renderChatMessage(message) {
    if ($(`[data-message-id="${CSS.escape(message.id)}"]`, byId("chat-messages"))) return;
    const item = document.createElement("article");
    item.className = `chat-message${message.sender_id === state.user?.id ? " mine" : ""}`;
    item.dataset.messageId = message.id;
    const author = document.createElement("strong");
    author.textContent = message.sender_id === state.user?.id
      ? (document.documentElement.lang === "en" ? "You" : "Vous")
      : (document.documentElement.lang === "en" ? "Icare" : "Icare");
    const body = document.createElement("p");
    body.textContent = message.content;
    const date = document.createElement("time");
    date.dateTime = message.created_at;
    date.textContent = formatMessageTimestamp(message.created_at);
    item.append(author, body, date);
    if (message.sender_id === state.user?.id) {
      const readStatus = document.createElement("span");
      readStatus.className = "message-read-status";
      readStatus.textContent = message.read_at
        ? (document.documentElement.lang === "en" ? "Read" : "Lu")
        : (document.documentElement.lang === "en" ? "Received" : "Reçu");
      item.append(readStatus);
    }
    byId("chat-messages").append(item);
    byId("chat-messages").scrollTop = byId("chat-messages").scrollHeight;
  }

  function setupChat() {
    const updateCounter = (input, output) => { output.textContent = String(input.value.length); };
    const termsCheckbox = byId("order-terms-accepted");
    const termsWarning = byId("order-terms-warning");
    const submitOrder = byId("order-submit");
    const termsMessage = "Veuillez cocher la case d’acceptation des CGV et de renoncement au droit de rétractation pour continuer.";
    termsCheckbox.setCustomValidity(termsMessage);
    termsCheckbox.addEventListener("change", () => {
      submitOrder.disabled = !termsCheckbox.checked;
      termsCheckbox.setCustomValidity(termsCheckbox.checked ? "" : termsMessage);
      termsWarning.hidden = termsCheckbox.checked;
    });
    termsCheckbox.addEventListener("invalid", () => { termsWarning.hidden = false; });
    byId("order-dialog").addEventListener("close", () => {
      if (state.pendingOrderProduct) state.pendingOrderProduct = null;
    });
    byId("order-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!termsCheckbox.checked) {
        termsWarning.hidden = false;
        termsCheckbox.setCustomValidity(termsMessage);
        termsCheckbox.reportValidity();
        return;
      }
      if (!state.user || !state.pendingOrderProduct) return;
      const product = state.pendingOrderProduct;
      const details = byId("order-details").value.trim();
      const now = new Date().toISOString();
      const startEarly = byId("order-start-early").checked;
      const submit = submitOrder;
      submit.disabled = true;
      try {
        const promo = state.activePromo
          ? `\nCode promo à confirmer : ${state.activePromo.code} (${state.activePromo.discount_percent} %).`
          : "";
        const message = `Demande de commande : ${product.name} · ${product.price}${details ? `\n\nDétails : ${details}` : ""}${promo}`;
        const conversation = await window.IcareSupabase.createConversation(state.user.id, state.pendingInitialSubject, {
          productName: product.name,
          details,
          termsAcceptedAt: now,
          startEarlyAt: startEarly ? now : null,
          price: product.price,
          eta: product.estimated_duration || product.duration || null
        });
        await window.IcareSupabase.sendMessage(conversation.id, message);
        state.pendingOrderProduct = null;
        state.activePromo = null;
        closeDialog(byId("order-dialog"));
        state.clientConversations = [conversation, ...state.clientConversations];
        await showConversation(conversation);
        await loadClientLatestConversation();
        openDialog(byId("chat-dialog"));
        toast("Demande envoyée. Aucun paiement n’a été effectué.");
      } catch (error) {
        errorMessage(error, "Impossible d’envoyer la demande de commande.");
      } finally {
        submit.disabled = false;
      }
    });
    byId("client-delete-conversation").addEventListener("click", async () => {
      if (!state.conversation || !window.confirm("Supprimer définitivement cette conversation et ses messages ?")) return;
      try {
        await window.IcareSupabase.deleteConversation(state.conversation.id);
          state.messageUnsubscribe?.();
          state.messageUnsubscribe = null;
        state.clientConversations = state.clientConversations.filter((item) => item.id !== state.conversation.id);
        state.conversation = state.clientConversations[0] || null;
        await loadClientLatestConversation();
        if (state.conversation) await showConversation(state.conversation);
        else {
          byId("conversation-chat").hidden = true;
          byId("first-contact-panel").hidden = false;
          renderClientPageState();
        }
        toast("Conversation supprimée.");
      } catch (error) {
        errorMessage(error, "Impossible de supprimer la conversation.");
      }
    });
    byId("chat-dialog").addEventListener("close", () => {
      if (state.pendingOrderProduct && !state.conversation) {
        state.pendingOrderProduct = null;
        state.pendingInitialMessage = "";
        state.pendingInitialSubject = "other";
        byId("order-consent").checked = false;
        byId("order-consent").required = false;
        byId("order-consent-wrap").hidden = true;
      }
    });
    byId("chat-input").addEventListener("input", () => updateCounter(byId("chat-input"), byId("chat-character-count")));
    byId("first-contact-message").addEventListener("input", () => updateCounter(byId("first-contact-message"), byId("first-contact-count")));
    byId("first-contact-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = byId("first-contact-send");
      const message = byId("first-contact-message").value.trim();
      if (!state.user || !message) return;
      if (state.pendingOrderProduct && !byId("order-consent").checked) {
        byId("order-consent").focus();
        toast(document.documentElement.lang === "en" ? "Confirm the service-start request before sending." : "Confirmez la demande de commencement avant l’envoi.", "error");
        return;
      }
      submit.disabled = true;
      try {
        const subject = byId("first-contact-subject").value;
        const consent = {
          termsAcceptedAt: new Date().toISOString(),
          productName: state.pendingOrderProduct?.name || null,
          startEarlyAt: state.pendingOrderProduct && byId("order-consent").checked ? new Date().toISOString() : null
        };
        const conversation = await window.IcareSupabase.createConversation(state.user.id, subject, consent);
        state.clientConversations = [conversation, ...state.clientConversations];
        await window.IcareSupabase.sendMessage(conversation.id, message);
        state.pendingInitialMessage = "";
        state.pendingInitialSubject = "other";
        state.pendingOrderProduct = null;
        byId("order-consent").required = false;
        await showConversation(conversation);
        renderClientPageState();
        toast(document.documentElement.lang === "en" ? "Your request has been sent." : "Votre demande a été envoyée.");
      } catch (error) {
        errorMessage(error, "Impossible d’envoyer votre demande.");
      } finally {
        submit.disabled = false;
      }
    });
    byId("chat-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.conversation || state.conversation.status === "closed") return;
      const input = byId("chat-input");
      const content = input.value.trim();
      if (!content) return;
      input.disabled = true;
      try {
        const message = await window.IcareSupabase.sendMessage(state.conversation.id, content);
        renderChatMessage(message);
        input.value = "";
        updateCounter(input, byId("chat-character-count"));
        await loadClientLatestConversation();
      } catch (error) {
        errorMessage(error, "Impossible d'envoyer le message.");
      } finally {
        input.disabled = false;
        input.focus();
      }
    });
    [byId("chat-input"), byId("first-contact-message")].forEach((input) => input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        input.form.requestSubmit();
      }
    }));
    byId("history-toggle").addEventListener("click", async () => {
      const history = byId("client-history");
      if (!history.hidden) {
        history.hidden = true;
        return;
      }
      try {
        const conversations = await window.IcareSupabase.getUserConversations(state.user.id);
        history.replaceChildren(...conversations.map((conversation) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "admin-list-item admin-inbox-item";
          const details = document.createElement("span");
          const title = document.createElement("strong");
          title.textContent = conversation.status === "closed"
            ? (document.documentElement.lang === "en" ? "Closed request" : "Demande clôturée")
            : (document.documentElement.lang === "en" ? "Open request" : "Demande en cours");
          const date = document.createElement("span");
          date.textContent = formatDate(conversation.created_at);
          details.append(title, date);
          button.append(details);
          button.addEventListener("click", async () => {
            try {
              await showConversation(conversation);
              history.hidden = true;
            } catch (error) {
              errorMessage(error, "Impossible de charger cette demande.");
            }
          });
          return button;
        }));
        if (!conversations.length) {
          const message = document.createElement("p");
          message.className = "muted";
          message.textContent = document.documentElement.lang === "en" ? "No request history yet." : "Aucun historique pour le moment.";
          history.append(message);
        }
        history.hidden = false;
      } catch (error) {
        errorMessage(error, "Impossible de charger l'historique.");
      }
    });
    byId("new-request").addEventListener("click", () => {
      state.pendingInitialMessage = "";
      state.pendingInitialSubject = "other";
      state.pendingOrderProduct = null;
      byId("order-consent").required = false;
      openChat({ newRequest: true });
    });
    byId("enable-notifications").addEventListener("click", enablePushNotifications);
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  }

  async function enablePushNotifications() {
    const english = document.documentElement.lang === "en";
    if (!("Notification" in window)) {
      toast(english
        ? "This browser does not support system notifications."
        : "Ce navigateur ne prend pas en charge les notifications système.", "error");
      return;
    }
    const isSecure = window.isSecureContext || location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (!isSecure) {
      toast(english
        ? "Notifications require HTTPS (or localhost). On iOS Safari, install the site as a PWA from the Share menu."
        : "Les notifications nécessitent HTTPS (ou localhost). Sur iOS Safari, installez le site en PWA via le menu Partager.", "error");
      return;
    }
    // iOS Safari only exposes reliable push after the site is added to Home Screen (standalone)
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isIos && !isStandalone) {
      toast(english
        ? "On iPhone/iPad, add this site to your Home Screen first (Share → Add to Home Screen), then open the installed app and enable notifications."
        : "Sur iPhone/iPad, ajoutez d’abord ce site à l’écran d’accueil (Partager → Sur l’écran d’accueil), puis ouvrez l’app installée et activez les notifications.", "error");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      toast(english
        ? "Service workers are required for notifications and are not available here."
        : "Les service workers sont requis pour les notifications et ne sont pas disponibles ici.", "error");
      return;
    }
    if (!("PushManager" in window)) {
      toast(english
        ? "Push notifications are not supported in this browser."
        : "Les notifications push ne sont pas prises en charge par ce navigateur.", "error");
      return;
    }
    if (!/^[A-Za-z0-9_-]{80,}$/.test(VapidConfig.publicKey)) {
      toast(english
        ? "Configure a VAPID public key before enabling push notifications."
        : "Configurez une clé publique VAPID pour activer les notifications push.", "error");
      return;
    }
    if (!state.user?.id) {
      toast(english ? "Sign in to enable notifications." : "Connectez-vous pour activer les notifications.", "error");
      openAuth();
      return;
    }
    try {
      // Ensure the service worker is registered before requesting permission / subscribe
      if (!state.pushRegistration) {
        try {
          state.pushRegistration = await navigator.serviceWorker.register("./service-worker.js");
        } catch (swError) {
          console.error("Service worker registration failed before push.", swError);
        }
      }
      const registration = state.pushRegistration || await navigator.serviceWorker.ready;
      state.pushRegistration = registration;

      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        throw new Error(english
          ? "Notification permission was denied. You can re-enable it in browser settings."
          : "Permission de notification refusée. Vous pouvez la réactiver dans les réglages du navigateur.");
      }

      const confirmTitle = "Icare Studio";
      const confirmBody = english
        ? "Notifications are enabled on this device."
        : "Les notifications sont activées sur cet appareil.";
      const confirmOptions = {
        body: confirmBody,
        icon: "./icon.svg",
        badge: "./icon.svg",
        tag: "icare-push-test",
        data: { url: "./" }
      };

      // Prefer service-worker notification (works in more PWA / mobile contexts)
      try {
        if (registration?.showNotification) {
          await registration.showNotification(confirmTitle, confirmOptions);
        } else {
          const testNotification = new Notification(confirmTitle, confirmOptions);
          testNotification.onclick = () => {
            window.focus();
            testNotification.close();
          };
        }
      } catch (notifyError) {
        console.warn("Unable to show confirmation notification.", notifyError);
        try {
          const fallback = new Notification(confirmTitle, confirmOptions);
          fallback.onclick = () => {
            window.focus();
            fallback.close();
          };
        } catch (fallbackError) {
          console.warn("Fallback Notification API also failed.", fallbackError);
        }
      }

      let subscription = await registration.pushManager.getSubscription();
      // Re-subscribe when missing or when VAPID key changed (force fresh subscription)
      if (subscription) {
        try {
          const currentKey = subscription.options?.applicationServerKey;
          const expected = urlBase64ToUint8Array(VapidConfig.publicKey);
          const sameKey = currentKey
            && currentKey.byteLength === expected.byteLength
            && [...new Uint8Array(currentKey)].every((b, i) => b === expected[i]);
          if (!sameKey) {
            await subscription.unsubscribe();
            subscription = null;
          }
        } catch {
          try { await subscription.unsubscribe(); } catch { /* ignore */ }
          subscription = null;
        }
      }
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VapidConfig.publicKey)
        });
      }
      await window.IcareSupabase.savePushSubscription(state.user.id, subscription.toJSON());
      toast(english ? "Notifications enabled on this device." : "Notifications activées sur cet appareil.");
    } catch (error) {
      errorMessage(error, english ? "Unable to enable notifications." : "Impossible d'activer les notifications.");
    }
  }

  async function loadAdminProducts() {
    if (!isAdmin()) return;
    try {
      const products = await window.IcareSupabase.getProducts(true);
      state.adminProducts = products;
      renderAdminProducts();
    } catch (error) {
      errorMessage(error, "Impossible de charger les produits.");
    }
  }

  function renderAdminProducts() {
    const list = byId("admin-products-list");
    list.replaceChildren(...state.adminProducts.map((product) => {
      const row = document.createElement("div");
      row.className = "admin-list-item";
      const summary = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const detail = document.createElement("span");
      detail.textContent = `${productCategoryName(product.category)} · ${product.active ? "Publié" : "Brouillon"}`;
      summary.append(name, detail);
      const actions = document.createElement("div");
      actions.className = "admin-list-actions";
      const edit = document.createElement("button");
      edit.className = "small-admin-button";
      edit.textContent = "Modifier";
      edit.addEventListener("click", () => fillProductForm(product));
      const remove = document.createElement("button");
      remove.className = "small-admin-button";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Supprimer « ${product.name} » ?`)) return;
        try {
          if (isLocalId(product.id)) {
            state.adminProducts = state.adminProducts.filter((item) => item.id !== product.id);
            state.products = (state.products || []).filter((item) => item.id !== product.id);
            try { localStorage.setItem("icare-hidden-local-products", JSON.stringify([...(JSON.parse(localStorage.getItem("icare-hidden-local-products") || "[]")), product.id])); } catch (_) {}
            renderProducts();
            renderAdminProducts();
            toast("Exemple local supprimé.");
            return;
          }
          await window.IcareSupabase.deleteProduct(product.id);
          state.adminProducts = state.adminProducts.filter((item) => item.id !== product.id);
          await loadProducts();
          renderAdminProducts();
          toast("Produit supprimé.");
        } catch (error) {
          errorMessage(error, "Impossible de supprimer le produit.");
        }
      });
      actions.append(edit, remove);
      row.append(summary, actions);
      return row;
    }));
  }

  function fillProductForm(product) {
    byId("product-id").value = product.id || "";
    byId("product-name").value = product.name;
    byId("product-category").value = product.category;
    byId("product-description").value = product.description;
    releaseImagePreviews(state.productImages);
    state.productImages = imageEntries(getProductImages(product));
    byId("product-image-files").value = "";
    byId("product-price").value = numericPrice(product.price);
    byId("product-original-price").value = numericPrice(product.original_price);
    byId("product-stock").value = product.stock_status;
    byId("product-release").value = product.release_at ? toLocalDateTimeInput(product.release_at) : "";
    byId("product-promo").value = product.promo || "";
    byId("product-active").value = String(product.active);
    byId("product-featured").checked = Boolean(product.is_featured);
    byId("product-is-promo").checked = Boolean(product.is_promo);
    renderProductImagePreview();
    $(".admin-pane[data-pane='products']").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function setupProductAdmin() {
    installImagePicker("product-image-files", state.productImages, renderProductImagePreview);
    byId("product-name").addEventListener("input", renderProductImagePreview);
    byId("product-reset").addEventListener("click", () => {
      releaseImagePreviews(state.productImages);
      state.productImages = [];
      byId("product-form").reset();
      renderProductImagePreview();
    });
    byId("product-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const release = byId("product-release").value;
      const product = {
        name: byId("product-name").value.trim(),
        category: byId("product-category").value,
        description: byId("product-description").value.trim(),
        images: [],
        price: numericPrice(byId("product-price").value) || byId("product-price").value.trim(),
        original_price: numericPrice(byId("product-original-price").value) || null,
        stock_status: byId("product-stock").value,
        release_at: release ? new Date(release).toISOString() : null,
        promo: byId("product-promo").value.trim() || null,
        is_featured: byId("product-featured").checked,
        is_promo: byId("product-is-promo").checked,
        active: byId("product-active").value === "true"
      };
      if (byId("product-id").value) product.id = byId("product-id").value;
      try {
        product.images = await uploadImageEntries(state.productImages, "products");
        await window.IcareSupabase.saveProduct(product);
        releaseImagePreviews(state.productImages);
        state.productImages = [];
        byId("product-form").reset();
        await loadProducts();
        await loadAdminProducts();
        renderProductImagePreview();
        toast("Produit enregistré.");
      } catch (error) {
        errorMessage(error, "Impossible d'enregistrer le produit.");
      }
    });
  }

  async function loadAdminInbox() {
    if (!isAdmin()) return;
    try {
      state.adminConversations = await window.IcareSupabase.getConversations();
      state.adminMessageIndex = await window.IcareSupabase.getConversationMessages(state.adminConversations.map((item) => item.id));
      renderAdminInbox();
      renderAdminOrders();
    } catch (error) {
      errorMessage(error, "Impossible de charger la boîte de réception.");
    }
  }

  function renderAdminInbox() {
    const inbox = byId("admin-inbox");
    const needle = byId("admin-inbox-search").value.trim().toLocaleLowerCase();
    const dateFilter = byId("admin-inbox-date").value;
    const statusFilter = byId("admin-inbox-status").value;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 86400000;
    const matching = state.adminConversations.filter((conversation) => {
      const messages = state.adminMessageIndex.filter((message) => message.conversation_id === conversation.id);
      const searchable = [
        conversation.profiles?.display_name,
        conversation.profiles?.email,
        conversation.subject,
        ...messages.map((message) => message.content)
      ].join(" ").toLocaleLowerCase();
      if (needle && !searchable.includes(needle)) return false;
      const updatedAt = new Date(conversation.updated_at || conversation.created_at).getTime();
      if (dateFilter === "today" && updatedAt < todayStart) return false;
      if (dateFilter === "week" && updatedAt < weekStart) return false;
      const waiting = messages.some((message) => message.sender_id !== state.user.id && !message.read_at);
      if (statusFilter === "open" && conversation.status !== "open") return false;
      if (statusFilter === "closed" && conversation.status !== "closed") return false;
      if (statusFilter === "waiting" && !waiting) return false;
      return true;
    });
    matching.sort((a, b) => {
      const delta = new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at);
      return dateFilter === "oldest" ? delta : -delta;
    });
    inbox.replaceChildren(...matching.map((conversation) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `admin-list-item admin-inbox-item${state.selectedAdminConversation?.id === conversation.id ? " selected" : ""}`;
      const identity = document.createElement("span");
      identity.className = "inbox-item-identity";
      const strong = document.createElement("strong");
      strong.textContent = conversation.profiles?.display_name || "Client";
      const email = document.createElement("span");
      email.textContent = conversation.profiles?.email || "";
      const detail = document.createElement("span");
      const subject = { discord: "Discord", roblox: "Roblox", coaching: "Coaching", other: "Autre" }[conversation.subject] || "Demande";
      detail.textContent = `${subject} · ${conversation.status === "closed" ? "Fermée" : orderStatusLabel(conversation.order_status)} · ${formatMessageTimestamp(conversation.updated_at || conversation.created_at)}`;
      identity.append(strong, email, detail);
      const recentMessage = state.adminMessageIndex.find((message) => message.conversation_id === conversation.id);
      if (recentMessage) {
        const preview = document.createElement("span");
        preview.className = "inbox-preview";
        preview.textContent = recentMessage.content;
        identity.append(preview);
      }
      const waiting = state.adminMessageIndex.some((message) => message.conversation_id === conversation.id && message.sender_id !== state.user.id && !message.read_at);
      if (waiting) {
        const unread = document.createElement("span");
        unread.className = "inbox-unread";
        unread.textContent = "Nouveau";
        item.append(unread);
      }
      item.append(identity);
      item.addEventListener("click", () => selectAdminConversation(conversation));
      return item;
    }));
    if (!matching.length) {
      const empty = document.createElement("p");
      empty.className = "muted inbox-empty";
      empty.textContent = state.adminConversations.length ? "Aucune conversation ne correspond aux filtres." : "Aucune demande pour le moment.";
      inbox.append(empty);
    }
  }

  function renderAdminOrders() {
    const list = byId("admin-orders-list");
    if (!list) return;
    const needle = byId("admin-orders-search").value.trim().toLocaleLowerCase();
    const dateFilter = byId("admin-orders-date").value;
    const statusFilter = byId("admin-orders-status-filter").value;
    const now = Date.now();
    const orders = state.adminConversations.filter((conversation) => {
      const text = `${conversation.order_consent_product || ""} ${conversation.order_details || ""} ${conversation.profiles?.display_name || ""} ${conversation.profiles?.email || ""}`.toLocaleLowerCase();
      const date = new Date(conversation.created_at).getTime();
      const dateMatches = dateFilter === "today" ? date >= new Date().setHours(0, 0, 0, 0)
        : dateFilter === "week" ? date >= now - 7 * 86400000
          : true;
      return Boolean(conversation.order_consent_product) && (!needle || text.includes(needle)) &&
        (statusFilter === "all" || conversation.order_status === statusFilter) && dateMatches;
    }).sort((a, b) => dateFilter === "oldest"
      ? new Date(a.created_at) - new Date(b.created_at)
      : new Date(b.created_at) - new Date(a.created_at));
    list.replaceChildren(...orders.map((conversation) => {
      const card = document.createElement("article");
      card.className = "admin-order-card";
      const heading = document.createElement("h3");
      heading.textContent = `${conversation.order_consent_product} · ${conversation.profiles?.display_name || conversation.profiles?.email || "Client"}`;
      const info = document.createElement("p");
      info.textContent = `${orderStatusLabel(conversation.order_status)} · ${formatDate(conversation.created_at)}${conversation.order_details ? ` · ${conversation.order_details}` : ""}`;
      const status = document.createElement("select");
      status.setAttribute("aria-label", "Statut de commande");
      for (const [value, label] of [["requested", "Demandé"], ["discussion", "En discussion"], ["awaiting_payment", "En attente de paiement"], ["in_progress", "En cours"], ["testing", "En test"], ["delivered", "Livré"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = value === conversation.order_status;
        status.append(option);
      }
      status.addEventListener("change", async () => {
        try {
          await window.IcareSupabase.updateConversation(conversation.id, { order_status: status.value });
          conversation.order_status = status.value;
          renderAdminOrders();
          toast("Statut de commande mis à jour.");
        } catch (error) {
          errorMessage(error, "Impossible de modifier le statut.");
        }
      });
      const actions = document.createElement("div");
      actions.className = "dialog-actions";
      const payment = document.createElement("button");
      payment.type = "button";
      payment.className = "small-admin-button";
      payment.textContent = "Lien de paiement";
      payment.addEventListener("click", () => {
        state.selectedAdminOrder = conversation;
        byId("admin-payment-url").value = conversation.paypal_payment_url || "";
        byId("admin-payment-form").hidden = false;
        byId("admin-payment-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-admin-button danger-text";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Supprimer définitivement cette commande et tous ses messages ?")) return;
        try {
          await window.IcareSupabase.deleteConversation(conversation.id);
          state.adminMessageUnsubscribe?.();
          state.adminMessageUnsubscribe = null;
          await loadAdminInbox();
          toast("Commande supprimée.");
        } catch (error) {
          errorMessage(error, "Impossible de supprimer la commande.");
        }
      });
      actions.append(payment, remove);
      card.append(heading, info, status, actions);
      return card;
    }));
    if (!orders.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Aucune commande pour ces filtres.";
      list.append(empty);
    }
  }

  function setupAdminOrders() {
    ["admin-orders-search", "admin-orders-date", "admin-orders-status-filter"].forEach((id) => {
      byId(id).addEventListener(id.endsWith("search") ? "input" : "change", renderAdminOrders);
    });
    byId("admin-payment-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.selectedAdminOrder) return;
      const url = byId("admin-payment-url").value.trim();
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") throw new Error("Le lien doit être une URL HTTPS valide (OnParticipe ou autre).");
        await window.IcareSupabase.updateConversation(state.selectedAdminOrder.id, {
          paypal_payment_url: parsed.href,
          order_status: "awaiting_payment"
        });
        await window.IcareSupabase.sendMessage(state.selectedAdminOrder.id, `Votre lien de paiement / soutien : ${parsed.href}`);
        state.selectedAdminOrder = null;
        byId("admin-payment-form").hidden = true;
        await loadAdminInbox();
        toast("Lien de paiement enregistré et envoyé au client.");
      } catch (error) {
        errorMessage(error, "Impossible d’enregistrer le lien de paiement.");
      }
    });
  }

  async function selectAdminConversation(conversation) {
    state.selectedAdminConversation = conversation;
    renderAdminInbox();
    byId("admin-reply-form").hidden = false;
    byId("admin-order-status-wrap").hidden = false;
    byId("quick-replies").hidden = false;
    byId("admin-order-status").value = conversation.order_status || "requested";
    try {
      let messages = await window.IcareSupabase.getMessages(conversation.id);
      const thread = byId("admin-thread");
      thread.replaceChildren();
      const header = byId("admin-thread-header");
      header.replaceChildren();
      const clientInfo = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = conversation.profiles?.display_name || "Client";
      const email = document.createElement("span");
      email.textContent = conversation.profiles?.email || "";
      const subject = document.createElement("span");
      subject.textContent = `Sujet : ${{ discord: "Discord", roblox: "Roblox", coaching: "Coaching", other: "Autre" }[conversation.subject] || "Autre"}`;
      clientInfo.append(name, email, subject);
      if (conversation.order_consent_at) {
        const consent = document.createElement("span");
        consent.className = "order-consent-record";
        consent.textContent = `Consentement de démarrage enregistré pour « ${conversation.order_consent_product || "prestation personnalisée"} » · ${formatMessageTimestamp(conversation.order_consent_at)}`;
        clientInfo.append(consent);
      }
      const unreadIds = messages.filter((message) => message.sender_id !== state.user.id && !message.read_at).map((message) => message.id);
      if (unreadIds.length) {
        await window.IcareSupabase.markMessagesRead(unreadIds);
        const readAt = new Date().toISOString();
        messages = messages.map((message) => unreadIds.includes(message.id) ? { ...message, read_at: readAt } : message);
        await refreshNotifications();
      }
      messages.forEach((message) => appendMessageBubble(thread, message, state.user.id, conversation.profiles?.display_name || "Client"));
      state.adminMessageIndex = state.adminMessageIndex.map((message) =>
        message.conversation_id === conversation.id && unreadIds.includes(message.id) ? { ...message, read_at: new Date().toISOString() } : message
      );
      renderAdminInbox();
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "small-admin-button";
      closeButton.textContent = conversation.status === "closed" ? "Rouvrir" : "Clôturer";
      closeButton.addEventListener("click", async () => {
        try {
          const status = conversation.status === "closed" ? "open" : "closed";
          const updated = await window.IcareSupabase.updateConversation(conversation.id, { status });
          state.selectedAdminConversation = { ...state.selectedAdminConversation, ...updated };
          await loadAdminInbox();
          await selectAdminConversation(state.selectedAdminConversation);
          toast(status === "closed" ? "Demande clôturée." : "Demande rouverte.");
        } catch (error) {
          errorMessage(error, "Impossible de modifier le statut.");
        }
      });
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "small-admin-button danger-text";
      deleteButton.textContent = "Supprimer la conversation";
      deleteButton.addEventListener("click", async () => {
        if (!window.confirm("Supprimer définitivement cette conversation et tous ses messages ?")) return;
        try {
          await window.IcareSupabase.deleteConversation(conversation.id);
          state.selectedAdminConversation = null;
          await loadAdminInbox();
          byId("admin-thread-header").replaceChildren();
          byId("admin-thread").replaceChildren();
          byId("admin-reply-form").hidden = true;
          byId("admin-order-status-wrap").hidden = true;
          byId("quick-replies").hidden = true;
          toast("Conversation supprimée.");
        } catch (error) {
          errorMessage(error, "Impossible de supprimer la conversation.");
        }
      });
      header.append(clientInfo, closeButton, deleteButton);
      state.adminMessageUnsubscribe?.();
      state.adminMessageUnsubscribe = window.IcareSupabase.subscribeToMessages(conversation.id, async () => {
        await selectAdminConversation(state.selectedAdminConversation);
      }, (error) => console.error("Admin chat realtime subscription failed.", error));
      thread.scrollTop = thread.scrollHeight;
    } catch (error) {
      errorMessage(error, "Impossible de charger la conversation.");
    }
  }

  function appendMessageBubble(thread, message, currentUserId, clientName) {
    const bubble = document.createElement("article");
    const mine = message.sender_id === currentUserId;
    bubble.className = `chat-message${mine ? " mine" : ""}`;
    bubble.dataset.messageId = message.id;
    const author = document.createElement("strong");
    author.textContent = mine ? "Icare" : clientName;
    const body = document.createElement("p");
    body.textContent = message.content;
    const date = document.createElement("time");
    date.dateTime = message.created_at;
    date.textContent = formatMessageTimestamp(message.created_at);
    bubble.append(author, body, date);
    if (mine) {
      const readStatus = document.createElement("span");
      readStatus.className = "message-read-status";
      readStatus.textContent = message.read_at ? "Lu" : "Reçu";
      bubble.append(readStatus);
    }
    thread.append(bubble);
    return bubble;
  }

  function setupAdminInbox() {
    byId("admin-inbox-search").addEventListener("input", renderAdminInbox);
    byId("admin-inbox-date").addEventListener("change", renderAdminInbox);
    byId("admin-inbox-status").addEventListener("change", renderAdminInbox);
    byId("admin-reply-input").addEventListener("input", () => {
      byId("admin-reply-count").textContent = String(byId("admin-reply-input").value.length);
    });
    byId("admin-reply-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        byId("admin-reply-form").requestSubmit();
      }
    });
    byId("admin-reply-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.selectedAdminConversation) return;
      const input = byId("admin-reply-input");
      try {
        const content = input.value.trim();
        await window.IcareSupabase.sendMessage(state.selectedAdminConversation.id, content);
        input.value = "";
        byId("admin-reply-count").textContent = "0";
        await notifyClientPush(state.selectedAdminConversation, content);
        await selectAdminConversation(state.selectedAdminConversation);
        await loadAdminInbox();
      } catch (error) {
        errorMessage(error, "Impossible d'envoyer la réponse.");
      }
    });
    byId("admin-order-status").addEventListener("change", async (event) => {
      if (!state.selectedAdminConversation) return;
      try {
        const updated = await window.IcareSupabase.updateConversation(state.selectedAdminConversation.id, { order_status: event.target.value });
        state.selectedAdminConversation = { ...state.selectedAdminConversation, ...updated, order_status: updated?.order_status || event.target.value };
        const conversation = state.adminConversations.find((item) => item.id === state.selectedAdminConversation.id);
        if (conversation) conversation.order_status = event.target.value;
        renderAdminInbox();
        toast("Suivi de commande mis à jour.");
      } catch (error) {
        errorMessage(error, "Impossible de mettre à jour le suivi.");
      }
    });
    $$(".quick-replies [data-quick-reply]").forEach((button) => button.addEventListener("click", async () => {
      if (!state.selectedAdminConversation) return;
      try {
        const content = button.dataset.quickReply;
        await window.IcareSupabase.sendMessage(state.selectedAdminConversation.id, content);
        await notifyClientPush(state.selectedAdminConversation, content);
        await selectAdminConversation(state.selectedAdminConversation);
        await refreshNotifications();
      } catch (error) {
        errorMessage(error, "Impossible d’envoyer la réponse rapide.");
      }
    }));
  }

  function renderAdminPortfolio() {
    const list = byId("admin-portfolio-list");
    list.replaceChildren(...state.portfolioProjects.map((project) => {
      const row = document.createElement("div");
      row.className = "admin-list-item";
      const summary = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = project.title;
      const metadata = document.createElement("span");
      metadata.textContent = `${(project.tags || []).join(" · ") || "Sans catégorie"} · ${project.active ? "Publié" : "Brouillon"}`;
      summary.append(title, metadata);
      const actions = document.createElement("span");
      actions.className = "admin-list-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "small-admin-button";
      edit.textContent = "Modifier";
      edit.addEventListener("click", () => fillPortfolioForm(project));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-admin-button";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Supprimer le projet « ${project.title} » ?`)) return;
        try {
          if (isLocalId(project.id)) {
            state.portfolioProjects = (state.portfolioProjects || []).filter((item) => item.id !== project.id);
            try { localStorage.setItem("icare-hidden-local-portfolio", JSON.stringify([...(JSON.parse(localStorage.getItem("icare-hidden-local-portfolio") || "[]")), project.id])); } catch (_) {}
            renderPortfolioProjects();
            // refresh admin list
            const list = byId("admin-portfolio-list");
            if (list) list.dispatchEvent(new Event("icare:refresh-admin-portfolio"));
            await loadPortfolioProjects(true);
            toast("Exemple local supprimé.");
            return;
          }
          await window.IcareSupabase.deletePortfolioProject(project.id);
          await loadPortfolioProjects(true);
          toast("Projet supprimé.");
        } catch (error) {
          errorMessage(error, "Impossible de supprimer ce projet.");
        }
      });
      actions.append(edit, remove);
      row.append(summary, actions);
      return row;
    }));
    if (!state.portfolioProjects.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Aucun projet enregistré.";
      list.append(empty);
    }
  }

  function fillPortfolioForm(project) {
    byId("portfolio-id").value = project.id || "";
    byId("portfolio-title").value = project.title || "";
    byId("portfolio-description").value = project.description || "";
    byId("portfolio-category").value = portfolioCategory(project);
    byId("portfolio-tags").value = (project.tags || []).join(", ");
    byId("portfolio-value").value = project.project_value || "";
    byId("portfolio-cost").value = project.project_cost || "";
    byId("portfolio-duration").value = project.duration || "";
    byId("portfolio-challenges").value = project.challenges || "";
    byId("portfolio-solutions").value = project.solutions || "";
    byId("portfolio-demo-url").value = project.demo_url || "";
    byId("portfolio-source-url").value = project.source_url || "";
    byId("portfolio-active").checked = Boolean(project.active);
    byId("portfolio-order").value = project.sort_order ?? 0;
    releaseImagePreviews(state.portfolioImages);
    state.portfolioImages = imageEntries(project.images);
    byId("portfolio-image-files").value = "";
    renderPortfolioImageEditor();
    $(".admin-pane[data-pane='portfolio']").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function setupAdminPortfolio() {
    setupPortfolioGallery();
    byId("portfolio-reset").addEventListener("click", () => {
      releaseImagePreviews(state.portfolioImages);
      state.portfolioImages = [];
      byId("portfolio-form").reset();
      byId("portfolio-id").value = "";
      byId("portfolio-order").value = "0";
      byId("portfolio-active").checked = true;
      renderPortfolioImageEditor();
    });
    byId("portfolio-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const category = byId("portfolio-category").value;
      const categoryTag = { web: "Développement Web/App", gaming: "Roblox & Gaming", graphisme: "Graphisme & Design Visuel" }[category];
      const tags = byId("portfolio-tags").value.split(",").map((tag) => tag.trim()).filter(Boolean);
      if (categoryTag && !tags.includes(categoryTag)) tags.unshift(categoryTag);
      const project = {
        title: byId("portfolio-title").value.trim(),
        description: byId("portfolio-description").value.trim(),
        tags,
        images: [],
        project_value: byId("portfolio-value").value.trim(),
        project_cost: byId("portfolio-cost").value.trim(),
        duration: byId("portfolio-duration").value.trim(),
        challenges: byId("portfolio-challenges").value.trim(),
        solutions: byId("portfolio-solutions").value.trim(),
        demo_url: byId("portfolio-demo-url").value.trim() || null,
        source_url: byId("portfolio-source-url").value.trim() || null,
        active: byId("portfolio-active").checked,
        sort_order: Number(byId("portfolio-order").value)
      };
      if (byId("portfolio-id").value) project.id = byId("portfolio-id").value;
      try {
        project.images = await uploadImageEntries(state.portfolioImages, "portfolio");
        await window.IcareSupabase.savePortfolioProject(project);
        releaseImagePreviews(state.portfolioImages);
        state.portfolioImages = [];
        byId("portfolio-reset").click();
        await loadPortfolioProjects(true);
        toast("Projet enregistré.");
      } catch (error) {
        errorMessage(error, "Impossible d'enregistrer le projet.");
      }
    });
  }

  async function loadAdminStats() {
    if (!isAdmin()) return;
    try {
      state.siteStats = await window.IcareSupabase.getSiteStats();
      renderSiteStats();
    } catch (error) {
      errorMessage(error, "Impossible de charger les statistiques.");
    }
  }

  function setupAdminStats() {
    byId("stats-reset").addEventListener("click", () => {
      byId("stats-form").reset();
      byId("stats-original-key").value = "";
      byId("stats-order").value = String(state.siteStats.length);
      byId("stats-delete").disabled = true;
    });
    byId("stats-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const stat = {
        key: byId("stats-key").value,
        value: byId("stats-value").value.trim(),
        suffix: byId("stats-suffix").value.trim(),
        label_fr: byId("stats-label-fr").value.trim(),
        label_en: byId("stats-label-en").value.trim(),
        sort_order: Number(byId("stats-order").value)
      };
      const originalKey = byId("stats-original-key").value;
      try {
        const saved = await window.IcareSupabase.saveSiteStat(stat, originalKey);
        state.siteStats = [...state.siteStats.filter((item) => item.key !== saved.key), saved].sort((a, b) => a.sort_order - b.sort_order);
        if (originalKey && originalKey !== saved.key) state.siteStats = state.siteStats.filter((item) => item.key !== originalKey);
        renderSiteStats();
        byId("stats-reset").click();
        toast("Statistique enregistrée.");
      } catch (error) {
        errorMessage(error, "Impossible d'enregistrer la statistique.");
      }
    });
    byId("stats-delete").addEventListener("click", async () => {
      const key = byId("stats-original-key").value;
      if (!key || !window.confirm(`Supprimer la statistique « ${byId("stats-label-fr").value} » ?`)) return;
      try {
        await window.IcareSupabase.deleteSiteStat(key);
        state.siteStats = state.siteStats.filter((stat) => stat.key !== key);
        renderSiteStats();
        byId("stats-reset").click();
        toast("Statistique supprimée.");
      } catch (error) {
        errorMessage(error, "Impossible de supprimer la statistique.");
      }
    });
  }

  async function loadAdminPromoCodes() {
    if (!isAdmin()) return;
    try {
      state.promoCodes = await window.IcareSupabase.getPromoCodes(true);
      renderAdminPromoCodes();
    } catch (error) {
      errorMessage(error, "Impossible de charger les codes promo.");
    }
  }

  function renderAdminPromoCodes() {
    const list = byId("admin-promo-list");
    list.replaceChildren(...state.promoCodes.map((promo) => {
      const row = document.createElement("div");
      row.className = "admin-list-item";
      const summary = document.createElement("span");
      const code = document.createElement("strong");
      code.textContent = promo.code;
      const detail = document.createElement("span");
      detail.textContent = `${promo.discount_percent}% · ${promo.active ? "Actif" : "Désactivé"}${promo.expires_at ? ` · expire le ${formatDate(promo.expires_at)}` : ""}`;
      summary.append(code, detail);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-admin-button";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Supprimer le code ${promo.code} ?`)) return;
        try {
          await window.IcareSupabase.deletePromoCode(promo.code);
          state.promoCodes = state.promoCodes.filter((item) => item.code !== promo.code);
          renderAdminPromoCodes();
          toast("Code promo supprimé.");
        } catch (error) {
          errorMessage(error, "Impossible de supprimer ce code promo.");
        }
      });
      row.append(summary, remove);
      return row;
    }));
  }

  function setupAdminPromoCodes() {
    byId("promo-code-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const expires = byId("promo-expiry").value;
      const promo = {
        code: byId("promo-code").value.trim().toUpperCase(),
        discount_percent: Number(byId("promo-discount").value),
        expires_at: expires ? new Date(expires).toISOString() : null,
        active: byId("promo-active").checked
      };
      try {
        const saved = await window.IcareSupabase.savePromoCode(promo);
        state.promoCodes = [saved, ...state.promoCodes.filter((item) => item.code !== saved.code)];
        renderAdminPromoCodes();
        byId("promo-code-form").reset();
        byId("promo-active").checked = true;
        toast("Code promo enregistré.");
      } catch (error) {
        errorMessage(error, "Impossible d'enregistrer ce code promo.");
      }
    });
  }

  async function loadSettingsIntoForm() {
    try {
      state.settings = await window.IcareSupabase.getSettings();
      const settings = state.settings || {};
      byId("maintenance-toggle").checked = settings.maintenance_enabled;
      byId("settings-message").value = settings.maintenance_message || "";
      byId("settings-end").value = settings.maintenance_end ? toLocalDateTimeInput(settings.maintenance_end) : "";
      byId("settings-color").value = settings.accent_color || "#94baff";
      byId("settings-availability").value = settings.availability || "open";
      byId("settings-meta-title").value = settings.meta_title || "";
      byId("settings-meta-description").value = settings.meta_description || "";
      byId("settings-keywords").value = settings.keywords || "";
      byId("settings-og-image").value = settings.og_image || "";
      byId("settings-site-url").value = settings.site_url || "https://icare.dev";
      byId("settings-legal-updated-at").value = settings.legal_updated_at || "";
      byId("settings-legal-notice").value = removeLegalPlaceholders(settings.legal_notice || defaultLegalText.legal_notice);
      byId("settings-legal-terms").value = removeLegalPlaceholders(settings.legal_terms || defaultLegalText.legal_terms);
      byId("settings-legal-sales").value = removeLegalPlaceholders(settings.legal_sales || defaultLegalText.legal_sales);
      byId("settings-legal-privacy").value = removeLegalPlaceholders(settings.legal_privacy || defaultLegalText.legal_privacy);
      byId("settings-business-status").value = settings.legal_business_status || "";
      byId("settings-registration").value = settings.legal_registration || "";
      byId("settings-address").value = settings.legal_address || "";
      byId("settings-legal-email").value = settings.legal_email || "";
      byId("settings-director").value = settings.legal_director || "";
      byId("settings-mediator").value = settings.legal_mediator || "";
    } catch (error) {
      errorMessage(error, "Impossible de charger les réglages.");
    }
  }

  function setupSettingsAdmin() {
    byId("settings-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const end = byId("settings-end").value;
      const settings = {
        maintenance_enabled: byId("maintenance-toggle").checked,
        maintenance_title: window.IcareI18n.t("maintenance.title"),
        maintenance_message: byId("settings-message").value.trim(),
        maintenance_end: end ? new Date(end).toISOString() : null,
        accent_color: byId("settings-color").value,
        availability: byId("settings-availability").value,
        meta_title: byId("settings-meta-title").value.trim() || null,
        meta_description: byId("settings-meta-description").value.trim() || null,
        keywords: byId("settings-keywords").value.trim() || null,
        og_image: byId("settings-og-image").value.trim() || null,
        site_url: normalizeSiteUrl(byId("settings-site-url").value) || "https://icare.dev",
        legal_updated_at: byId("settings-legal-updated-at").value || null,
        legal_notice: byId("settings-legal-notice").value.trim(),
        legal_terms: byId("settings-legal-terms").value.trim(),
        legal_sales: byId("settings-legal-sales").value.trim(),
        legal_privacy: byId("settings-legal-privacy").value.trim(),
        legal_business_status: byId("settings-business-status").value.trim() || null,
        legal_registration: byId("settings-registration").value.trim() || null,
        legal_address: byId("settings-address").value.trim() || null,
        legal_email: byId("settings-legal-email").value.trim() || null,
        legal_director: byId("settings-director").value.trim() || null,
        legal_mediator: byId("settings-mediator").value.trim() || null
      };
      try {
        await window.IcareSupabase.saveSettings(settings);
        await loadSettings();
        updateSeoMetadata();
        renderLegalContent();
        setAvailability(settings.availability);
        toast("Réglages enregistrés.");
      } catch (error) {
        errorMessage(error, "Impossible d'enregistrer les réglages.");
      }
    });
  }

  function setupChangelogAdmin() {
    byId("changelog-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await window.IcareSupabase.publishChangelog(byId("changelog-title").value.trim(), byId("changelog-body").value.trim());
        byId("changelog-form").reset();
        await loadChangelog();
        toast("Mise à jour publiée.");
      } catch (error) {
        errorMessage(error, "Impossible de publier la mise à jour.");
      }
    });
  }

  function setupReviews() {
    byId("review-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await window.IcareSupabase.submitReview(Number(byId("review-rating").value), byId("review-body").value.trim());
        byId("review-form").reset();
        closeDialog(byId("review-dialog"));
        toast(document.documentElement.lang === "en" ? "Thanks! Your review will be published after moderation." : "Merci ! Votre avis sera publié après modération.");
      } catch (error) {
        errorMessage(error, "Impossible d'envoyer votre avis.");
      }
    });
  }


  async function loadPartners(includeDrafts = false) {
    try {
      state.partners = await window.IcareSupabase.getPartners(includeDrafts);
      renderPartners();
      if (includeDrafts) renderAdminPartners();
    } catch (error) {
      errorMessage(error, "Impossible de charger les partenaires.");
    }
  }

  function renderPartners() {
    const grid = byId("partners-grid");
    const empty = byId("empty-partners");
    if (!grid) return;
    const list = (state.partners || []).filter((p) => p.active !== false);
    if (!list.length) {
      grid.replaceChildren();
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.replaceChildren(...list.map((partner) => {
      const card = document.createElement("article");
      card.className = "partner-card";
      card.style.setProperty("--partner-color", partner.theme_color || "#94baff");
      const logoWrap = document.createElement("div");
      logoWrap.className = "partner-logo-wrap";
      if (partner.image_url) {
        const img = document.createElement("img");
        img.className = "partner-logo";
        img.src = partner.image_url;
        img.alt = partner.title || "Partenaire";
        img.loading = "lazy";
        logoWrap.append(img);
      } else {
        const letter = document.createElement("span");
        letter.style.cssText = "font:700 42px var(--font-display);color:var(--partner-color)";
        letter.textContent = (partner.title || "P")[0];
        logoWrap.append(letter);
      }
      const title = document.createElement("h3");
      title.textContent = partner.title || "";
      const desc = document.createElement("p");
      desc.textContent = partner.description || "";
      const links = document.createElement("div");
      links.className = "partner-links";
      (Array.isArray(partner.links) ? partner.links : []).forEach((link) => {
        if (!link || !link.url) return;
        const a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = link.label || (window.IcareI18n?.t("partners.visit") || "Visiter");
        links.append(a);
      });
      card.append(logoWrap, title, desc, links);
      return card;
    }));
  }

  function parsePartnerLinks(text) {
    return String(text || "").split("\n").map((line) => {
      const sep = line.indexOf("|");
      if (sep === -1) {
        const url = line.trim();
        return url ? { label: window.IcareI18n?.t("partners.visit") || "Visiter", url } : null;
      }
      return { label: line.slice(0, sep).trim() || "Lien", url: line.slice(sep + 1).trim() };
    }).filter((item) => item && item.url);
  }

  function renderAdminPartners() {
    const list = byId("admin-partners-list");
    if (!list) return;
    list.replaceChildren(...(state.partners || []).map((partner) => {
      const row = document.createElement("div");
      row.className = "admin-list-item";
      const summary = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = partner.title;
      const detail = document.createElement("span");
      detail.textContent = `${partner.active ? "Publié" : "Brouillon"} · ${partner.theme_color || ""} · ordre ${partner.sort_order ?? 0}`;
      summary.append(strong, detail);
      const actions = document.createElement("div");
      actions.className = "admin-list-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "small-admin-button";
      edit.textContent = "Éditer";
      edit.addEventListener("click", () => {
        byId("partner-id").value = partner.id;
        byId("partner-title").value = partner.title || "";
        byId("partner-description").value = partner.description || "";
        byId("partner-theme-color").value = partner.theme_color || "#94baff";
        byId("partner-active").checked = partner.active !== false;
        byId("partner-order").value = String(partner.sort_order ?? 0);
        byId("partner-image-url").value = partner.image_url || "";
        const links = Array.isArray(partner.links) ? partner.links : [];
        byId("partner-links").value = links.map((l) => `${l.label || ""}|${l.url || ""}`).join("\n");
        const preview = byId("partner-image-preview");
        if (partner.image_url && preview) { preview.src = partner.image_url; preview.hidden = false; }
        else if (preview) { preview.hidden = true; preview.removeAttribute("src"); }
        state.partnerImageFile = null;
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-admin-button";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Supprimer « ${partner.title} » ?`)) return;
        try {
          if (isLocalId(partner.id)) {
            state.partners = state.partners.filter((p) => p.id !== partner.id);
            renderPartners();
            renderAdminPartners();
            toast("Exemple local supprimé.");
            return;
          }
          await window.IcareSupabase.deletePartner(partner.id);
          state.partners = state.partners.filter((p) => p.id !== partner.id);
          renderPartners();
          renderAdminPartners();
          toast("Partenaire supprimé.");
        } catch (error) {
          errorMessage(error, "Impossible de supprimer ce partenaire.");
        }
      });
      actions.append(edit, remove);
      row.append(summary, actions);
      return row;
    }));
  }

  function setupPartnersAdmin() {
    const form = byId("partner-form");
    if (!form) return;
    byId("partner-reset")?.addEventListener("click", () => {
      form.reset();
      byId("partner-id").value = "";
      byId("partner-image-url").value = "";
      byId("partner-theme-color").value = "#94baff";
      byId("partner-active").checked = true;
      byId("partner-order").value = "0";
      const preview = byId("partner-image-preview");
      if (preview) { preview.hidden = true; preview.removeAttribute("src"); }
      state.partnerImageFile = null;
    });
    byId("partner-image-file")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      state.partnerImageFile = file || null;
      const preview = byId("partner-image-preview");
      if (file && preview) { preview.src = URL.createObjectURL(file); preview.hidden = false; }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const partner = {
        title: byId("partner-title").value.trim(),
        description: byId("partner-description").value.trim(),
        theme_color: byId("partner-theme-color").value || "#94baff",
        links: parsePartnerLinks(byId("partner-links").value),
        active: byId("partner-active").checked,
        sort_order: Number(byId("partner-order").value) || 0,
        image_url: byId("partner-image-url").value || null
      };
      if (byId("partner-id").value) partner.id = byId("partner-id").value;
      try {
        if (state.partnerImageFile && state.user?.id) {
          partner.image_url = await window.IcareSupabase.uploadPublicImage(state.partnerImageFile, "partners", state.user.id);
        }
        const saved = await window.IcareSupabase.savePartner(partner);
        state.partners = [saved, ...(state.partners || []).filter((p) => p.id !== saved.id)].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        renderPartners();
        renderAdminPartners();
        byId("partner-reset").click();
        toast("Partenaire enregistré.");
      } catch (error) {
        errorMessage(error, "Impossible d'enregistrer le partenaire.");
      }
    });
  }

  function setupHeroAndFlagsAdmin() {
    byId("hero-banner-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const file = byId("hero-banner-file")?.files?.[0];
      if (!file || !state.user?.id) { toast("Choisissez une image.", "error"); return; }
      try {
        const url = await window.IcareSupabase.uploadPublicImage(file, "banners", state.user.id);
        await window.IcareSupabase.saveSettings({ hero_banner_url: url });
        state.settings = { ...(state.settings || {}), hero_banner_url: url };
        applyHeroBanner(url);
        toast("Bannière d’accueil enregistrée.");
      } catch (error) {
        errorMessage(error, "Impossible d’enregistrer la bannière.");
      }
    });
    byId("hero-banner-file")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      const preview = byId("hero-banner-preview");
      if (file && preview) { preview.src = URL.createObjectURL(file); preview.hidden = false; }
    });
    byId("language-flags-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const flags = {};
      $$("#language-flags-fields input[data-lang]").forEach((input) => {
        const val = input.value.trim();
        if (val) flags[input.dataset.lang] = val;
      });
      try {
        await window.IcareSupabase.saveSettings({ language_flags: flags });
        state.settings = { ...(state.settings || {}), language_flags: flags };
        if (window.IcareI18n?.applyCustomFlags) window.IcareI18n.applyCustomFlags(flags);
        toast("Drapeaux enregistrés.");
      } catch (error) {
        errorMessage(error, "Impossible d’enregistrer les drapeaux.");
      }
    });
  }

  function renderLanguageFlagsFields() {
    const root = byId("language-flags-fields");
    if (!root) return;
    const langs = window.IcareI18n?.languages || [];
    const custom = state.settings?.language_flags || {};
    root.replaceChildren(...langs.map((item) => {
      const label = document.createElement("label");
      label.textContent = `${item.label} (${item.code})`;
      const input = document.createElement("input");
      input.type = "url";
      input.dataset.lang = item.code;
      input.placeholder = item.flag || "https://…";
      input.value = custom[item.code] || "";
      label.append(input);
      return label;
    }));
  }

  function applyHeroBanner(url) {
    const hero = document.querySelector(".hero-visual");
    if (!hero || !url) return;
    hero.style.backgroundImage = `url("${String(url).replace(/"/g, '\\"')}")`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
  }



  async function notifyClientPush(conversation, preview) {
    const userId = conversation?.user_id;
    if (!userId || !window.IcareSupabase.sendPushNotification) return;
    try {
      const snippet = String(preview || "").replace(/\s+/g, " ").trim().slice(0, 120);
      await window.IcareSupabase.sendPushNotification({
        userId,
        title: "Icare Studio",
        body: snippet ? `Nouveau message : ${snippet}` : "Vous avez reçu un nouveau message.",
        url: "/#client",
        icon: "./icon.svg"
      });
    } catch (error) {
      console.warn("Push notification could not be sent.", error);
    }
  }

  function openAdmin() {
    if (!isAdmin()) {
      toast(document.documentElement.lang === "en" ? "Administrator access required." : "Accès administrateur requis.", "error");
      openAuth();
      return;
    }
    openDialog(byId("admin-dialog"));
    loadAdminProducts();
    loadPartners(true);
    loadPortfolioProjects(true);
    loadAdminInbox();
    loadAdminStats();
    loadAdminPromoCodes();
    loadSettingsIntoForm();
    if (!state.adminConversationUnsubscribe) {
      state.adminConversationUnsubscribe = window.IcareSupabase.subscribeToConversations(
        loadAdminInbox,
        (error) => console.error("Admin realtime subscription failed.", error)
      );
    }
  }

  function setupAdmin() {
    $$(".admin-tab").forEach((tab) => tab.addEventListener("click", () => {
      $$(".admin-tab").forEach((item) => item.classList.toggle("active", item === tab));
      $$(".admin-pane").forEach((pane) => pane.classList.toggle("active", pane.dataset.pane === tab.dataset.tab));
      if (tab.dataset.tab === "inbox") loadAdminInbox();
      if (tab.dataset.tab === "stats") loadAdminStats();
      if (tab.dataset.tab === "promos") loadAdminPromoCodes();
      if (tab.dataset.tab === "portfolio") loadPortfolioProjects(true);
      if (tab.dataset.tab === "partners") loadPartners(true);
      if (tab.dataset.tab === "orders") loadAdminInbox();
      if (tab.dataset.tab === "profile-banner") {
        loadSettingsIntoForm();
        const bannerMode = state.settings?.profile_banner_mode || "discord";
        $$('input[name="profile-banner-mode"]').forEach((radio) => { radio.checked = radio.value === bannerMode; });
        renderProfileBannerEditor();
      }
      if (tab.dataset.tab === "deletions") loadAccountDeletionRequests();
    }));
    setupProductAdmin();
    setupPartnersAdmin();
    setupHeroAndFlagsAdmin();
    setupAdminPortfolio();
    setupAdminInbox();
    setupAdminOrders();
    setupProfileBannerAdmin();
    setupSettingsAdmin();
    setupChangelogAdmin();
    setupReviews();
    setupAdminStats();
    setupAdminPromoCodes();
  }

  function setupPrivacyConsent() {
    const banner = byId("cookie-consent");
    const saveChoice = async (push) => {
      try {
        localStorage.setItem("icare-privacy-choice", JSON.stringify({ essential: true, push, savedAt: new Date().toISOString() }));
      } catch (error) {
        console.error("Unable to persist privacy preferences.", error);
      }
      banner.hidden = true;
      // Native Web Push only — no third-party SDK
      if (push && state.user?.id) {
        try {
          await enablePushNotifications();
        } catch (error) {
          console.error("Unable to enable push after consent.", error);
        }
      }
    };
    let savedChoice = null;
    try {
      savedChoice = JSON.parse(localStorage.getItem("icare-privacy-choice") || "null");
    } catch (error) {
      console.error("Unable to read privacy preferences.", error);
    }
    banner.hidden = Boolean(savedChoice);
    byId("cookie-accept").addEventListener("click", () => saveChoice(true));
    byId("cookie-reject").addEventListener("click", () => saveChoice(false));
    byId("cookie-settings-open").addEventListener("click", () => { banner.hidden = false; });
  }

  function setupStudioConsole() {
    const commands = ["npm run build", "deploy --target production", "git status --short", "ship small, learn fast"];
    const output = byId("console-typed");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const network = byId("console-network");
    const updateNetwork = () => {
      network.textContent = navigator.onLine ? "NETWORK: ONLINE" : "NETWORK: OFFLINE";
      network.classList.toggle("offline", !navigator.onLine);
      const estimate = navigator.connection?.rtt;
      byId("console-latency").textContent = Number.isFinite(estimate) && estimate > 0 ? `~${estimate} ms` : "AVAILABLE";
    };
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    navigator.connection?.addEventListener?.("change", updateNetwork);
    updateNetwork();
    const sessionStarted = performance.now();
    window.setInterval(() => {
      const elapsed = Math.floor((performance.now() - sessionStarted) / 1000);
      byId("console-uptime").textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    }, 1000);
    let commandIndex = 0;
    let characterIndex = 0;
    const typeNext = () => {
      const command = commands[commandIndex % commands.length];
      output.textContent = command.slice(0, characterIndex++);
      if (characterIndex > command.length) {
        commandIndex++;
        characterIndex = 0;
        window.setTimeout(typeNext, reducedMotion ? 4000 : 1900);
      } else {
        window.setTimeout(typeNext, reducedMotion ? 100 : 54);
      }
    };
    typeNext();
    const canvas = byId("console-visualizer");
    const context = canvas.getContext("2d");
    if (!context) return;
    const draw = (time) => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(bounds.width * ratio));
      const height = Math.max(1, Math.floor(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(148,186,255,.44)";
      context.lineWidth = ratio;
      context.beginPath();
      for (let x = 0; x <= width; x += 3 * ratio) {
        const y = height / 2 + Math.sin(x * .018 / ratio + (reducedMotion ? 0 : time * .001)) * 7 * ratio +
          Math.sin(x * .041 / ratio + 1) * 3 * ratio;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      if (!reducedMotion) window.requestAnimationFrame(draw);
    };
    draw(0);
    if (reducedMotion) window.addEventListener("resize", () => draw(0));
  }

  function setupCardTilt() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const selector = ".product-card, .portfolio-card, .skill-card-3d";
    document.addEventListener("pointermove", (event) => {
      const card = event.target.closest(selector);
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--tilt-x", `${(0.5 - y) * 8}deg`);
      card.style.setProperty("--tilt-y", `${(x - 0.5) * 10}deg`);
      card.style.setProperty("--shine-x", `${x * 100}%`);
      card.style.setProperty("--shine-y", `${y * 100}%`);
    });
    document.addEventListener("pointerout", (event) => {
      const card = event.target.closest(selector);
      if (!card || card.contains(event.relatedTarget)) return;
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  }

  function setupSkills3DBackground() {
    if (!window.THREE || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const container = byId("skills-3d-background");
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x94baff,
      transparent: true,
      opacity: 0.8
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 3;

    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
    });

    const animate = () => {
      requestAnimationFrame(animate);

      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0005;

      particlesMesh.rotation.x += mouseY * 0.001;
      particlesMesh.rotation.y += mouseX * 0.001;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      state.pushRegistration = await navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      console.error("Service worker registration failed.", error);
    }
  }

  async function init() {
    setupNavigation();
    setupProductFilters();
    setupPortfolioFilters();
    setupAuth();
    setupChat();
    setupAdmin();
    setupProductCountdown();
    setupPrivacyConsent();
    setupStudioConsole();
    setupCardTilt();
        loadDiscordProfile();
    loadDiscordGuild();
    connectDiscordPresence();
    await Promise.all([loadProducts(), loadPortfolioProjects(), loadPartners(), loadChangelog(), loadSettings(), loadSiteStats()]);
    startNotificationRealtime();
    await refreshNotifications();
    await registerServiceWorker();
  }

  init();
})();