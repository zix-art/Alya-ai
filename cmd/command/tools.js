import axios from 'axios'
import fromdt from 'form-data'
import fs from 'fs'
import os from 'os'
import path from 'path'
import c from 'chalk'
import util from 'util'
import fetch from 'node-fetch'
import { vn } from '../interactive.js'
import { downloadMediaMessage } from 'baileys'
import { processRemini } from '../../system/remini.js'; 
import { tmpFiles } from '../../system/tmpfiles.js'

async function reactBoostReach(url, emoji){
  try {

    const encodedUrl = encodeURIComponent(url)
    const encodedEmoji = encodeURIComponent(emoji)

    const api = `https://valzz-psi.vercel.app/api/tools/reach?url=${encodedUrl}&emoji=${encodedEmoji}`
    
    const res = await axios.get(api)
    const data = res.data
    
    if (data.result?.error) {
      return {
        success: false,
        message: `❌ ${data.result.error}`
      }
    }
    
    if (data.status === true) {
      return {
        success: true,
        message: `✅ React Boost (${emoji}) berhasil dikirim!\n⏱️ Tunggu 5-60 menit untuk hasil`
      }
    } else {
      return {
        success: false,
        message: "❌ Gagal mengirim react boost."
      }
    }
    
  } catch (err) {
    return {
      success: false,
      message: `❌ Error React: ${err.message}`
    }
  }
}

export default function tools(ev) {
  ev.on({
    name: 'enigma2text',
    cmd: ['enigma2text', 'en2text', 'en2txt'],
    tags: 'Tools Menu',
    desc: 'decode enigma personal',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const file = './temp/enigma.json',
              abc = [...'abcdefghijklmnopqrstuvwxyz'],
              rand = () => [...abc].sort(() => Math.random() - .5),
              dec = (t, r) => t.toLowerCase().split('')
                .map(c => {
                  const i = r.indexOf(c)
                  return i !== -1 ? abc[i] : c
                }).join(''),
              q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              text = q?.conversation || q?.text || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: 'reply atau masukkan teks enigma' }, { quoted: m })

        const db = fs.existsSync(file)
              ? JSON.parse(fs.readFileSync(file))
              : {},
              data = Object.values(db.key || {})
                .find(v => v.jid === chat.sender),
              rotor = data?.rotor?.random || rand(),
              result = dec(text, rotor)

        await xp.sendMessage(chat.id, { text: result }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'get url',
    cmd: ['get', 'fetch', 'getapi'],
    tags: 'Tools Menu',
    desc: 'Melakukan HTTP GET request ke URL atau API',
    owner: !1, // Bisa dipakai siapa saja (ubah !0 kalau mau khusus owner)
    prefix: !0,
    money: 10, // Biaya murah meriah
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const url = args[0]

        if (!url) {
          return xp.sendMessage(chat.id, { 
            text: `⚠️ *Format salah!*\n\nMasukkan URL API atau Website yang ingin di-get.\n\n💬 *Contoh:*\n${prefix}${cmd} https://api.github.com/users/petanikode` 
          }, { quoted: m })
        }

        if (!/^https?:\/\//i.test(url)) {
          return xp.sendMessage(chat.id, { 
            text: '❌ URL tidak valid! Pastikan diawali dengan *http://* atau *https://*' 
          }, { quoted: m })
        }

        // Reaksi loading
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // Eksekusi request GET
        const res = await axios.get(url, {
          // Tambahkan User-Agent standar agar tidak ditolak oleh keamanan web (seperti Cloudflare)
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        })

        // Format hasil tangkapan
        // Jika formatnya JSON (Object), kita susun rapi. Jika teks biasa/HTML, kita tampilkan apa adanya.
        let resultText = typeof res.data === 'object' 
          ? JSON.stringify(res.data, null, 2) 
          : res.data.toString()

        // Cegah pesan kepanjangan yang bisa bikin WA ngelag (Maksimal 3000 karakter)
        if (resultText.length > 3000) {
          resultText = resultText.substring(0, 3000) + '\n\n... ✂️ [Teks terlalu panjang, dipotong oleh sistem]'
        }

        // Kirim hasil
        await xp.sendMessage(chat.id, { 
          text: `🌐 *GET RESPONSE*\n🔗 *URL:* ${url}\n📊 *Status:* ${res.status} ${res.statusText}\n\n*Result:*\n\`\`\`json\n${resultText}\n\`\`\`` 
        }, { quoted: m })

        // Reaksi sukses
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        // Tangkap error dari API (misal 404 Not Found atau 500 Server Error)
        console.error(`Error pada command ${cmd}:`, e.message)
        
        const errStatus = e.response?.status || 'Unknown'
        let errData = e.response?.data || e.message
        
        if (typeof errData === 'object') errData = JSON.stringify(errData, null, 2)
        if (errData.length > 1000) errData = errData.substring(0, 1000) + '...'

        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        await xp.sendMessage(chat.id, { 
          text: `❌ *GET FAILED*\n\n📊 *Status:* ${errStatus}\n*Response:*\n\`\`\`json\n${errData}\n\`\`\`` 
        }, { quoted: m })
      }
    }
  })
  
  ev.on({
    name: 'web to apk',
    cmd: ['web2apk', 'buildapk', 'createapk'],
    tags: 'Tools Menu',
    desc: 'Mengubah website menjadi aplikasi Android (APK)',
    owner: !1,
    prefix: !0,
    money: 250, 
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = args.join(' ').trim()
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const isImageMsg = q?.imageMessage || m.message?.imageMessage

        if (!text.includes('|') || !isImageMsg) {
          return xp.sendMessage(chat.id, { 
            text: `⚠️ *Format salah!*\n\nKirim/reply gambar (sebagai Ikon Aplikasi) dengan caption:\n${prefix}${cmd} URL Website | Nama Aplikasi\n\n💬 *Contoh:*\n${prefix}${cmd} https://www.google.com | Google App` 
          }, { quoted: m })
        }

        const [url, appName] = text.split('|').map(v => v.trim())

        if (!/^https?:\/\//i.test(url)) {
          return xp.sendMessage(chat.id, { text: '❌ URL harus diawali dengan http:// atau https://' }, { quoted: m })
        }

        if (!appName) {
          return xp.sendMessage(chat.id, { text: '❌ Nama aplikasi tidak boleh kosong.' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
        await xp.sendMessage(chat.id, { text: '⏳ Sedang mem-build APK... Proses ini biasanya memakan waktu beberapa detik.' }, { quoted: m })

        const buffer = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!buffer) throw new Error('Gagal mengunduh gambar ikon.')

        // Simpan Buffer ke file sementara
        const tempDir = path.join(dirname, '../temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: !0 })
        
        const tempIconPath = path.join(tempDir, `icon_${Date.now()}.png`)
        fs.writeFileSync(tempIconPath, buffer)

        // ✨ PERBAIKAN: Panggil form-data secara spesifik untuk menghindari bentrok dengan FormData bawaan Node.js
        const FormDataNode = (await import('form-data')).default
        const form = new FormDataNode()

        form.append('websiteUrl', url)
        form.append('appName', appName)
        form.append('icon', fs.createReadStream(tempIconPath))
        
        const cleanedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '')
        const packageName = `com.${cleanedName || 'app'}.web2apk`
        
        form.append('packageName', packageName)
        form.append('versionName', '1.0.0')
        form.append('versionCode', 1)

        const response = await axios.post('https://webappcreator.amethystlab.org/api/build-apk', form, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://webappcreator.amethystlab.org',
            'Referer': 'https://webappcreator.amethystlab.org/',
            ...form.getHeaders() // 👈 Sekarang ini dijamin tidak akan error
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        })

        if (fs.existsSync(tempIconPath)) fs.unlinkSync(tempIconPath)

        const data = response.data

        if (!data.success) {
           throw new Error(data.message || 'Gagal mem-build APK dari server.')
        }

        const downloadUrl = `https://webappcreator.amethystlab.org${data.downloadUrl}`

        await xp.sendMessage(chat.id, {
          document: { url: downloadUrl },
          fileName: `${appName}.apk`,
          mimetype: 'application/vnd.android.package-archive',
          caption: `✅ *APK BERHASIL DIBUAT!*\n\n📱 *Nama:* ${appName}\n🌐 *Web:* ${url}\n📦 *Package:* ${packageName}\n\n> *Powered by ${global.botName || 'Alya'}*`
        }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        await xp.sendMessage(chat.id, { 
          text: `❌ *GAGAL BUILD APK*\n\n💡 Pastikan gambar tidak terlalu besar atau URL website valid.\n📝 *Pesan Error:* ${e.response?.data?.message || e.message}` 
        }, { quoted: m })
      }
    }
  })
  
  ev.on({
    name: 'like boost',
    cmd: ['boost', 'likeboost', 'boostlink'],
    tags: 'Tools Menu',
    desc: 'Meningkatkan interaksi/boost pada link tertentu',
    owner: !1, // Bisa dipakai member biasa (ubah ke !0 kalau mau khusus owner)
    prefix: !0,
    money: 200, // Biaya bot
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const link = args[0]

        if (!link) {
          return xp.sendMessage(chat.id, { 
            text: `⚠️ *Format penggunaan :*\nKirim link yang ingin di-boost.\n\n💬 *Contoh :*\n${prefix}${cmd} https://vt.tiktok.com/ZSuVxM66Rx/` 
          }, { quoted: m })
        }

        // Validasi link dasar
        if (!/^https?:\/\//i.test(link)) {
          return xp.sendMessage(chat.id, { 
            text: `❌ Pastikan itu adalah link yang valid (diawali dengan http:// atau https://).` 
          }, { quoted: m })
        }

        // Reaksi loading
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // Request ke API LikeBoost
        const response = await axios.post('https://likeboost.zone.id/api/boost', {
            link: link,
            pin: 'admin128'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-key': 'LikeBoost-8719-ApiAkses',
                'User-Agent': 'WhatsApp/2.21.11.17' 
            }
        })

        const data = response.data

        // Susun pesan balasan (menyesuaikan response data dari API)
        const hasilTeks = `✅ *BOOST BERHASIL DIKIRIM!*\n\n🔗 *Target:* ${link}\n📝 *Info:* ${data?.message || data?.status || 'Proses boost sedang berjalan.'}\n\n> *Powered by ${global.botName || 'Alya'}*`

        // Kirim hasil & Reaksi Sukses
        await xp.sendMessage(chat.id, { text: hasilTeks }, { quoted: m })
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        // Menangkap error dari API (misal limit habis, salah PIN, dll)
        const errDetail = e.response?.data?.message || e.response?.data?.error || e.message
        console.error(`Error pada command ${cmd}:`, errDetail)

        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        await xp.sendMessage(chat.id, { 
          text: `❌ *GAGAL MEMPROSES BOOST*\n\n📝 *Pesan:* ${errDetail}\n💡 *Info:* Pastikan link bisa diakses publik atau API sedang tidak gangguan.` 
        }, { quoted: m })
      }
    }
  })
  
  ev.on({
    name: 'wink / wink hd',
    cmd: ['wink', 'unblur'],
    tags: 'Tools Menu',
    desc: 'Memperjelas gambar (HD/Ultra HD) menggunakan Wink AI',
    owner: !1,
    prefix: !0,
    money: 100, // Biaya bot
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      let tempFile = null;

      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedKey = m.message?.extendedTextMessage?.contextInfo;
        const imageMsg = q?.imageMessage || m.message?.imageMessage;

        if (!imageMsg) {
          return xp.sendMessage(chat.id, { 
            text: `Mana gambarnya?\nKirim atau balas gambar dengan caption *${prefix}${cmd}*` 
          }, { quoted: m });
        }

        // Tentukan kualitas HD atau Ultra HD
        const isUltra = args[0]?.toLowerCase() === 'ultra';
        const typeMode = isUltra ? 'ultra' : 'hd';

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } });

        // Unduh media dari WhatsApp
        let media;
        if (q?.imageMessage) {
          media = await downloadMediaMessage({ key: quotedKey, message: q }, 'buffer');
        } else {
          media = await downloadMediaMessage(m, 'buffer');
        }
        
        if (!media) throw new Error('Gagal mengunduh gambar dari pesan');

        // Simpan buffer ke temporary file
        const tmpDir = path.resolve('./tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        
        tempFile = path.join(tmpDir, `wink_${crypto.randomUUID()}.jpg`);
        fs.writeFileSync(tempFile, media);

        // --- PANGGIL FUNGSI DARI SYSTEM/REMINI.JS ---
        const resultUrl = await processRemini(tempFile, typeMode);

        // Kirim gambar hasil ke WhatsApp
        await xp.sendMessage(chat.id, { 
          image: { url: resultUrl }, 
          caption: `✅ Berhasil diperjelas menggunakan *${typeMode.toUpperCase()}*` 
        }, { quoted: m });

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e);
        await xp.sendMessage(chat.id, { 
          text: `❌ Terjadi kesalahan: ${e.message}` 
        }, { quoted: m });
      } finally {
        // Hapus file sementara agar disk tidak penuh
        if (tempFile && fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    }
  });
  
  ev.on({
    name: "react teach",
    cmd: ["reactreach","reach"],
    tags: "Tools Menu",
    desc: "Boost react postingan",
    prefix: true,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      store
    }) => {

        if(args.length < 2){
            return xp.sendMessage(chat.id,{
                text: "Contoh:\n.reach https://postingan.com 👍"
            },{quoted:m})
        }

        let url = args[0]
          
        // Mengambil semua argumen setelah URL, menggabungkannya, dan menghapus tanda koma
        let emoji = args.slice(1).join('').replace(/,/g, '')

        await xp.sendMessage(chat.id,{
            text:"⏳ Mengirim react boost..."
        },{quoted:m})

        let result = await reactBoostReach(url, emoji)
 
        await xp.sendMessage(chat.id,{
            text: result.message
        },{quoted:m})
  
    }
  })

  ev.on({
    name: 'get ch id',
    cmd: ['getchid', 'getch'],
    tags: 'Tools Menu',
    desc: 'mengambil id ch/saluran whatsapp',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      store
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo
        if (!q?.stanzaId) return xp.sendMessage(chat.id, { text: 'reply pesan yang diteruskan dari saluran' }, { quoted: m })

        const load = await store.loadMsg(chat.id, q?.stanzaId)
        if (!load) return xp.sendMessage(chat.id, { text: 'pastikan reply pesan yang diteruskan dari saluran' }, { quoted: m })

        const info = load?.message?.[load.message?.extendedTextMessage ? 'extendedTextMessage' : 'conversation']?.contextInfo?.forwardedNewsletterMessageInfo

        log(info)

        if (!info?.newsletterJid) return xp.sendMessage(chat.id, { text: 'Tidak ditemukan informasi saluran.' }, { quoted: m })

        let txt = `${head}${opb} Data Channel ${clb}\n`
            txt += `${body} ${btn} *Nama: ${info?.newsletterName}*\n`
            txt += `${body} ${btn} *ID Saluran: ${info?.newsletterJid}*\n`
            txt += `${body} ${btn} *ID Pesan: ${info?.serverMessageId}*\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `informasi saluran ${info.newsletterName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName:`klik disini untuk dukung ${botName}`
            }
          }
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'get pp',
    cmd: ['getpp'],
    tags: 'Tools Menu',
    desc: 'mengambil foto profil orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.participant || quoted?.mentionedJid?.[0],
              user = target.replace(/@s\.whatsapp\.net$/, ''),
              { usrAdm, botAdm } = await grupify(xp, m),
              defThumb = 'https://c.termai.cc/i0/7DbG.jpg'

        if (!chat.group || !usrAdm || !botAdm || !target) {
          return xp.sendMessage(chat.id, {
              text: !chat.group
                ? 'perintah ini hanya bisa dijalankan digrup'
                : !usrAdm
                ? 'kamu bukan admin'
                : !botAdm
                ? 'aku bukan admin'
                : 'reply/tag target'
            }, { quoted: m })
        }

        let thumb
        try { thumb = await xp.profilePictureUrl(target, 'image') }
        catch { thumb = defThumb }

        await xp.sendMessage(chat.id, { image: { url: thumb }, caption: `pp @${user}`, mentions: [target] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'hd',
    cmd: ['hd'],
    tags: 'Tools Menu',
    desc: 'Upscale / enhance gambar menggunakan AI',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              img = q?.imageMessage || m.message?.imageMessage

        if (!img) return xp.sendMessage(chat.id, { text: `Kirim atau reply gambar dengan caption ${prefix}${cmd}` }, { quoted: m })

        const media = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!media) throw new Error('media tidak terunduh')

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const imageUrl = await tmpFiles(media),
              type = 'stdx4',
              task = await fetch(`${termaiWeb}/api/tools/enhance/createTask?url=${encodeURIComponent(imageUrl)}&type=${type}&key=${termaiKey}`).then(r => r.json()).catch(() => null)

        let i = 0

        if (!task?.status)
          return xp.sendMessage(chat.id, { text: task?.msg || 'Gagal membuat task enhance.' }, { quoted: m })

        while (i++ < 5e1) {
          const status = await fetch(`${termaiWeb}/api/tools/enhance/taskStatus?id=${task.id}&key=${termaiKey}`).then(r => r.json()).catch(() => null)
          if (!status) break
          if (status.task_status === 'failed' || status.task_status === 'done')
            return xp.sendMessage(chat.id,
              status.task_status === 'failed'
                ? { text: 'Maaf terjadi kesalahan. Gunakan gambar lain!' }
                : { image: { url: status.output }, caption: 'Gambar berhasil di-enhance' }, { quoted: m })
          await new Promise(r => setTimeout(r, 1e3))
        }

        xp.sendMessage(chat.id, { text: 'Waktu pemrosesan habis. Coba lagi.' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'mc2text',
    cmd: ['mc2text', 'decmc', 'decodeminecraft'],
    tags: 'Tools Menu',
    desc: 'mengubah bahasa mc menjadi text',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              text = q?.conversation || q?.text || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `Masukkan teks atau reply pesan\nContoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m });

        const mc = {
          a: "ᔑ", b: "ʖ",
          c: "ᓵ", d: "↸",
          e: "ᒷ", f: "⎓",
          g: "⊣", h: "⍑",
          i: "╎", j: "⋮",
          k: "ꖌ", l: "ꖎ",
          m: "ᒲ", n: "リ",
          o: "𝙹", p: "!¡",
          q: "ᑑ", r: "∷",
          s: "ᓭ", t: "ℸ̣",
          u: "⚍", v: "⍊", 
          w: "∴", x: "̇/",
          y: "||", z: "⨅",
          " ": "/"
        },
        decmc = text => text
          .trim()
          .split(" ")
          .map(v => v === "/" ? " " : Object.keys(mc).find(k => mc[k] === v) ?? v)
          .join("")

        await xp.sendMessage(chat.id, { text: decmc(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'morse2text',
    cmd: ['decodemorse', 'decomorse', 'morse2text'],
    tags: 'Tools Menu',
    desc: 'mengubah morse menjadi text',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              text = q?.conversation || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `masukan atau reply pesan nya\ncontoh: ${prefix}${cmd} .... .- .-.. ---   .- -.- ..-   -... --- -` }, { quoted: m })

        const mrs = {
          a: ".-", b: "-...",
          c: "-.-.", d: "-..",
          e: ".", f: "..-.",
          g: "--.", h: "....",
          i: "..", j: ".---",
          k: "-.-", l: ".-..",
          m: "--", n: "-.",
          o: "---", p: ".--.",
          q: "--.-", r: ".-.",
          s: "...", t: "-",
          u: "..-", v: "...-",
          w: ".--", x: "-..-",
          y: "-.--", z: "--..",
          "0": "-----", "1": ".----",
          "2": "..---", "3": "...--",
          "4": "....-", "5": ".....",
          "6": "-....", "7": "--...",
          "8": "---..", "9": "----."
        },
        decodemrs = text => text
          .trim()
          .replace(/ {3,}/g, " / ")
          .split(" ")
          .map(v => v === "/" 
              ? " "
              : Object.keys(mrs).find(key => mrs[key] === v) ?? v
          ).join("")

        await xp.sendMessage(chat.id, { text: decodemrs(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'ptv',
    cmd: ['ptv', 'p'],
    tags: 'Tools Menu',
    desc: 'generate ptv studio',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              video = quoted?.videoMessage || m.message?.videoMessage

        if (!video) {
          return xp.sendMessage(chat.id, { text: 'reply atau kirim video yang ingin dijadikan ptv' }, { quoted: m })
        }

        const buffer = await downloadMediaMessage({ message: quoted || m.message }, 'buffer')

        if (!buffer) throw new Error('gagal mengunduh media')

        await xp.sendMessage(chat.id, { video: buffer, mimetype: 'video/mp4', ptv: !0 })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'readmore',
    cmd: ['rm', 'readmore'],
    tags: 'Tools Menu',
    desc: 'membuat teks baca selengkapnya',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const txt = args?.join(' ')

        if (!txt?.includes('|'))
          return xp.sendMessage(chat.id, {
            text: `format salah\ncontoh: ${prefix}${cmd} teks 1 | teks 2`
          }, { quoted: m })

        const [t1, t2] = txt.split('|').map(v => v.trim()),
              result = `${t1}${global.readmore} ${t2}`

        await xp.sendMessage(chat.id, { text: result }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'rvo',
    cmd: ['rvo'],
    tags: 'Tools Menu',
    desc: 'mengekstrak media viewOnce',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              reply = ['imageMessage','videoMessage','audioMessage']
                .map(v => q?.[v])
                .find(Boolean),
              media = ['image', 'video', 'audio'],
              mediaType = media.find(t => reply?.mimetype?.includes(t)),
              time = global.time.timeIndo("Asia/Jakarta", "HH"),
              { usrAdm } = await grupify(xp, m)

        if (!usrAdm) return xp.sendMessage(chat.id, { text: 'kamu bukan admin' }, { quoted: m })

        if (!reply || !mediaType || !reply.mediaKey) {
          return xp.sendMessage(chat.id, { text: !reply ? 'reply pesan satu kali lihat' : 'pesan tidak didukung atau sudah dibuka' }, { quoted: m })
        }

        const buffer = await downloadMediaMessage({ message: { [`${mediaType}Message`]: reply } }, 'buffer', {}, { logger: xp.logger, reuploadRequest: xp.updateMediaMessage })

        if (!buffer) throw new Error('gagal mengunduh media')

        await xp.sendMessage(chat.id, {
            [mediaType]: buffer,
            caption: reply.caption ? `pesan: ${reply.caption}` : 'media berhasil diambil'
          }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to enigma',
    cmd: ['toenigma', 'toen'],
    tags: 'Tools Menu',
    desc: 'encode teks enigma personal',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const file = './temp/enigma.json',
              abc = [...'abcdefghijklmnopqrstuvwxyz'],
              rand = () => [...abc].sort(() => Math.random() - .5),
              enc = (t, r) => t.toLowerCase().split('')
                .map(c => {
                  const i = abc.indexOf(c)
                  return i !== -1 ? r[i] : c
                }).join(''),
              q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              text = q?.conversation || q?.text || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, {
            text: `Masukkan teks atau reply pesan\nContoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m })

        !fs.existsSync(file)
          ? fs.writeFileSync(file, JSON.stringify({ key: {} }, null, 2))
          : !0

        const jid = m.key?.participant || chat.sender,
              rotor = rand(),
              result = enc(text, rotor),
              db = JSON.parse(fs.readFileSync(file))

        db.key[chat.pushName] = {
          jid,
          id: m.key?.id,
          rotor: {
            text: result,
            random: rotor
          }
        }

        fs.writeFileSync(file, JSON.stringify(db, null, 2))
        await xp.sendMessage(chat.id, { text: result }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'tomc',
    cmd: ['tomc', 'tominecraft', 'totomc'],
    tags: 'Tools Menu',
    desc: 'mengubah teks menjadi bahasa mc',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              text = q?.conversation || q?.text || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `Masukkan teks atau reply pesan\nContoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m })

        const mc = {
          a: "ᔑ", b: "ʖ",
          c: "ᓵ", d: "↸",
          e: "ᒷ", f: "⎓",
          g: "⊣", h: "⍑",
          i: "╎", j: "⋮",
          k: "ꖌ", l: "ꖎ",
          m: "ᒲ", n: "リ",
          o: "𝙹", p: "!¡",
          q: "ᑑ", r: "∷",
          s: "ᓭ", t: "ℸ̣",
          u: "⚍", v: "⍊", 
          w: "∴", x: "̇/",
          y: "||", z: "⨅",
          " ": "/"
        },
        encmc = text => text
          .toLowerCase()
          .split("")
          .map(v => mc[v] ?? v)
          .join(" ")

        await xp.sendMessage(chat.id, { text: encmc(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to morse',
    cmd: ['tomorse'],
    tags: 'Tools Menu',
    desc: 'mengubah text menjadi morse',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              text = q?.conversation || q?.text || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `masukan atau reply pesan nya\ncontoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m })

        const mrs = {
          a: ".-", b: "-...",
          c: "-.-.", d: "-..",
          e: ".", f: "..-.",
          g: "--.", h: "....",
          i: "..", j: ".---",
          k: "-.-", l: ".-..",
          m: "--", n: "-.",
          o: "---", p: ".--.",
          q: "--.-", r: ".-.",
          s: "...", t: "-",
          u: "..-", v: "...-",
          w: ".--", x: "-..-",
          y: "-.--", z: "--..",
          "0": "-----", "1": ".----",
          "2": "..---", "3": "...--",
          "4": "....-", "5": ".....",
          "6": "-....", "7": "--...",
          "8": "---..", "9": "----."
        },
        encmrs = text => text
           .toLowerCase()
            .split("")
            .map(v => mrs[v] ?? v)
            .join(" ")

        await xp.sendMessage(chat.id, { text: ` ${encmrs(text)}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'tmp files',
    cmd: ['tmpfiles', 'totmp'],
    tags: 'Tools Menu',
    desc: 'Ubah gambar jadi link dengan tmpfiles',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message,
              img = q?.imageMessage || q?.videoMessage

        if (!img)
          return xp.sendMessage(chat.id, { text: 'Kirim atau reply gambar/video untuk dijadikan link.' }, { quoted: m })

        const buffer = await downloadMediaMessage({ message: q }, 'buffer'),
              url = await tmpFiles(buffer)

        await xp.sendMessage(chat.id, { text: url }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to url',
    cmd: ['tourl', 'url'],
    tags: 'Tools Menu',
    desc: 'mengubah media menjadi url',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              media = ['imageMessage','videoMessage','documentMessage','audioMessage']
                .map(v => m.message?.[v] || q?.[v])
                .find(Boolean),
              name = chat.pushName,
              time = global.time.timeIndo("Asia/Jakarta", "HH")

        if (!media) return xp.sendMessage(chat.id, { text: 'reply media yang ingin dijadikan url' }, { quoted: m })

        const mediadl = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!mediadl) throw new Error('error saat mengunduh')

        const upload = async (file) => {
          const { ext } = await fileTypeFromBuffer(file),
                form = new fromdt()

          form.append('file', file, { filename: `${name}-${time}.` + ext })

          const url = await axios.post(`https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk`, form, { headers: form.getHeaders() })

          return url.data
        }

        const res = await upload(mediadl)

        if (!res) return xp.sendMessage(chat.id, { text: 'error pada api' }, { quoted: m })

        let txt = `upload file berhasil\n\n`
            txt += `${head}${opb} *${botName}* ${clb}\n`
            txt += `${body} ${btn} *url:* ${res.path}\n`
            txt += `${body} ${btn} *type:* ${res.mimetype}\n`
            txt += `${body} ${btn} *size:* ${res.size}\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `terima kasih telah menggunakan ${botName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: footer
            }
          }
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to vn',
    cmd: ['tovn', 'vn'],
    tags: 'Tools Menu',
    desc: 'ubah lagu jadi vn',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              reply = ['audioMessage', 'videoMessage']
                .map(v => m.message?.[v] || q?.[v])
                .find(Boolean)

        if (!reply) return xp.sendMessage(chat.id, { text: 'reply atau kirim audio atau video yang akan diubah ke vn' }, { quoted: m })

        let audio
        audio = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!audio) throw new Error('media tidak terunduh')

        await vn(xp, audio, m)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'what music',
    cmd: ['whatmusic', 'musikapa'],
    tags: 'Tools Menu',
    desc: 'mencari judul lagu',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              audio = q?.audioMessage || q?.voiceNoteMessage

        if (!q || !audio) return xp.sendMessage(chat.id, { text: 'reply pesan audio nya' }, { quoted: m })

        let media
        media = await downloadMediaMessage({ message: q || m.message }, 'buffer')

        if (!media) throw new Error('media tidak terunduh')

        xp.sendMessage(chat.id, { text: 'bentar aku dengerin dulu...' }, { quoted: m })

        const res = await axios.post(`${termaiWeb}/api/audioProcessing/whatmusic?key=${termaiKey}`, media, { headers: { 'Content-Type': 'audio/mpeg' } })

        if (!res.data?.status || !res.data.data) return xp.sendMessage(chat.id, { text: 'Lagu tidak dikenali.' }, { quoted: m })

        const { title, artists, acrid } = res.data.data

        let txt = `${head} ${opb} *Lagu Ditemukan* ${clb}\n`
            txt += `${body} ${btn} *Judul:* ${title}\n`
            txt += `${body} ${btn} *Artis:* ${artists}\n`
            txt += `${body} ${btn} *ACRID:* ${acrid}\n`
            txt += `${foot}${line}`

      await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}
