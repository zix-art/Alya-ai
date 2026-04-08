import axios from 'axios'
import fs from 'fs'
const config = JSON.parse(fs.readFileSync('./system/set/config.json'))
const komputerzKey = config.apikey.komputerz.key

export default function search(ev) {
  
  ev.on({
    name: 'image search',
    cmd: ['image', 'gimage', 'gambar', 'cariimage'],
    tags: 'Search Menu',
    desc: 'Mencari gambar dari internet',
    owner: !1,
    prefix: !0,
    money: 100, // Biaya bot
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const query = args.join(' ').trim()

        if (!query) {
          return xp.sendMessage(chat.id, { 
            text: `Mau cari gambar apa?\n*Contoh:* ${prefix}${cmd} kucing lucu` 
          }, { quoted: m })
        }

        // Reaksi loading
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // ⚠️ PENTING: Ganti dengan API Key kamu sendiri
        const apikey = komputerzKey
        
        const url = new URL("https://api.komputerz.site/api/v1/search/image")
        url.searchParams.set("apikey", apikey)
        url.searchParams.set("q", query)
        url.searchParams.set("limit", "1") 

        const res = await fetch(url)
        const data = await res.json()

        if (!data.status || !data.result?.results?.length) {
           await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
           return xp.sendMessage(chat.id, { 
             text: `❌ *Gagal:* Gambar tidak ditemukan atau API sedang gangguan.` 
           }, { quoted: m })
        }

        const imgData = data.result.results[0]
        const sisaLimit = data.remaining

        const caption = `🔍 *BING IMAGE SEARCH*\n\n📝 *Pencarian:* ${data.result.query}\n📌 *Judul:* ${imgData.title}\n🌐 *Sumber:* ${imgData.source}\n\n> *Powered by ${global.botName || 'Code_Bot'}*`

        let buffer;
        try {
          // 1. Coba download gambar utama dengan Header yang lebih lengkap (menyamar jadi Chrome PC)
          const imgRes = await axios.get(imgData.image_url, { 
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Referer': 'https://www.bing.com/'
            } 
          })
          buffer = Buffer.from(imgRes.data)
        } catch (err1) {
          console.log(`Gambar utama diblokir (403), mencoba thumbnail...`)
          
          // 2. Jika gagal/403, otomatis Fallback ke link Thumbnail dari Bing yang lebih aman
          try {
            const thumbRes = await axios.get(imgData.thumbnail, { 
              responseType: 'arraybuffer',
              timeout: 10000,
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            })
            buffer = Buffer.from(thumbRes.data)
          } catch (err2) {
             throw new Error('Semua akses gambar diblokir oleh server asal.')
          }
        }

        // 3. Kirim gambar hasil download
        await xp.sendMessage(chat.id, { 
          image: buffer, 
          caption: caption 
        }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e.message)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        await xp.sendMessage(chat.id, { 
          text: `❌ Terjadi kesalahan: Gambar gagal diunduh karena dilindungi oleh situs pemiliknya. Coba cari kata kunci lain.` 
        }, { quoted: m })
      }
    }
  })

}