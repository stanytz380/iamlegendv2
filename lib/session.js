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
 *    Description: Download session credentials from Pastebin/paste.rs      *
 *                 using custom session ID and save to session/ folder.     *
 *                                                                           *
 ***************************************************************************/

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import fs from 'fs';
import axios from 'axios';

/**
 * Extracts the paste ID from a custom session string.
 * Expected format: Stanytz378/iamlegendv2_<pasteId>
 * @param {string} txt - Full session identifier
 * @returns {string} The paste ID
 */
function extractPasteId(txt) {
    const parts = txt.split('_');
    // The paste ID is the last part after the last underscore
    return parts[parts.length - 1];
}

/**
 * Attempts to fetch raw content from Pastebin.
 * @param {string} pasteId 
 * @returns {Promise<string|null>}
 */
async function fetchFromPastebin(pasteId) {
    try {
        const url = `https://pastebin.com/raw/${pasteId}`;
        const response = await axios.get(url, { timeout: 10000 });
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (error) {
        console.warn(`Pastebin fetch failed: ${error.message}`);
        return null;
    }
}

/**
 * Attempts to fetch raw content from paste.rs.
 * @param {string} pasteId 
 * @returns {Promise<string|null>}
 */
async function fetchFromPasteRs(pasteId) {
    try {
        const url = `https://paste.rs/${pasteId}`;
        const response = await axios.get(url, { timeout: 10000 });
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (error) {
        console.warn(`paste.rs fetch failed: ${error.message}`);
        return null;
    }
}

/**
 * Downloads credentials from Pastebin/paste.rs and saves them to session/creds.json.
 * @param {string} txt - Session identifier (e.g., "Stanytz378/iamlegendv2_abc123")
 */
async function SaveCreds(txt) {
    const pasteId = extractPasteId(txt);
    if (!pasteId) {
        throw new Error('Invalid session ID format. Expected: Stanytz378/iamlegendv2_<pasteId>');
    }

    console.log(`📥 Downloading session (paste ID: ${pasteId})`);

    // Try Pastebin first, then fallback to paste.rs
    let data = await fetchFromPastebin(pasteId);
    if (!data) {
        data = await fetchFromPasteRs(pasteId);
    }
    if (!data) {
        throw new Error('Failed to download credentials from both Pastebin and paste.rs');
    }

    // Ensure session directory exists
    const sessionDir = path.join(process.cwd(), 'session');
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const credsPath = path.join(sessionDir, 'creds.json');
    fs.writeFileSync(credsPath, data);
    console.log('✅ Credentials saved to session/creds.json');
}

export default SaveCreds;