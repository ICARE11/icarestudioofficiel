# Web Push natif (VAPID) — Icare Studio

## 1. Clés VAPID (production)

- Subject : `mailto:icare.loison@gmail.com`
- Public  : `BOx4HmJmw39v03_r_TbOA6OwSg-LIMmYjq1jYyKNGHgmCN4g4Z6q03Rmg7XOfJxJqSX140NRKJpJ-rf-2WX2IVs`
- Private : `Q2q4FtFrPRAL4XqJudxSQt8kEJFoqJsmMG4HZ6UtOlY`

La clé **publique** est dans `app.js` (`VapidConfig.publicKey`).  
La clé **privée** ne doit **jamais** être dans le frontend : uniquement en secret Edge Function.

## 2. Table Supabase

Déjà définie dans `schema.sql` :

```sql
public.push_subscriptions (
  id uuid PK,
  user_id uuid → auth.users,
  endpoint text UNIQUE,
  subscription jsonb,  -- objet PushSubscription JSON
  created_at timestamptz
)
```

RLS : chaque utilisateur gère ses abonnements ; les admins peuvent lire.

## 3. Déploiement de l’Edge Function

```bash
# Depuis le dossier du projet Supabase
supabase functions deploy send-push

supabase secrets set VAPID_PUBLIC_KEY="BOx4HmJmw39v03_r_TbOA6OwSg-LIMmYjq1jYyKNGHgmCN4g4Z6q03Rmg7XOfJxJqSX140NRKJpJ-rf-2WX2IVs"
supabase secrets set VAPID_PRIVATE_KEY="Q2q4FtFrPRAL4XqJudxSQt8kEJFoqJsmMG4HZ6UtOlY"
supabase secrets set VAPID_SUBJECT="mailto:icare.loison@gmail.com"
```

Fichier source : `supabase/functions/send-push/index.ts`

## 4. Flux client

1. L’utilisateur se connecte.
2. Clic sur **Activer les notifications** (dialog chat) ou acceptation du bandeau cookies.
3. `Notification.requestPermission()` → `pushManager.subscribe({ userVisibleOnly, applicationServerKey })`.
4. `IcareSupabase.savePushSubscription(userId, subscription.toJSON())` stocke l’abonnement.

## 5. Envoi

- Depuis l’admin, chaque réponse / réponse rapide appelle `sendPushNotification` (Edge Function `send-push`).
- Payload attendu par le service worker :

```json
{
  "title": "Icare Studio",
  "body": "Nouveau message : …",
  "icon": "./icon.svg",
  "url": "/#client"
}
```

## 6. Service Worker

`service-worker.js` gère :

- `push` → `showNotification`
- `notificationclick` → focus / ouverture de l’onglet du site

Cache version : `icare-studio-v11` (force refresh des clients).

## 7. Mobile

- CSS `< 760px` : menu notifications en carte fixe `top: 80px; left/right: 16px; background: #121318`.
- iOS : les notifications push fiables nécessitent l’ajout à l’écran d’accueil (PWA standalone).

## 8. Test rapide

1. HTTPS (ou localhost).
2. Connexion client → Activer les notifications → autoriser.
3. Vérifier une ligne dans `push_subscriptions`.
4. Depuis un compte admin, répondre dans la messagerie → notification système sur l’appareil du client.
