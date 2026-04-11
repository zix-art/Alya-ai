import { gc } from '../../system/db/data.js'
import fs from 'fs'
import { isJidGroup, downloadMediaMessage } from 'baileys'
import supabase from '../../system/db/supabase.js'
import { getGroupDataSupa } from '../../system/function.js'

// ☁️ HELPER: Fungsi pintar untuk mengupdate Cache RAM & Database Supabase secara bersamaan (0 delay)
const updateDb = async (id, gcData, updates) => {
  Object.assign(gcData, updates) // Update RAM instan
  await supabase.from('groups').update(updates).eq('id', id) // Simpan ke Cloud di background
}

export default function group(ev) {
  ev.on({
    name: 'Auto Stiker',
    cmd: ['autostiker'],
    tags: 'Group Menu',
    desc: 'Menyalakan fitur auto stiker roasting & random',
    owner: !1,
    prefix: !0,
    
    run: async (xp, m, { chat, args, prefix, cmd }) => {
      try {
        const { usrAdm } = await grupify(xp, m)
        if (!usrAdm && !m.key.fromMe) return xp.sendMessage(chat.id, { text: '❌ Perintah ini khusus Admin Grup!' }, { quoted: m })

        const gcData = await getGroupDataSupa(chat.id)

        if (args[0] === 'on') {
            if (gcData.autostiker) return xp.sendMessage(chat.id, { text: '⚠️ Auto stiker sudah aktif di grup ini!' }, { quoted: m })
            await updateDb(chat.id, gcData, { autostiker: true })
            return xp.sendMessage(chat.id, { text: '✅ Fitur Auto Stiker berhasil *DIAKTIFKAN* di grup ini!\n\n_Bot akan merespon admin dan mengirim stiker random setiap 2,5 jam._' }, { quoted: m })
        } else if (args[0] === 'off') {
            if (!gcData.autostiker) return xp.sendMessage(chat.id, { text: '⚠️ Auto stiker belum aktif di grup ini!' }, { quoted: m })
            await updateDb(chat.id, gcData, { autostiker: false })
            return xp.sendMessage(chat.id, { text: '❌ Fitur Auto Stiker berhasil *DIMATIKAN* di grup ini!' }, { quoted: m })
        } else {
            return xp.sendMessage(chat.id, { text: `⚠️ *Cara Penggunaan:*\n\nKetik *${prefix}${cmd} on* untuk menyalakan.\nKetik *${prefix}${cmd} off* untuk mematikan.` }, { quoted: m })
        }
      } catch (e) {
        console.error(e)
      }
    }
  })
  
  ev.on({
    name: 'anti channel',
    cmd: ['antiteksch', 'antich'],
    tags: 'Group Menu',
    desc: 'Mencegah member meneruskan pesan dari Saluran (Channel)',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id)
        const { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { 
            text: !chat.group ? 'Perintah ini hanya bisa dijalankan di grup' : 
                  !gcData ? `Grup ini belum terdaftar, ketik ${prefix}daftargc` : 
                  !usrAdm ? 'Kamu bukan admin' : 'Aku harus jadi admin dulu' 
          }, { quoted: m })
        }

        const input = args[0]?.toLowerCase()
        const opsi = !!gcData.antich

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { 
            text: `Gunakan:\n${prefix}${cmd} on/off\n\nStatus saat ini: *${opsi ? 'Aktif' : 'Tidak Aktif'}*` 
          }, { quoted: m })
        }

        await updateDb(chat.id, gcData, { antich: input === 'on' })
        await xp.sendMessage(chat.id, { text: `✅ Fitur Anti-Channel berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}.` }, { quoted: m })
      } catch (e) {
        call(xp, e, m)
      }
    }
  })
  
  ev.on({
    name: 'anti link',
    cmd: ['antilink'],
    tags: 'Group Menu',
    desc: 'anti link grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id)
        const { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })
        }

        const input = args[0]?.toLowerCase()
        const opsi = !!gcData.antilink

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantilink: ${opsi ? 'Aktif' : 'Tidak'}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        await updateDb(chat.id, gcData, { antilink: input === 'on' })
        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'anti tag all',
    cmd: ['antitagall', 'antitag', 'antihidetag'],
    tags: 'Group Menu',
    desc: 'anti tag all digrup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id)
        const { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: 'Akses Ditolak/Grup belum terdaftar/Bot bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(), opsi = !!gcData.antitagall
        if (!input || !['on', 'off'].includes(input)) return xp.sendMessage(chat.id, { text: `gunakan:\n ${prefix}${cmd} on/off` }, { quoted: m })

        await updateDb(chat.id, gcData, { antitagall: input === 'on' })
        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'anti tag sw',
    cmd: ['antitagsw', 'tagsw'],
    tags: 'Group Menu',
    desc: 'anti tag status digrup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id)
        const { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: 'Akses Ditolak/Grup belum terdaftar/Bot bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(), opsi = !!gcData.antitagsw
        if (!input || !['on', 'off'].includes(input)) return xp.sendMessage(chat.id, { text: `gunakan:\n ${prefix}${cmd} on/off` }, { quoted: m })

        await updateDb(chat.id, gcData, { antitagsw: input === 'on' })
        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'add bad sticker',
    cmd: ['addbadsticker', 'blocksticker'],
    tags: 'Group Menu',
    desc: 'Melarang stiker tertentu di grup ini',
    owner: !1,
    prefix: !0,
    money: 0,

    run: async (xp, m, { chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id)
        const { usrAdm } = await grupify(xp, m)

        if (!chat.group || !usrAdm) return xp.sendMessage(chat.id, { text: 'Perintah ini hanya untuk Admin Grup.' }, { quoted: m })

        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const isQuotedSticker = q?.stickerMessage

        if (!isQuotedSticker) return xp.sendMessage(chat.id, { text: `Reply stiker yang ingin dilarang dengan command ${prefix}${cmd}` }, { quoted: m })

        const stickerHash = Buffer.from(isQuotedSticker.fileSha256).toString('base64')
        let bs = gcData.badstickers || []

        if (bs.includes(stickerHash)) return xp.sendMessage(chat.id, { text: 'Stiker ini sudah masuk daftar larangan grup.' }, { quoted: m })

        bs.push(stickerHash)
        await updateDb(chat.id, gcData, { badstickers: bs })

        await xp.sendMessage(chat.id, { text: '✅ Stiker berhasil ditambahkan ke daftar larangan.' }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'izin stiker',
    cmd: ['izinstiker', 'addwhitelist'],
    tags: 'Group Menu',
    desc: 'Memberikan izin ke member untuk mengirim stiker terlarang',
    owner: !1,
    prefix: !0,
    money: 0,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id)
        const { usrAdm } = await grupify(xp, m)

        if (!chat.group || (!usrAdm && !global.ownerNumber.includes(m.sender.split('@')[0]))) {
          return xp.sendMessage(chat.id, { text: 'Hanya Admin/Owner yang bisa menggunakan perintah ini.' }, { quoted: m })
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo
        const targetRaw = quoted?.participant || quoted?.mentionedJid?.[0] || (args[0] ? global.number(args[0]) + '@s.whatsapp.net' : null)

        if (!targetRaw) return xp.sendMessage(chat.id, { text: `Tag/reply/masukkan nomor target.\nContoh: ${prefix}${cmd} @member` }, { quoted: m })

        let ws = gcData.whitelist || []
        if (ws.includes(targetRaw)) return xp.sendMessage(chat.id, { text: 'Nomor ini sudah ada di daftar izin stiker.' }, { quoted: m })

        ws.push(targetRaw)
        await updateDb(chat.id, gcData, { whitelist: ws })

        await xp.sendMessage(chat.id, { text: `✅ Berhasil! @${targetRaw.split('@')[0]} sekarang memiliki VVIP Pass stiker.`, mentions: [targetRaw] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'auto back',
    cmd: ['autoback'],
    tags: 'Group Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const { usrAdm, botAdm } = await grupify(xp, m), gcData = await getGroupDataSupa(chat.id)
        if (!usrAdm || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: 'Akses Ditolak/Belum Terdaftar' }, { quoted: m })

        const input = args[0]?.toLowerCase()
        if (!input || !['on', 'off'].includes(input)) return xp.sendMessage(chat.id, { text: `gunakan: ${prefix}${cmd} on/off` }, { quoted: m })

        await updateDb(chat.id, gcData, { autoback: input === 'on' })
        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'blacklist member',
    cmd: ['blacklistmember', 'blacklist'],
    tags: 'Group Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const { usrAdm, botAdm } = await grupify(xp, m), q = m.message?.extendedTextMessage?.contextInfo, target = q?.participant || q?.mentionedJid?.[0]
        if (!usrAdm || !botAdm || !target) return xp.sendMessage(chat.id, { text: 'Admin Only/Bot Harus Admin/Tag Target' }, { quoted: m })

        const gcData = await getGroupDataSupa(chat.id)
        let bl = gcData.blacklist || []
        bl.push(target)
        
        await updateDb(chat.id, gcData, { blacklist: bl })
        await xp.sendMessage(chat.id, { text: `${target.replace(/@s\.whatsapp\.net$/, '')} berhasil di blacklist` }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'daftar gc',
    cmd: ['daftargc'],
    tags: 'Group Menu',
    desc: 'mendaftarkan grup ke database',
    owner: !1,
    prefix: !0,
    money: 300,
    exp: 0.1,

    run: async (xp, m, { chat, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        let { data } = await supabase.from('groups').select('id').eq('id', chat.id).single()
        if (data) return xp.sendMessage(chat.id, { text: 'grup ini sudah terdaftar' }, { quoted: m })

        const cache = groupCache.get(chat.id) || await xp.groupMetadata(chat.id)
        
        // Memasukkan data grup baru ke Supabase
        await supabase.from('groups').insert([{ 
            id: chat.id, 
            name: cache.subject 
        }])

        xp.sendMessage(chat.id, { text: `grup *${cache.subject}* berhasil didaftarkan` }, { quoted: m })
      } catch (e) {
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'left',
    cmd: ['left'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { args, chat, cmd, ocrs, prefix, text }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id), quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation, { usrAdm, botAdm } = await grupify(xp, m)
        if (!gcData || !usrAdm || !botAdm || !ocrs) return xp.sendMessage(chat.id, { text: 'Grup belum daftar / Akses Ditolak / Format Salah' }, { quoted: m })

        if (ocrs === 'on' || ocrs === 'off') {
          await updateDb(chat.id, gcData, { left_gc: ocrs === 'on' })
          return xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })
        }

        if (ocrs === 'set') {
          let lftTxt = text.replace(/^[^\s]+\s*left\s+set/i, "").trim() || quoted
          if (!lftTxt) return xp.sendMessage(chat.id, { text: 'masukan/reply pesan selamat tinggalnya' }, { quoted: m })

          await updateDb(chat.id, gcData, { left_gc: true, left_text: lftTxt })
          return xp.sendMessage(chat.id, { text: `pesan selamat tinggal diperbaharui\n${lftTxt}` }, { quoted: m })
        }

        if (ocrs === 'reset') {
          await updateDb(chat.id, gcData, { left_gc: false, left_text: null })
          return xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
        }
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'mute',
    cmd: ['mute'],
    tags: 'Group Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id), { usrAdm, botAdm } = await grupify(xp, m)
        const isOwner = m.key.fromMe || global.ownerNumber.some(n => chat.sender.includes(n))
        const canAccess = usrAdm || isOwner

        if (!canAccess || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: 'Akses Ditolak/Grup Belum Daftar' }, { quoted: m })

        const input = args.join(' ').toLowerCase()
        if (!['on', 'off'].includes(input)) return xp.sendMessage(chat.id, { text: `Gunakan: ${prefix}${cmd} on/off` }, { quoted: m })

        await updateDb(chat.id, gcData, { mute: input === 'on' })
        await xp.sendMessage(chat.id, { text: `✅ Fitur Mute berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'anti badword',
    cmd: ['antibadword', 'badword'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    desc: 'mengatur fitur anti badword dalam grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, ocrs, prefix, text }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = await getGroupDataSupa(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm || !ocrs) {
          return xp.sendMessage(chat.id, {
            text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar`
              : !usrAdm ? 'kamu bukan admin'
              : !botAdm ? 'aku bukan admin'
              : `masukan input\ncontoh:\n${prefix}${cmd} on → aktifkan\n${prefix}${cmd} off → nonaktifkan\n${prefix}${cmd} set <text> → setting kata\n${prefix}${cmd} reset → reset kata`
          }, { quoted: m })
        }

        if (ocrs === 'on' || ocrs === 'off') {
          await updateDb(chat.id, gcData, { antibadword: ocrs === 'on' })
          return xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })
        }

        if (ocrs === 'set') {
          let txt = args.join(' ').trim()
          if (!txt) return xp.sendMessage(chat.id, { text: `masukan kata-kata kasar nya\ncontoh: ${prefix}${cmd} set bahlil` }, { quoted: m })

          let bwList = gcData.badwords || []
          if (!bwList.includes(txt)) bwList.push(txt)

          await updateDb(chat.id, gcData, { antibadword: true, badwords: bwList })
          return xp.sendMessage(chat.id, { text: `kata "${txt}" berhasil ditambahkan ke blacklist` }, { quoted: m })
        } 
        
        if (ocrs === 'reset') {
          await updateDb(chat.id, gcData, { antibadword: false, badwords: [] })
          return xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
        }
      } catch (e) {
        call(xp, e, m)
      }
    }
  })
  
  
  ev.on({
    name: 'anti channel',
    cmd: ['antiteksch'],
    tags: 'Group Menu',
    desc: 'Mencegah member meneruskan pesan dari Saluran (Channel)',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const gcData = getGc(chat)
        const { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { 
            text: !chat.group ? 'Perintah ini hanya bisa dijalankan di grup' : 
                  !gcData ? `Grup ini belum terdaftar, ketik ${prefix}daftargc` : 
                  !usrAdm ? 'Kamu bukan admin' : 
                  'Aku harus jadi admin dulu untuk menghapus pesan' 
          }, { quoted: m })
        }

        const input = args[0]?.toLowerCase()
        const opsi = !!gcData?.filter?.antich
        const statusMode = opsi ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { 
            text: `Gunakan:\n${prefix}${cmd} on/off\n\nStatus saat ini: *${statusMode}*` 
          }, { quoted: m })
        }

        // Simpan ke database
        gcData.filter.antich = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { 
          text: `✅ Fitur Anti-Channel berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}.` 
        }, { quoted: m })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
      }
    }
  })
  
  ev.on({
    name: 'anti ch',
    cmd: ['antich'],
    tags: 'Group Menu',
    desc: 'mengatur fitur anti saluran/ch',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = getGc(chat),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })
        }

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antich,
              type = v => v ? 'Aktif' : 'Tidak',
              modech = type(gcData?.filter?.antich)

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modech}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        gcData.filter.antich = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
  
/*
  ev.on({
    name: 'anti link',
    cmd: ['antilink'],
    tags: 'Group Menu',
    desc: 'anti link grup',
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
        const gcData = getGc(chat),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })
        }

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antilink,
              type = v => v ? 'Aktif' : 'Tidak',
              modelink = type(gcData?.filter?.antilink)

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantilink: ${modelink}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        gcData.filter.antilink = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })*/

  ev.on({
    name: 'close',
    cmd: ['tutup', 'close'],
    tags: 'Group Menu',
    desc: 'menutup grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'Perintah ini hanya untuk grup' }, { quoted: m })

        const { botAdm, usrAdm } = await grupify(xp, m),
              meta = groupCache.get(chat.id) || await xp.groupMetadata(chat.id)

        if (!botAdm || !usrAdm || meta?.announce) {
          return xp.sendMessage(chat.id, { text: !botAdm ? 'aku bukan admin' : !usrAdm ? 'kamu bukan admin' : 'grup sudah ditutup' }, { quoted: m })
        }

        await xp.groupSettingUpdate(chat.id, 'announcement')
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'delete',
    cmd: ['d', 'del', 'delete'],
    tags: 'Group Menu',
    desc: 'menghapus pesan di group',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              reply = quoted?.quotedMessage,
              mKey = quoted?.stanzaId,
              user = quoted?.participant

        if (!reply || !mKey || !user) return xp.sendMessage(chat.id, { text: 'reply chat yang ingin dihapus' }, { quoted: m })

        const botNum = `${xp.user.id.split(':')[0]}@s.whatsapp.net`,
              fromBot = user === botNum,
              { botAdm, usrAdm } = await grupify(xp, m)

        if (!fromBot && !usrAdm) return xp.sendMessage(chat.id, { text: 'kamu bukan admin' }, { quoted: m })
        if (!fromBot && !botAdm) return xp.sendMessage(chat.id, { text: 'aku bukan admin' }, { quoted: m })

        await xp.sendMessage(chat.id, { delete: { remoteJid: chat.id, fromMe: fromBot, id: mKey, ...(fromBot? {} : { participant: user }) } })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'demote',
    cmd: ['demote'],
    tags: 'Group Menu',
    desc: 'menurunkan admin',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.mentionedJid?.[0] || quoted?.participant,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !target) {
          return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : 'reply atau tag nomor yang ingin diturunkan jabatannya' }, { quoted: m })
        }

        await xp.groupParticipantsUpdate(chat.id, [target], 'demote')

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'hidetag',
    cmd: ['h', 'hidetag'],
    tags: 'Group Menu',
    desc: 'tag all member',
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
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              reply = quoted?.conversation,
              { botAdm, usrAdm } = await grupify(xp, m),
              text = args.join(' '),
              fallback = reply || text,
              gcInfo = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              all = gcInfo.participants.map(v => v.id)

        if (!chat.group || !usrAdm || !botAdm || !fallback)
          return !chat.group
            ? xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan di grup' }, { quoted: m })
            : !usrAdm
            ? xp.sendMessage(chat.id, { text: 'kamu bukan admin' }, { quoted: m })
            : !botAdm
            ? xp.sendMessage(chat.id, { text: 'aku bukan admin' }, { quoted: m })
            : xp.sendMessage(chat.id, { text: 'hidetag tidak boleh kosong' }, { quoted: m })

        xp.sendMessage(chat.id, { text: fallback, mentions: all }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
  
  ev.on({
    name: 'hidetag v2',
    cmd: ['hv2', 'hidetagv2'],
    tags: 'Group Menu',
    desc: 'tag all member Tanpa Pengecekan Admin (Fast Mode)',
    owner: !0,
    prefix: !0,
    money: 1000,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd }) => {
      try {
        if (!chat.group) {
          return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa dijalankan di grup' }, { quoted: m })
        }

        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const text = args.join(' ')
        
        // Ambil teks dari pesan yang di-reply atau argumen
        const fallback = q?.conversation || q?.extendedTextMessage?.text || text

        if (!fallback) {
          return xp.sendMessage(chat.id, { text: '⚠️ Teks hidetag tidak boleh kosong' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // OPTIMASI 1: Ambil data dari Cache agar instan, jika tidak ada baru fetch ke server
        const gcInfo = groupCache.get(chat.id) || await xp.groupMetadata(chat.id)
        const all = gcInfo.participants.map(v => v.id)

        // ==========================================
        // OPTIMASI 2 & 3: Chunking Cepat (Turbo Mode)
        // ==========================================
        const chunkSize = 400 // Daya angkut diperbesar jadi 400
        const delay = ms => new Promise(res => setTimeout(res, ms))

        // Jika member di bawah 400 (Grup Kecil/Sedang), eksekusi instan 1x kirim!
        if (all.length <= chunkSize) {
          await xp.sendMessage(chat.id, { text: fallback, mentions: all })
        } 
        // Jika member di atas 400 (Grup Raksasa 700+), gunakan pemecahan cepat
        else {
          for (let i = 0; i < all.length; i += chunkSize) {
            const chunk = all.slice(i, i + chunkSize)
            
            await xp.sendMessage(chat.id, { text: fallback, mentions: chunk })
            
            // Jeda hanya 1 detik agar prosesnya kilat tapi WA tetap tidak curiga
            if (i + chunkSize < all.length) {
              await delay(1000) 
            }
          }
        }

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
      }
    }
  })

  ev.on({
    name: 'intro',
    cmd: ['intro'],
    tags: 'Group Menu',
    owner: !1, prefix: !0, money: 0, exp: 0.1,
    run: async (xp, m, { chat, cmd, prefix }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id)
        if (!chat.group || !gcData || !gcData.welcome) return xp.sendMessage(chat.id, { text: !chat.group ? 'digrup aja' : !gcData ? `belum daftar` : `welcome off` }, { quoted: m })
        await xp.sendMessage(chat.id, { text: gcData.welcome_text || 'halo selamat datang' }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'join gc',
    cmd: ['join', 'masuk', 'joingc'],
    tags: 'Group Menu',
    desc: 'memasukkan bot ke grup dengan link',
    owner: !1,
    prefix: !0,
    money: 1500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      args,
      cmd
    }) => {
      try {
        let prompt = args.join(' '),
            quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

        if (quoted) prompt = quoted.conversation 
                        || quoted.extendedTextMessage?.text 
                        || quoted.extendedTextMessage?.prompt 
                        || prompt

        const match = prompt?.match(/chat\.whatsapp\.com\/([\w\d]+)/)
        if (!match) return xp.sendMessage(chat.id, { text: prompt ? 'Link grup tidak valid' : 'Link grupnya mana?' }, { quoted: m })

        const res = await xp.groupAcceptInvite(match[1]),
              text = isJidGroup(res) 
                ? `Berhasil masuk ke grup dengan ID: ${res}` 
                : 'Undangan diterima, menunggu persetujuan admin'

        await xp.sendMessage(chat.id, { text }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'kick',
    cmd: ['kick', 'dor'],
    tags: 'Group Menu',
    desc: 'mengeluarkan orang dari grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan di grup' }, { quoted: m })

        const { botAdm, usrAdm, adm } = await grupify(xp, m),
              quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.mentionedJid?.[0] || quoted?.participant

        if (!usrAdm || !botAdm || !target || adm.includes(target)) {
          const txt = !usrAdm ? 'kamu bukan admin'
                    : !botAdm ? 'aku bukan admin'
                    : !target ? 'reply/tag orang yang akan dikeluarkan'
                    : 'tidak bisa mengeluarkan admin'
          return xp.sendMessage(chat.id, { text: txt }, { quoted: m })
        }

        await xp.groupParticipantsUpdate(chat.id, [target], 'remove')
          .catch(() => xp.sendMessage(chat.id, { text: 'gagal mengeluarkan anggota' }, { quoted: m }))
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
  
    ev.on({
    name: 'list gc',
    cmd: ['listgc', 'gclist'],
    tags: 'Owner Menu',
    desc: 'melihat daftar semua grup yang bot masuki',
    owner: !0, // Hanya owner yang bisa melihat daftar grup
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        // Mengambil semua grup yang bot ikuti saat ini
        const gc = await xp.groupFetchAllParticipating(),
              gcList = Object.values(gc)

        if (!gcList.length) {
          return xp.sendMessage(chat.id, { text: 'Bot belum bergabung ke grup mana pun.' }, { quoted: m })
        }

        let text = `*📊 DAFTAR GRUP BOT*\n\nTotal: ${gcList.length} Grup\n\n`

        gcList.forEach((g, i) => {
          text += `*${i + 1}. ${g.subject}*\n`
          text += `🔖 ID: ${g.id}\n`
          text += `👥 Member: ${g.participants?.length || 'Tidak diketahui'}\n`
          text += `====================\n`
        })

        await xp.sendMessage(chat.id, { text }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'open',
    cmd: ['buka', 'open'],
    tags: 'Group Menu',
    desc: 'membuka grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya untuk grup' }, { quoted: m })

        const { botAdm, usrAdm } = await grupify(xp, m),
              meta = groupCache.get(chat.id) || await xp.groupMetadata(chat.id)

        if (!botAdm || !usrAdm || !meta?.announce) {
          return xp.sendMessage(chat.id, { text: !botAdm ? 'aku bukan admin' : !usrAdm ? 'kamu bukan admin' : 'grup ini sudah dibuka' }, { quoted: m })
        }

        await xp.groupSettingUpdate(chat.id, 'not_announcement');
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'out gc',
    cmd: ['out', 'keluar', 'outgc'],
    tags: 'Group Menu',
    desc: 'mengeluarkan bot dari grup',
    owner: !0,
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
        const gc = await xp.groupFetchAllParticipating(),
              gcList = Object.values(gc)

        if (!gcList.length) return xp.sendMessage(chat.id, { text: `Tidak ada grup yang ${botName} masuk` }, { quoted: m })

        if (!args.length) {
          let text = `*Daftar Grup ${botName}:*\n\n`
          gcList.forEach((g, i) => {
            text += `${i + 1}. ${g.subject}\nID: ${g.id}\n\n`
          })
          text += `Ketik: ${prefix}${cmd} <nomor atau id grup>\nContoh:\n${prefix}${cmd} 1\n${prefix}${cmd} 628xxx-xxx@g.us`
          return xp.sendMessage(chat.id, { text }, { quoted: m })
        }

        const input = args[0]
        let target = null

        if (/^\d+$/.test(input)) {
          const i = parseInt(input, 10) - 1
          if (i >= 0 && i < gcList.length) target = gcList[i].id
        } else if (input.endsWith('@g.us')) {
          target = gcList.find(g => g.id === input)?.id
        }

        if (!target || !target.endsWith('@g.us')) return xp.sendMessage(chat.id, { text: !target ? 'Grup tidak ditemukan.' : 'ID grup tidak valid.' }, { quoted: m })

        await xp.groupLeave(target)
        xp.sendMessage(chat.id, { text: `${botName} berhasil keluar dari grup:\n${target}` }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'promote',
    cmd: ['promote'],
    tags: 'Group Menu',
    desc: 'menjadikan member sebagai admin',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya untuk grup' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.mentionedJid?.[0] || quoted?.participant,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !target) {
          return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : 'reply atau tag nomor yang ingin dijadikan admin' }, { quoted: m })
        }

        await xp.groupParticipantsUpdate(chat.id, [target], 'promote')

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
  
  ev.on({
    name: 'pin message',
    cmd: ['pinpesan', 'sematkan', 'unpin', 'lepaskan'],
    tags: 'Group Menu',
    desc: 'Menyematkan (pin) atau melepas pin pesan di obrolan',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, { chat, cmd, prefix }) => {
      try {
        const { usrAdm, botAdm } = await grupify(xp, m)

        // Pengecekan standar grup & admin
        if (!chat.group) {
          return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: m })
        }
        if (!usrAdm && !global.ownerNumber.includes(m.sender.split('@')[0])) {
          return xp.sendMessage(chat.id, { text: '❌ Hanya Admin Grup yang bisa menggunakan perintah ini.' }, { quoted: m })
        }
        if (!botAdm) {
          return xp.sendMessage(chat.id, { text: '❌ Aku harus menjadi Admin terlebih dahulu untuk bisa menyematkan pesan.' }, { quoted: m })
        }

        // Cari pesan yang di-reply
        const q = m.message?.extendedTextMessage?.contextInfo
        if (!q || !q.stanzaId) {
          return xp.sendMessage(chat.id, { 
            text: `⚠️ *Format salah!*\n\nReply/balas pesan yang ingin di-pin/unpin dengan perintah:\n${prefix}${cmd}` 
          }, { quoted: m })
        }

        // Reaksi loading
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // Susun Kunci (Key) dari pesan yang di-reply
        const botNumber = xp.user.id.split(':')[0] + '@s.whatsapp.net'
        const quotedKey = {
          remoteJid: chat.id,
          fromMe: q.participant === botNumber, 
          id: q.stanzaId,
          participant: q.participant
        }

        const isPin = cmd === 'pin' || cmd === 'sematkan'
        const actionType = isPin ? 1 : 2 

        // Eksekusi perintah ke server WhatsApp
        await xp.sendMessage(chat.id, {
          pin: quotedKey,
          type: actionType,
          time: 2592000 // Durasi Pin: 30 Hari
        })

        // Reaksi sukses (TIDAK ADA KIRIM PESAN TEKS)
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
        // Kalau error tetap kirim pesan biar ketahuan
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        await xp.sendMessage(chat.id, { text: `❌ Gagal memproses. Pastikan pesan tersebut belum dihapus atau ditarik.` }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'set pp gc',
    cmd: ['setppgc', 'ppgc'],
    tags: 'Group Menu',
    desc: 'Mengatur foto profil grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              img = q?.imageMessage || m.message?.imageMessage,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!img || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { text: !img ? `reply/kirim gambar dengan caption ${prefix}${cmd}` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })
        }

        const media = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!media) throw new Error('Gagal mengunduh media')

        await xp.updateProfilePicture(chat.id, media)
        await xp.sendMessage(chat.id, { text: 'foto profile grup berhasil diperbaharui' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
  
  ev.on({
    name: 'acc join',
    cmd: ['acc', 'terima', 'accjoin', 'approve'],
    tags: 'Group Menu',
    desc: 'Menyetujui permintaan bergabung ke dalam grup',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const { usrAdm, botAdm } = await grupify(xp, m)

        // Pengecekan standar grup & admin
        if (!chat.group) {
          return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: m })
        }
        if (!usrAdm && !global.ownerNumber.includes(m.sender.split('@')[0])) {
          return xp.sendMessage(chat.id, { text: '❌ Hanya Admin Grup yang bisa menggunakan perintah ini.' }, { quoted: m })
        }
        if (!botAdm) {
          return xp.sendMessage(chat.id, { text: '❌ Aku harus menjadi Admin terlebih dahulu untuk bisa menyetujui member.' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // 1. Ambil daftar orang yang meminta bergabung
        let pendingList = []
        try {
          pendingList = await xp.groupRequestParticipantsList(chat.id)
        } catch (err) {
          return xp.sendMessage(chat.id, { text: '❌ Fitur "Persetujuan Admin" sepertinya tidak aktif di grup ini.' }, { quoted: m })
        }

        // 2. Jika tidak ada yang mengantre
        if (!pendingList || pendingList.length === 0) {
          await xp.sendMessage(chat.id, { react: { text: 'ℹ️', key: m.key } })
          return xp.sendMessage(chat.id, { text: 'ℹ️ Tidak ada permintaan bergabung yang tertunda saat ini.' }, { quoted: m })
        }

        // 3. Tentukan jumlah yang ingin di-ACC
        let targetCount = pendingList.length // Default: ACC Semua
        
        if (args[0] && !isNaN(args[0])) {
          const inputNum = parseInt(args[0])
          if (inputNum > 0) {
            targetCount = Math.min(inputNum, pendingList.length)
          }
        }

        // ==========================================
        // ✨ MODIFIKASI: SISTEM ACAK ANTREAN
        // ==========================================
        // Mengacak urutan array agar persetujuan dilakukan secara acak (atas/bawah/tengah)
        pendingList = pendingList.sort(() => Math.random() - 0.5)

        const jidsToApprove = pendingList.slice(0, targetCount).map(req => req.jid)

        // ==========================================
        // ✨ MODIFIKASI: SISTEM DELAY & SATU PER SATU (1-1)
        // ==========================================
        let msgStart = `⏳ *PROSES ACC DIMULAI*\n\n`
        msgStart += `Menyetujui *${targetCount}* member secara acak satu per satu...\n`
        msgStart += `_Mohon tunggu agar bot tidak terkena limit WA._`
        
        const progressMsg = await xp.sendMessage(chat.id, { text: msgStart }, { quoted: m })
        
        const delay = ms => new Promise(res => setTimeout(res, ms))
        let accCount = 0

        // Melakukan looping (perulangan) untuk meng-ACC orang satu per satu
        for (let jid of jidsToApprove) {
           // Memasukkan array yang hanya berisi 1 nomor (satu per satu)
           await xp.groupRequestParticipantsUpdate(chat.id, [jid], 'approve').catch(() => {})
           accCount++

           // Update notifikasi progress setiap kelipatan 5 atau saat sudah selesai
           if (accCount % 5 === 0 || accCount === targetCount) {
              try {
                 await xp.sendMessage(chat.id, { text: `⏳ *Proses ACC...* (${accCount}/${targetCount} diterima)`, edit: progressMsg.key })
              } catch (e) {}
           }
           
           // Memberikan Jeda 2 Detik (2000 ms) per orang agar terhindar dari deteksi spam/bulk action Meta
           if (accCount < targetCount) {
               await delay(2000) 
           }
        }

        // 6. Laporan Akhir
        let finalTxt = `✅ *ACC SELESAI!*\n\n`
        finalTxt += `Berhasil memasukkan *${accCount}* member baru secara acak.\n`
        finalTxt += `*(Sisa antrean: ${pendingList.length - accCount})*`

        try { await xp.sendMessage(chat.id, { text: finalTxt, edit: progressMsg.key }) } 
        catch (e) { await xp.sendMessage(chat.id, { text: finalTxt }, { quoted: m }) }

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
        await xp.sendMessage(chat.id, { text: `❌ Terjadi kesalahan saat mencoba menyetujui permintaan bergabung.` }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'welcome',
    cmd: ['welcome'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    owner: !1, prefix: !0, money: 50, exp: 0.1,
    run: async (xp, m, { args, chat, cmd, ocrs, prefix, text }) => {
      try {
        const gcData = await getGroupDataSupa(chat.id), quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text, { usrAdm, botAdm } = await grupify(xp, m)
        if (!gcData || !usrAdm || !botAdm || !ocrs) return xp.sendMessage(chat.id, { text: 'Grup belum daftar / Akses Ditolak / Format Salah' }, { quoted: m })

        if (ocrs === 'on' || ocrs === 'off') {
          await updateDb(chat.id, gcData, { welcome: ocrs === 'on' })
          return xp.sendMessage(chat.id, { text: `✅ Fitur Welcome berhasil *${ocrs === 'on' ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}*` }, { quoted: m })
        }

        if (ocrs === 'set') {
          let rawText = text || ''
          let wlcTxt = rawText.replace(new RegExp(`^.*?${cmd}\\s+set\\s*`, 'i'), '') || quoted
          if (!wlcTxt) return xp.sendMessage(chat.id, { text: 'masukan/reply pesan welcome nya' }, { quoted: m })

          await updateDb(chat.id, gcData, { welcome: true, welcome_text: wlcTxt })
          return xp.sendMessage(chat.id, { text: `✅ *Pesan selamat datang berhasil diperbarui!*\n\n_Preview:_\n${wlcTxt}` }, { quoted: m })
        }
  
        if (ocrs === 'reset') {
          await updateDb(chat.id, gcData, { welcome: false, welcome_text: null })
          return xp.sendMessage(chat.id, { text: `♻️ Teks Welcome berhasil direset.` }, { quoted: m })
        }
      } catch (e) { call(xp, e, m) }
    }
  })
  
}