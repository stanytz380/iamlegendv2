export default {
    command: 'rejectall',
    aliases: ['declineall'],
    category: 'admin',
    description: 'Reject all pending join requests',
    usage: '.rejectall',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        await sock.sendMessage(chatId, { text: '🚫 Feature coming soon.', ...channelInfo }, { quoted: message });
    }
};