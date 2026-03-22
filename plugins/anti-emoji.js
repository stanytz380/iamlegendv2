import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';

const emojiRegex = /\p{Emoji}/gu;

async function setAntiEmoji(chatId, enabled, action = 'delete') {
    await store.saveSetting(chatId, 'antiemoji', { enabled, action });
}

async function getAntiEmoji(chatId) {
    return await store.getSetting(chatId, 'antiemoji') || { enabled: false, action: 'delete' };
}

async function removeAntiEmoji(chatId) {
    await store.saveSetting(chatId, 'antiemoji', { enabled: false, action: null });
}

export async function handleAntiEmoji(sock, chatId, message, userMessage, senderId) {
    const config = await getAntiEmoji(chatId);
    if (!config.enabled) return;

    const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (isOwnerSudo) return;
    try {
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (isSenderAdmin) return;
    } catch (e) {}

    const emojiCount = [...userMessage.matchAll(emojiRegex)].length;
    if (emojiCount <= 10) return;

    const action = config.action || 'delete';
    const messageId = message.key.id;
    const participant = message.key.participant || senderId;

    if (action === 'delete' || action === 'kick') {
        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: messageId, participant }
            });
        } catch (e) {}
    }

    if (action === 'warn' || action === 'delete') {
        await sock.sendMessage(chatId, {
            text: `⚠️ *Anti‑Emoji Warning*\n\n@${senderId.split('@')[0]}, too many emojis!`,
            mentions: [senderId]
        });
    }

    if (action === 'kick') {
        try {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            await sock.sendMessage(chatId, {
                text: `🚫 @${senderId.split('@')[0]} removed for emoji flood.`,
                mentions: [senderId]
            });
        } catch (e) {}
    }
}

export default {
    command: 'antiemoji',
    aliases: ['emoji'],
    category: 'admin',
    description: 'Block messages with more than 10 emojis',
    usage: '.antiemoji <on|off|set delete|warn|kick>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            const config = await getAntiEmoji(chatId);
            return sock.sendMessage(chatId, {
                text: `*😀 ANTI-EMOJI SETUP*\n\n` +
                    `*Status:* ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                    `*Action:* ${config.action || 'Not set'}\n\n` +
                    `*Commands:*\n` +
                    `• \`.antiemoji on\` - Enable\n` +
                    `• \`.antiemoji off\` - Disable\n` +
                    `• \`.antiemoji set delete|warn|kick\``
            }, { quoted: message });
        }

        switch (action) {
            case 'on':
                if ((await getAntiEmoji(chatId)).enabled) return sock.sendMessage(chatId, { text: '⚠️ Already enabled.' });
                await setAntiEmoji(chatId, true, 'delete');
                return sock.sendMessage(chatId, { text: '✅ Anti‑emoji enabled.' });
            case 'off':
                await removeAntiEmoji(chatId);
                return sock.sendMessage(chatId, { text: '❌ Anti‑emoji disabled.' });
            case 'set':
                const sub = args[1]?.toLowerCase();
                if (!['delete', 'warn', 'kick'].includes(sub)) return sock.sendMessage(chatId, { text: '❌ Use delete, warn, or kick.' });
                await setAntiEmoji(chatId, true, sub);
                return sock.sendMessage(chatId, { text: `✅ Action set to ${sub}.` });
            default:
                return sock.sendMessage(chatId, { text: '❌ Invalid command.' });
        }
    },
    handleAntiEmoji,
    setAntiEmoji,
    getAntiEmoji,
    removeAntiEmoji
};