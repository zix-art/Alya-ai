import fs from 'fs'
import path from 'path'

export default function store(ev) {

  // ==========================================
  // 1. FITUR DAFTAR STIKER ADMIN
  // ==========================================
  ev.on({
    name: 'set stiker admin',
    cmd: ['setstikeradmin', 'setstiker'],
    tags: 'Store Menu',
    desc: 'Mendaftarkan stiker Info Admin agar bisa dibalas otomatis',
    owner: !0, 
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!q?.stickerMessage) {
           return xp.sendMessage(chat.id, { text: '⚠️ Balas stiker "Info Admin" yang ingin dijadikan pemicu (trigger), lalu ketik perintah ini!' }, { quoted: m })
        }

        const hash = Buffer.from(q.stickerMessage.fileSha256).toString('base64')
        
        // Simpan hash ke memori global dan file permanen
        global.stikerAdminHash = hash
        const tmpDir = './tmp'
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
        fs.writeFileSync(path.join(tmpDir, 'stiker_admin.txt'), hash)

        await xp.sendMessage(chat.id, { text: `✅ *STIKER BERHASIL DIDAFTARKAN!*\n\nSekarang bot akan otomatis membalas "on" setiap kali ada yang mengirim stiker ini.` }, { quoted: m })
      } catch (e) {
        console.error(e)
      }
    }
  })

  // ==========================================
  // 2. FITUR AMBIL MCAN / MCIN (JOIN VIA LINK)
  // ==========================================
  ev.on({
    name: 'ambil order',
    cmd: ['ambil', 'gas'],
    tags: 'Store Menu',
    desc: 'Masuk grup buyer dan kirim link saluran',
    owner: !0, 
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const link = args[0]
        if (!link || !link.includes('chat.whatsapp.com/')) {
            return xp.sendMessage(chat.id, { text: `⚠️ *Format Salah!*\n\nKirim link grup buyer.\n💬 *Contoh:* ${prefix}${cmd} https://chat.whatsapp.com/L1nkGrUp` }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const inviteCode = link.split('chat.whatsapp.com/')[1].split(/[ \n]/)[0]
        const newGroupId = await xp.groupAcceptInvite(inviteCode)

        // Teks sesuai permintaan kamu
        let payTxt = `https://whatsapp.com/channel/0029VbBgnQV7oQhgzcy3iy3K\n\n`
        payTxt += `PAYMENT + RULES DI SALURAN JANGAN MINES BACA RULES!!`

        await xp.sendMessage(newGroupId, { text: payTxt })
        await xp.sendMessage(chat.id, { text: `✅ *BERHASIL AMBIL MCAN*\n\nBot sudah masuk dan mengirim link saluran ke grup tersebut.` }, { quoted: m })
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(e)
        await xp.sendMessage(chat.id, { text: `❌ Gagal masuk grup. Pastikan link aktif.` }, { quoted: m })
      }
    }
  })

  // ==========================================
  // 3. FITUR DROP MCAN (MANUAL / DICULIK)
  // ==========================================
  ev.on({
    name: 'drop mcan',
    cmd: ['mcan', 'mcin', 'payment', 'pay'],
    tags: 'Store Menu',
    desc: 'Mengirim link saluran payment seketika di grup',
    owner: !0, 
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Perintah ini khusus di dalam grup transaksi!' }, { quoted: m })

        let payTxt = `https://whatsapp.com/channel/0029VbBgnQV7oQhgzcy3iy3K\n\n`
        payTxt += `PAYMENT + RULES DI SALURAN JANGAN MINES BACA RULES!!`

        await xp.sendMessage(chat.id, { text: payTxt })
      } catch (e) {
        console.error(e)
      }
    }
  })
  
    // ==========================================
  // 4. FITUR SET STATUS ADMIN (ON/OFF)
  // ==========================================
  ev.on({
    name: 'set status admin',
    cmd: ['admin'],
    tags: 'Store Menu',
    desc: 'Mengubah status admin (on/off)',
    owner: !0, 
    prefix: !0,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      const status = args[0]?.toLowerCase()
      if (!status || !['on', 'off'].includes(status)) {
          const current = global.adminStatus || 'on'
          return xp.sendMessage(chat.id, { text: `⚠️ Gunakan: *${prefix}${cmd} on* atau *${prefix}${cmd} off*\n\nStatus saat ini: *${current.toUpperCase()}*` }, { quoted: m })
      }

      global.adminStatus = status
      // Simpan permanen ke file agar tidak reset saat bot restart
      fs.writeFileSync('./tmp/admin_status.txt', status)

      await xp.sendMessage(chat.id, { text: `✅ Status admin berhasil diubah menjadi: *${status.toUpperCase()}*` }, { quoted: m })
    }
  })
}
