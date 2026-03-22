// plugins/security.js
import store from '../lib/lightweight_store.js';

// List of all security features with their default actions
const SECURITY_FEATURES = [
    { key: 'antilink', defaultAction: 'delete' },
    { key: 'anticaps', defaultAction: 'delete' },
    { key: 'antiemoji', defaultAction: 'delete' },
    { key: 'antiphone', defaultAction: 'delete' },
    { key: 'antiforward', defaultAction: 'delete' },
    { key: 'antimedia', defaultAction: 'delete' },
    { key: 'antireaction', defaultAction: 'warn' },
    { key: 'antitag', defaultAction: 'delete' },
    { key: 'antisticker', defaultAction: 'delete' },
    { key: 'antilocation', defaultAction: 'delete' },
    { key: 'anticontact', defaultAction: 'delete' },
    { key: 'antipoll', defaultAction: 'delete' },
    { key: 'antigif', defaultAction: 'delete' },
    { key: 'antivoice', defaultAction: 'delete' },
    { key: 'antiemail', defaultAction: 'delete' },
    { key: 'antiip', defaultAction: 'delete' },
    { key: 'antiflood', defaultAction: 'warn' },
    { key: 'antimassmention', defaultAction: 'warn' },
    { key: 'antiurl', defaultAction: 'delete' },
    // Special features that don't have an action (just on/off or numeric)
    { key: 'slowmode', defaultAction: null, defaultValue: 5 },
    { key: 'tempmute', defaultAction: null, special: true }, // handled separately
];

async function getFeatureSettings(chatId, featureKey) {
    return await store.getSetting(chatId, featureKey) || { enabled: false };
}

async function setFeatureEnabled(chatId, featureKey, enabled, action = null) {
    const existing = await store.getSetting(chatId, featureKey) || {};
    if (enabled) {
        const defaultAction = SECURITY_FEATURES.find(f => f.key === featureKey)?.defaultAction;
        // For features with a default action, set it; otherwise set a default value if applicable
        if (defaultAction) {
            await store.saveSetting(chatId, featureKey, {
                enabled: true,
                action: action || existing.action || defaultAction
            });
        } else if (featureKey === 'slowmode') {
            // Enable with a default 5 seconds if not already set
            await store.saveSetting(chatId, featureKey, existing.value || 5);
        } else if (featureKey === 'tempmute') {
            // Tempmute is a per‑user state; we can't simply "enable" it, but we can enable a flag
            await store.saveSetting(chatId, featureKey, { enabled: true });
        } else {
            await store.saveSetting(chatId, featureKey, { enabled: true });
        }
    } else {
        if (featureKey === 'slowmode') {
            await store.saveSetting(chatId, featureKey, 0);
        } else {
            await store.saveSetting(chatId, featureKey, { enabled: false });
        }
    }
}

async function setFeatureAction(chatId, featureKey, action) {
    const existing = await store.getSetting(chatId, featureKey) || {};
    if (existing.enabled || existing.action) {
        await store.saveSetting(chatId, featureKey, { ...existing, action });
    }
}

export default {
    command: 'security',
    aliases: ['sec', 'secure'],
    category: 'admin',
    description: 'Bulk manage all security features',
    usage: '.security <on|off|set|status>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            return sock.sendMessage(chatId, {
                text: `🛡️ *SECURITY COMMANDS*\n\n` +
                    `• \`.security on\` – Enable all security features (with defaults)\n` +
                    `• \`.security off\` – Disable all security features\n` +
                    `• \`.security set <action>\` – Set action (delete/warn/kick) for all features that support it\n` +
                    `• \`.security status\` – Show current security status`
            });
        }

        switch (sub) {
            case 'on':
                for (const feature of SECURITY_FEATURES) {
                    await setFeatureEnabled(chatId, feature.key, true);
                }
                return sock.sendMessage(chatId, { text: '✅ All security features enabled (with default actions).' });
            case 'off':
                for (const feature of SECURITY_FEATURES) {
                    await setFeatureEnabled(chatId, feature.key, false);
                }
                return sock.sendMessage(chatId, { text: '❌ All security features disabled.' });
            case 'set':
                const action = args[1]?.toLowerCase();
                if (!['delete', 'warn', 'kick'].includes(action)) {
                    return sock.sendMessage(chatId, { text: '❌ Invalid action. Use delete, warn, or kick.' });
                }
                for (const feature of SECURITY_FEATURES) {
                    if (feature.defaultAction) {
                        await setFeatureAction(chatId, feature.key, action);
                    }
                }
                return sock.sendMessage(chatId, { text: `✅ Action set to "${action}" for all applicable security features.` });
            case 'status':
                let report = `🛡️ *SECURITY STATUS*\n\n`;
                for (const feature of SECURITY_FEATURES) {
                    const settings = await store.getSetting(chatId, feature.key) || {};
                    let status = '❌';
                    let detail = '';
                    if (feature.key === 'slowmode') {
                        const value = settings;
                        if (value && value > 0) {
                            status = '✅';
                            detail = ` (${value}s)`;
                        }
                    } else if (feature.key === 'tempmute') {
                        if (settings.enabled) status = '✅';
                    } else {
                        if (settings.enabled) {
                            status = '✅';
                            if (settings.action) detail = ` (${settings.action})`;
                        }
                    }
                    report += `${status} ${feature.key}${detail}\n`;
                }
                await sock.sendMessage(chatId, { text: report });
                break;
            default:
                return sock.sendMessage(chatId, { text: '❌ Invalid subcommand.' });
        }
    }
};