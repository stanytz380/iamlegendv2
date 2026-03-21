export default {
    command: 'lockcontact',
    aliases: ['blockcontact'],
    category: 'admin',
    description: 'Block contact cards in the group',
    usage: '.lockcontact <on/off>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const store = await import('../lib/lightweight_store.js');
        const mode = args[0]?.toLowerCase();
        if (mode === 'on') {
            await store.default.saveSetting(chatId, 'lockcontact', true);
            await sock.sendMessage(chatId, { text: '📇 Contact cards are blocked.', ...channelInfo }, { quoted: message });
        } else if (mode === 'off') {
            await store.default.saveSetting(chatId, 'lockcontact', false);
            await sock.sendMessage(chatId, { text: '📇 Contact cards are allowed.', ...channelInfo }, { quoted: message });
        } else {
            const locked = await store.default.getSetting(chatId, 'lockcontact');
            await sock.sendMessage(chatId, { text: `Contact cards locked: ${locked ? 'ON' : 'OFF'}`, ...channelInfo }, { quoted: message });
        }
    }
};