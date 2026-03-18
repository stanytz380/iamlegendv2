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
 *    Description: Download session credentials from GitHub Gist             *
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
 * Extract username and Gist ID from a custom session string.
 * Expected format: username/project_gistId (e.g., "Stanytz378/iamlegendv2_abc123")
 * @param {string} txt - Full session identifier
 * @returns {{ username: string, gistId: string }}
 */
function parseSessionId(txt) {
    const parts = txt.split('/');
    if (parts.length !== 2) {
        throw new Error('Invalid session ID format. Expected: username/project_gistId');
    }
    const username = parts[0];
    const rest = parts[1]; // e.g., "iamlegendv2_abc123"
    const underscoreIndex = rest.lastIndexOf('_');
    if (underscoreIndex === -1) {
        throw new Error('Invalid session ID format: missing underscore in project part');
    }
    const gistId = rest.substring(underscoreIndex + 1);
    return { username, gistId };
}

/**
 * Save credentials from GitHub Gist to session/creds.json
 * @param {string} txt - Session ID (e.g., "Stanytz378/iamlegendv2_abc123")
 */
async function SaveCreds(txt) {
    const { username, gistId } = parseSessionId(txt);
    const gistUrl = `https://gist.githubusercontent.com/${username}/${gistId}/raw/creds.json`;

    try {
        console.log(`📥 Downloading session from: ${gistUrl}`);
        const response = await axios.get(gistUrl, { timeout: 10000 });
        const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        const sessionDir = path.join(process.cwd(), 'session');
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        const credsPath = path.join(sessionDir, 'creds.json');
        fs.writeFileSync(credsPath, data);
        console.log('✅ Credentials saved to session/creds.json');
    } catch (error) {
        console.error('❌ Error downloading or saving credentials:', error.message);
        if (error.response) {
            console.error('❌ Status:', error.response.status);
            console.error('❌ Response:', error.response.data);
        }
        throw error;
    }
}

export default SaveCreds;