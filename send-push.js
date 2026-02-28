#!/usr/bin/env node
/**
 * send-push.js — Send a Web Push notification to Lucid
 *
 * Usage (manual test):
 *   PUSH_SUBSCRIPTION='<paste JSON from localStorage.getItem("lucid_push_sub")>' node send-push.js
 *
 * Or save subscription to push-subscription.json and run:
 *   node send-push.js
 *
 * GitHub Actions sets PUSH_SUBSCRIPTION, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY as secrets.
 */

const webpush = require('web-push');
const fs = require('fs');

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || 'BNyscrRl_Zvn6NOpLcOZcwXz0RW5YC3JtT5fbuAAib1L16MejNHgoKi9FnWJL1KKN1PxbnggT2EFF8sl5A182C4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'NUkiK87tkUZHyGmnZWm4CrA68dQYyOrf0n2_OE7PWD4';

webpush.setVapidDetails('mailto:kbgnote3@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Load subscription: env var → local file → error
let subscription;
if (process.env.PUSH_SUBSCRIPTION) {
  const raw = process.env.PUSH_SUBSCRIPTION.trim();
  console.log('Subscription length:', raw.length);
  console.log('First 3 chars:', JSON.stringify(raw.slice(0, 3)));
  console.log('Last 3 chars:', JSON.stringify(raw.slice(-3)));
  subscription = JSON.parse(raw);
} else if (fs.existsSync('./push-subscription.json')) {
  subscription = JSON.parse(fs.readFileSync('./push-subscription.json', 'utf8'));
} else {
  console.error('No subscription found. Set PUSH_SUBSCRIPTION env var or create push-subscription.json');
  process.exit(1);
}

const payload = JSON.stringify({
  title: 'Lucid · Check In 💙',
  body: process.env.PUSH_BODY || 'Take a moment — how are you feeling right now?'
});

webpush.sendNotification(subscription, payload)
  .then(() => console.log('✅ Push sent successfully'))
  .catch(err => {
    console.error('❌ Push failed:', err.statusCode, err.body);
    process.exit(1);
  });
