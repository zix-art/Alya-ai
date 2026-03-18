import axios from 'axios'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { downloadMediaMessage } from 'baileys'

// Fungsi untuk menangani request tipe Stream dari API Atha
async function fetchAthaAI(prompt, sessionId) {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://chatbot.athabima.workers.dev/api/chat',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      data: {
        message: prompt,
        sessionId: sessionId, // <-- Session ID per user masuk ke sini
        stream: true,
        userMemory: "",
        focusMode: ""
      },
      responseType: 'stream'
    })

    return new Promise((resolve, reject) => {
      let fullText = ""

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n')
        
        for (let line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim()
            if (!jsonStr) continue
            
            try {
              const data = JSON.parse(jsonStr)
              
              if (data.token) fullText += data.token
              if (data.done) resolve(fullText.trim())
              
            } catch (e) {
              // Abaikan error parse kalau JSON kepotong di tengah stream
            }
          }
        }
      })

      response.data.on('end', () => resolve(fullText.trim()))
      response.data.on('error', (err) => reject(err))
    })
    
  } catch (err) {
    throw new Error("Gagal terhubung ke API AI")
  }
}

export default function ai(ev) {
  ev.on({
    name: 'auto ai',
    cmd: ['ai', 'bell'],
    tags: 'Ai Menu',
    desc: 'Fitur open ai',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.2,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const val = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(val)) 
          return xp.sendMessage(chat.id, { text: `Gunakan perintah ${prefix}${cmd} on/off` }, { quoted: m });

        const value = val === 'on',
              userdb = Object.values(db().key).find(u => u.jid === chat.sender),
              opsi = !!userdb?.ai?.bell

        if ((value && opsi) || (!value && !opsi)) {
          return xp.sendMessage(chat.id, { text: `${cmd} sudah ${value ? 'aktif' : 'nonaktif'}`
          }, { quoted: m })
        }

        userdb.ai.bell = value
        save.db()

        xp.sendMessage(chat.id, { text: `${cmd} telah ${value ? 'diaktifkan' : 'dinonaktifkan'}.` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
  
    ev.on({
    name: 'atha ai',
    cmd: ['atha', 'ask'], // Jangan pakai 'ai' lagi biar nggak bentrok dengan auto ai
    tags: 'Ai Menu',
    desc: 'Chat dengan Atha AI (Mengingat Obrolan)',
    owner: !1,
    prefix: !0,
    money: 10,
    exp: 0.2,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = args.join(" ")
        
        if (!text) {
          return xp.sendMessage(chat.id, {
            text: `Mau tanya apa nih?\nContoh: ${prefix}${cmd} namaku siapa?`
          }, { quoted: m })
        }

        // React jam pasir biar user tahu bot lagi mikir
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // Bikin sessionId unik berdasarkan nomor WA user
        // Contoh chat.sender: "62812xxx@s.whatsapp.net" -> diubah jadi "s_62812xxx"
        const senderNumber = chat.sender.split('@')[0]
        const sessionId = `s_${senderNumber}`

        // Panggil fungsi stream AI dengan sessionId khusus user ini
        const result = await fetchAthaAI(text, sessionId)

        // Kirim hasil balasan
        await xp.sendMessage(chat.id, { text: result }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        xp.sendMessage(chat.id, { text: `❌ Waduh, AI-nya error: ${e.message}` }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'cek key',
    cmd: ['cekkey', 'key'],
    tags: 'Ai Menu',
    desc: 'cek key termai',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const res = await fetch(`${termaiWeb}/api/tools/key-checker?key=${termaiKey}`),
              json = await res.json();

        if (!json.status) {
          return xp.sendMessage(chat.id, { text: `gagal mengambil data api ${json.data}` }, { quoted: m })
        }

        const d = json.data,
              formatTime = ({ days, hours, minutes, seconds }) =>
              [days && `${days} hari`, hours && `${hours} jam`, minutes && `${minutes} menit`, seconds && `${seconds} detik`]
                .filter(Boolean)
                .join(", ");

        let txt = `${head}${opb} *Info API Key* ${clb}\n` +
          `${body} ${btn} *Plan:* ${d.plan}\n` +
          `${body} ${btn} *Limit:* ${d.limit}\n` +
          `${body} ${btn} *Usage:* ${d.usage}\n` +
          `${body} ${btn} *Total Hit:* ${d.totalHit}\n` +
          `${body} ${btn} *Remaining:* ${d.remaining}\n` +
          `${body} ${btn} *Reset:* ${d.reset}\n` +
          `${body} ${btn} *Reset Dalam:* ${formatTime(d.resetEvery.format)}\n` +
          `${body} ${btn} *Expired:* ${d.expired}\n` +
          `${body} ${btn} *Expired?:* ${d.isExpired ? "Ya" : "Tidak"}\n` +
          `${foot}${line}\n\n` +
          `${head} *Fitur & Pemakaian:*\n`;

        for (const [fitur, detail] of Object.entries(d.features)) {
          if (typeof detail !== "object") continue;
          txt += `${body} ${btn} ${fitur}:\n` +
            `${body} ${btn} *Max:* ${detail.max ?? "-"}\n` +
            `${body} ${btn} *Use:* ${detail.use ?? "-"}\n` +
            `${body} ${btn} *Hit:* ${detail.hit ?? "-"}\n` +
            (detail.lastReset ? `${body} ${btn} *Last Reset:* ${new Date(detail.lastReset).toLocaleString("id-ID")}\n` : "") +
            `${body} ${line}\n`;
        }

        txt += `${body} Api Dari ${termaiWeb}\n${foot}${line}\n`;

        xp.sendMessage(chat.id, { text: txt.trim() }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'img2img',
    cmd: ['img2img', 'i2i'],
    tags: 'Ai Menu',
    desc: 'edit gambar dengan generatif ai',
    owner: !1,
    prefix: !0,
    money: 1000,
    exp: 0.3,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const prompt = args.join(" "),
              q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              quotedKey = m.message?.extendedTextMessage?.contextInfo,
              image = q?.imageMessage || m.message?.imageMessage

        if (!image && !prompt) {
          return xp.sendMessage(chat.id, { text: !image ? `reply/kirim gambar dengan caption ${prefix}${cmd} prompt` : `sertakan prompt\ncontoh prompt: ${prefix}${cmd} ubah kulitnya jadi hitam` }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        let media
        try {
          if (q?.imageMessage) {
            media = await downloadMediaMessage({ key: quotedKey, message: q }, 'buffer')
          } else if (m.message?.imageMessage) {
            media = await downloadMediaMessage(m, 'buffer')
          }
          if (!media) throw new Error('media tidak terunduh')
        } catch (e) {
          err('gagal mengunduh media', e)
        }

        const res = await fetch(`${termaiWeb}/api/img2img/edit?key=${termaiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, image: media })
        })

        if (!res.ok) throw new Error(`API Error: ${res.statusText} (${res.status})`)

        const array = await res.arrayBuffer(),
              imgBuffer = Buffer.from(array)

        await xp.sendMessage(chat.id, { image: imgBuffer, caption: `hasil dengan prompt: ${prompt}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'img2vid',
    cmd: ['i2v', 'img2vid'],
    tags: 'Ai Menu',
    desc: 'ubah gambar jadi video',
    owner: !1,
    prefix: !0,
    money: 1500,
    exp: 0.2,
  
    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo,
              mediaMessage = q?.quotedMessage?.imageMessage || m.message?.imageMessage,
              prompt = args.join(' ')

        if (!mediaMessage || !prompt)
          return xp.sendMessage(chat.id, { text: `mana gambar nya?\ncontoh: ${prefix}${cmd} perhalus gerakannya` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const media = await downloadMediaMessage({ message: { imageMessage: mediaMessage } }, 'buffer')
        if (!media) throw new Error('gagal mengunduh gambar')

        const response = await axios.post(
          `${termaiWeb}/api/img2video/luma?key=${termaiKey}&prompt=${encodeURIComponent(prompt)}`,
          media, {
            headers: { "Content-Type": "application/octet-stream" },
            responseType: "stream"
          })

        let lastUrl = null,
            finished = !1

        response.data.on('data', chunk => {
          if (finished) return

          try {
            const lines = chunk.toString()
                               .split('\n')
                               .filter(v => v.startsWith('data: '))

            for (const line of lines) {
              const data = JSON.parse(line.slice(6))

              if (data.url) lastUrl = data.url

              if (data.status === 'failed') {
                finished = !0
                response.data.destroy()
                return call(xp, new Error('gagal generate video'), m)
              }

              if (data.status === 'completed') {
                finished = !0
                response.data.destroy()

                const videoUrl = data?.video?.url || data?.url || lastUrl
                if (!videoUrl)
                  return call(xp, new Error('video tidak ditemukan'), m)

                return xp.sendMessage(chat.id, { video: { url: videoUrl }, caption: 'berhasil convert gambar ke video' }, { quoted: m })
              }
            }
          } catch (e) {
            finished = !0
            response.data.destroy()
            call(xp, e, m)
          }
        })

        response.data.on('error', e => {
          if (finished) return
          finished = !0
          call(xp, e, m)
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'reset bell',
    cmd: ['resetbell', 'reset'],
    tags: 'Ai Menu',
    desc: 'Reset sesi AI Bell',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          || m.message?.extendedTextMessage?.contextInfo?.participant
          || chat.sender

        if (!target) 
          return await xp.sendMessage(chat.id, { text: 'Target tidak ditemukan.' }, { quoted: m })

        const res  = await fetch(`${termaiWeb}/api/chat/logic-bell/reset?id=${target}&key=${termaiKey}`),
              json = await res.json()

        await xp.sendMessage(chat.id, { text: json.m || json.msg || 'Terjadi error saat reset sesi Bell.' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'setlogic',
    cmd: ['setlogic'],
    tags: 'Ai Menu',
    desc: 'setting logika ai',
    owner: !0,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const ctx = m.message?.extendedTextMessage?.contextInfo,
              q = ctx?.quotedMessage?.conversation,
              cfg = JSON.parse(fs.readFileSync('./system/set/config.json', 'utf-8')),
              newLogic = q || args.join(' ')

        if (!newLogic) return xp.sendMessage(chat.id, { text: `contoh:\n${prefix}${cmd} teks logika\n\nlogika saat ini:\n${cfg?.botSetting?.logic || 'belum di setting'}` }, { quoted: m })

        cfg.botSetting.logic = newLogic
        fs.writeFileSync('./system/set/config.json', JSON.stringify(cfg, null, 2))

        await xp.sendMessage(chat.id, { text: `logic ai berhasil diubah ke:\n${newLogic}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}
