(() => {
  // Add the public project URL and anon key here before deploying. Never put a service-role key in browser code.
  const config = {
    url: "https://pyfrhdeqkgcqzbnrhzmb.supabase.co",
    anonKey: "sb_publishable_kWMWNNBhoIhVrtwHQaA7mw_WU1OY4qN"
  };
  const configured = !config.url.includes("YOUR_PROJECT_ID") && !config.anonKey.includes("YOUR_SUPABASE_ANON_KEY");
  const sdkAvailable = typeof window.supabase?.createClient === "function";
  const client = configured && sdkAvailable
    ? window.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        realtime: { params: { eventsPerSecond: 5 } }
      })
    : null;

  async function requireClient() {
    if (!client) throw new Error("Supabase n'est pas configuré. Renseignez l'URL du projet et la clé anon dans supabase.js.");
    return client;
  }

  async function invoke(operation) {
    const supabase = await requireClient();
    const { data, error } = await operation(supabase);
    if (error) throw error;
    return data;
  }

  async function getSession() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getProducts(includeDrafts = false) {
    return invoke((db) => {
      let query = db.from("products").select("*").order("created_at", { ascending: false });
      if (!includeDrafts) query = query.eq("active", true);
      return query;
    });
  }

  async function getSettings() {
    const rows = await invoke((db) => db.from("site_settings").select("*").eq("id", 1).limit(1));
    return rows[0] || null;
  }

  async function getChangelog() {
    return invoke((db) => db.from("changelog").select("*").order("created_at", { ascending: false }).limit(10));
  }

  async function getSiteStats() {
    return invoke((db) => db.from("site_stats").select("*").order("sort_order", { ascending: true }));
  }

  async function saveSiteStat(stat, originalKey = "") {
    return invoke((db) => originalKey && originalKey !== stat.key
      ? db.from("site_stats").update(stat).eq("key", originalKey).select().single()
      : db.from("site_stats").upsert(stat, { onConflict: "key" }).select().single());
  }

  async function deleteSiteStat(key) {
    return invoke((db) => db.from("site_stats").delete().eq("key", key));
  }

  async function getPortfolioProjects(includeDrafts = false) {
    return invoke((db) => {
      let query = db.from("portfolio_projects").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (!includeDrafts) query = query.eq("active", true);
      return query;
    });
  }
  async function getPartners(includeDrafts = false) {
    return invoke((db) => {
      let query = db.from("partners").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (!includeDrafts) query = query.eq("active", true);
      return query;
    });
  }
  async function savePartner(partner) {
    const values = { ...partner, updated_at: new Date().toISOString() };
    if (values.links && !Array.isArray(values.links)) values.links = [];
    return invoke((db) => partner.id
      ? db.from("partners").update(values).eq("id", partner.id).select().single()
      : db.from("partners").insert(values).select().single());
  }
  async function deletePartner(id) {
    return invoke((db) => db.from("partners").delete().eq("id", id));
  }

  async function savePortfolioProject(project) {
    const values = { ...project, updated_at: new Date().toISOString() };
    for (const field of ["demo_url", "source_url"]) {
      if (!values[field]) continue;
      let url;
      try {
        url = new URL(values[field]);
      } catch {
        throw new Error(`Le lien « ${field === "demo_url" ? "démo" : "code source"} » doit être une URL HTTP(S) valide.`);
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error(`Le lien « ${field === "demo_url" ? "démo" : "code source"} » doit être une URL HTTP(S) valide.`);
      }
      values[field] = url.href;
    }
    return invoke((db) => project.id
      ? db.from("portfolio_projects").update(values).eq("id", project.id).select().single()
      : db.from("portfolio_projects").insert(values).select().single());
  }

  async function deletePortfolioProject(id) {
    return invoke((db) => db.from("portfolio_projects").delete().eq("id", id));
  }

  async function getPromoCodes(includeInactive = false) {
    return invoke((db) => {
      let query = db.from("promo_codes").select("*").order("created_at", { ascending: false });
      if (!includeInactive) query = query.eq("active", true);
      return query;
    });
  }

  async function savePromoCode(promo) {
    return invoke((db) => db.from("promo_codes").upsert(promo, { onConflict: "code" }).select().single());
  }

  async function deletePromoCode(code) {
    return invoke((db) => db.from("promo_codes").delete().eq("code", code));
  }

  async function validatePromoCode(code) {
    const matches = await invoke((db) => db.from("promo_codes").select("code,discount_percent,expires_at")
      .eq("code", code.toUpperCase()).eq("active", true).limit(1));
    const promo = matches[0];
    if (!promo || (promo.expires_at && new Date(promo.expires_at).getTime() <= Date.now())) return null;
    return promo;
  }

  async function signIn(email, password) {
    const supabase = await requireClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim(),
      password
    });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, displayName) {
    return invoke((db) => db.auth.signUp({
      email, password,
      options: { data: { display_name: displayName } }
    }));
  }

  async function signOut() {
    return invoke((db) => db.auth.signOut());
  }

  async function sendPasswordReset(email, redirectTo) {
    return invoke((db) => db.auth.resetPasswordForEmail(email, { redirectTo }));
  }

  async function updatePassword(password) {
    return invoke((db) => db.auth.updateUser({ password }));
  }

  async function getOrCreateConversation(userId) {
    const existing = await invoke((db) => db.from("conversations").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1));
    if (existing.length) return existing[0];
    const created = await invoke((db) => db.from("conversations").insert({ user_id: userId }).select().single());
    return created;
  }

  async function createConversation(userId, subject = "other", order = null) {
    const values = { user_id: userId, subject, order_status: "requested" };
    if (order) {
      values.order_consent_product = order.productName || null;
      values.order_details = order.details || null;
      values.order_terms_accepted_at = order.termsAcceptedAt || null;
      values.order_start_early_at = order.startEarlyAt || null;
      values.order_consent_at = order.startEarlyAt || null;
      values.order_price = order.price || null;
      values.order_eta = order.eta || null;
    }
    return invoke((db) => db.from("conversations").insert(values).select().single());
  }

  async function getUserConversations(userId) {
    return invoke((db) => db.from("conversations").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50));
  }

  async function getUnreadMessages(userId, admin = false) {
    const conversations = admin ? await getConversations() : await getUserConversations(userId);
    const ids = conversations.map((conversation) => conversation.id);
    if (!ids.length) return [];
    return invoke((db) => db.from("messages").select("id,conversation_id,sender_id,content,created_at")
      .in("conversation_id", ids).is("read_at", null).neq("sender_id", userId).order("created_at", { ascending: false }).limit(50));
  }

  async function markMessagesRead(ids) {
    if (!ids.length) return [];
    return invoke((db) => db.from("messages").update({ read_at: new Date().toISOString() }).in("id", ids).select("id"));
  }

  async function getMessages(conversationId) {
    return invoke((db) => db.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(200));
  }

  async function getConversationMessages(conversationIds) {
    if (!conversationIds.length) return [];
    const messages = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await invoke((db) => db.from("messages").select("id,conversation_id,content,created_at,sender_id,read_at")
        .in("conversation_id", conversationIds).order("created_at", { ascending: false }).range(offset, offset + 999));
      messages.push(...page);
      if (page.length < 1000) return messages;
    }
  }

  async function sendMessage(conversationId, content) {
    return invoke((db) => db.from("messages").insert({ conversation_id: conversationId, content }).select().single());
  }

  async function getConversations() {
    return invoke((db) => db.from("conversations").select("*,profiles(display_name,email)").order("updated_at", { ascending: false }).limit(200));
  }

  async function updateConversation(conversationId, values) {
    return invoke((db) => db.from("conversations").update({ ...values, updated_at: new Date().toISOString() }).eq("id", conversationId).select().single());
  }

  async function deleteConversation(conversationId) {
    return invoke((db) => db.from("conversations").delete().eq("id", conversationId));
  }

  async function saveProduct(product) {
    return invoke((db) => product.id
      ? db.from("products").update(product).eq("id", product.id).select().single()
      : db.from("products").insert(product).select().single());
  }

  async function deleteProduct(id) {
    return invoke((db) => db.from("products").delete().eq("id", id));
  }

  async function saveSettings(settings) {
    return invoke((db) => db.from("site_settings").upsert({ id: 1, ...settings }).select().single());
  }

  async function uploadPublicImage(file, bucket, ownerId) {
    if (!client) throw new Error("Supabase n'est pas configuré.");
    if (!(file instanceof File) || !file.type.startsWith("image/")) throw new Error("Sélectionnez un fichier image valide.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Chaque image doit faire 8 Mo maximum.");
    if (!["banners", "products", "portfolio", "partners", "flags"].includes(bucket)) throw new Error("Destination Storage invalide.");
    if (!ownerId) throw new Error("Utilisateur Storage non identifié.");
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!authData.user || authData.user.id !== ownerId || authData.user.app_metadata?.role !== "admin") {
      throw new Error("Seul un administrateur peut envoyer les images du site.");
    }
    const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
    const extension = extensions[file.type];
    if (!extension) throw new Error("Format non pris en charge. Utilisez JPG, PNG, WebP, GIF ou AVIF.");
    const path = `${ownerId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Supabase n’a pas retourné d’URL publique pour l’image.");
    return data.publicUrl;
  }

  async function savePushSubscription(userId, subscription) {
    if (!client) throw new Error("Supabase n’est pas configuré.");
    if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      throw new Error("L’abonnement Push reçu est incomplet.");
    }
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!authData.user || authData.user.id !== userId) {
      throw new Error("Connectez-vous au compte associé aux notifications.");
    }
    return invoke((db) => db.from("push_subscriptions").upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      subscription
    }, { onConflict: "endpoint" }).select("id,endpoint").single());
  }

  async function requestAccountDeletion(userId) {
    const db = await requireClient();
    const { data: pending, error } = await db.from("account_deletion_requests")
      .select("id,created_at").eq("user_id", userId).eq("status", "pending").order("created_at", { ascending: false }).limit(1);
    if (error) throw error;
    if (pending.length) return pending[0];
    return invoke((db) => db.from("account_deletion_requests")
      .insert({ user_id: userId }).select("id,created_at").single());
  }

  async function getAccountDeletionRequests() {
    const requests = await invoke((db) => db.from("account_deletion_requests")
      .select("id,user_id,status,created_at,resolved_at").order("created_at", { ascending: false }).limit(200));
    const ids = [...new Set(requests.map((request) => request.user_id))];
    if (!ids.length) return requests;
    const profiles = await invoke((db) => db.from("profiles").select("id,display_name,email").in("id", ids));
    const byUserId = new Map(profiles.map((profile) => [profile.id, profile]));
    return requests.map((request) => ({ ...request, profile: byUserId.get(request.user_id) || null }));
  }

  async function setAccountDeletionRequestStatus(id, status) {
    if (!["pending", "completed", "rejected"].includes(status)) throw new Error("Statut de demande invalide.");
    return invoke((db) => db.from("account_deletion_requests")
      .update({ status, resolved_at: status === "pending" ? null : new Date().toISOString() })
      .eq("id", id).select().single());
  }

  async function getGdprRequests() {
    try {
      return await invoke((db) => db.from("gdpr_requests").select("*").order("created_at", { ascending: false }).limit(200));
    } catch {
      return getAccountDeletionRequests();
    }
  }

  async function deleteGdprRequest(requestId) {
    const supabase = await requireClient();
    const { error } = await supabase.from("gdpr_requests").delete().eq("id", requestId);
    if (!error) return true;
    return invoke((db) => db.from("account_deletion_requests").delete().eq("id", requestId));
  }

  async function publishChangelog(title, body) {
    return invoke((db) => db.from("changelog").insert({ title, body }).select().single());
  }

  async function submitReview(rating, body) {
    return invoke((db) => db.from("reviews").insert({ rating, body }).select().single());
  }

  function subscribeToMessages(conversationId, onMessage, onError) {
    if (!client) return () => {};
    let errorReported = false;
    const channel = client.channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, ({ new: message }) => onMessage(message))
      .subscribe((status) => {
        if (!errorReported && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          errorReported = true;
          onError(new Error(`Realtime status: ${status}`));
        }
      });
    return () => client.removeChannel(channel);
  }

  function subscribeToConversations(onChange, onError) {
    if (!client) return () => {};
    let errorReported = false;
    const channel = client.channel("admin-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, onChange)
      .subscribe((status) => {
        if (!errorReported && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          errorReported = true;
          onError(new Error(`Realtime status: ${status}`));
        }
      });
    return () => client.removeChannel(channel);
  }

  function subscribeToMessagesFeed(onMessage, onError) {
    if (!client) return () => {};
    let errorReported = false;
    const channel = client.channel("notification-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ({ new: message }) => onMessage(message))
      .subscribe((status) => {
        if (!errorReported && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          errorReported = true;
          onError(new Error(`Realtime status: ${status}`));
        }
      });
    return () => client.removeChannel(channel);
  }

  function subscribeToChangelog(onChange, onError) {
    if (!client) return () => {};
    let errorReported = false;
    const channel = client.channel("notification-changelog")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "changelog" }, onChange)
      .subscribe((status) => {
        if (!errorReported && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          errorReported = true;
          onError(new Error(`Realtime status: ${status}`));
        }
      });
    return () => client.removeChannel(channel);
  }


  async function sendPushNotification({ userId, title, body, url = "./", icon = "./icon.svg" }) {
    const supabase = await requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error("Session requise pour envoyer une notification push.");
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        user_id: userId,
        title,
        body,
        url,
        icon
      }
    });
    if (error) throw error;
    return data;
  }

  window.IcareSupabase = {
    configured, client, getSession, getProducts, getSettings, getChangelog, getSiteStats, saveSiteStat, deleteSiteStat,
    getPortfolioProjects, savePortfolioProject, deletePortfolioProject,
    getPartners, savePartner, deletePartner,
    getPromoCodes, savePromoCode, deletePromoCode, validatePromoCode,
    signIn, signUp, signOut, sendPasswordReset, updatePassword, getOrCreateConversation, createConversation, getUserConversations, getUnreadMessages, markMessagesRead, getMessages, getConversationMessages, sendMessage,
    getConversations, updateConversation, deleteConversation, saveProduct, deleteProduct, saveSettings,
    publishChangelog, submitReview, uploadPublicImage, savePushSubscription, requestAccountDeletion, getAccountDeletionRequests,
    setAccountDeletionRequestStatus, getGdprRequests, deleteGdprRequest, subscribeToMessages, subscribeToConversations,
    subscribeToMessagesFeed, subscribeToChangelog, sendPushNotification
  };
})();
