import './system/global.js'
import c from 'chalk'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import readline from 'readline'
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from 'baileys'
import { handleCmd, loadAll, ev } from './cmd/handle.js'
import { signal } from './cmd/interactive.js'
import { evConnect, handleSessi } from './connect/evConnect.js' 
import { autofarm, sambungkata, timerhistory, cost_robbery } from './system/gamefunc.js'
import getMessageContent from './system/msg.js'
import { authFarm } from './system/db/data.js'
import { rct_key } from './system/reaction.js'
import { txtWlc, txtLft, mode, banned, bangc } from './system/sys.js'
import { getMetadata, replaceLid, saveLidCache, cleanMsg, filter, imgCache, _imgTmp, afk, filterMsg } from './system/function.js'

global.rl = readline.createInterface({ input: process.stdin, output: process.stdout })
global.q = (t) => new Promise((r) => rl.question(t, r))
global.lidCache = {}

const logLevel = pino({ level: 'silent' }),
      tempDir = path.join(dirname, '../temp')

let xp, ft

if (!imgCache.url) await _imgTmp()

fs.existsSync(tempDir) || fs.mkdirSync(tempDir, { recursive: !0 })
setInterval(() => console.clear(), 6e5)

// ==========================================
// 🧹 SWEEPER GLOBAL (ANTI RAM BENGKAK)
// ==========================================
setInterval(() => {
  if (!xp || !xp.reactionCache) return;
  const now = Date.now()
  for (const [key, msg] of xp.reactionCache.entries()) {
    const msgTime = (msg.messageTimestamp * 1000) || now
    if (now - msgTime > 1800000) xp.reactionCache.delete(key) // Hapus jika > 30 menit
  }
}, 300000) // Dijalankan setiap 5 menit

const startBot = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./connect/session')
    const { version } = await fetchLatestBaileysVersion()
    
    // UI Startup System
    console.clear()
    log(c.cyanBright.bold(`╭──────────────────────────────────────────╮`))
    log(c.cyanBright.bold(`│ `) + c.whiteBright.bold(`🚀 STARTING ALYA BOT SYSTEM`) + c.cyanBright.bold(`            │`))
    log(c.cyanBright.bold(`├──────────────────────────────────────────┤`))
    log(c.cyanBright.bold(`│ `) + c.greenBright(`WA Version : v${version.join('.')}`) + c.cyanBright.bold(`                   │`))
    log(c.cyanBright.bold(`╰──────────────────────────────────────────╯\n`))

    xp = makeWASocket({
      auth: state,
      version: version, 
      printQRInTerminal: !1,
      syncFullHistory: !1,
      logger: logLevel,
      browser: ['Ubuntu', 'Chrome', '20.0.04'] 
    })

    xp.ev.on('creds.update', saveCreds)
    xp.reactionCache ??= new Map();

    // ==========================================
    // 📞 FITUR ANTI TELEPON (CALL REJECTOR)
    // ==========================================
    xp.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status === 'offer') {
                log(c.bgRed.whiteBright.bold(` [ ! ] PANGGILAN MASUK DARI: ${call.from} - OTOMATIS DITOLAK `))
                await xp.rejectCall(call.id, call.from)
                await xp.sendMessage(call.from, { 
                    text: '⚠️ *SISTEM KEAMANAN ALYA BOT*\n\nMohon maaf, bot tidak menerima panggilan telepon. Panggilan Anda telah ditolak otomatis untuk mencegah *server crash*.' 
                })
            }
        }
    })

    // ==========================================
    // 🔑 SISTEM PAIRING CODE
    // ==========================================
    if (!state.creds?.me?.id) {
      try {
       const num = await q(c.cyanBright.bold(' 📱 Masukkan Nomor WhatsApp Bot: '));
       // PENTING: "ALYABOT1" Dihapus agar tidak error status 515 (Gagal Tautkan)
       const code = await xp.requestPairingCode(await global.number(num));
       const show = (code || '').match(/.{1,4}/g)?.join('-') || ''; 
       
       log(c.yellowBright(`\n╭──────────────────────────────────────╮`))
       log(c.yellowBright(`│ `) + c.whiteBright(`Masukkan kode ini di perangkat Anda:`) + c.yellowBright(` │`))
       log(c.yellowBright(`│          `) + c.bgGreen.black.bold(` ${show} `) + c.yellowBright(`             │`))
       log(c.yellowBright(`╰──────────────────────────────────────╯\n`))

      } catch (e) {
        if (e?.output?.statusCode === 428 || /Connection Closed/i.test(e?.message || ''))
          return handleSessi('Pairing timeout', startBot) 
        throw e
      }
    }

    rl.close()
    evConnect(xp, startBot)
    store.bind(xp.ev)
    autofarm()
    timerhistory(xp)
    cost_robbery()

    // ==========================================
    // 📩 HANDLER PESAN MASUK
    // ==========================================
    xp.ev.on('messages.upsert', async ({ messages }) => {
      for (let m of messages) {
        if (m?.message?.messageContextInfo?.deviceListMetadata && !Object.keys(m.message).some(k => k === 'conversation' || k === 'extendedTextMessage')) continue
        if (m.key?.jadibot) continue

        m = cleanMsg(m)
        m = replaceLid(m)
        
        if (m.key && !m.key.fromMe) {
          await xp.readMessages([m.key]).catch(() => {})
        }

        const chat = global.chat(m, botName),
              time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
              meta = chat.group ? (groupCache.get(chat.id) || await getMetadata(chat.id, xp) || {}) : {},
              groupName = chat.group ? meta?.subject || 'Grup' : chat.channel ? chat.id : '',
              { text, media } = getMessageContent(m),
              name = chat.pushName || chat.sender || chat.id,
              isMode = await mode(xp, chat),
              gcData = chat.group && getGc(chat)

        await rct_key(xp, m)
        if (chat.group && Object.keys(meta).length) { await saveLidCache(meta) }

        // 🎨 UI LOGGING CHAT YANG LEBIH KEREN & RAPI
        if (media || text) {
            const isGrp = chat.group
            const logTipe = media ? `[ 📸 ${media} ]` : text
            
            // Baris Header Pesan
            log(c.cyanBright(`[${time}]`) + c.whiteBright(` | `) + 
               (isGrp ? c.greenBright(`👥 ${groupName}`) + c.whiteBright(` | `) : c.magentaBright(`👤 PRIVATE CHAT `) + c.whiteBright(` | `)) + 
               c.yellowBright(`👤 ${name}`))
            
            // Baris Isi Pesan
            log(c.whiteBright(` ╰─> `) + c.cyanBright(logTipe) + `\n`)
        }

        if (banned(chat)) return log(c.bgRed.whiteBright(` [!] ${chat.sender} DIBANNED `))
        if (chat.group && bangc(chat)) return
        if (!(await filterMsg(m, chat, text))) return

        await authFarm(m)
        await afk(xp, m)
        await sambungkata(xp, m)

        if (chat.group) {
          ft = await filter(xp, m, text)
          ft && (
            ft.antiLink(),
            ft.antiTagSw(), 
            ft.antiCh(),
            ft.antiBadSticker(), 
            ft.badword(),
            ft.antiCh(),
            ft.antitag()
          )
        }

        if (!isMode) return

        if (gcData) {
          const { usrAdm, botAdm } = await grupify(xp, m)
          if (gcData.filter?.mute && !usrAdm) return !1
        }

        if (text || media) xp.reactionCache.set(m.key?.id, m)
        if (text) await signal(text, m, xp, ev)
        await handleCmd(m?.key ? m : null, xp, store)
      }
    })

    // ==========================================
    // 👥 EVENT MEMBER GRUP
    // ==========================================
    xp.ev.on('group-participants.update', async u => {
      if (!u.id) return
      groupCache.delete(u.id)

      const meta = await getMetadata(u.id, xp),
            g = meta?.subject || 'Grup',
            idToPhone = Object.fromEntries((meta?.participants || []).map(p => [p.id, p.phoneNumber]))

      for (const pid of u.participants) {
        const phone = pid.phoneNumber || idToPhone[pid],
              msg = u.action === 'add'     ? c.greenBright(`[+] ${phone} JOINED ${g}`) :
                    u.action === 'remove'  ? c.redBright(`[-] ${phone} LEFT ${g}`) :
                    u.action === 'promote' ? c.magentaBright(`[^] ${phone} PROMOTED in ${g}`) :
                    u.action === 'demote'  ? c.cyanBright(`[v] ${phone} DEMOTED in ${g}`) : ''
        
        if(msg) log(msg) // Log aktivitas grup ke terminal

        if (u.action === 'add' || u.action === 'remove') {
          const gcData = getGc({ id: u.id }),
                isAdd = u.action === 'add',
                cfg = isAdd ? gcData?.filter?.welcome?.welcomeGc : gcData?.filter?.left?.leftGc

          if (!gcData || !cfg) return

          const id = { id: u.id },
                { txt } = await (isAdd ? txtWlc : txtLft)(xp, id),
                jid = pid.phoneNumber || idToPhone[pid],
                mention = '@' + (jid?.split('@')[0] || jid),
                text = txt.replace(/@user|%user/gi, mention)

          await xp.sendMessage(u.id, { text, mentions: [jid] })
        }
      }
    })

    xp.ev.on('groups.update', u => 
      u.forEach(async v => {
        if (!v.id) return
        groupCache.delete(v.id)

        const m = await getMetadata(v.id, xp).catch(() => ({})),
              a = v.participantAlt || v.participant || v.author,
              f = a && m?.participants?.length ? m.participants.find(p => p.id === a) : 0
        v.author = f?.phoneNumber || a
      })
    )
  } catch (e) {
    console.error(c.bgRed.whiteBright(' ERROR PADA INDEX.JS: '), e)
  }
}

startBot()
await loadAll()

// ==========================================
// 🛡️ BENTENG ANTI CRASH (GLOBAL ERROR HANDLER)
// ==========================================
process.on('uncaughtException', function (err) {
  console.error(c.bgRed.whiteBright(' [TERTANGKAP] Uncaught Exception: '), err.message)
})
process.on('unhandledRejection', function (err) {
  console.error(c.bgYellow.black(' [TERTANGKAP] Unhandled Rejection: '), err.message)
})
