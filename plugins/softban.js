export default {
    command: 'softban',
    aliases: ['kickban'],
    category: 'admin',
    description: 'Kick a user and delete their last 50 messages',
    usage: '.softban @user',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const target = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return sock.sendMessage(chatId, { text: '❌ Mention user.', ...channelInfo }, { quoted: message });
        await sock.groupParticipantsUpdate(chatId, [target], 'remove');
        await sock.sendMessage(chatId, { text: `🚫 @${target.split('@')[0]} has been softbanned (removed).`, mentions: [target], ...channelInfo });
    }
};