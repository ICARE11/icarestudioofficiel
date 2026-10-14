// Supabase Edge Function: send-push
// Deploy: supabase functions deploy send-push --no-verify-jwt  (or protect with service role)
// Secrets required:
//   supabase secrets set VAPID_PUBLIC_KEY="BOx4HmJmw39v03_r_TbOA6OwSg-LIMmYjq1jYyKNGHgmCN4g4Z6q03Rmg7XOfJxJqSX140NRKJpJ-rf-2WX2IVs"
//   supabase secrets set VAPID_PRIVATE_KEY="Q2q4FtFrPRAL4XqJudxSQt8kEJFoqJsmMG4HZ6UtOlY"
//   supabase secrets set VAPID_SUBJECT="mailto:icare.loison@gmail.com"
//
// Body JSON:
// {
//   "user_id": "<uuid of recipient>",          // optional if subscriptions[] provided
//   "subscriptions": [ { endpoint, keys: { p256dh, auth } } ], // optional override
//   "title": "Icare Studio",
//   "body": "Nouveau message…",
//   "url": "/#client",
//   "icon": "./icon.svg"
// }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PushSub = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  subscription?: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  };
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:icare.loison@gmail.com";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!vapidPublic || !vapidPrivate) {
    return json(500, { error: "VAPID keys are not configured as Edge Function secrets." });
  }
  if (!supabaseUrl || !serviceRole) {
    return json(500, { error: "Supabase service role environment is missing." });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let payload: {
    user_id?: string;
    subscriptions?: PushSub[];
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const title = payload.title?.trim() || "Icare Studio";
  const body = payload.body?.trim() || "Vous avez reçu une nouvelle notification.";
  const url = payload.url || "./";
  const icon = payload.icon || "./icon.svg";

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Auth: only service role key or an admin JWT may call this function.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token && token !== serviceRole) {
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return json(401, { error: "Unauthorized." });
    }
    const role = (userData.user.app_metadata as { role?: string } | undefined)?.role;
    if (role !== "admin") {
      return json(403, { error: "Admin role required." });
    }
  } else if (!token) {
    return json(401, { error: "Missing Authorization header." });
  }

  let targets: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }> = [];

  if (Array.isArray(payload.subscriptions) && payload.subscriptions.length) {
    for (const raw of payload.subscriptions) {
      const sub = raw.subscription ?? raw;
      const endpoint = sub.endpoint;
      const p256dh = sub.keys?.p256dh;
      const auth = sub.keys?.auth;
      if (endpoint && p256dh && auth) {
        targets.push({ endpoint, keys: { p256dh, auth } });
      }
    }
  } else if (payload.user_id) {
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("endpoint, subscription")
      .eq("user_id", payload.user_id);
    if (error) {
      return json(500, { error: error.message });
    }
    for (const row of data ?? []) {
      const sub = (row.subscription ?? {}) as PushSub;
      const endpoint = sub.endpoint || row.endpoint;
      const p256dh = sub.keys?.p256dh;
      const auth = sub.keys?.auth;
      if (endpoint && p256dh && auth) {
        targets.push({ endpoint, keys: { p256dh, auth } });
      }
    }
  } else {
    return json(400, { error: "Provide user_id or subscriptions[]." });
  }

  if (!targets.length) {
    return json(200, { sent: 0, failed: 0, message: "No push subscriptions found." });
  }

  const notificationPayload = JSON.stringify({
    title,
    body,
    icon,
    url,
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  await Promise.all(
    targets.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload, {
          TTL: 60 * 60 * 12,
          urgency: "normal",
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number })?.statusCode;
        // Gone / Not Found → drop subscription
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(subscription.endpoint);
        } else {
          console.error("web-push error", statusCode, error);
        }
      }
    }),
  );

  if (staleEndpoints.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return json(200, { sent, failed, cleaned: staleEndpoints.length });
});
