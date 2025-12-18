const TelegramBot = require('node-telegram-bot-api');
const { Connection, PublicKey } = require('@solana/web3.js');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');

// Config
const BOT_TOKEN = '8217371800:AAF4Aoq3DdZefncNBtQM9G2dC1LH-BtuB3M';
const HONK_MINT = '3ag1Mj9AKz9FAkCQ6gAEhpLSX8B2pUbPdkb9iBsDLZNB';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const DEX_CHECK_INTERVAL = 180000; // 3 minutes
const RPC_CHECK_INTERVAL = 300000; // 5 minutes

// Initialize
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const connection = new Connection(SOLANA_RPC, 'confirmed');
const db = new Database('whale_tracker.db');

// Database setup
db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    label TEXT,
    cluster_id INTEGER,
    is_exchange INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signature TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    tx_type TEXT,
    amount REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Helper functions
function getChatId() {
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('chat_id');
  return result ? result.value : null;
}

function setChatId(chatId) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('chat_id', chatId);
}

async function sendAlert(message) {
  const chatId = getChatId();
  if (!chatId) return;
  
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error sending alert:', error.message);
  }
}

function getWalletInfo(address) {
  return db.prepare(`
    SELECT w.*, c.name as cluster_name 
    FROM wallets w 
    LEFT JOIN clusters c ON w.cluster_id = c.id 
    WHERE w.address = ?
  `).get(address);
}

function formatAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Solana RPC monitoring
async function checkWalletTransactions(walletAddress) {
  try {
    const pubkey = new PublicKey(walletAddress);
    
    // Get recent signatures
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 10 });
    
    for (const sigInfo of signatures) {
      // Check if we've already processed this transaction
      const exists = db.prepare('SELECT id FROM transactions WHERE signature = ?').get(sigInfo.signature);
      if (exists) continue;

      // Get transaction details
      const tx = await connection.getParsedTransaction(sigInfo.signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.meta) continue;

      // Parse for token transfers
      const preBalances = tx.meta.preTokenBalances || [];
      const postBalances = tx.meta.postTokenBalances || [];

      for (let i = 0; i < postBalances.length; i++) {
        const post = postBalances[i];
        if (post.mint !== HONK_MINT) continue;

        const pre = preBalances.find(p => p.accountIndex === post.accountIndex);
        if (!pre) continue;

        const preAmount = parseFloat(pre.uiTokenAmount.uiAmountString || 0);
        const postAmount = parseFloat(post.uiTokenAmount.uiAmountString || 0);
        const diff = postAmount - preAmount;

        if (Math.abs(diff) < 0.01) continue; // Ignore dust

        // Record transaction
        db.prepare('INSERT OR IGNORE INTO transactions (signature, wallet_address, tx_type, amount) VALUES (?, ?, ?, ?)').run(
          sigInfo.signature,
          walletAddress,
          diff > 0 ? 'receive' : 'send',
          Math.abs(diff)
        );

        // Send alert
        const walletInfo = getWalletInfo(walletAddress);
        const label = walletInfo?.label || formatAddress(walletAddress);
        const cluster = walletInfo?.cluster_name ? ` [${walletInfo.cluster_name}]` : '';
        const type = diff > 0 ? '🟢 RECEIVED' : '🔴 SENT';
        const exchangeTag = walletInfo?.is_exchange ? ' 🏦 EXCHANGE' : '';

        const message = `
<b>${type} $HONK${exchangeTag}</b>
${cluster}

💼 Wallet: <code>${label}</code>
💰 Amount: ${Math.abs(diff).toLocaleString()} HONK
🔗 <a href="https://solscan.io/tx/${sigInfo.signature}">View Transaction</a>
        `.trim();

        await sendAlert(message);
      }
    }
  } catch (error) {
    console.error(`Error checking wallet ${walletAddress}:`, error.message);
  }
}

async function monitorAllWallets() {
  const wallets = db.prepare('SELECT address FROM wallets').all();
  
  for (const wallet of wallets) {
    await checkWalletTransactions(wallet.address);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  setChatId(chatId);
  
  bot.sendMessage(chatId, `
🐋 <b>Whale Tracker Bot Activated!</b>

<b>Your Chat ID: ${chatId}</b>

<b>Commands:</b>
/addwallet [address] [label] - Add wallet to track
/addcluster [name] - Create wallet cluster
/assigncluster [address] [cluster] - Assign wallet to cluster
/addexchange [address] [label] - Mark wallet as exchange
/listwallet - List all tracked wallets
/listcluster - List all clusters
/remove [address] - Remove wallet
/status - Bot status

Monitoring $HONK on Solana 🚀
  `.trim(), { parse_mode: 'HTML' });
});

bot.onText(/\/addwallet (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const params = match[1].split(' ');
  const address = params[0];
  const label = params.slice(1).join(' ') || null;

  try {
    new PublicKey(address);
    db.prepare('INSERT OR IGNORE INTO wallets (address, label) VALUES (?, ?)').run(address, label);
    bot.sendMessage(chatId, `✅ Wallet added: ${label || formatAddress(address)}`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Invalid wallet address`);
  }
});

bot.onText(/\/addcluster (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const name = match[1];
  
  try {
    db.prepare('INSERT INTO clusters (name) VALUES (?)').run(name);
    bot.sendMessage(chatId, `✅ Cluster created: ${name}`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Cluster already exists`);
  }
});

bot.onText(/\/assigncluster (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const params = match[1].split(' ');
  const address = params[0];
  const clusterName = params.slice(1).join(' ');

  const cluster = db.prepare('SELECT id FROM clusters WHERE name = ?').get(clusterName);
  
  if (!cluster) {
    bot.sendMessage(chatId, `❌ Cluster not found`);
    return;
  }

  db.prepare('UPDATE wallets SET cluster_id = ? WHERE address = ?').run(cluster.id, address);
  bot.sendMessage(chatId, `✅ Wallet assigned to cluster: ${clusterName}`);
});

bot.onText(/\/addexchange (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const params = match[1].split(' ');
  const address = params[0];
  const label = params.slice(1).join(' ') || 'Exchange';

  try {
    new PublicKey(address);
    db.prepare('INSERT OR REPLACE INTO wallets (address, label, is_exchange) VALUES (?, ?, 1)').run(address, label);
    bot.sendMessage(chatId, `✅ Exchange wallet added: ${label}`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Invalid wallet address`);
  }
});

bot.onText(/\/listwallet/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const wallets = db.prepare(`
    SELECT w.address, w.label, c.name as cluster_name, w.is_exchange
    FROM wallets w
    LEFT JOIN clusters c ON w.cluster_id = c.id
  `).all();

  if (wallets.length === 0) {
    bot.sendMessage(chatId, 'No wallets tracked yet.');
    return;
  }

  let message = '<b>📋 Tracked Wallets:</b>\n\n';
  wallets.forEach(w => {
    const label = w.label || formatAddress(w.address);
    const cluster = w.cluster_name ? ` [${w.cluster_name}]` : '';
    const exchange = w.is_exchange ? ' 🏦' : '';
    message += `${label}${cluster}${exchange}\n<code>${w.address}</code>\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

bot.onText(/\/listcluster/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const clusters = db.prepare('SELECT * FROM clusters').all();

  if (clusters.length === 0) {
    bot.sendMessage(chatId, 'No clusters created yet.');
    return;
  }

  let message = '<b>📁 Clusters:</b>\n\n';
  clusters.forEach(c => {
    const walletCount = db.prepare('SELECT COUNT(*) as count FROM wallets WHERE cluster_id = ?').get(c.id).count;
    message += `${c.name} (${walletCount} wallets)\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const address = match[1];
  
  db.prepare('DELETE FROM wallets WHERE address = ?').run(address);
  bot.sendMessage(chatId, `✅ Wallet removed`);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== getChatId()) return;

  const walletCount = db.prepare('SELECT COUNT(*) as count FROM wallets').get().count;
  const clusterCount = db.prepare('SELECT COUNT(*) as count FROM clusters').get().count;
  const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;

  const message = `
<b>🤖 Bot Status</b>

📊 Tracking: ${walletCount} wallets
📁 Clusters: ${clusterCount}
📈 Transactions logged: ${txCount}

⏱ Checking wallets every 5 minutes

Token: $HONK
Network: Solana
  `.trim();

  bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

// Start monitoring loop
setInterval(monitorAllWallets, RPC_CHECK_INTERVAL);

// Initial check after 30 seconds
setTimeout(monitorAllWallets, 30000);

console.log('🐋 Whale Tracker Bot started!');
console.log('Token:', HONK_MINT);
console.log('Check interval:', RPC_CHECK_INTERVAL / 1000, 'seconds');