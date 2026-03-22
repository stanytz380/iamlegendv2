import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';

const phoneRegex = /\b(?:\+?[0-9]{1,3}[-.]?)?\(?[0-9]{3}\)?[-.]?[0-9]{3}[-.]?[0-9]{4}\b/;

async function setAntiPhone(chatId, enabled, action = 'delete') {
    await store.saveSetting(chatId, 'antiphone', { enabled, action });
}

async function getAntiPhone(chatId) {
    return await store.getSetting(chatId, 'antiphone') || { enabled: false, action: 'delete' };
}

async function removeAntiPhone(chatId) {
    await store.saveSetting(chatId, 'antiphone', { enabled: false, action: null });
}

export async function handleAntiPhone(sock, chatId, message, userMessage, senderId) {
    const config = await getAntiPhone(chatId);
    if (!config.enabled) return;

    const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (isOwnerSudo) return;
    try {
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (isSenderAdmin) return;
    } catch (e) {}

    if (!phoneRegex.test(userMessage)) return;

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
            text: `⚠️ *Anti-Phone Warning*\n\n@${senderId.split('@')[0]}, phone numbers are not allowed!`,
            mentions: [senderId]
        });
    }

    if (action === 'kick') {
        try {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            await sock.sendMessage(chatId, {
                text: `🚫 @${senderId.split('@')[0]} removed for sharing phone number.`,
                mentions: [senderId]
            });
        } catch (e) {}
    }
}

export default {
    command: 'antiphone',
    aliases: ['blockphone'],
    category: 'admin',
    description: 'Block messages containing phone numbers',
    usage: '.antiphone <on|off|set delete|warn|kick>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            const config = await getAntiPhone(chatId);
            return sock.sendMessage(chatId, {
                text: `*📞 ANTI-PHONE SETUP*\n\n` +
                    `*Status:* ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                    `*Action:* ${config.action || 'Not set'}\n\n` +
                    `*Commands:*\n` +
                    `• \`.antiphone on\` - Enable\n` +
                    `• \`.antiphone off\` - Disable\n` +
                    `• \`.antiphone set delete|warn|kick\``
            }, { quoted: message });
        }

        switch (action) {
            case 'on':
                if ((await getAntiPhone(chatId)).enabled) return sock.sendMessage(chatId, { text: '⚠️ Already enabled.' });
                await setAntiPhone(chatId, true, 'delete');
                return sock.sendMessage(chatId, { text: '✅ Anti‑phone enabled.' });
            case 'off':
                await removeAntiPhone(chatId);
                return sock.sendMessage(chatId, { text: '❌ Anti‑phone disabled.' });
            case 'set':
                const sub = args[1]?.toLowerCase();
                if (!['delete', 'warn', 'kick'].includes(sub)) return sock.sendMessage(chatId, { text: '❌ Use delete, warn, or kick.' });
                await setAntiPhone(chatId, true, sub);
                return sock.sendMessage(chatId, { text: `✅ Action set to ${sub}.` });
            default:
                return sock.sendMessage(chatId, { text: '❌ Invalid command.' });
        }
    },
    handleAntiPhone,
    setAntiPhone,
    getAntiPhone,
    removeAntiPhone
};