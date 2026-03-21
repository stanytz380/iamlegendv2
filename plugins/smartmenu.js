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
 *    Description: Interactive smart menu with live stats and emojis        *
 *                                                                           *
 ***************************************************************************/

import config from '../config.js';
import commandHandler from '../lib/commandHandler.js';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────
// EMOJI SETS
// ─────────────────────────────────────────────────────────────
const menuEmojis = ['✨', '🌟', '⭐', '💫', '🎯', '🎨', '🎪', '🎭'];
const activeEmojis = ['✅', '🟢', '💚', '✔️', '☑️'];
const disabledEmojis = ['❌', '🔴', '⛔', '🚫', '❎'];
const fastEmojis = ['⚡', '🚀', '💨', '⏱️', '🔥'];
const slowEmojis = ['🐢', '🐌', '⏳', '⌛', '🕐'];

const categoryEmojis = {
    general: ['📱', '🔧', '⚙️', '🛠️'],
    owner: ['👑', '🔱', '💎', '🎖️'],
    admin: ['🛡️', '⚔️', '🔐', '👮'],
    group: ['👥', '👫', '🧑‍🤝‍🧑', '👨‍👩‍👧‍👦'],
    download: ['📥', '⬇️', '💾', '📦'],
    ai: ['🤖', '🧠', '💭', '🎯'],
    search: ['🔍', '🔎', '🕵️', '📡'],
    apks: ['📲', '📦', '💿', '🗂️'],
    info: ['ℹ️', '📋', '📊', '📄'],
    fun: ['🎮', '🎲', '🎰', '🎪'],
    stalk: ['👀', '🔭', '🕵️', '🎯'],
    games: ['🎮', '🕹️', '🎯', '🏆'],
    images: ['🖼️', '📸', '🎨', '🌄'],
    menu: ['📜', '📋', '📑', '📚'],
    tools: ['🔨', '🔧', '⚡', '🛠️'],
    stickers: ['🎭', '😀', '🎨', '🖼️'],
    quotes: ['💬', '📖', '✍️', '💭'],
    music: ['🎵', '🎶', '🎧', '🎤'],
    utility: ['📂', '🔧', '⚙️', '🛠️']
};

function getRandomEmoji(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getCategoryEmoji(category) {
    const emojis = categoryEmojis[category.toLowerCase()] || ['📂', '📁', '🗂️', '📋'];
    return getRandomEmoji(emojis);
}

function formatTime() {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: config.timeZone || 'Africa/Nairobi'
    };
    return now.toLocaleTimeString('en-US', options);
}

// ─────────────────────────────────────────────────────────────
// HELPER: FORMAT COMMANDS (compact style like main menu)
// ─────────────────────────────────────────────────────────────
function renderCompactCategory(catName, commands, statsMap, prefix, disabledSet) {
    let block = `  ├• ${catName.toUpperCase()}\n`;
    block += `  < ${commands.length} COMMANDS >\n\n`;
    for (const cmd of commands) {
        const isDisabled = disabledSet.has(cmd.toLowerCase());
        const cmdStats = statsMap.get(cmd.toLowerCase());
        const statusIcon = isDisabled ? getRandomEmoji(disabledEmojis) : getRandomEmoji(activeEmojis);
        let speedIcon = '';
        if (cmdStats && !isDisabled && cmdStats.usage > 0) {
            const ms = parseFloat(cmdStats.average_speed);
            if (!isNaN(ms)) {
                if (ms < 100) speedIcon = ` ${getRandomEmoji(fastEmojis)}`;
                else if (ms > 1000) speedIcon = ` ${getRandomEmoji(slowEmojis)}`;
            }
        }
        block += `  ├➣ *${cmd.toUpperCase()}*${speedIcon}\n`;
        block += `  ├➣ ${statusIcon} Active\n\n`;
    }
    return block;
}

export default {
    command: 'smenu',
    aliases: ['shelp', 'smart', 'help2'],
    category: 'general',
    description: 'Interactive smart menu with live status',
    usage: '.smenu',
    isPrefixless: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo, senderId } = context;
        const imagePath = path.join(process.cwd(), 'assets/thumb.png');
        const thumbnail = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

        // Get all categories and commands
        const categories = Array.from(commandHandler.categories.keys()).sort();
        const stats = commandHandler.getDiagnostics?.() || [];
        const statsMap = new Map(stats.map(s => [s.command, s]));
        const disabledSet = commandHandler.disabledCommands || new Set();

        // Build top commands (up to 3)
        const topCmds = stats.filter(s => s.usage > 0).sort((a, b) => b.usage - a.usage).slice(0, 3);
        const topText = topCmds.length > 0
            ? topCmds.map((c, i) => {
                const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                return `${rank} .${c.command} • ${c.usage} uses`;
            }).join('\n')
            : '';

        // Header with bot info
        const menuEmoji = getRandomEmoji(menuEmojis);
        const header = `${menuEmoji} *${config.botName || 'IAMLEGEND'}* ${menuEmoji}\n\n`;
        const infoBlock = `┌─────────────────┐\n` +
            `│ 📱 Bot: ${config.botName || 'IAMLEGEND'}\n` +
            `│ 🔖 Version: ${config.version || '6.0.0'}\n` +
            `│ 👤 Owner: ${config.botOwner || 'STANY TZ'}\n` +
            `│ ⏰ Time: ${formatTime()}\n` +
            `│ ℹ️ Prefix: ${config.prefixes ? config.prefixes.join(', ') : '.'}\n` +
            `│ 📊 Plugins: ${commandHandler.commands.size}\n` +
            `└─────────────────┘\n\n`;

        let menuText = header + infoBlock;
        if (topCmds.length) {
            menuText += `🔥 *TOP COMMANDS*\n${topText}\n\n`;
        }

        // Render each category in compact style
        for (const cat of categories) {
            const catEmoji = getCategoryEmoji(cat);
            const catCmds = commandHandler.categories.get(cat) || [];
            if (catCmds.length === 0) continue;
            menuText += `  ${catEmoji} *${cat.toUpperCase()}*\n`;
            menuText += renderCompactCategory(cat, catCmds, statsMap, config.prefixes[0], disabledSet);
        }

        // Legend
        const legend = `┌─────────────────\n` +
            `├  💡 *LEGEND*\n` +
            `├─ ${getRandomEmoji(activeEmojis)} Active Command\n` +
            `├─ ${getRandomEmoji(disabledEmojis)} Disabled Command\n` +
            `├─ ${getRandomEmoji(fastEmojis)} Fast (<100ms)\n` +
            `├─ ${getRandomEmoji(slowEmojis)} Slow (>1000ms)\n` +
            `└─────────────────`;

        menuText += legend;

        // Send message (with optional image)
        const messageOptions = thumbnail
            ? { image: thumbnail, caption: menuText, mentions: [senderId], ...channelInfo }
            : { text: menuText, mentions: [senderId], ...channelInfo };

        await sock.sendMessage(chatId, messageOptions, { quoted: message });
    }
};