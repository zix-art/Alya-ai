import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'
import { downloadMediaMessage } from 'baileys'

export default function aiimage(ev) {
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
          caption: `✨ *AI NANO EDIT*\n\n💬 *Perintah:* ${prompt}\n> *Powered by NeoAPIs*`
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
}
