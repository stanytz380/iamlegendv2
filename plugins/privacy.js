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
 *    Description: Privacy settings manager for iamlegendv2 WhatsApp Bot    *
 *                 (Plain text formatting, no decorative boxes)             *
 *                                                                           *
 ***************************************************************************/

export default {
    command: 'privacy',
    aliases: ['setprivacy', 'pvcy', 'pri'],
    category: 'menu',
    description: 'Manage all WhatsApp privacy settings, block/unblock users',
    usage: '.privacy — show menu',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const setting = args[0]?.toLowerCase();
        const value = args[1]?.toLowerCase();

        // ── No args: show full menu ───────────────────────────────────────
        if (!setting) {
            return await sock.sendMessage(chatId, {
                text: `🔒 *PRIVACY SETTINGS*\n` +
                    `────────────────────\n` +
                    `📌 *Usage:* \`.pvcy <set> <val>\`\n\n` +
                    `⚙️ *PRIVACY CONTROLS*\n` +
                    `👁️ *lastseen* — \`all\` \`contacts\` \`blacklist\` \`none\`\n` +
                    `🟢 *online* — \`all\` \`match_last_seen\`\n` +
                    `🖼️ *profile* — \`all\` \`contacts\` \`blacklist\` \`none\`\n` +
                    `📊 *status* — \`all\` \`contacts\` \`blacklist\` \`none\`\n` +
                    `✅ *receipts* — \`all\` \`none\`\n` +
                    `👥 *groups* — \`all\` \`contacts\` \`blacklist\`\n` +
                    `⏳ *timer* — \`off\` \`24h\` \`7d\` \`90d\`\n\n` +
                    `🚫 *BLOCK CONTROLS*\n` +
                    `🔴 *block* — \`<number>\` or reply to msg\n` +
                    `🟢 *unblock* — \`<number>\` or reply to msg\n` +
                    `📋 *blocklist* — view blocked users\n\n` +
                    `📊 *INFO*\n` +
                    `🔍 *status* — view privacy settings\n` +
                    `────────────────────\n\n` +
                    `💡 *Examples:*\n` +
                    `› \`.privacy lastseen all\`\n` +
                    `› \`.privacy receipts none\`\n` +
                    `› \`.privacy timer 7d\`\n` +
                    `› \`.privacy block 923001234567\`\n` +
                    `› \`.privacy blocklist\`\n` +
                    `› \`.privacy status\``,
                ...channelInfo
            }, { quoted: message });
        }

        // ── status: show current privacy settings ─────────────────────────
        if (setting === 'status') {
            try {
                const s = await sock.fetchPrivacySettings(true);
                const fmt = (v) => v ? `\`${v}\`` : `\`unknown\``;
                return await sock.sendMessage(chatId, {
                    text: `🔒 *CURRENT PRIVACY*\n` +
                        `────────────────────\n` +
                        `👁️ *Last Seen:* ${fmt(s.last)}\n` +
                        `🟢 *Online:* ${fmt(s.online)}\n` +
                        `🖼️ *Profile Pic:* ${fmt(s.profile)}\n` +
                        `📊 *Status:* ${fmt(s.status)}\n` +
                        `✅ *Read Receipts:* ${fmt(s.readreceipts)}\n` +
                        `👥 *Groups Add:* ${fmt(s.groupadd)}\n` +
                        `────────────────────\n` +
                        `_Use \`.pvcy <set> <value>\` to change_`,
                    ...channelInfo
                }, { quoted: message });
            } catch (e) {
                return await sock.sendMessage(chatId, { text: `❌ Failed to fetch settings: ${e.message}`, ...channelInfo }, { quoted: message });
            }
        }

        // ── blocklist ─────────────────────────────────────────────────────
        if (setting === 'blocklist') {
            try {
                const list = await sock.fetchBlocklist();
                if (!list || list.length === 0) {
                    return await sock.sendMessage(chatId, { text: `📋 *Block List*\n\n_No blocked users._`, ...channelInfo }, { quoted: message });
                }
                const entries = list.map((jid, i) => `${i + 1}. +${jid.split('@')[0]}`).join('\n');
                return await sock.sendMessage(chatId, {
                    text: `🚫 *BLOCK LIST*\n` +
                        `────────────────────\n` +
                        `${entries}\n` +
                        `────────────────────\n` +
                        `*Total:* ${list.length} blocked user(s)`,
                    ...channelInfo
                }, { quoted: message });
            } catch (e) {
                return await sock.sendMessage(chatId, { text: `❌ Failed to fetch block list: ${e.message}`, ...channelInfo }, { quoted: message });
            }
        }

        // ── block/unblock ─────────────────────────────────────────────────
        if (setting === 'block' || setting === 'unblock') {
            let targetJid = null;
            const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
            if (quotedParticipant) {
                const num = quotedParticipant.split('@')[0].split(':')[0];
                targetJid = `${num}@s.whatsapp.net`;
            }
            if (!targetJid && value) {
                const num = value.replace(/[^0-9]/g, '');
                if (num.length >= 7) targetJid = `${num}@s.whatsapp.net`;
            }
            if (!targetJid && !chatId.endsWith('@g.us')) {
                targetJid = chatId;
            }
            if (!targetJid) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Provide a number or reply to a message.\n\nExample: \`.privacy block 923001234567\``,
                    ...channelInfo
                }, { quoted: message });
            }
            try {
                await sock.updateBlockStatus(targetJid, setting);
                const icon = setting === 'block' ? '🚫' : '✅';
                const action = setting === 'block' ? 'Blocked' : 'Unblocked';
                return await sock.sendMessage(chatId, {
                    text: `${icon} *${action}* +${targetJid.split('@')[0]}`,
                    ...channelInfo
                }, { quoted: message });
            } catch (e) {
                return await sock.sendMessage(chatId, { text: `❌ Failed to ${setting}: ${e.message}`, ...channelInfo }, { quoted: message });
            }
        }

        // ── default disappearing timer ────────────────────────────────────
        if (setting === 'timer') {
            const durations = {
                'off': 0, '0': 0,
                '24h': 86400, '1d': 86400,
                '7d': 604800, '1w': 604800,
                '90d': 7776000, '3m': 7776000,
            };
            if (!value || !(value in durations)) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Choose: \`off\` \`24h\` \`7d\` \`90d\`\n\nExample: \`.privacy timer 7d\``,
                    ...channelInfo
                }, { quoted: message });
            }
            try {
                await sock.updateDefaultDisappearingMode(durations[value]);
                const label = value === 'off' || value === '0' ? 'disabled' : `set to *${value}*`;
                return await sock.sendMessage(chatId, { text: `⏳ Default disappearing timer ${label}`, ...channelInfo }, { quoted: message });
            } catch (e) {
                return await sock.sendMessage(chatId, { text: `❌ Failed to set timer: ${e.message}`, ...channelInfo }, { quoted: message });
            }
        }

        // ── privacy setting updates ───────────────────────────────────────
        const privacySettings = {
            lastseen: { fn: (v) => sock.updateLastSeenPrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist', 'blacklist', 'none'], label: 'Last Seen' },
            online: { fn: (v) => sock.updateOnlinePrivacy(v), allowed: ['all', 'match_last_seen'], label: 'Online Status' },
            profile: { fn: (v) => sock.updateProfilePicturePrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist', 'blacklist', 'none'], label: 'Profile Picture' },
            status: { fn: (v) => sock.updateStatusPrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist', 'blacklist', 'none'], label: 'Status' },
            receipts: { fn: (v) => sock.updateReadReceiptsPrivacy(v), allowed: ['all', 'none'], label: 'Read Receipts' },
            groups: { fn: (v) => sock.updateGroupsAddPrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist', 'blacklist'], label: 'Groups Add' },
        };

        const config = privacySettings[setting];
        if (!config) {
            return await sock.sendMessage(chatId, {
                text: `❌ Unknown option: *${setting}*\n\nUse \`.privacy\` to see all commands.`,
                ...channelInfo
            }, { quoted: message });
        }

        if (!value || !config.allowed.includes(value)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid value for *${setting}*\n\nAllowed: ${config.allowed.filter(v => v !== 'contact_blacklist').map(v => `\`${v}\``).join(' ')}`,
                ...channelInfo
            }, { quoted: message });
        }

        const resolvedValue = value === 'blacklist' ? 'contact_blacklist' : value;
        try {
            await config.fn(resolvedValue);
            return await sock.sendMessage(chatId, {
                text: `✅ *${config.label}* set to \`${value}\``,
                ...channelInfo
            }, { quoted: message });
        } catch (e) {
            console.error('[PRIVACY] Error:', e.message);
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to update ${config.label}: ${e.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};