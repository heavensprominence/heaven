#!/usr/bin/env python3
"""
HeavensLive Automated Marketing Pipeline
Scheduled cross-platform posting: YouTube, Telegram, auto-generated content.
Run via cron: 0 9,15,21 * * * python3 /path/to/marketing-pipeline.py
"""
import asyncio, os, pickle, json, time, random
from datetime import datetime
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from telegram import Bot
import subprocess

# === Config ===
CLIENT_SECRET = os.path.expanduser("~/.openclaw/workspace/client_secret.json")
TOKEN_FILE = os.path.expanduser("~/.openclaw/workspace/youtube-token.pickle")
TG_BOT = "8748162639:AAGtvrLV6isqNPTvjccvUJ75Ga2kZ7Yjqs0"
TG_CHANNEL = "@heavenslive"
STATE_FILE = os.path.expanduser("~/.openclaw/workspace/.marketing-state.json")

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

# === Content Library ===
CONTENT = [
    {
        "type": "text",
        "platforms": ["telegram"],
        "text": (
            "🙏 Start your day with divine intention.\n\n"
            "Browse the marketplace with prayer audio — available on every platform.\n\n"
            "🔗 heavenslive.com"
        ),
        "schedule": "morning",
    },
    {
        "type": "text",
        "platforms": ["telegram"],
        "text": (
            "💡 Seller tip: Use the AI Listing Assistant to create perfect listings in seconds.\n"
            "Describe your item in plain language — AI fills everything else.\n\n"
            "🔗 heavenslive.com/shop/create"
        ),
        "schedule": "afternoon",
    },
    {
        "type": "text",
        "platforms": ["telegram"],
        "text": (
            "💳 Credon Wallet — borderless banking, built in.\n"
            "Send money, exchange currencies, get loans. Free for all users.\n\n"
            "🔗 heavenslive.com/credon/"
        ),
        "schedule": "evening",
    },
]

# === YouTube Auth ===
def get_youtube():
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as f: creds = pickle.load(f)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
            creds = flow.run_local_server(port=0, open_browser=False)
        with open(TOKEN_FILE, "wb") as f: pickle.dump(creds, f)
    return build("youtube", "v3", credentials=creds)

# === State ===
def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f: return json.load(f)
    return {"last_run": None, "posts_made": 0, "schedule_index": 0}

def save_state(s):
    with open(STATE_FILE, "w") as f: json.dump(s, f)

# === Posting ===
async def post_telegram(text):
    bot = Bot(TG_BOT)
    try:
        await bot.send_message(TG_CHANNEL, text)
        print(f"  ✅ Telegram: sent")
    except Exception as e:
        print(f"  ❌ Telegram: {e}")

def post_social_media(text, platforms):
    """Post to available platforms."""
    for platform in platforms:
        if platform == "telegram":
            asyncio.run(post_telegram(text))

# === Main ===
def main():
    state = load_state()
    now = datetime.now()
    hour = now.hour
    
    # Determine schedule slot
    if hour < 12: slot = "morning"
    elif hour < 17: slot = "afternoon"
    else: slot = "evening"
    
    print(f"📣 Marketing Pipeline — {now.strftime('%Y-%m-%d %H:%M')} ({slot})")
    
    # Post content for this slot
    posts_today = [c for c in CONTENT if c["schedule"] == slot]
    if posts_today:
        content = random.choice(posts_today)
        post_social_media(content["text"], content["platforms"])
        state["posts_made"] += 1
    
    state["last_run"] = now.isoformat()
    save_state(state)
    print(f"✅ Pipeline complete. Total posts: {state['posts_made']}")

if __name__ == "__main__":
    main()
