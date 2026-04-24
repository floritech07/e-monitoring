'use strict';
/**
 * Service de notifications multi-canal
 * Email (nodemailer) · SMS Africa's Talking · Telegram · Son local
 */

const EventEmitter = require('events');

// ── Canal Email (nodemailer) ──────────────────────────────────────────────────

async function sendEmail({ to, subject, html, text }) {
  try {
    const nodemailer = require('nodemailer');
    if (!process.env.SMTP_HOST) return { ok: false, reason: 'SMTP non configuré' };

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth:   process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    await transporter.sendMail({
      from:    process.env.SMTP_FROM || 'nexusmonitor@sbee.bj',
      to:      Array.isArray(to) ? to.join(',') : to,
      subject, html: html || text,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Canal SMS — Africa's Talking (MTN/Moov Bénin) ────────────────────────────

async function sendSMS({ to, message }) {
  try {
    const apiKey  = process.env.AT_API_KEY;
    const user    = process.env.AT_USERNAME;
    const sender  = process.env.AT_SENDER_ID || 'NexusMon';
    if (!apiKey || !user) return { ok: false, reason: "Africa's Talking non configuré (AT_API_KEY, AT_USERNAME)" };

    const https   = require('https');
    const qs      = require('querystring');
    const body    = qs.stringify({ username: user, to: Array.isArray(to) ? to.join(',') : to, message, from: sender });
    const isSandbox = process.env.AT_ENV === 'sandbox';
    const host    = isSandbox ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';

    return new Promise((resolve) => {
      const req = https.request({
        hostname: host,
        path:     '/version1/messaging',
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'apiKey': apiKey },
      }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const recipients = json.SMSMessageData?.Recipients || [];
            const allOk = recipients.every(r => r.status === 'Success' || r.statusCode === 101);
            resolve({ ok: allOk, recipients, raw: json });
          } catch (_) {
            resolve({ ok: false, reason: data });
          }
        });
      });
      req.on('error', (e) => resolve({ ok: false, reason: e.message }));
      req.write(body);
      req.end();
    });
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Canal Telegram ────────────────────────────────────────────────────────────

async function sendTelegram({ chatId, message, parseMode = 'HTML' }) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { ok: false, reason: 'TELEGRAM_BOT_TOKEN non configuré' };

    const https    = require('https');
    const resolvedChatId = chatId || process.env.TELEGRAM_CHAT_ID;
    if (!resolvedChatId) return { ok: false, reason: 'TELEGRAM_CHAT_ID non configuré' };

    const body = JSON.stringify({ chat_id: resolvedChatId, text: message, parse_mode: parseMode, disable_web_page_preview: true });

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.telegram.org',
        path:     `/bot${token}/sendMessage`,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json' },
      }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (_) { resolve({ ok: false, reason: data }); }
        });
      });
      req.on('error', (e) => resolve({ ok: false, reason: e.message }));
      req.write(body);
      req.end();
    });
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Canal WhatsApp (Twilio WhatsApp Business) ─────────────────────────────────

async function sendWhatsApp({ to, message }) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const from       = process.env.TWILIO_WA_FROM || 'whatsapp:+14155238886';
    if (!accountSid || !authToken) return { ok: false, reason: 'Twilio non configuré' };

    const https = require('https');
    const qs    = require('querystring');
    const body  = qs.stringify({ From: from, To: `whatsapp:${to}`, Body: message });
    const auth  = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.twilio.com',
        path:     `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${auth}` },
      }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try { const j = JSON.parse(data); resolve({ ok: !j.error_code, ...j }); }
          catch (_) { resolve({ ok: false, reason: data }); }
        });
      });
      req.end();
    });
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Canal Appel Vocal (TTS) — Africa's Talking ────────────────────────────────

async function sendVoiceCall({ to }) {
  try {
    const apiKey  = process.env.AT_API_KEY;
    const user    = process.env.AT_USERNAME;
    const from    = process.env.AT_VOICE_PHONE; // Doit être un numéro virtuel AT
    if (!apiKey || !user || !from) return { ok: false, reason: "Africa's Talking Voice non configuré (AT_VOICE_PHONE manquant)" };

    const https = require('https');
    const qs    = require('querystring');
    const body  = qs.stringify({ username: user, to: Array.isArray(to) ? to.join(',') : to, from });
    const isSandbox = process.env.AT_ENV === 'sandbox';
    const host  = isSandbox ? 'voice.sandbox.africastalking.com' : 'voice.africastalking.com';

    return new Promise((resolve) => {
      const req = https.request({
        hostname: host,
        path:     '/call',
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'apiKey': apiKey },
      }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ ok: !json.errorMessage, raw: json });
          } catch (_) {
            resolve({ ok: false, reason: data });
          }
        });
      });
      req.on('error', (e) => resolve({ ok: false, reason: e.message }));
      req.write(body);
      req.end();
    });
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Formatage des messages d'alerte ──────────────────────────────────────────

const SEV_EMOJI = { DISASTER: '🔴', CRITICAL: '🟠', WARNING: '🟡', INFO: 'ℹ️' };

function formatAlertMessage(alert, format = 'text') {
  const emoji   = SEV_EMOJI[alert.level] || '❓';
  const ts      = new Date(alert.timestamp || Date.now()).toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' });
  const sev     = alert.level || alert.severity || 'INFO';
  const source  = alert.sourceId || alert.source || 'inconnu';
  const message = alert.message || alert.description || '';

  if (format === 'html') {
    return `<b>${emoji} [${sev}] NexusMonitor SBEE</b>\n<b>Source :</b> ${source}\n<b>Alerte :</b> ${message}\n<b>Horodatage :</b> ${ts} WAT\n<i>ID : ${alert.key || alert.id || '-'}</i>`;
  }
  if (format === 'sms') {
    return `[NexusMon-${sev}] ${source}: ${message.slice(0, 120)} — ${ts}`;
  }
  return `${emoji} [${sev}] ${source}\n${message}\n${ts} WAT`;
}

// ── Historique des notifications ──────────────────────────────────────────────

const _history = [];
const HIST_MAX = 500;

function _log(channel, alert, result) {
  _history.unshift({
    id:        `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    channel,
    alertLevel: alert.level || alert.severity,
    source:    alert.sourceId || alert.source,
    message:   alert.message,
    result,
  });
  if (_history.length > HIST_MAX) _history.pop();
}

// ── Service principal ─────────────────────────────────────────────────────────

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this._channels = {
      email:    !!process.env.SMTP_HOST,
      sms:      !!(process.env.AT_API_KEY && process.env.AT_USERNAME),
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      whatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      voice:    !!(process.env.AT_API_KEY && process.env.AT_USERNAME && process.env.AT_VOICE_PHONE),
    };
  }

  async notify(alert) {
    const results = {};
    const sev = (alert.level || alert.severity || 'INFO').toUpperCase();

    // Email — toujours
    if (this._channels.email && process.env.ALERT_EMAILS) {
      const to  = process.env.ALERT_EMAILS.split(',');
      const res = await sendEmail({
        to,
        subject: `[NexusMonitor ${sev}] ${alert.sourceId || alert.source} — ${alert.message?.slice(0, 60)}`,
        html:    formatAlertMessage(alert, 'html').replace(/\n/g, '<br>'),
      });
      _log('email', alert, res);
      results.email = res;
    }

    // SMS — Critical + Disaster uniquement
    if (this._channels.sms && ['CRITICAL', 'DISASTER'].includes(sev) && process.env.ALERT_PHONES) {
      const to  = process.env.ALERT_PHONES.split(',');
      const res = await sendSMS({ to, message: formatAlertMessage(alert, 'sms') });
      _log('sms', alert, res);
      results.sms = res;
    }

    // Telegram — Warning et plus
    if (this._channels.telegram && ['WARNING', 'CRITICAL', 'DISASTER'].includes(sev)) {
      const res = await sendTelegram({ message: formatAlertMessage(alert, 'html') });
      _log('telegram', alert, res);
      results.telegram = res;
    }

    // WhatsApp — Disaster uniquement
    if (this._channels.whatsapp && sev === 'DISASTER' && process.env.ALERT_WA_PHONES) {
      const phones = process.env.ALERT_WA_PHONES.split(',');
      for (const phone of phones) {
        const res = await sendWhatsApp({ to: phone, message: formatAlertMessage(alert, 'text') });
        _log('whatsapp', alert, res);
      }
      results.whatsapp = { sent: phones.length };
    }

    // Voice Call (TTS) — Disaster uniquement
    if (this._channels.voice && sev === 'DISASTER' && process.env.ALERT_PHONES) {
      const to = process.env.ALERT_PHONES.split(',');
      // L'API Voice AT déclenche l'appel. Le contenu est lu via un webhook callback configuré sur la plateforme AT.
      const res = await sendVoiceCall({ to });
      _log('voice', alert, res);
      results.voice = res;
    }

    this.emit('notified', { alert, results });
    return results;
  }

  // Test d'un canal spécifique
  async test(channel, target) {
    const testAlert = { level: 'INFO', sourceId: 'TEST', message: 'Test de notification NexusMonitor v2 — SBEE DSITD', timestamp: new Date().toISOString(), key: 'test-001' };
    switch (channel) {
      case 'email':    return sendEmail({ to: target, subject: '[NexusMonitor TEST]', html: formatAlertMessage(testAlert, 'html') });
      case 'sms':      return sendSMS({ to: target, message: formatAlertMessage(testAlert, 'sms') });
      case 'telegram': return sendTelegram({ chatId: target, message: formatAlertMessage(testAlert, 'html') });
      case 'whatsapp': return sendWhatsApp({ to: target, message: formatAlertMessage(testAlert, 'text') });
      case 'voice':    return sendVoiceCall({ to: target });
      default:         return { ok: false, reason: 'Canal inconnu' };
    }
  }

  getChannelStatus() { return { ...this._channels }; }
  getHistory(limit = 100) { return _history.slice(0, limit); }

  // Reconfiguration à chaud
  refresh() {
    this._channels = {
      email:    !!process.env.SMTP_HOST,
      sms:      !!(process.env.AT_API_KEY && process.env.AT_USERNAME),
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      whatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      voice:    !!(process.env.AT_API_KEY && process.env.AT_USERNAME && process.env.AT_VOICE_PHONE),
    };
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
