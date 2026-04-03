import { gc } from '../../system/db/data.js'
import { isJidGroup, downloadMediaMessage } from 'baileys'

export default function group(ev) {
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

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix,
      text,
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = getGc(chat),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm || !ocrs) {
          return xp.sendMessage(chat.id, {
            text: !gcData
              ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar`
              : !usrAdm
              ? 'kamu bukan admin'
              : !botAdm
              ? 'aku bukan admin'
              : `masukan input\ncontoh:\n${prefix}${cmd} on → aktifkan ${cmd}\n${prefix}${cmd} off → nonaktifkan ${cmd}\n${prefix}${cmd} set <text> → setting ${cmd}\n${prefix}${cmd} reset → reset ${cmd}`
          }, { quoted: m })
        }

        gcData.filter = gcData.filter || {}
        gcData.filter.badword = gcData.filter.badword || {
          antibadword: !1,
          badwordtext: []
        }

        if (ocrs === 'on' || ocrs === 'off')
          return gcData.filter.badword.antibadword = ocrs === 'on',
          save.gc(),
          await xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })

        if (ocrs === 'set' || ocrs === 'reset') {
          if (ocrs === 'set') {
            let txt = args.join(' ').trim()

            if (!txt)
              return xp.sendMessage(chat.id, { text: `masukan kata-kata kasar nya\ncontoh: ${prefix}${cmd} set bahlil` }, { quoted: m })

            if (!Array.isArray(gcData.filter.badword.badwordtext))
              gcData.filter.badword.badwordtext = []

            if (!gcData.filter.badword.badwordtext.includes(txt))
              gcData.filter.badword.badwordtext.push(txt)

            gcData.filter.badword.antibadword = !0
            save.gc()

            await xp.sendMessage(chat.id, { text: `kata "${txt}" berhasil ditambahkan ke blacklist` }, { quoted: m })

          } else {
            gcData.filter.badword.antibadword = !1
            gcData.filter.badword.badwordtext = []
            save.gc()

            await xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
          }
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
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
  
  // 🔹 command untuk ON/OFF
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
        save.gc() // 🔴 Ini wajib ada agar pengaturan tersimpan di database

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
    name: 'anti tag all',
    cmd: ['antitagall', 'antitag', 'antihidetag'],
    tags: 'Group Menu',
    desc: 'anti tag all digrup',
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
              opsi = !!gcData?.filter?.antitagall,
              type = v => v ? 'Aktif' : 'Tidak',
              modeantitag= type(gcData?.filter?.antitagall)

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantitagall: ${modeantitag}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        gcData.filter.antitagall = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
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
              opsi = !!gcData?.filter?.antitagsw,
              type = v => v ? 'Aktif' : 'Tidak',
              modetagsw = type(gcData?.filter?.antitagsw)

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modetagsw}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        gcData.filter.antitagsw = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
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
        const gcData = getGc(chat)
        const { usrAdm } = await grupify(xp, m)

        if (!chat.group || !usrAdm) {
          return xp.sendMessage(chat.id, { text: 'Perintah ini hanya untuk Admin Grup.' }, { quoted: m })
        }

        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const isQuotedSticker = q?.stickerMessage

        if (!isQuotedSticker) {
          return xp.sendMessage(chat.id, { text: `Reply stiker yang ingin dilarang dengan command ${prefix}${cmd}` }, { quoted: m })
        }

        // Ambil sidik jari (hash) stikernya
        const stickerHash = Buffer.from(isQuotedSticker.fileSha256).toString('base64')

        // Pastikan array badStickers sudah ada di database grup
        if (!gcData.filter.badStickers) gcData.filter.badStickers = []

        // Cek apakah stiker sudah ada di daftar
        if (gcData.filter.badStickers.includes(stickerHash)) {
          return xp.sendMessage(chat.id, { text: 'Stiker ini sudah masuk daftar larangan grup.' }, { quoted: m })
        }

        // Simpan hash ke database
        gcData.filter.badStickers.push(stickerHash)
        save.gc()

        await xp.sendMessage(chat.id, { text: '✅ Stiker berhasil ditambahkan ke daftar larangan. Member biasa yang mengirim stiker ini akan otomatis dihapus pesannya.' }, { quoted: m })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
      }
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
        const gcData = getGc(chat)
        const { usrAdm } = await grupify(xp, m)

        // Hanya Admin atau Owner yang bisa pakai command ini
        if (!chat.group || (!usrAdm && !own(m))) {
          return xp.sendMessage(chat.id, { text: 'Hanya Admin/Owner yang bisa menggunakan perintah ini.' }, { quoted: m })
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo
        const targetRaw = quoted?.participant || quoted?.mentionedJid?.[0] || (args[0] ? global.number(args[0]) + '@s.whatsapp.net' : null)

        if (!targetRaw) {
          return xp.sendMessage(chat.id, { text: `Tag/reply/masukkan nomor target.\nContoh: ${prefix}${cmd} @member` }, { quoted: m })
        }

        // Pastikan array whitelist sudah ada
        if (!gcData.filter.whitelistSticker) gcData.filter.whitelistSticker = []

        // Cek apakah nomor sudah ada di daftar
        if (gcData.filter.whitelistSticker.includes(targetRaw)) {
          return xp.sendMessage(chat.id, { text: 'Nomor ini sudah ada di daftar izin stiker.' }, { quoted: m })
        }

        // Simpan nomor ke database grup
        gcData.filter.whitelistSticker.push(targetRaw)
        save.gc()

        await xp.sendMessage(chat.id, { 
          text: `✅ Berhasil! @${targetRaw.split('@')[0]} sekarang memiliki VVIP Pass untuk mengirim stiker terlarang di grup ini.`, 
          mentions: [targetRaw] 
        }, { quoted: m })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
      }
    }
  })

  ev.on({
    name: 'auto back',
    cmd: ['autoback'],
    tags: 'Group Menu',
    desc: 'mengaktifkan autoback grup',
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

        const { usrAdm, botAdm } = await grupify(xp, m),
              gcData = getGc(chat)

        if (!usrAdm || !botAdm || !gcData) {
          return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })
        }

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.autoback,
              type = v => v ? 'Aktif' : 'Tidak',
              modeback = type(gcData?.filter?.autoback)

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modeback}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        gcData.filter.autoback = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'blacklist member',
    cmd: ['blacklistmember', 'blacklist'],
    tags: 'Group Menu',
    desc: 'menutup grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'Perintah ini hanya untuk grup' }, { quoted: m })

        const { usrAdm, botAdm } = await grupify(xp, m),
              q = m.message?.extendedTextMessage?.contextInfo,
              target = q?.participant || q?.mentionedJid?.[0]

        if (!usrAdm || !botAdm || !target) {
          return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : 'reply/tag target yang akan diblacklist' }, { quoted: m })
        }

        const gcData = getGc(chat),
              usr = target.replace(/@s\.whatsapp\.net$/, '')

        gcData.blacklist ??= []
        gcData.blacklist.push(target)

        await xp.sendMessage(chat.id, { text: `${usr} berhasil di blacklist` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

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
    name: 'daftar gc',
    cmd: ['daftargc'],
    tags: 'Group Menu',
    desc: 'mendaftarkan grup ke database',
    owner: !1,
    prefix: !0,
    money: 300,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = getGc(chat)

        if (gcData) return xp.sendMessage(chat.id, { text: 'grup ini sudah terdaftar' }, { quoted: m })

        const cache = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              groupName = cache.subject,
              gcInfo = cache;

        gc().key[groupName] = {
          id: chat.id,
          ban: !1,
          member: gcInfo.participants?.length || 0,
          filter: {
            mute: !1,
            antilink: !1,
            antitagsw: !1,
            antich: !1,
            autoback: !1,
            antitagall: !1,
            blacklist: [],
            badword: {
              antibadword: !1,
              badwordtext: []
            },
            left: {
              leftGc: !1,
              leftText: ''
            },
            welcome: {
              welcomeGc: !1,
              welcomeText: ''
            }
          }
        }

        save.gc()
        xp.sendMessage(chat.id, { text: `grup *${groupName}* berhasil didaftarkan` }, { quoted: m })
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
    desc: 'melihat intro grup',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const gcData = getGc(chat),
              w = gcData?.filter?.welcome,
              txt = w?.welcomeText?.trim() || 'halo selamat datang',
              wlcOn = w?.welcomeGc === true;

        if (!chat.group || !gcData || !wlcOn) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : `fitur welcome off ketik ${prefix}welcome on untuk mengaktifkan` }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
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
    name: 'left',
    cmd: ['left'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    desc: 'seting left outro',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix,
      text
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan digrup' }, { quoted: m })

        const gcData = getGc(chat),
              quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm || !ocrs) {
          return xp.sendMessage(chat.id, {
            text: !gcData
              ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar`
              : !usrAdm
              ? 'kamu bukan admin'
              : !botAdm
              ? 'aku bukan admin'
              : `masukan input\ncontoh:\n${prefix}${cmd} on → aktifkan ${cmd}\n${prefix}${cmd} off → nonaktifkan ${cmd}\n${prefix}${cmd} set <text> → setting ${cmd}\n${prefix}${cmd} reset → reset ${cmd}`
          }, { quoted: m })
        }

        gcData.filter.left ??= { leftGc: !1, leftText: '' }

        if (ocrs === 'on' || ocrs === 'off')
          return gcData.filter.left.leftGc = ocrs === 'on',
          save.gc(),
          await xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })

        if (ocrs === 'set') {
          let lftTxt = text.replace(/^[^\s]+\s*left\s+set/i, "").trim() || quoted

          if (!lftTxt) return xp.sendMessage(chat.id, { text: 'masukan/reply pesan selamat tinggalnya' }, { quoted: m })

          gcData.filter.left.leftGc = !0
          gcData.filter.left.leftText = lftTxt
          save.gc()

          return xp.sendMessage(chat.id, { text: `pesan selamat tinggal diperbaharui\n${lftTxt}` }, { quoted: m })
        }

        if (ocrs === 'reset')
          return gcData.filter.left.leftGc = !1,
          gcData.filter.left.leftText = '',
          save.gc(),
          await xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'mute',
    cmd: ['mute'],
    tags: 'Group Menu',
    desc: 'setting mute grup',
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

        const input = args.join(' '),
              gcData = getGc(chat),
              type = v => v ? 'Aktif' : 'Tidak',
              modeMute = type(gcData?.filter?.mute),
              opsi = !!gcData?.filter?.mute,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !input || !gcData) {
          return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : !input ? `contoh:\n${prefix}${cmd} on/off\n\n${cmd}: ${modeMute}` : `grup ini belum terdaftar, ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })
        }

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modeMute}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        gcData.filter.mute = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
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
    name: 'bersih grup',
    cmd: ['bersihgrup', 'cleangc', 'kickbanned', 'sidakkenon'],
    tags: 'Admin Menu',
    desc: 'Sidak akun kenon skala besar menggunakan Native Scan WA (Super Cepat)',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, cmd, prefix }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa digunakan di dalam grup!' }, { quoted: m })

        const groupMetadata = await xp.groupMetadata(chat.id)
        const participants = groupMetadata.participants
        const botId = xp.user.id.split(':')[0] + '@s.whatsapp.net'

        const isAdmins = participants.find(p => p.id === chat.sender)?.admin !== null
        const isBotAdmins = participants.find(p => p.id === botId)?.admin !== null
        const isOwner = chat.sender === (global.ownerNumber?.[0] || '') + '@s.whatsapp.net'

        if (!isAdmins && !isOwner) return xp.sendMessage(chat.id, { text: '❌ Hanya Admin grup yang bisa menggunakan perintah ini!' }, { quoted: m })
        if (!isBotAdmins) return xp.sendMessage(chat.id, { text: '❌ Bot harus menjadi Admin terlebih dahulu!' }, { quoted: m })

        const totalMember = participants.length
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
        
        let msgStart = `🕵️‍♂️ _Memulai Native Scan pada ${totalMember} anggota..._\n\n`
        msgStart += `⚡ *Mode Super Cepat Aktif:*\n_Bot sedang mengecek langsung ke server Meta/WhatsApp._`
        const progressMsg = await xp.sendMessage(chat.id, { text: msgStart }, { quoted: m })

        let kickedCount = 0
        let scannedCount = 0
        let errorCount = 0

        const delay = ms => new Promise(res => setTimeout(res, ms))

        for (let part of participants) {
          const jid = part.id
          const num = jid.split('@')[0]

          if (jid === botId || part.admin !== null || num === global.ownerNumber?.[0]) continue

          scannedCount++

          try {
            // ✨ PERBAIKAN: Menggunakan fungsi bawaan Baileys untuk ngecek keaslian nomor!
            const [cekWa] = await xp.onWhatsApp(num)

            // Jika nomor tidak ada di server WA (Kenon / Dihapus permanen)
            if (!cekWa || !cekWa.exists) {
               await xp.groupParticipantsUpdate(chat.id, [jid], 'remove').catch(() => {})
               kickedCount++
            }
          } catch (err) {
            errorCount++
          }

          // Live Progress update setiap kelipatan 50 anggota
          if (scannedCount % 50 === 0 || scannedCount === totalMember - 3) {
             let updateTxt = `⏳ *NATIVE SCAN BERJALAN (${scannedCount}/${totalMember})*\n\n`
             updateTxt += `☠️ *Akun Mati Ditendang:* ${kickedCount} zombi.\n\n`
             updateTxt += `_Mengecek langsung ke server Meta..._`
             
             try { await xp.sendMessage(chat.id, { text: updateTxt, edit: progressMsg.key }) } catch (e) {}
          }

          // Jeda dipercepat jadi 1 detik saja karena ping internal WA jauh lebih ringan
          await delay(1000) 
        }

        // Laporan Akhir
        let finalTxt = `🧹 *SIDAK GRUP SUPER SELESAI*\n\n`
        finalTxt += `📊 *Total Diperiksa:* ${scannedCount} anggota\n`
        finalTxt += `☠️ *Akun Banned/Mati Ditendang:* ${kickedCount} orang\n`
        if (errorCount > 0) finalTxt += `⚠️ *Gagal Cek:* ${errorCount} nomor\n`
        finalTxt += `\n> *Grup sekarang 100% bersih dari akun zombi!*`

        try {
            await xp.sendMessage(chat.id, { text: finalTxt, edit: progressMsg.key })
        } catch (e) {
            await xp.sendMessage(chat.id, { text: finalTxt }, { quoted: m })
        }
        
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error utama pada ${cmd}:`, e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
      }
    }
  })

  ev.on({
    name: 'kick pasif',
    cmd: ['kickpasif', 'sidakpasif', 'cleansilent'],
    tags: 'Group Menu',
    desc: 'Menendang silent reader yang tidak pernah chat selama X hari',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa digunakan di dalam grup!' }, { quoted: m })

        const groupMetadata = await xp.groupMetadata(chat.id)
        const participants = groupMetadata.participants
        const botId = xp.user.id.split(':')[0] + '@s.whatsapp.net'

        const isAdmins = participants.find(p => p.id === chat.sender)?.admin !== null
        const isBotAdmins = participants.find(p => p.id === botId)?.admin !== null
        const isOwner = chat.sender === (global.ownerNumber?.[0] || '') + '@s.whatsapp.net'

        if (!isAdmins && !isOwner) return xp.sendMessage(chat.id, { text: '❌ Hanya Admin grup yang bisa menggunakan perintah ini!' }, { quoted: m })
        if (!isBotAdmins) return xp.sendMessage(chat.id, { text: '❌ Bot harus menjadi Admin terlebih dahulu!' }, { quoted: m })

        // Validasi input jumlah hari
        if (!args[0] || isNaN(args[0])) {
           return xp.sendMessage(chat.id, { 
               text: `⚠️ *Format Salah!*\n\nMasukkan jumlah hari batas pasif.\n\n💬 *Contoh:* ${prefix}${cmd} 30\n_(Artinya: menendang anggota yang tidak pernah chat selama 30 hari)_` 
           }, { quoted: m })
        }

        const hari = parseInt(args[0])
        
        // Mencegah admin iseng nendang orang yang baru sehari nggak buka grup
        if (hari < 7) {
           return xp.sendMessage(chat.id, { text: `⚠️ *Terlalu Cepat!*\n\nMinimal set waktu ke 7 hari agar wajar dan tidak salah tendang orang yang cuma lagi sibuk.` }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        // Menghitung batas waktu: Waktu sekarang dikurangi (Hari x 24 Jam x 60 Menit x 60 Detik x 1000 Milidetik)
        const batasWaktu = Date.now() - (hari * 24 * 60 * 60 * 1000)
        
        let targetKick = []
        let amanCount = 0
        const allUsers = Object.values(db().key) // Mengambil seluruh database user

        // Memilah mana yang rajin dan mana yang silent reader
        for (let part of participants) {
          const jid = part.id
          const num = jid.split('@')[0]

          // Lewati bot, admin grup, dan owner bot
          if (jid === botId || part.admin !== null || num === global.ownerNumber?.[0]) continue

          const userData = allUsers.find(u => u.jid === jid)
          
          // Mengambil waktu chat terakhir (CCTV). Jika belum pernah terekam (0), otomatis masuk target tendang
          const lastChatTime = userData?.lastchat || 0

          if (lastChatTime < batasWaktu) {
             targetKick.push(jid)
          } else {
             amanCount++
          }
        }

        if (targetKick.length === 0) {
           return xp.sendMessage(chat.id, { text: `✅ *Grup Sangat Aktif!*\n\nTidak ditemukan *Silent Reader* yang pasif lebih dari ${hari} hari. Semua anggota rajin chatting!` }, { quoted: m })
        }

        // Mulai proses eksekusi dengan Live Progress
        let msgStart = `🚨 *SIDAK SILENT READER DIMULAI*\n\n`
        msgStart += `🔎 *Target:* ${targetKick.length} orang (Pasif ${hari} Hari)\n`
        msgStart += `🛡️ *Anggota Aktif (Aman):* ${amanCount} orang\n\n`
        msgStart += `_Mengeksekusi target perlahan agar tidak terkena spam limit WA..._`
        
        const progressMsg = await xp.sendMessage(chat.id, { text: msgStart }, { quoted: m })
        
        let kickedCount = 0
        const delay = ms => new Promise(res => setTimeout(res, ms))

        for (let jid of targetKick) {
           await xp.groupParticipantsUpdate(chat.id, [jid], 'remove').catch(() => {})
           kickedCount++

           // Update pesan progress setiap kelipatan 20 atau saat sudah selesai semua
           if (kickedCount % 20 === 0 || kickedCount === targetKick.length) {
              try {
                 await xp.sendMessage(chat.id, { text: `⏳ *Mengeksekusi...* (${kickedCount}/${targetKick.length} ditendang)`, edit: progressMsg.key })
              } catch (e) {}
           }
           await delay(1500) // Jeda 1.5 detik per tendangan
        }

        // Laporan Akhir
        let finalTxt = `🧹 *PEMBERSIHAN SILENT READER SELESAI*\n\n`
        finalTxt += `☠️ *Total Ditendang:* ${kickedCount} orang\n`
        finalTxt += `⏱️ *Batas Pasif:* ${hari} Hari\n\n`
        finalTxt += `> _Mereka ditendang karena hanya menyimak tanpa pernah mengirim pesan di grup ini._`

        try { await xp.sendMessage(chat.id, { text: finalTxt, edit: progressMsg.key }) } 
        catch (e) { await xp.sendMessage(chat.id, { text: finalTxt }, { quoted: m }) }

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
      }
    }
  })
  
  ev.on({
    name: 'sweep tag',
    cmd: ['sweeptag', 'sidak', 'bersihtag', 'cleanspam'],
    tags: 'Admin Menu',
    desc: 'Membersihkan oknum spam tag/SW yang beraksi saat bot mati',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, cmd, prefix }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa digunakan di dalam grup!' }, { quoted: m })

        // Validasi Admin dan Bot Admin
        const groupMetadata = await xp.groupMetadata(chat.id)
        const participants = groupMetadata.participants
        const botId = xp.user.id.split(':')[0] + '@s.whatsapp.net'
        
        const isAdmins = participants.find(p => p.id === chat.sender)?.admin !== null
        const isBotAdmins = participants.find(p => p.id === botId)?.admin !== null
        const isOwner = chat.sender === global.ownerNumber[0] + '@s.whatsapp.net'

        if (!isAdmins && !isOwner) return xp.sendMessage(chat.id, { text: '❌ Hanya Admin grup yang bisa melakukan sidak!' }, { quoted: m })
        if (!isBotAdmins) return xp.sendMessage(chat.id, { text: '❌ Bot harus menjadi Admin terlebih dahulu untuk bisa menendang oknum dan menghapus pesan!' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '🕵️‍♂️', key: m.key } })
        await xp.sendMessage(chat.id, { text: '🕵️‍♂️ _Melakukan inspeksi mendadak... Memeriksa riwayat pesan saat bot tertidur..._' }, { quoted: m })

        // Mengambil memori pesan grup
        const memStore = typeof store !== 'undefined' ? store : global.store
        // PERBAIKAN: Penambahan opsional chaining (?.) sebelum [chat.id]
        const msgs = memStore?.messages?.[chat.id]?.array || []

        if (msgs.length === 0) {
            return xp.sendMessage(chat.id, { text: '✅ Memori grup kosong atau aman.' }, { quoted: m })
        }

        // Batas jumlah tag yang dianggap SPAM (Bisa kamu atur)
        const TAG_LIMIT = 15 
        let offenders = new Set()
        let messagesToDelete = []

        // Mengais riwayat pesan dari bawah ke atas
        for (let msg of msgs) {
            // Cek apakah ada mention di dalam pesan
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            
            // Cek apakah pesan menggunakan fitur tagall/hidetag bawaan WhatsApp
            const isAllMentions = msg.message?.extendedTextMessage?.contextInfo?.mentionAll || false

            if (mentions.length > TAG_LIMIT || isAllMentions) {
                const sender = msg.key.participant || msg.key.remoteJid
                
                // Jangan tendang sesama Admin atau Owner!
                const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null
                const isSenderOwner = sender === global.ownerNumber[0] + '@s.whatsapp.net'

                if (!isSenderAdmin && !isSenderOwner && sender !== botId) {
                    offenders.add(sender)
                    messagesToDelete.push(msg.key)
                }
            }
        }

        if (offenders.size === 0) {
            return xp.sendMessage(chat.id, { text: '✅ Hutan aman! Tidak ditemukan oknum spammer/fakboy SW di memori grup ini.' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { text: `🚨 *TARGET DITEMUKAN!*\n\nDitemukan ${offenders.size} oknum yang melakukan spam tag.\nMengeksekusi target...` }, { quoted: m })

        const delay = ms => new Promise(res => setTimeout(res, ms))

        // 1. Menghapus Pesan Spam Mereka (Tarik Pesan)
        for (let key of messagesToDelete) {
            await xp.sendMessage(chat.id, { delete: key }).catch(() => {})
            await delay(500) // Jeda agar tidak spam request
        }

        // 2. Menendang (Kick) Para Pelaku
        const arrayOffenders = Array.from(offenders)
        await xp.groupParticipantsUpdate(chat.id, arrayOffenders, 'remove').catch(() => {})

        // Laporan Selesai
        let txt = `🧹 *SIDAK SELESAI*\n\nBerhasil membasmi dan menghapus pesan dari oknum berikut:\n`
        arrayOffenders.forEach((jid, i) => {
            txt += `${i + 1}. @${jid.split('@')[0]}\n`
        })
        txt += `\n> *Pesan Sponsor:* Makanya jangan macem-macem kalau bot lagi tidur!`

        await xp.sendMessage(chat.id, { text: txt, mentions: arrayOffenders }, { quoted: m })
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada command ${cmd}:`, e)
        await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
      }
    }
  })

  ev.on({
    name: 'welcome',
    cmd: ['welcome'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    desc: 'set welcome grup',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix,
      text
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = getGc(chat),
              quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm || !ocrs) {
          return xp.sendMessage(chat.id, {
            text: !gcData
              ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar`
              : !usrAdm
              ? 'kamu bukan admin'
              : !botAdm
              ? 'aku bukan admin'
              : `masukan input\ncontoh:\n${prefix}${cmd} on → aktifkan ${cmd}\n${prefix}${cmd} off → nonaktifkan ${cmd}\n${prefix}${cmd} set <text> → setting ${cmd}\n${prefix}${cmd} reset → reset ${cmd}`
          }, { quoted: m })
        }

        gcData.filter ??= {}
        gcData.filter.welcome ??= { welcomeGc: !1, welcomeText: '' }

        const wlc = gcData.filter.welcome

        if (ocrs === 'on' || ocrs === 'off')
          return wlc.welcomeGc = ocrs === 'on',
          save.gc(),
          xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })

        if (ocrs === 'set') {
          let wlcTxt = text.replace(/^[^\s]+\s*welcome\s+set/i, "").trim() || quoted

          if (!wlcTxt) return xp.sendMessage(chat.id, { text: 'masukan/reply pesan selamat datangnya' }, { quoted: m })

          wlc.welcomeGc = !0
          wlc.welcomeText = wlcTxt
          save.gc()

          return xp.sendMessage(chat.id, { text: `pesan selamat datang diperbaharui\n${wlcTxt}` }, { quoted: m })
        }
  
        if (ocrs === 'reset')
          return wlc.welcomeGc = !1,
          wlc.welcomeText = '',
          save.gc(),
          xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}
