import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';

const userMessageCount = new Map(); // key: chatId_userId, value: { count, firstTimestamp }

async function setAntiFlood(chatId, enabled, action = 'warn', limit = 5, windowMs = 5000) {
    await store.saveSetting(chatId, 'antiflood', { enabled, action, limit, windowMs });
}

async function getAntiFlood(chatId) {
    const def = { enabled: false, action: 'warn', limit: 5, windowMs: 5000 };
    return await store.getSetting(chatId, 'antiflood') || def;
}

async function removeAntiFlood(chatId) {
    await store.saveSetting(chatId, 'antiflood', { enabled: false, action: null, limit: 5, windowMs: 5000 });
}

export async function handleAntiFlood(sock, chatId, message, senderId) {
    const config = await getAntiFlood(chatId);
    if (!config.enabled) return;

    const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (isOwnerSudo) return;
    try {
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (isSenderAdmin) return;
    } catch (e) {}

    const key = `${chatId}_${senderId}`;
    const now = Date.now();
    const record = userMessageCount.get(key);
    if (!record) {
        userMessageCount.set(key, { count: 1, firstTimestamp: now });
        setTimeout(() => userMessageCount.delete(key), config.windowMs);
        return;
    }

    if (now - record.firstTimestamp > config.windowMs) {
        // window expired, reset
        userMessageCount.set(key, { count: 1, firstTimestamp: now });
        setTimeout(() => userMessageCount.delete(key), config.windowMs);
        return;
    }

    record.count++;
    if (record.count >= config.limit) {
        // Flood detected
        const action = config.action || 'warn';
        const messageId = message.key.id;
        const participant = message.key.participant || senderId;

        // Delete the flood message
        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: messageId, participant }
            });
        } catch (e) {}

        if (action === 'warn') {
            await sock.sendMessage(chatId, {
                text: `⚠️ *Anti‑Flood Warning*\n\n@${senderId.split('@')[0]}, please slow down!`,
                mentions: [senderId]
            });
        } else if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `🚫 @${senderId.split('@')[0]} removed for flooding.`,
                    mentions: [senderId]
                });
            } catch (e) {}
        }

        // Reset counter after punishment
        userMessageCount.delete(key);
    }
}

export default {
    command: 'antiflood',
    aliases: ['floodcontrol'],
    category: 'admin',
    description: 'Prevent message flooding (limit messages per time window)',
    usage: '.antiflood <on|off|set limit window>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            const config = await getAntiFlood(chatId);
            return sock.sendMessage(chatId, {
                text: `*💧 ANTI‑FLOOD SETUP*\n\n` +
                    `*Status:* ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                    `*Action:* ${config.action || 'warn'}\n` +
                    `*Limit:* ${config.limit} messages in ${config.windowMs/1000}s\n\n` +
                    `*Commands:*\n` +
                    `• \`.antiflood on\` - Enable (default limit 5 in 5s)\n` +
                    `• \`.antiflood off\` - Disable\n` +
                    `• \`.antiflood set <limit> <seconds>\` - Set limit and window (e.g., .antiflood set 5 5)\n` +
                    `• \`.antiflood set warn|kick\` - Change action`
            }, { quoted: message });
        }

        switch (action) {
            case 'on':
                if ((await getAntiFlood(chatId)).enabled) return sock.sendMessage(chatId, { text: '⚠️ Already enabled.' });
                await setAntiFlood(chatId, true, 'warn', 5, 5000);
                return sock.sendMessage(chatId, { text: '✅ Anti‑flood enabled (5 msg/5s, warn).' });
            case 'off':
                await removeAntiFlood(chatId);
                return sock.sendMessage(chatId, { text: '❌ Anti‑flood disabled.' });
            case 'set':
                if (args.length < 2) return sock.sendMessage(chatId, { text: '❌ Provide parameters.' });
                const sub = args[1]?.toLowerCase();
                if (sub === 'warn' || sub === 'kick') {
                    const config = await getAntiFlood(chatId);
                    await setAntiFlood(chatId, config.enabled, sub, config.limit, config.windowMs);
                    return sock.sendMessage(chatId, { text: `✅ Anti‑flood action set to ${sub}.` });
                }
                const limit = parseInt(args[1]);
                const windowSec = parseInt(args[2]);
                if (isNaN(limit) || limit < 1) return sock.sendMessage(chatId, { text: '❌ Limit must be a positive number.' });
                if (isNaN(windowSec) || windowSec < 1) return sock.sendMessage(chatId, { text: '❌ Window must be a positive number of seconds.' });
                const config = await getAntiFlood(chatId);
                await setAntiFlood(chatId, config.enabled, config.action, limit, windowSec * 1000);
                return sock.sendMessage(chatId, { text: `✅ Anti‑flood limit set to ${limit} messages in ${windowSec}s.` });
            default:
                return sock.sendMessage(chatId, { text: '❌ Invalid command.' });
        }
    },
    handleAntiFlood,
    setAntiFlood,
    getAntiFlood,
    removeAntiFlood
};