(() => {
  // Drapeaux officiels du sélecteur (Discord CDN fourni + drapeau EN UK/US).
  const languages = [
    { code: "fr", label: "Français", flag: "https://flagcdn.com/fr.svg", emoji: "🇫🇷" },
    { code: "en", label: "English", flag: "https://flagcdn.com/gb.svg", emoji: "🇬🇧" },
    { code: "es", label: "Español", flag: "https://flagcdn.com/es.svg", emoji: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "https://flagcdn.com/de.svg", emoji: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "https://flagcdn.com/it.svg", emoji: "🇮🇹" },
    { code: "ja", label: "日本語", flag: "https://flagcdn.com/jp.svg", emoji: "🇯🇵" },
    { code: "zh", label: "中文", flag: "https://flagcdn.com/cn.svg", emoji: "🇨🇳" }
  ];

  const hourlySuffix = {
    fr: "€ / heure",
    en: "€ / hour",
    es: "€ / hora",
    de: "€ / Stunde",
    it: "€ / ora",
    ja: "€ / 時間",
    zh: "€ / 小时"
  };

  const dictionaries = {
    fr: {
      "nav.home": "Accueil", "nav.portfolio": "Portfolio", "nav.partners": "Partenaires", "nav.client": "Espace client", "nav.services": "Boutique / Services",
      "partners.label": "Partenaires", "partners.title": "Ils nous font <span>confiance.</span>", "partners.intro": "Communautés, projets et collaborations avec lesquels Icare Studio travaille.", "partners.empty": "Aucun partenaire publié pour le moment.", "partners.emptySub": "Les prochains partenaires seront présentés ici.", "partners.visit": "Visiter",
      "support.button": "Soutenir Icare Studio 🖤", "support.aria": "Soutenir Icare Studio via OnParticipe", "shop.payment": "Soutenez les projets via la cagnotte officielle OnParticipe.",
      "legal.notice.title": "Mentions légales", "legal.terms.title": "Conditions générales d’utilisation", "legal.sales.title": "Conditions générales de vente", "legal.privacy.title": "Confidentialité & RGPD",
      "footer.rights": "Tous droits réservés.", "footer.legal": "Mentions légales", "footer.terms": "CGU", "footer.sales": "CGV", "footer.privacy": "RGPD", "footer.cookies": "Cookies",
      "legal.notice.body": "Icare Studio offers Roblox and Discord development, coaching and communication strategy services.\n\nContact: Discord @i.lsn1.\n\nHosting: Netlify. Database and authentication: Supabase.",
      "legal.terms.body": "Access to the site is provided for information and may be interrupted for maintenance. Users agree to provide accurate information, respect third-party rights and not misuse forms, chat or services.\n\nContent and work shown remain subject to their authors’ rights. Reuse requires prior authorization when required.",
      "legal.sales.body": "Service pages show indicative offers. Scope, timelines, price and delivery rights are agreed individually in writing before work starts. Project support can be made via the OnParticipe fundraiser (https://www.onparticipe.fr/c/icarestudio). Submitting a request does not trigger any payment.\n\nThe legal 14-day withdrawal right applies where provided by law. For a customized digital service, waiver only applies under the legal conditions of consumer law (e.g. after full performance with required consent).",
      "legal.privacy.body": "Account data (email and display name), support messages and tracking info are processed to provide the client space. They are stored in Supabase and are not sold.\n\nYou may request access, correction or deletion via Discord. Push notifications are only enabled after your permission.",

      "legal.notice.body": "Icare Studio présente des services de développement Roblox et Discord, de coaching et de stratégie de communication.\n\nContact : Discord @i.lsn1.\n\nHébergement : Netlify. Base de données et authentification : Supabase.",
      "legal.terms.body": "L’accès au site est proposé à titre informatif et peut être interrompu pour maintenance. L’utilisateur s’engage à fournir des informations exactes, à respecter les droits des tiers et à ne pas détourner les formulaires, le chat ou les services du site.\n\nLes contenus et réalisations présentés restent soumis aux droits de leurs auteurs. Toute réutilisation nécessite une autorisation préalable lorsqu’elle est requise.",
      "legal.sales.body": "Les pages de services présentent des offres indicatives. Le périmètre, les délais, le prix et les droits de livraison sont convenus individuellement avant tout démarrage, par écrit. Le soutien aux projets peut s’effectuer via la cagnotte OnParticipe (https://www.onparticipe.fr/c/icarestudio). Une demande sur le site ne déclenche aucun paiement.\n\nLe droit de rétractation légal de 14 jours demeure applicable lorsqu’il est prévu par la loi. Pour un service numérique personnalisé, la perte de ce droit ne peut intervenir que dans les conditions de l’article L.221-28 du Code de la consommation.",
      "legal.privacy.body": "Les données de compte (e-mail et nom affiché), messages de support et informations de suivi sont traités pour fournir l’espace client. Elles sont stockées dans Supabase et ne sont pas vendues.\n\nVous pouvez demander l’accès, la rectification ou la suppression de vos données via Discord. Les notifications Push ne sont activées qu’après votre autorisation.",

      "portfolio.label": "Projets sélectionnés", "portfolio.title": "Du concept au <span>projet livré.</span>", "portfolio.intro": "Une sélection de réalisations, leurs choix de conception et les défis relevés.", "portfolio.empty": "Aucun projet publié pour le moment.", "portfolio.emptySub": "Les prochaines réalisations seront présentées ici.",
      "portfolio.filter.all": "Tout", "portfolio.filter.web": "Développement Web/App", "portfolio.filter.gaming": "Roblox & Gaming", "portfolio.filter.graphisme": "Graphisme & Design Visuel",
      "skills.label": "Compétences", "skills.title": "Mes compétences & stack technique", "skills.intro": "Développement web, mobile, gaming, graphisme et accompagnement personnalisé.",
      "client.label": "Votre espace", "client.title": "Un suivi clair, au même endroit.", "client.intro": "Connectez-vous pour retrouver vos demandes, suivre leur avancement et échanger avec Icare en privé.", "client.signin": "Connexion / inscription",
      "notifications.title": "Notifications", "notifications.markRead": "Tout marquer comme lu", "notifications.empty": "Aucune nouvelle notification.", "notifications.enable": "Activer les notifications sur cet appareil",
      "shop.promoLabel": "Code promo", "shop.applyPromo": "Appliquer",
      "shop.paypal": "Soutenez les projets via la cagnotte officielle OnParticipe. Aucun paiement n’est demandé au dépôt d’une demande.",
      "filters.all": "Tout", "filters.coaching": "Coaching", "filters.strategy": "Stratégie", "filters.graphisme": "Graphisme",
      "availability.open": "Ouvert aux commissions", "availability.limited": "Places limitées", "availability.closed": "Complet",
      "hero.eyebrow": "Icare Studio · Indépendant", "hero.title": "Des idées claires.<br><span>Des projets qui vivent.</span>", "hero.lede": "Je transforme vos idées en expériences numériques utiles, élégantes et pensées pour durer.", "hero.cta": "Découvrir les services", "hero.contact": "Parlons de votre projet", "hero.status": "Disponible pour de nouveaux projets",
      "profile.label": "En dehors du code", "profile.loading": "Chargement du statut Discord…", "profile.copy": "Copier @i.lsn1", "profile.badges": "BADGES DISCORD",
      "services.label": "Ce que je fais", "services.title": "Un bon projet commence<br>par une bonne <span>collaboration.</span>", "services.intro": "Du premier échange à la mise en ligne, je vous accompagne avec une approche claire, attentive et orientée résultats.", "services.search": "Rechercher une prestation…", "services.empty": "Le prochain drop arrive bientôt.", "services.emptySub": "De nouvelles idées sont en préparation.", "services.noResults": "Aucun résultat pour cette recherche.", "services.noResultsSub": "Essayez un autre filtre ou un autre mot-clé.",
      "numbers.label": "Du concret, ensemble",
      "faq.label": "Questions fréquentes", "faq.title": "Avant de se lancer.", "faq.q1": "Comment démarrer une collaboration ?", "faq.a1": "Écrivez-moi sur Discord ou créez un compte pour démarrer une conversation privée. Nous clarifierons votre besoin et les prochaines étapes ensemble.", "faq.q2": "Quels sont les délais de réalisation ?", "faq.a2": "Ils dépendent du périmètre et de la disponibilité. Chaque projet reçoit une estimation claire avant son lancement.", "faq.q3": "Proposes-tu du coaching individuel ?", "faq.a3": "Oui, pour le développement, la structuration de projet ou la communication. Le format est adapté à vos objectifs.", "faq.q4": "Comment sont gérées les commandes ?", "faq.a4": "Les demandes sont suivies depuis votre espace client. Les détails et les conditions sont confirmés directement avant tout démarrage.",
      "journal.label": "Journal de bord", "journal.title": "Ce qui se construit.", "journal.review": "Laisser un avis", "journal.loading": "Chargement du journal…",
      "contact.eyebrow": "Tout commence par un message", "contact.title": "Votre prochaine idée<br>mérite de prendre vie.", "contact.cta": "Retrouver Icare sur Discord", "contact.chat": "Écrire un message privé",
      "maintenance.label": "UN INSTANT, S'IL VOUS PLAÎT", "maintenance.title": "On peaufine quelque chose.", "maintenance.message": "Icare Studio revient très bientôt. Merci pour votre patience.", "maintenance.login": "Connexion administrateur",
      "auth.title": "Votre espace client", "auth.description": "Connectez-vous pour suivre vos demandes et échanger en privé.", "auth.email": "Adresse e-mail", "auth.password": "Mot de passe", "auth.name": "Nom affiché", "auth.login": "Se connecter", "auth.signup": "Créer mon compte", "auth.signupPrompt": "Créer un compte", "auth.loginPrompt": "J'ai déjà un compte", "auth.forgot": "Mot de passe oublié ?", "auth.resetDescription": "Choisissez un nouveau mot de passe pour votre compte.", "auth.newPassword": "Nouveau mot de passe", "auth.updatePassword": "Mettre à jour le mot de passe", "auth.chat": "Ouvrir le chat", "auth.admin": "Administration", "auth.logout": "Se déconnecter",
      "chat.title": "Votre conversation", "chat.placeholder": "Écrivez votre message…", "chat.history": "Voir le suivi de ma demande",
      "admin.title": "Console de pilotage", "admin.products": "Boutique", "admin.inbox": "Messages", "admin.updates": "Journal", "admin.settings": "Réglages",
      "review.title": "Un mot sur notre collaboration ?", "review.submit": "Envoyer mon avis",
      "order.terms": "J'accepte les Conditions Générales de Vente (CGV) et je reconnais expressément renoncer à mon droit de rétractation de 14 jours, s'agissant de la fourniture d'un contenu ou service numérique personnalisé immédiatement exécuté.",
      "svc.logo.name": "Création de Logo & Identité Visuelle", "svc.logo.desc": "Logo vectoriel, déclinaisons et base d’identité visuelle pour votre projet.",
      "svc.banner.name": "Bannière Discord / YouTube & Réseaux", "svc.banner.desc": "Bannières sur-mesure pour Discord, YouTube et les réseaux sociaux.",
      "svc.da.name": "Direction Artistique & Charte Graphique complète", "svc.da.desc": "Direction artistique globale, charte graphique et assets 2D cohérents."
    },
    en: {
      "nav.home": "Home", "nav.portfolio": "Portfolio", "nav.partners": "Partners", "nav.client": "Client space", "nav.services": "Shop / Services",
      "partners.label": "Partners", "partners.title": "They trust <span>us.</span>", "partners.intro": "Communities, projects and collaborations Icare Studio works with.", "partners.empty": "No partners published yet.", "partners.emptySub": "Upcoming partners will be featured here.", "partners.visit": "Visit",
      "support.button": "Support Icare Studio 🖤", "support.aria": "Support Icare Studio via OnParticipe", "shop.payment": "Support projects via the official OnParticipe fundraiser.",
      "legal.notice.title": "Legal notice", "legal.terms.title": "Terms of use", "legal.sales.title": "Terms of sale", "legal.privacy.title": "Privacy & GDPR",
      "footer.rights": "All rights reserved.", "footer.legal": "Legal notice", "footer.terms": "Terms", "footer.sales": "Sales terms", "footer.privacy": "Privacy", "footer.cookies": "Cookies",
      "portfolio.label": "Selected projects", "portfolio.title": "From concept to <span>delivery.</span>", "portfolio.intro": "A selection of projects, design choices and challenges solved.", "portfolio.empty": "No published projects yet.", "portfolio.emptySub": "New work will be featured here soon.",
      "portfolio.filter.all": "All", "portfolio.filter.web": "Web / App Development", "portfolio.filter.gaming": "Roblox & Gaming", "portfolio.filter.graphisme": "Graphic & Visual Design",
      "skills.label": "Skills", "skills.title": "Skills & technical stack", "skills.intro": "Web, mobile, gaming, graphic design and tailored support.",
      "client.label": "Your space", "client.title": "A clear project status, all in one place.", "client.intro": "Sign in to find your requests, follow their progress and chat privately with Icare.", "client.signin": "Sign in / create account",
      "notifications.title": "Notifications", "notifications.markRead": "Mark all as read", "notifications.empty": "No new notifications.", "notifications.enable": "Enable notifications on this device",
      "shop.promoLabel": "Promo code", "shop.applyPromo": "Apply",
      "shop.paypal": "Support projects via the official OnParticipe fundraiser. No payment is requested when submitting a request.",
      "filters.all": "All", "filters.coaching": "Coaching", "filters.strategy": "Strategy", "filters.graphisme": "Graphic design",
      "availability.open": "Open for commissions", "availability.limited": "Limited availability", "availability.closed": "Fully booked",
      "hero.eyebrow": "Icare Studio · Independent", "hero.title": "Clear ideas.<br><span>Projects that come to life.</span>", "hero.lede": "I turn your ideas into thoughtful digital experiences, built to be useful, elegant and lasting.", "hero.cta": "Explore services", "hero.contact": "Let's talk about your project", "hero.status": "Available for new projects",
      "profile.label": "Beyond the code", "profile.loading": "Loading Discord status…", "profile.copy": "Copy @i.lsn1", "profile.badges": "DISCORD BADGES",
      "services.label": "What I do", "services.title": "Every great project starts<br>with a great <span>collaboration.</span>", "services.intro": "From our first conversation to launch, I bring a clear, thoughtful and results-focused approach.", "services.search": "Search services…", "services.empty": "The next drop is coming soon.", "services.emptySub": "New ideas are in the works.", "services.noResults": "No results for this search.", "services.noResultsSub": "Try a different filter or keyword.",
      "numbers.label": "Making things happen",
      "faq.label": "Frequently asked", "faq.title": "Before we get started.", "faq.q1": "How do we start working together?", "faq.a1": "Message me on Discord or create an account to start a private conversation. We'll clarify your needs and next steps together.", "faq.q2": "What is the project timeline?", "faq.a2": "It depends on scope and availability. Every project gets a clear estimate before work begins.", "faq.q3": "Do you offer one-to-one coaching?", "faq.a3": "Yes — for development, project structure or communications. Sessions are tailored to your goals.", "faq.q4": "How are orders managed?", "faq.a4": "Track requests from your client space. Details and terms are confirmed directly before work starts.",
      "journal.label": "Field notes", "journal.title": "Things in the making.", "journal.review": "Leave a review", "journal.loading": "Loading journal…",
      "contact.eyebrow": "It all starts with a message", "contact.title": "Your next idea deserves<br>to come to life.", "contact.cta": "Find Icare on Discord", "contact.chat": "Send a private message",
      "maintenance.label": "JUST A MOMENT", "maintenance.title": "We're polishing something.", "maintenance.message": "Icare Studio will be back very soon. Thanks for your patience.", "maintenance.login": "Administrator sign in",
      "auth.title": "Your client space", "auth.description": "Sign in to track requests and chat privately.", "auth.email": "Email address", "auth.password": "Password", "auth.name": "Display name", "auth.login": "Sign in", "auth.signup": "Create my account", "auth.signupPrompt": "Create an account", "auth.loginPrompt": "I already have an account", "auth.forgot": "Forgot your password?", "auth.resetDescription": "Choose a new password for your account.", "auth.newPassword": "New password", "auth.updatePassword": "Update password", "auth.chat": "Open chat", "auth.admin": "Administration", "auth.logout": "Sign out",
      "chat.title": "Your conversation", "chat.placeholder": "Write your message…", "chat.history": "View request status",
      "admin.title": "Studio dashboard", "admin.products": "Shop", "admin.inbox": "Inbox", "admin.updates": "Journal", "admin.settings": "Settings",
      "review.title": "How was our collaboration?", "review.submit": "Submit my review",
      "order.terms": "I accept the Terms of Sale (CGV) and expressly acknowledge that I waive my 14-day right of withdrawal, as this is a customized digital content or service performed immediately.",
      "svc.logo.name": "Logo & Visual Identity", "svc.logo.desc": "Vector logo, variations and a visual identity foundation for your project.",
      "svc.banner.name": "Discord / YouTube & Social Banners", "svc.banner.desc": "Custom banners for Discord, YouTube and social networks.",
      "svc.da.name": "Art Direction & Full Brand Guidelines", "svc.da.desc": "Global art direction, graphic charter and consistent 2D assets."
    },
    es: {
      "nav.home": "Inicio", "nav.portfolio": "Portafolio", "nav.partners": "Partners", "nav.client": "Espacio cliente", "nav.services": "Tienda / Servicios",
      "partners.label": "Partners", "partners.title": "Confían en <span>nosotros.</span>", "partners.intro": "Comunidades y colaboraciones con Icare Studio.", "partners.empty": "Ningún partner publicado.", "partners.emptySub": "Los próximos partners se presentarán aquí.", "partners.visit": "Visitar",
      "support.button": "Apoyar Icare Studio 🖤", "shop.payment": "Apoye los proyectos vía OnParticipe.",
      "footer.rights": "Todos los derechos reservados.", "footer.legal": "Aviso legal", "footer.terms": "CGU", "footer.sales": "CGV", "footer.privacy": "Privacidad", "footer.cookies": "Cookies",
      "portfolio.filter.all": "Todo", "portfolio.filter.web": "Desarrollo Web/App", "portfolio.filter.gaming": "Roblox & Gaming", "portfolio.filter.graphisme": "Gráfico y diseño visual",
      "skills.label": "Competencias", "skills.title": "Competencias y stack técnico", "shop.paypal": "Pago seguro exclusivamente a través de PayPal tras la validación de su solicitud con Icare.",
      "filters.all": "Todo", "filters.coaching": "Coaching", "filters.strategy": "Estrategia", "filters.graphisme": "Gráfico",
      "hero.cta": "Descubrir los servicios", "client.signin": "Iniciar sesión / registrarse",
      "svc.logo.name": "Creación de logo e identidad visual", "svc.banner.name": "Banner Discord / YouTube y redes", "svc.da.name": "Dirección artística y carta gráfica completa",
      "order.terms": "Acepto las Condiciones Generales de Venta (CGV) y reconozco expresamente renunciar a mi derecho de desistimiento de 14 días, al tratarse de un contenido o servicio digital personalizado ejecutado de inmediato."
    },
    de: {
      "nav.home": "Start", "nav.portfolio": "Portfolio", "nav.partners": "Partner", "nav.client": "Kundenbereich", "nav.services": "Shop / Services",
      "partners.label": "Partner", "partners.title": "Sie vertrauen <span>uns.</span>", "partners.intro": "Communities und Kooperationen mit Icare Studio.", "partners.empty": "Noch keine Partner.", "partners.emptySub": "Kommende Partner erscheinen hier.", "partners.visit": "Besuchen",
      "support.button": "Icare Studio unterstützen 🖤", "shop.payment": "Unterstützen Sie Projekte über OnParticipe.",
      "footer.rights": "Alle Rechte vorbehalten.", "footer.legal": "Impressum", "footer.terms": "AGB", "footer.sales": "Verkauf", "footer.privacy": "Datenschutz", "footer.cookies": "Cookies",
      "portfolio.filter.all": "Alle", "portfolio.filter.web": "Web-/App-Entwicklung", "portfolio.filter.gaming": "Roblox & Gaming", "portfolio.filter.graphisme": "Grafik & visuelles Design",
      "skills.label": "Kompetenzen", "shop.paypal": "Sichere Zahlung ausschließlich per PayPal nach Validierung Ihrer Anfrage mit Icare.",
      "filters.all": "Alle", "filters.coaching": "Coaching", "filters.strategy": "Strategie", "filters.graphisme": "Grafik",
      "hero.cta": "Services entdecken", "client.signin": "Anmelden / registrieren",
      "svc.logo.name": "Logo & visuelle Identität", "svc.banner.name": "Discord- / YouTube- & Social-Banner", "svc.da.name": "Art Direction & vollständige Grafik-Charta"
    },
    it: {
      "nav.home": "Home", "nav.portfolio": "Portfolio", "nav.partners": "Partner", "nav.client": "Area cliente", "nav.services": "Shop / Servizi",
      "partners.label": "Partner", "partners.title": "Si fidano di <span>noi.</span>", "partners.intro": "Community e collaborazioni con Icare Studio.", "partners.empty": "Nessun partner pubblicato.", "partners.emptySub": "I prossimi partner appariranno qui.", "partners.visit": "Visita",
      "support.button": "Sostieni Icare Studio 🖤", "shop.payment": "Sostieni i progetti tramite OnParticipe.",
      "footer.rights": "Tutti i diritti riservati.", "footer.legal": "Note legali", "footer.terms": "CGU", "footer.sales": "CGV", "footer.privacy": "Privacy", "footer.cookies": "Cookie",
      "portfolio.filter.all": "Tutto", "portfolio.filter.web": "Sviluppo Web/App", "portfolio.filter.gaming": "Roblox & Gaming", "portfolio.filter.graphisme": "Grafica e design visivo",
      "skills.label": "Competenze", "shop.paypal": "Pagamento sicuro esclusivamente via PayPal dopo la convalida della richiesta con Icare.",
      "filters.all": "Tutto", "filters.coaching": "Coaching", "filters.strategy": "Strategia", "filters.graphisme": "Grafica",
      "hero.cta": "Scopri i servizi", "client.signin": "Accedi / registrati",
      "svc.logo.name": "Logo e identità visiva", "svc.banner.name": "Banner Discord / YouTube e social", "svc.da.name": "Direzione artistica e carta grafica completa"
    },
    ja: {
      "nav.home": "ホーム", "nav.portfolio": "ポートフォリオ", "nav.partners": "パートナー", "nav.client": "クライアントスペース", "nav.services": "ショップ / サービス",
      "partners.label": "パートナー", "partners.title": "信頼してくださる<span>方々。</span>", "partners.intro": "Icare Studio が関わるコミュニティ・プロジェクト。", "partners.empty": "公開中のパートナーはまだありません。", "partners.emptySub": "今後のパートナーはこちらに。", "partners.visit": "訪問",
      "support.button": "Icare Studio を支援 🖤", "shop.payment": "OnParticipe でプロジェクトを支援。",
      "footer.rights": "全著作権所有。", "footer.legal": "法的情報", "footer.terms": "利用規約", "footer.sales": "販売条件", "footer.privacy": "プライバシー", "footer.cookies": "Cookie",
      "portfolio.filter.all": "すべて", "portfolio.filter.web": "Web/アプリ開発", "portfolio.filter.gaming": "Roblox & ゲーム", "portfolio.filter.graphisme": "グラフィック＆ビジュアルデザイン",
      "skills.label": "スキル", "shop.paypal": "Icareによるリクエスト承認後、PayPalのみで安全にお支払いください。",
      "filters.all": "すべて", "filters.coaching": "コーチング", "filters.strategy": "戦略", "filters.graphisme": "グラフィック",
      "hero.cta": "サービスを見る", "client.signin": "ログイン / 登録",
      "svc.logo.name": "ロゴ＆ビジュアルアイデンティティ", "svc.banner.name": "Discord / YouTube・SNSバナー", "svc.da.name": "アートディレクション＆グラフィックガイドライン"
    },
    zh: {
      "nav.home": "首页", "nav.portfolio": "作品集", "nav.partners": "合作伙伴", "nav.client": "客户空间", "nav.services": "商店 / 服务",
      "partners.label": "合作伙伴", "partners.title": "他们信任<span>我们。</span>", "partners.intro": "与 Icare Studio 合作的社区与项目。", "partners.empty": "暂无已发布的合作伙伴。", "partners.emptySub": "即将上线的合作伙伴将展示在此。", "partners.visit": "访问",
      "support.button": "支持 Icare Studio 🖤", "shop.payment": "通过 OnParticipe 支持项目。",
      "footer.rights": "保留所有权利。", "footer.legal": "法律声明", "footer.terms": "使用条款", "footer.sales": "销售条款", "footer.privacy": "隐私", "footer.cookies": "Cookie",
      "portfolio.filter.all": "全部", "portfolio.filter.web": "网页/应用开发", "portfolio.filter.gaming": "Roblox 与游戏", "portfolio.filter.graphisme": "平面与视觉设计",
      "skills.label": "技能", "shop.paypal": "在 Icare 确认您的需求后，仅通过 PayPal 安全付款。",
      "filters.all": "全部", "filters.coaching": "辅导", "filters.strategy": "策略", "filters.graphisme": "平面设计",
      "hero.cta": "了解服务", "client.signin": "登录 / 注册",
      "svc.logo.name": "标志与视觉识别", "svc.banner.name": "Discord / YouTube 与社交横幅", "svc.da.name": "艺术指导与完整视觉规范"
    }
  };

  function currentLanguage() {
    return document.documentElement.lang || "fr";
  }

  function t(key) {
    const lang = currentLanguage();
    return dictionaries[lang]?.[key] || dictionaries.fr[key] || dictionaries.en[key] || key;
  }

  function applyTranslations(lang) {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const translated = dictionaries[lang]?.[element.dataset.i18n] ?? dictionaries.fr[element.dataset.i18n];
      if (translated !== undefined) element.innerHTML = translated;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const translated = dictionaries[lang]?.[element.dataset.i18nPlaceholder] ?? dictionaries.fr[element.dataset.i18nPlaceholder];
      if (translated !== undefined) element.placeholder = translated;
    });
  }

  function renderLanguageSwitcher(lang) {
    const root = document.getElementById("language-switcher");
    if (!root) return;
    const selected = languages.find((item) => item.code === lang) || languages[0];
    const toggle = document.getElementById("language-toggle");
    const menu = document.getElementById("language-menu");
    if (!toggle || !menu) return;
    toggle.innerHTML = `<img class="language-flag" src="${selected.flag}" alt="" width="24" height="24" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling){this.nextElementSibling.hidden=false;this.nextElementSibling.style.display='inline'}"><span class="language-emoji" hidden>${selected.emoji||""}</span><span class="language-code">${selected.code.toUpperCase()}</span>`;
    toggle.setAttribute("aria-label", selected.label);
    menu.replaceChildren(...languages.map((item) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = `language-option${item.code === lang ? " active" : ""}`;
      option.dataset.lang = item.code;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(item.code === lang));
      option.innerHTML = `<img class="language-flag" src="${item.flag}" alt="" width="24" height="24" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling){this.nextElementSibling.hidden=false;this.nextElementSibling.style.display='inline'}"><span class="language-emoji" hidden>${item.emoji||""}</span><span class="language-label">${item.label}</span><small class="language-code-badge">${item.code.toUpperCase()}</small>`;
      option.addEventListener("click", () => {
        setLanguage(item.code);
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      });
      return option;
    }));
  }

  function detectLanguage() {
    const saved = localStorage.getItem("icare-language");
    if (dictionaries[saved]) return saved;
    const nav = (navigator.language || "fr").toLowerCase();
    if (nav.startsWith("fr")) return "fr";
    if (nav.startsWith("es")) return "es";
    if (nav.startsWith("de")) return "de";
    if (nav.startsWith("it")) return "it";
    if (nav.startsWith("ja")) return "ja";
    if (nav.startsWith("zh")) return "zh";
    if (nav.startsWith("en")) return "en";
    return "fr";
  }

  function setLanguage(language) {
    const lang = dictionaries[language] ? language : "fr";
    document.documentElement.lang = lang;
    localStorage.setItem("icare-language", lang);
    applyTranslations(lang);
    renderLanguageSwitcher(lang);
    const selector = document.getElementById("language-select");
    if (selector) selector.value = lang;
    document.dispatchEvent(new CustomEvent("icare:languagechange", { detail: { language: lang } }));
    return lang;
  }

  function setupLanguageSwitcher() {
    const toggle = document.getElementById("language-toggle");
    const menu = document.getElementById("language-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("#language-switcher")) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  window.IcareI18n = {
    setLanguage,
    t,
    languages,
    hourlySuffix: () => hourlySuffix[currentLanguage()] || hourlySuffix.fr,
    currentLanguage,
    applyCustomFlags(flags) {
      if (!flags || typeof flags !== "object") return;
      languages.forEach((item) => { if (flags[item.code]) item.flag = flags[item.code]; });
      renderLanguageSwitcher(currentLanguage());
    }
  };
  setupLanguageSwitcher();
  setLanguage(detectLanguage());
})();
