# WARFARE MULTIPLAYER — HOW TO PUBLISH (Free!)

## What you have:
- server.js       → the server that connects all players
- package.json    → tells the server what tools it needs
- public/
  └── index.html  → the actual game

---

## STEP 1 — Install Node.js (if you don't have it)
Go to: https://nodejs.org
Download the "LTS" version and install it.

---

## STEP 2 — Test it on your own computer first
Open a terminal (search "Terminal" or "Command Prompt" on your PC).

Type these commands one at a time:
  cd warfare-multiplayer
  npm install
  node server.js

You should see: "Warfare server running on port 3000"

Open your browser and go to: http://localhost:3000
You should see the game! Open two tabs to test with yourself.

---

## STEP 3 — Put it on the internet (FREE with Railway)

1. Go to https://railway.app and make a free account
2. Download GitHub Desktop: https://desktop.github.com
3. Create a new GitHub repo and add your warfare-multiplayer folder
4. In Railway, click "New Project" → "Deploy from GitHub repo"
5. Select your repo → Railway will auto-deploy it!
6. Click "Settings" → "Domains" → "Generate Domain"
7. You'll get a free URL like: https://warfare-abc123.railway.app

Share that URL with friends — they open it in their browser and you're playing together!

---

## How rooms work:
- Players type the SAME room code to join the same match
- Different room code = different match, can't see each other
- Works from anywhere in the world!

---

## Troubleshooting:
- "npm not found" → Node.js didn't install right, try again
- Game loads but players don't see each other → make sure same room code
- Railway deploy fails → check that server.js and package.json are in the ROOT folder

---

## Want real money payments later?
Look into: https://stripe.com (free to sign up, they take a small % per sale)
You'd add Stripe to your server.js to handle credit purchases.
