export default {
    command: 'resetwarn',
    aliases: ['clearwarn'],
    category: 'admin',
    description: 'Reset warnings for a user',
    usage: '.resetwarn @user',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        // similar to warn but reset
    }
};