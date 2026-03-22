// plugins/sudo.js
import { addSudo, removeSudo, getSudoList, cleanJid } from '../lib/index.js';
import isOwnerOrSudo from '../lib/isOwner.js';

function extractTargetJid(message, args) {
    // Check for mention
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        return message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for reply
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return message.message.extendedTextMessage.contextInfo.participant;
    }
    // Check for plain number in arguments
    const text = args.join(' ');
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return `${match[1]}@s.whatsapp.net`;
    return null;
}

export default {
    command: 'sudo',
    aliases: [],
    category: 'owner',
    description: 'Add or remove sudo users or list them',
    usage: '.sudo add|del|list <@user|number>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const config = context.config;
        const sub = (args[0] || '').toLowerCase();

        if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
            await sock.sendMessage(chatId, {
                text: `╭━━━〔 *SUDO MANAGER* 〕━━━┈
┃
┃ 📝 *Usage:*
┃ ▢ .sudo add <@tag/reply/num>
┃ ▢ .sudo del <@tag/reply/num>
┃ ▢ .sudo list
┃
╰━━━━━━━━━━━━━━━━━━┈`
            }, { quoted: message });
            return;
        }

        if (sub === 'list') {
            const list = await getSudoList();
            if (list.length === 0) {
                await sock.sendMessage(chatId, { text: '❌ No sudo users found.' }, { quoted: message });
                return;
            }
            const textList = list.map((j, i) => `┃ ${i + 1}. @${cleanJid(j)}`).join('\n');
            await sock.sendMessage(chatId, {
                text: `╭━━〔 *SUDO USERS* 〕━━┈
┃
${textList}
┃
╰━━━━━━━━━━━━━━━┈`,
                mentions: list
            }, { quoted: message });
            return;
        }

        // Only owner can add/remove (we already set ownerOnly: true, but double-check)
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '❌ *Access Denied:* Only the Main Owner can manage Sudo privileges.' }, { quoted: message });
            return;
        }

        const targetJid = extractTargetJid(message, args.slice(1));
        if (!targetJid) {
            await sock.sendMessage(chatId, { text: '❌ Please mention a user, reply to a message, or provide a number.' }, { quoted: message });
            return;
        }

        const displayId = cleanJid(targetJid);

        if (sub === 'add') {
            const ok = await addSudo(targetJid);
            await sock.sendMessage(chatId, {
                text: ok ? `✅ *Success:* @${displayId} has been granted Sudo privileges.` : `❌ *Error:* User already has Sudo privileges or failed to add.`,
                mentions: [targetJid]
            }, { quoted: message });
            return;
        }

        if (sub === 'del' || sub === 'remove') {
            const ownerNumberClean = cleanJid(config.ownerNumber);
            if (displayId === ownerNumberClean) {
                await sock.sendMessage(chatId, { text: '❌ *Action Denied:* Cannot remove the Main Owner.' }, { quoted: message });
                return;
            }
            const ok = await removeSudo(targetJid);
            await sock.sendMessage(chatId, {
                text: ok ? `✅ *Success:* Sudo privileges revoked from @${displayId}.` : `❌ *Error:* User not found in sudo list or failed to remove.`,
                mentions: [targetJid]
            }, { quoted: message });
        }
    }
};