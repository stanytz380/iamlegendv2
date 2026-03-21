export default {
    command: 'nick',
    aliases: ['setnick'],
    category: 'admin',
    description: 'Set nickname for a user (visible only to bot)',
    usage: '.nick @user <nickname>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const target = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target || args.length < 2) return sock.sendMessage(chatId, { text: '❌ Mention user and provide nickname.', ...channelInfo }, { quoted: message });
        const nick = args.slice(1).join(' ');
        const store = await import('../lib/lightweight_store.js');
        let nicks = await store.default.getSetting(chatId, 'nicks') || {};
        nicks[target] = nick;
        await store.default.saveSetting(chatId, 'nicks', nicks);
        await sock.sendMessage(chatId, { text: `✅ Nickname set for @${target.split('@')[0]}: ${nick}`, mentions: [target], ...channelInfo }, { quoted: message });
    }
};