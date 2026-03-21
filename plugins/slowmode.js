import store from '../lib/lightweight_store.js';

export default {
    command: 'slowmode',
    aliases: ['slow'],
    category: 'admin',
    description: 'Set slow mode (delay between messages)',
    usage: '.slowmode <seconds>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const seconds = parseInt(args[0]);
        if (isNaN(seconds) || seconds < 0) return sock.sendMessage(chatId, { text: '❌ Provide valid seconds.', ...channelInfo }, { quoted: message });
        await store.saveSetting(chatId, 'slowmode', seconds);
        await sock.sendMessage(chatId, { text: `⏱️ Slow mode set to ${seconds}s.`, ...channelInfo }, { quoted: message });
    }
};