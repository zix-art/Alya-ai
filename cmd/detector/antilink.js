export default function (ev) {
  // text sudah dipassing dari handle.js
  ev.on('message', async (xp, m, { chat, text }) => { 
    if (!chat?.isGroup) return

    const gcData = getGc(chat)
    if (!gcData?.filter?.antilink) return

    if (!text) return

    if (/chat\.whatsapp\.com/i.test(text)) {
      console.log('LINK KE DETECT')

      const { botAdm, usrAdm } = await grupify(xp, m)
      if (!botAdm) return
      if (usrAdm) return // Abaikan jika yang kirim adalah Admin

      // 1. Hapus pesan yang mengandung link
      await xp.sendMessage(chat.id, { delete: m.key })

      // 2. Kirim pesan peringatan
      await xp.sendMessage(chat.id, {
        text: '🚫 Link grup terdeteksi! Kamu akan dikeluarkan.'
      })

      // 3. Kick member (Gunakan m.key.participant untuk identifier di grup)
      const participant = m.key.participant || m.key.remoteJid
      await xp.groupParticipantsUpdate(
        chat.id,
        [participant],
        'remove'
      )
    }
  })
}
