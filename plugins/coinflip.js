export default {
    command: 'coinflip',
    aliases: ['cf'],
    category: 'games',
    description: 'Flip a coin',
    usage: '.coinflip',
    groupOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await sock.sendMessage(chatId, { text: `🪙 Coin flipped: ${result}!`, ...channelInfo }, { quoted: message });
    }
};