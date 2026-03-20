/*****************************************************************************
 *                                                                           *
 *                     Developed By STANY TZ                                 *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/Stanytz378/iamlegendv2                 *
 *  ▶️  YouTube  : https://youtube.com/@STANYTZ                              *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p     *
 *                                                                           *
 *    © 2026 STANY TZ. All rights reserved.                                 *
 *                                                                           *
 *    Description: Block or warn users who mention a group in their status  *
 *                                                                           *
 ***************************************************************************/

import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';

const SETTING_KEY = 'antistatusmention';

async function getConfig() {
    const config = await store.getSetting('global', SETTING_KEY);
    return config || { enabled: false, action: 'warn' };
}

async function saveConfig(config) {
    await store.saveSetting('global', SETTING_KEY, config);
}

/**
 * Check if a status message mentions any group.
 * @param {object} statusMessage - The status message object
 * @returns {boolean} - true if a group is mentioned
 */
function mentionsGroup(statusMessage) {
    const mentionedJid = statusMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    return mentionedJid.some(jid => jid.endsWith('@g.us'));
}

/**
 * Main handler to be called from the status update event.
 * If antistatusmention is enabled and a group is mentioned, take action.
 * @param {object} sock - Baileys socket
 * @param {object} status - The status event (either a message or a reaction)
 * @returns {boolean} - true if action was taken (blocked further processing)
 */
export async function handleStatusMention(sock, status) {
    const config = await getConfig();
    if (!config.enabled) return false;

    // Extract the message object from the status event
    let msg = null;
    if (status.messages && status.messages.length) {
        msg = status.messages[0];
    } else if (status.key && status.key.remoteJid === 'status@broadcast') {
        // If it's just a key (e.g., from a reaction), we can't check mentions
        return false;
    }
    if (!msg || !msg.message) return false;

    const senderJid = msg.key.participant || msg.key.remoteJid;
    // Skip if sender is owner or sudo (they are exempt)
    const isSenderOwnerSudo = await isOwnerOrSudo(senderJid, sock);
    if (isSenderOwnerSudo) return false;

    // Check if the status mentions any group
    if (!mentionsGroup(msg)) return false;

    // Take action based on config
    const action = config.action;
    console.log(`[ANTISTATUSMENTION] User ${senderJid} mentioned a group in status. Action: ${action}`);

    if (action === 'warn') {
        // Send a warning message to the user in private chat
        await sock.sendMessage(senderJid, {
            text: `⚠️ *Warning*\n\nYou mentioned a group in your WhatsApp status. This is not allowed.\n\nIf you continue, you may be blocked.`
        }).catch(err => console.error('Failed to send warning:', err.message));
    } else if (action === 'block') {
        // Block the user
        try {
            await sock.updateBlockStatus(senderJid, 'block');
            console.log(`[ANTISTATUSMENTION] Blocked user: ${senderJid}`);
            // Optionally send a final message before blocking (though after block it won't be delivered)
            await sock.sendMessage(senderJid, {
                text: `🔒 *You have been blocked*\n\nReason: Mentioning a group in status is prohibited.`
            }).catch(() => {});
        } catch (err) {
            console.error('Failed to block user:', err.message);
        }
    }

    // Return true to indicate that the status should be skipped by other handlers (like autoview)
    return true;
}

export default {
    command: 'antistatusmention',
    aliases: ['asm', 'antistatusgroup'],
    category: 'owner',
    description: 'Block or warn users who mention a group in their WhatsApp status',
    usage: '.antistatusmention <on|off|set warn|block|status>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const config = await getConfig();
        const action = args[0]?.toLowerCase();

        if (!action || action === 'status') {
            const statusText = config.enabled ? '✅ Enabled' : '❌ Disabled';
            const actionText = config.action === 'warn' ? 'Warn' : 'Block';
            return await sock.sendMessage(chatId, {
                text: `🔇 *Anti‑Status‑Mention*\n\nCurrent: ${statusText}\nAction: ${actionText}\n\nCommands:\n.antistatusmention on — enable\n.antistatusmention off — disable\n.antistatusmention set warn — only warn\n.antistatusmention set block — block users\n.antistatusmention status — show current`,
                ...channelInfo
            }, { quoted: message });
        }

        if (action === 'on') {
            if (config.enabled) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ Anti‑status‑mention is already enabled.',
                    ...channelInfo
                }, { quoted: message });
            }
            config.enabled = true;
            await saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: '✅ Anti‑status‑mention enabled. Users who mention a group in their status will be warned (or blocked depending on action).',
                ...channelInfo
            }, { quoted: message });
        }

        if (action === 'off') {
            if (!config.enabled) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ Anti‑status‑mention is already disabled.',
                    ...channelInfo
                }, { quoted: message });
            }
            config.enabled = false;
            await saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: '❌ Anti‑status‑mention disabled. Users may now mention groups in statuses.',
                ...channelInfo
            }, { quoted: message });
        }

        if (action === 'set') {
            const sub = args[1]?.toLowerCase();
            if (!sub || !['warn', 'block'].includes(sub)) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Please specify action: `warn` or `block`\n\nExample: `.antistatusmention set warn`',
                    ...channelInfo
                }, { quoted: message });
            }
            config.action = sub;
            await saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: `✅ Action set to *${sub.toUpperCase()}*. Users who mention a group in status will now be ${sub === 'warn' ? 'warned' : 'blocked'}.`,
                ...channelInfo
            }, { quoted: message });
        }

        return await sock.sendMessage(chatId, {
            text: '❌ Invalid command. Use `.antistatusmention` to see options.',
            ...channelInfo
        }, { quoted: message });
    }
};