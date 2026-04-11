import axios from 'axios'
import fetch from 'node-fetch'
import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs'
import path from 'path'
import { AIBanana } from '../../lib/scraper/aibanana.js'
import { ChatGPT } from '../../lib/scraper/chatgpt.js' 
import { downloadMediaMessage } from 'baileys'
const config = JSON.parse(fs.readFileSync('./system/set/config.json'))
const komputerzKey = config.apikey.komputerz.key


const gptSessions = new Map()

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
    name: 'ChatGPT Ai',
    cmd: ['gpt', 'chatgpt'],
    tags: 'Ai Menu',
    desc: 'ChatGPT pintar bisa baca gambar & ingat obrolan',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        const text = args.join(' ')
        const isQuotedImage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        const isImage = m.message?.imageMessage
        const imageMsg = isQuotedImage || isImage

        if (!text && !imageMsg) {
          return xp.sendMessage(chat.id, { 
            text: `⚠️ *Cara Penggunaan:*\n\n1. Ketik *${prefix}${cmd} halo* untuk ngobrol.\n2. Kirim/Balas gambar dengan caption *${prefix}${cmd} jelaskan gambar ini*.\n\n_Ketik *${prefix}resetai* untuk menghapus ingatan AI._` 
          }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { text: '⏳ *Sedang berpikir...*' }, { quoted: m })

        // Ambil ID user untuk memori sesi
        const senderId = m.sender || m.key.participant || chat.id
        const session = gptSessions.get(senderId) || {}

        // Inisialisasi AI
        const gpt = new ChatGPT({ lang: 'id-ID' })
        const opts = {
          conversationId: session.conversationId, // Lanjut obrolan
          parentMessageId: session.messageId,     // Lanjut obrolan
        }

        let tmpFile = null

        // Logika jika user mengirim gambar
        if (imageMsg) {
          const stream = await downloadContentFromMessage(imageMsg, 'image')
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }
          
          // Simpan gambar sementara untuk dibaca AI
          tmpFile = path.join(process.cwd(), `temp_gpt_${Date.now()}.jpg`)
          fs.writeFileSync(tmpFile, buffer)
          opts.imagePath = tmpFile // Masukkan path gambar ke opsi AI
        }

        // Teks default jika user hanya kirim gambar tanpa teks
        const prompt = text || "Tolong jelaskan gambar apa ini secara detail."

        // 🚀 EKSEKUSI KE CHATGPT SHANNZ
        const res = await gpt.send(prompt, opts)

        // Simpan sesi terbaru agar obrolan bisa nyambung terus
        gptSessions.set(senderId, {
          conversationId: res.conversationId,
          messageId: res.messageId
        })

        // Hapus gambar sementara setelah selesai dibaca
        if (tmpFile && fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile)
        }

        // Kirim hasil ke WhatsApp
        await xp.sendMessage(chat.id, { text: res.text }, { quoted: m })

      } catch (e) {
        console.error('Error GPT:', e)
        await xp.sendMessage(chat.id, { text: `❌ Terjadi kesalahan sistem AI: ${e.message}` }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'AI Image Banana',
    cmd: ['aiimg', 'imagine', 'txt2img'],
    tags: 'Ai Menu',
    desc: 'Membuat gambar AI dari teks deskripsi',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        const prompt = args.join(' ')
        if (!prompt) {
          return xp.sendMessage(chat.id, { 
              text: `⚠️ *Harap masukkan deskripsi gambar!*\n\nContoh penggunaan:\n*${prefix}${cmd} cat drinking coffee in a cyberpunk city*` 
          }, { quoted: m })
        }
  
        // Kirim reaksi dan pesan loading
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
        const loadingMsg = await xp.sendMessage(chat.id, { text: '🎨 Sedang melukis mahakarya, tunggu sebentar komandan...' }, { quoted: m })

        // Eksekusi scraper
        const banana = new AIBanana()
        const result = await banana.generateImage(prompt)

        let imageUrl = ''
      
        // Deteksi struktur response API secara brutal (Aman dari tipe data ghaib)
        if (typeof result === 'string') {
            imageUrl = result
        } else if (result?.images?.[0]) {
            imageUrl = result.images[0]
        } else if (result?.image) {
            imageUrl = result.image
        } else if (result?.url) {
            imageUrl = result.url
        } else if (result?.data?.[0]?.url) {
            imageUrl = result.data[0].url
        } else if (result?.data?.[0]?.b64_json) {
            imageUrl = result.data[0].b64_json
        } else {
            // Jika struktur JSON benar-benar aneh, cetak ke terminal
            console.log('Result AI Banana:', JSON.stringify(result, null, 2))
            return xp.sendMessage(chat.id, { text: '❌ Server AI berhasil memproses, tapi gagal membaca format gambar. Cek log terminal komandan!' }, { quoted: m })
        }

        // Benteng Pertahanan: Pastikan imageUrl adalah String sebelum dieksekusi
        if (typeof imageUrl !== 'string') {
            imageUrl = String(imageUrl) // Paksa jadi string jika membandel
        }

        let finalMedia;
      
        // Eksekusi Gambar sesuai Formatnya
        if (imageUrl.startsWith('http')) {
            // Format Link URL
            finalMedia = { url: imageUrl }
        } else if (imageUrl.startsWith('data:image')) {
            // Format Base64 ber-prefix
            const base64Data = imageUrl.split(';base64,').pop()
            finalMedia = Buffer.from(base64Data, 'base64')
        } else {
            // Format Base64 mentah murni (tanpa prefix data:image)
            finalMedia = Buffer.from(imageUrl, 'base64')
        }

        // Kirim hasil gambar
        await xp.sendMessage(chat.id, { 
            image: finalMedia, 
            caption: `🎨 *Prompt:* ${prompt}\n✨ *Source:* AIBanana Model`,
        }, { quoted: m })

        // Edit pesan loading jadi sukses
        await xp.sendMessage(chat.id, { text: '✅ Mahakarya berhasil dilukis!', edit: loadingMsg.key })
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (err) {
        console.error(err)
        await xp.sendMessage(chat.id, { text: '❌ *Gagal membuat gambar!*\nServer AI mungkin sedang sibuk atau sistem bypass Cloudflare gagal.' }, { quoted: m })
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
      }
    }
  })

  ev.on({
    name: 'imagine ai',
    cmd: ['imagine', 'flux'],
    tags: 'Ai Menu',
    desc: 'Membuat gambar dari teks menggunakan Komputerz AI (Model Flux)',
    owner: !1,
    prefix: !0,
    money: 150, // Biaya bot
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const prompt = args.join(' ').trim()

        if (!prompt) {
          return xp.sendMessage(chat.id, { 
            text: `Mau bikin gambar apa nih?\n*Contoh:* ${prefix}${cmd} Kucing oren pakai jaket kulit naik motor balap` 
          }, { quoted: m })
        }

        // Reaksi loading
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // ⚠️ PENTING: Ganti dengan API Key kamu sendiri dari komputerz.site
        const apikey = komputerzKey
        
        const url = new URL("https://api.komputerz.site/api/v1/ai/imagine")
        url.searchParams.set("apikey", apikey)
        url.searchParams.set("prompt", prompt)
        url.searchParams.set("model", "flux") // Kamu bisa sesuaikan modelnya jika ada model lain
        // url.searchParams.set("width", "1024") // Aktifkan jika butuh resolusi spesifik
        // url.searchParams.set("height", "1024") 

        // Eksekusi request API
        const res = await fetch(url)
        const data = await res.json()

        // Validasi respon dari API
        if (!data.status || !data.result?.image_url) {
           return xp.sendMessage(chat.id, { 
             text: `❌ *Gagal:* ${data.message || 'API tidak merespon dengan benar. Cek kembali apikey kamu.'}` 
           }, { quoted: m })
        }

        const imageUrl = data.result.image_url
        const sisaLimit = data.remaining

        // Susun pesan balasan
        const caption = `🎨 *Prompt:* ${prompt}\n🤖 *Model:* ${data.result.model}\n🔋 *Limit API:* ${sisaLimit} tersisa\n\n> *Powered by ${global.botName || 'Code_Bot'}*`

        // Kirim gambar (karena url valid, Baileys bisa langsung baca dari URL-nya)
        await xp.sendMessage(chat.id, { 
          image: { url: imageUrl }, 
          caption: caption 
        }, { quoted: m })

        // Reaksi sukses
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        await xp.sendMessage(chat.id, { 
          text: `❌ Terjadi kesalahan sistem saat mencoba memproses gambar.` 
        }, { quoted: m })
      }
    }
  })
  
  ev.on({
    name: 'nano edit',
    cmd: ['nanoedit', 'aiedit', 'editfoto'],
    tags: 'AI Image Menu',
    desc: 'Edit teks atau objek pada foto menggunakan AI',
    owner: !1, // Bisa dipakai member
    prefix: !0,
    money: 25, // Kasih harga lumayan karena proses AI lumayan berat
    exp: 1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const prompt = args.join(' ')
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const isImage = (q?.imageMessage || m.message?.imageMessage)

        // Validasi input (Wajib ada gambar dan prompt)
        if (!isImage || !prompt) {
          return xp.sendMessage(chat.id, {
            text: `⚠️ *Format salah!*\n\nReply/kirim gambar dengan caption *${prefix}${cmd} <perintah edit>*\n\n💬 *Contoh:* ${prefix}${cmd} edit kata kata pada foto berikan dengan kata "apalah tai"`
          }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // ==========================================
        // 1. UPLOAD GAMBAR KE NEOAPIS (Ambil URL)
        // ==========================================
        const mediaBuffer = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!mediaBuffer) throw new Error('Gagal mengunduh gambar dari WA.')

        const fileInfo = await fileTypeFromBuffer(mediaBuffer)
        const ext = fileInfo ? fileInfo.ext : 'jpg'
        const mime = fileInfo ? fileInfo.mime : 'image/jpeg'
        const fileName = `nanoedit-${Date.now()}.${ext}`
        const fileSize = mediaBuffer.length

        // Tahap A: Presign
        const presignRes = await axios.post('https://www.neoapis.xyz/uploader/presign', {
          fileName: fileName, mimeType: mime, expiry: "permanent", fileSize: fileSize
        }, { headers: { 'Content-Type': 'application/json' } })

        if (!presignRes.data?.status) throw new Error('Gagal mendapatkan akses upload.')
        const { presignedUrl, fileUrl, expiresAt } = presignRes.data

        // Tahap B: PUT File
        await axios.put(presignedUrl, mediaBuffer, { headers: { 'Content-Type': mime } })

        // Tahap C: Confirm File
        await axios.post('https://www.neoapis.xyz/uploader/confirm', {
          fileUrl: fileUrl, fileName: fileName, mimeType: mime, fileSize: fileSize,
          expiry: "Permanent", expiresAt: expiresAt
        }, { headers: { 'Content-Type': 'application/json' } })

        // ==========================================
        // 2. PROSES KE AI NANOEDIT
        // ==========================================
        // Gunakan fileUrl yang baru saja di-upload sebagai bahan editan AI
        const apiUrl = `https://www.neoapis.xyz/api/ai-image/nanoedit?url=${encodeURIComponent(fileUrl)}&prompt=${encodeURIComponent(prompt)}`

        const aiRes = await axios.get(apiUrl, {
            headers: { 'Accept': 'application/json' }
        })

        // Ambil link hasil editan dari JSON (res.data.data.image)
        const resultImage = aiRes.data?.data?.image

        if (!resultImage) throw new Error('AI gagal memproses gambar.')

        // ==========================================
        // 3. KIRIM HASIL KE WHATSAPP
        // ==========================================
        await xp.sendMessage(chat.id, {
          image: { url: resultImage },
          caption: `✨ *AI NANO EDIT*\n\n💬 *Perintah:* ${prompt}\n> *Powered by Alya-Ai*`
        }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e.message || e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        
        let errorMsg = 'Gagal memproses AI Edit.'
        if (e.response?.status === 429) errorMsg = 'Limit API dari NeoAPIs sudah habis, coba lagi nanti.'
        
        await xp.sendMessage(chat.id, { text: `❌ ${errorMsg}\n*Detail:* ${e.message}` }, { quoted: m })
      }
    }
  })
  
  ev.on({
    name: 'auto ai',
    cmd: ['autoai'],
    tags: 'Ai Menu',
    desc: 'Fitur Auto AI khusus Grup dengan memori permanen',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Fitur Auto AI ini dirancang khusus untuk Grup!' }, { quoted: m })

        const val = args[0]?.toLowerCase()

        if (!['on', 'off', 'reset'].includes(val)) {
          let txt = `⚙️ *SETTING AUTO AI GRUP*\n\n`
          txt += `Gunakan perintah:\n`
          txt += `👉 *${prefix}${cmd} on* (Aktifkan Auto AI)\n`
          txt += `👉 *${prefix}${cmd} off* (Matikan Auto AI)\n`
          txt += `👉 *${prefix}${cmd} reset* (Hapus ingatan AI di grup ini)`
          return xp.sendMessage(chat.id, { text: txt }, { quoted: m })
        }

        // Setup Database JSON Permanen
        const dbFolder = './system/db'
        const dbPath = './system/db/autoai.json'

        if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true })
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}))
        
        const aiDb = JSON.parse(fs.readFileSync(dbPath))

        if (!aiDb[chat.id]) {
          aiDb[chat.id] = { status: false, conversationId: null, messageId: null }
        }

        // Fitur Reset Memori Grup
        if (val === 'reset') {
           aiDb[chat.id].conversationId = null
           aiDb[chat.id].messageId = null
           fs.writeFileSync(dbPath, JSON.stringify(aiDb, null, 2))
           return xp.sendMessage(chat.id, { text: '✅ Ingatan Auto AI di grup ini berhasil dicuci bersih!' }, { quoted: m })
        }

        const value = val === 'on'
        const opsi = aiDb[chat.id].status

        if ((value && opsi) || (!value && !opsi)) {
          return xp.sendMessage(chat.id, { text: `⚠️ Auto AI sudah dalam keadaan ${value ? 'AKTIF' : 'NONAKTIF'} di grup ini.` }, { quoted: m })
        }

        aiDb[chat.id].status = value
        fs.writeFileSync(dbPath, JSON.stringify(aiDb, null, 2))

        await xp.sendMessage(chat.id, { text: `✅ Auto AI berhasil ${value ? '*DIAKTIFKAN*' : '*DINONAKTIFKAN*'} untuk grup ini.` }, { quoted: m })
      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
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