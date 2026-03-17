#!/bin/bash
#############################################################################
#                                                                           #
#                     Developed By STANY TZ                                 #
#                                                                           #
#  🌐  GitHub   : https://github.com/Stanytz378                             #
#  ▶️  YouTube  : https://youtube.com/@STANYTZ                              #
#  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p     #
#                                                                           #
#    © 2026 STANY TZ. All rights reserved.                                 #
#                                                                           #
#    Description: Fly.io One‑Click Deployer for ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ Bot            #
#                                                                           #
#############################################################################

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════╗"
echo "║     ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ Fly.io Deployer       ║"
echo "║           by STANY TZ                 ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Install flyctl if not present
if ! command -v fly &>/dev/null; then
    echo -e "${YELLOW}📦 Installing flyctl...${NC}"
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Check login
if ! fly auth whoami &>/dev/null; then
    echo -e "${YELLOW}🔑 Please login to Fly.io:${NC}"
    fly auth login
fi

echo ""
echo -e "${BOLD}📋 Enter your bot details:${NC}"
echo ""

read -p "$(echo -e ${CYAN}App name (e.g. my-iamlegend): ${NC})" APP_NAME
APP_NAME=${APP_NAME:-iamlegend-bot}

read -p "$(echo -e ${CYAN}Session ID (Stanytz378/IAMLEGEND_xxxxx): ${NC})" SESSION_ID
if [ -z "$SESSION_ID" ]; then
    echo -e "${RED}❌ Session ID is required!${NC}"
    exit 1
fi

read -p "$(echo -e ${CYAN}Owner WhatsApp number (e.g. 255618558502): ${NC})" OWNER_NUMBER
OWNER_NUMBER=${OWNER_NUMBER:-255618558502}

read -p "$(echo -e ${CYAN}Bot name (default: ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ): ${NC})" BOT_NAME
BOT_NAME=${BOT_NAME:-ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ}

read -p "$(echo -e ${CYAN}MongoDB URL (recommended, press Enter to skip): ${NC})" MONGO_URL

read -p "$(echo -e ${CYAN}Timezone (default: Africa/Nairobi): ${NC})" TIMEZONE
TIMEZONE=${TIMEZONE:-Africa/Nairobi}

read -p "$(echo -e ${CYAN}Region (default: iad = US East, options: lhr sin bom): ${NC})" REGION
REGION=${REGION:-iad}

echo ""
echo -e "${YELLOW}🚀 Starting deployment...${NC}"
echo ""

# Clone if not in repo
if [ ! -f "fly.toml" ]; then
    echo -e "${YELLOW}📦 Cloning ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ repo...${NC}"
    git clone https://github.com/Stanytz378/IAMLEGEND iamlegend-deploy
    cd iamlegend-deploy
fi

# Update app name and region in fly.toml
sed -i "s/^app = .*/app = \"${APP_NAME}\"/" fly.toml
sed -i "s/^primary_region = .*/primary_region = \"${REGION}\"/" fly.toml

# Launch app (no deploy yet)
echo -e "${YELLOW}📱 Creating Fly.io app: ${APP_NAME}${NC}"
fly launch --no-deploy --name "$APP_NAME" --region "$REGION" --yes 2>/dev/null || true

# Set secrets
echo -e "${YELLOW}⚙️ Setting secrets...${NC}"
fly secrets set \
    SESSION_ID="$SESSION_ID" \
    OWNER_NUMBER="$OWNER_NUMBER" \
    BOT_NAME="$BOT_NAME" \
    TIMEZONE="$TIMEZONE" \
    COMMAND_MODE="public" \
    --app "$APP_NAME"

[ -n "$MONGO_URL" ] && fly secrets set MONGO_URL="$MONGO_URL" --app "$APP_NAME"

# Deploy
echo -e "${YELLOW}📤 Deploying to Fly.io (this may take 3‑5 minutes)...${NC}"
fly deploy --app "$APP_NAME" --dockerfile lib/Dockerfile

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✅ Deployment Complete!        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Logs:${NC}    fly logs -a ${APP_NAME}"
echo -e "${BOLD}Status:${NC}  fly status -a ${APP_NAME}"
echo -e "${BOLD}Stop:${NC}    fly scale count 0 -a ${APP_NAME}"
echo -e "${BOLD}Restart:${NC} fly machine restart -a ${APP_NAME}"
echo ""
echo -e "${CYAN}📱 Scan QR or use Session ID to connect your WhatsApp!${NC}"