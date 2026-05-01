const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  })

  // 🔐 Pairing Code System
  if (!sock.authState.creds.registered) {
    const phoneNumber = "92XXXXXXXXXX" // apna number likho (92 se start)

    const code = await sock.requestPairingCode(phoneNumber)
    console.log("📲 Pairing Code:", code)
  }

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) {
        startBot()
      }
    } else if (connection === "open") {
      console.log("✅ Bot Connected Successfully!")
    }
  })

  // 🤖 Message System
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const text = msg.message.conversation || ""

    if (text === "hi") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👑 Bot King Active!"
      })
    }
  })
}

startBot()
