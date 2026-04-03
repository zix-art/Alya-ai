import fs from 'fs'
import path from 'path'
import { Chess } from 'chess.js'
const bankData = path.join(dirname, './db/bank.json')

export default function game(ev) {
  
  // ==========================================
  // 🥷 1. UPDATE FITUR RAMPOK (Player vs Player)
  // ==========================================
  ev.on({
    name: 'rampok',
    cmd: ['rampok'],
    tags: 'Game Menu',
    desc: 'Mencuri uang member grup (Risiko Denda)',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.2,

    run: async (xp, m, { chat, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa digunakan di grup' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo
        const target = quoted?.participant || quoted?.mentionedJid?.[0]
        
        if (!target) return xp.sendMessage(chat.id, { text: '⚠️ Reply atau tag target yang ingin dirampok!' }, { quoted: m })
        if (target === chat.sender) return xp.sendMessage(chat.id, { text: '⚠️ Masa merampok diri sendiri?' }, { quoted: m })

        const targetdb = Object.values(db().key).find(t => t.jid === target)
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!targetdb) return xp.sendMessage(chat.id, { text: '❌ Target tidak terdaftar di database' }, { quoted: m })
        if (usrdb.game?.robbery?.cost <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Kesempatan merampokmu hari ini habis. Coba lagi besok!' }, { quoted: m })
        if (targetdb.moneyDb.money < 1000) return xp.sendMessage(chat.id, { text: '⚠️ Kasihan, target terlalu miskin untuk dirampok.' }, { quoted: m })
        if (usrdb.moneyDb.money < 1000) return xp.sendMessage(chat.id, { text: '⚠️ Kamu harus punya minimal Rp 1.000 untuk modal merampok.' }, { quoted: m })

        const mention = target.split('@')[0]
        
        // Peluang berhasil mencuri hanya 40%
        const isSuccess = Math.random() < 0.4 
        
        // Mengambil/Kehilangan 10% dari dompet
        const stolenAmount = Math.floor(targetdb.moneyDb.money * 0.10)
        const fineAmount = Math.floor(usrdb.moneyDb.money * 0.10)

        usrdb.game.robbery.cost -= 1
        let txt = ''

        if (isSuccess) {
            targetdb.moneyDb.money -= stolenAmount
            usrdb.moneyDb.money += stolenAmount
            txt = `🥷 *PERAMPOKAN BERHASIL!*\n\nKamu berhasil menyelinap dan mencuri uang dari @${mention}!\n💰 *Hasil Rampokan:* +Rp ${stolenAmount.toLocaleString('id-ID')}`
        } else {
            usrdb.moneyDb.money -= fineAmount
            targetdb.moneyDb.money += fineAmount
            txt = `🚨 *PERAMPOKAN GAGAL!*\n\nKamu ketahuan oleh warga saat mencoba merampok @${mention}!\nKamu dipukuli dan harus membayar denda ganti rugi.\n💸 *Denda:* -Rp ${fineAmount.toLocaleString('id-ID')}`
        }

        save.db()
        await xp.sendMessage(chat.id, { text: txt, mentions: [target] }, { quoted: m })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
      }
    }
  })

  // ==========================================
  // 🔫 2. RUSSIAN ROULETTE (Taruhan Multiplayer)
  // ==========================================
  global.rouletteGame = global.rouletteGame || {}

  ev.on({
    name: 'russian roulette',
    cmd: ['roulette', 'russian'],
    tags: 'Game Menu',
    desc: 'Taruhan hidup dan mati bersama member grup',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.5,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya bisa dimainkan di grup' }, { quoted: m })
        
        if (global.rouletteGame[chat.id]) {
            return xp.sendMessage(chat.id, { text: '⚠️ Selesaikan dulu game Roulette yang sedang berlangsung di grup ini!' }, { quoted: m })
        }

        if (!args[0] || isNaN(args[0]) || parseInt(args[0]) < 100) {
            return xp.sendMessage(chat.id, { text: `⚠️ Masukkan nominal taruhan minimal Rp 100\n💬 *Contoh:* ${prefix}${cmd} 5000` }, { quoted: m })
        }

        const bet = parseInt(args[0])
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!usrdb || usrdb.moneyDb.money < bet) {
            return xp.sendMessage(chat.id, { text: `❌ Saldomu tidak cukup untuk bertaruh Rp ${bet.toLocaleString('id-ID')}` }, { quoted: m })
        }

        // Buka Lobi
        global.rouletteGame[chat.id] = {
            bet: bet,
            players: [chat.sender],
            status: 'waiting'
        }

        let txt = `🔫 *RUSSIAN ROULETTE DIBUKA* 🔫\n\n`
        txt += `Alya sedang memutar silinder peluru...\n\n`
        txt += `💰 *Taruhan Masuk:* Rp ${bet.toLocaleString('id-ID')}\n`
        txt += `🙋‍♂️ *Pemain:* 1\n\n`
        txt += `_Ketik *${prefix}ikut* untuk bergabung! Game akan dimulai dalam 30 detik._`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })

        // Timer 30 detik untuk mulai
        setTimeout(async () => {
            const game = global.rouletteGame[chat.id]
            if (!game) return

            if (game.players.length < 2) {
                await xp.sendMessage(chat.id, { text: '❌ Game dibatalkan karena pemain kurang dari 2 orang.' })
                delete global.rouletteGame[chat.id]
                return
            }

            game.status = 'playing'
            const totalPrize = game.bet * game.players.length
            await xp.sendMessage(chat.id, { text: `🔥 *GAME DIMULAI!* 🔥\n\nTerdapat ${game.players.length} pemain dengan total hadiah *Rp ${totalPrize.toLocaleString('id-ID')}*.\nPistol berputar dan ditembakkan secara acak...` })

            setTimeout(async () => {
                // Pilih 1 korban yang kalah
                const loserIndex = Math.floor(Math.random() * game.players.length)
                const loser = game.players[loserIndex]
                const winners = game.players.filter(p => p !== loser)
                
                // Hadiah dibagi rata ke pemenang
                const prizePerWinner = Math.floor(totalPrize / winners.length)

                // Eksekusi Database
                game.players.forEach(jid => {
                    const dbUser = Object.values(db().key).find(u => u.jid === jid)
                    if (dbUser) {
                        if (jid === loser) {
                            dbUser.moneyDb.money -= game.bet // Kalah hangus
                        } else {
                            dbUser.moneyDb.money += prizePerWinner // Menang dapat bagian
                        }
                    }
                })
                save.db()

                let winMentions = winners.map(w => `@${w.split('@')[0]}`).join('\n- ')
                let endTxt = `💥 *DORRR!!!*\n\nPistol meledak di kepala @${loser.split('@')[0]}! (Uang hangus)\n\n`
                endTxt += `🎉 *PEMENANG (Selamat):*\n- ${winMentions}\n\n`
                endTxt += `Masing-masing mendapatkan *Rp ${prizePerWinner.toLocaleString('id-ID')}*!`

                await xp.sendMessage(chat.id, { text: endTxt, mentions: game.players })
                delete global.rouletteGame[chat.id]

            }, 4000)

        }, 30000)

      } catch (e) {
        console.error(e)
        delete global.rouletteGame[chat.id]
      }
    }
  })

  ev.on({
    name: 'ikut roulette',
    cmd: ['ikut'],
    tags: 'Game Menu',
    desc: 'Ikut permainan Russian Roulette',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, prefix }) => {
      const game = global.rouletteGame[chat.id]
      if (!game || game.status !== 'waiting') return

      if (game.players.includes(chat.sender)) {
          return xp.sendMessage(chat.id, { text: '⚠️ Kamu sudah terdaftar di lobi ini.' }, { quoted: m })
      }

      const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
      if (!usrdb || usrdb.moneyDb.money < game.bet) {
          return xp.sendMessage(chat.id, { text: `❌ Saldomu tidak cukup! Membutuhkan Rp ${game.bet.toLocaleString('id-ID')}` }, { quoted: m })
      }

      game.players.push(chat.sender)
      await xp.sendMessage(chat.id, { text: `✅ @${chat.sender.split('@')[0]} bergabung ke meja judi! (Total: ${game.players.length} orang)`, mentions: [chat.sender] }, { quoted: m })
    }
  })

  // ==========================================
  // 🧩 3. SUSUN KATA BERHADIAH
  // ==========================================
  global.susunKataGame = global.susunKataGame || {}

  ev.on({
    name: 'susun kata',
    cmd: ['susunkata', 'acakata'],
    tags: 'Game Menu',
    desc: 'Tebak acak huruf berhadiah',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, prefix, cmd }) => {
        if (global.susunKataGame[chat.id]) return xp.sendMessage(chat.id, { text: '⚠️ Masih ada sesi Susun Kata yang belum terjawab di grup ini!' }, { quoted: m })

        const words = ['MEDAN', 'PUZZLE', 'ALYA', 'DATABASE', 'SERVER', 'JAVASCRIPT', 'VERCEL', 'PROGRAMMER', 'WEBSITE', 'INTERNET']
        const jawaban = words[Math.floor(Math.random() * words.length)]
        
        // Mengacak huruf
        const acak = jawaban.split('').sort(() => 0.5 - Math.random()).join(' - ')
        const hadiah = Math.floor(Math.random() * 500) + 100 // Hadiah 100 - 600

        global.susunKataGame[chat.id] = { jawaban, hadiah }

        let txt = `🧩 *SUSUN KATA* 🧩\n\n`
        txt += `Susun huruf berikut menjadi sebuah kata:\n`
        txt += `👉 *${acak}*\n\n`
        txt += `🎁 *Hadiah:* Rp ${hadiah}\n`
        txt += `_Ketik *${prefix}jawab <kata>* untuk menebak!_`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
    }
  })

  ev.on({
    name: 'jawab kata',
    cmd: ['jawab'],
    tags: 'Game Menu',
    desc: 'Menjawab teka-teki',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { args, chat }) => {
        const game = global.susunKataGame[chat.id]
        if (!game) return

        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan jawabanmu!' }, { quoted: m })

        const tebakan = args[0].toUpperCase()

        if (tebakan === game.jawaban) {
            const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
            if (usrdb) {
                usrdb.moneyDb = usrdb.moneyDb || { money: 0 }
                usrdb.moneyDb.money += game.hadiah
                save.db()
            }
            await xp.sendMessage(chat.id, { text: `🎉 *BENAR!*\n\nKata yang tepat adalah *${game.jawaban}*.\nKamu mendapatkan hadiah Rp ${game.hadiah}!`, mentions: [chat.sender] }, { quoted: m })
            delete global.susunKataGame[chat.id]
        } else {
            await xp.sendMessage(chat.id, { text: '❌ Salah, coba lagi!' }, { quoted: m })
        }
    }
  })

  // ==========================================
  // ♟️ 4. SISTEM CATUR (MENGGUNAKAN CHESS.JS)
  // ==========================================
  global.chessGame = global.chessGame || {}

  ev.on({
    name: 'catur',
    cmd: ['catur', 'chess'],
    tags: 'Game Menu',
    desc: 'Bermain catur dengan member grup',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 1,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        const action = args[0]?.toLowerCase()
        const game = global.chessGame[chat.id]

        if (!action) {
            let guide = `♟️ *PANDUAN MAIN CATUR*\n\n`
            guide += `1. *${prefix}${cmd} main @tag* (Menantang orang)\n`
            guide += `2. *${prefix}${cmd} jalan e2e4* (Menggerakkan bidak dari e2 ke e4)\n`
            guide += `3. *${prefix}${cmd} board* (Melihat papan catur saat ini)\n`
            guide += `4. *${prefix}${cmd} nyerah* (Menyerah)\n\n`
            guide += `_Pastikan kamu sudah install library dengan mengetik 'npm install chess.js' di terminal._`
            return xp.sendMessage(chat.id, { text: guide }, { quoted: m })
        }

        if (action === 'main') {
            if (game) return xp.sendMessage(chat.id, { text: '⚠️ Selesaikan dulu pertandingan catur yang ada di grup ini!' }, { quoted: m })
            
            const quoted = m.message?.extendedTextMessage?.contextInfo
            const target = quoted?.participant || quoted?.mentionedJid?.[0]
            if (!target) return xp.sendMessage(chat.id, { text: '⚠️ Tag orang yang ingin kamu tantang!' }, { quoted: m })

            global.chessGame[chat.id] = {
                chess: new Chess(),
                white: chat.sender,
                black: target,
                turn: 'w' // Putih jalan duluan
            }

            const fen = encodeURIComponent(global.chessGame[chat.id].chess.fen())
            const boardUrl = `https://fen2image.chessvision.ai/${fen}`

            await xp.sendMessage(chat.id, { 
                image: { url: boardUrl }, 
                caption: `⚔️ *PERTANDINGAN CATUR DIMULAI* ⚔️\n\n⚪ Putih: @${chat.sender.split('@')[0]}\n⚫ Hitam: @${target.split('@')[0]}\n\nPutih jalan duluan. Gunakan *${prefix}${cmd} jalan <posisi>*`,
                mentions: [chat.sender, target]
            }, { quoted: m })
            return
        }

        if (action === 'jalan') {
            if (!game) return xp.sendMessage(chat.id, { text: '⚠️ Tidak ada game catur yang berjalan.' }, { quoted: m })
            
            const isWhiteTurn = game.chess.turn() === 'w'
            const currentPlayer = isWhiteTurn ? game.white : game.black
            
            if (chat.sender !== currentPlayer) {
                return xp.sendMessage(chat.id, { text: '⚠️ Bukan giliranmu!' }, { quoted: m })
            }

            const moveInput = args[1] // contoh: e2e4
            if (!moveInput || moveInput.length !== 4) return xp.sendMessage(chat.id, { text: `⚠️ Format salah! Contoh: *${prefix}${cmd} jalan e2e4*` }, { quoted: m })

            try {
                // Melakukan pergerakan
                game.chess.move({
                    from: moveInput.substring(0, 2),
                    to: moveInput.substring(2, 4),
                    promotion: 'q' // Otomatis promote ke Ratu jika bidak sampai ujung
                })
            } catch (e) {
                return xp.sendMessage(chat.id, { text: '❌ Langkah tidak sah / Ilegal!' }, { quoted: m })
            }

            const fen = encodeURIComponent(game.chess.fen())
            const boardUrl = `https://fen2image.chessvision.ai/${fen}`
            
            let statusTxt = `♟️ *CATUR UPDATE*\n\n`
            
            if (game.chess.isCheckmate()) {
                statusTxt += `👑 *SKAKMAT!* @${currentPlayer.split('@')[0]} Memenangkan pertandingan!`
                await xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: statusTxt, mentions: [currentPlayer] })
                delete global.chessGame[chat.id]
                return
            }

            if (game.chess.isDraw() || game.chess.isStalemate()) {
                statusTxt += `🤝 *SERI / DRAW!* Pertandingan berakhir.`
                await xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: statusTxt })
                delete global.chessGame[chat.id]
                return
            }

            if (game.chess.isCheck()) statusTxt += `⚠️ *SKAK!*\n\n`
            
            const nextPlayer = game.chess.turn() === 'w' ? game.white : game.black
            statusTxt += `Langkah diterima. Sekarang giliran @${nextPlayer.split('@')[0]}!`

            await xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: statusTxt, mentions: [nextPlayer] })
        }

        if (action === 'board') {
            if (!game) return
            const fen = encodeURIComponent(game.chess.fen())
            await xp.sendMessage(chat.id, { image: { url: `https://fen2image.chessvision.ai/${fen}` }, caption: 'Papan Catur Saat Ini' })
        }

        if (action === 'nyerah') {
            if (!game) return
            if (chat.sender !== game.white && chat.sender !== game.black) return
            
            const winner = chat.sender === game.white ? game.black : game.white
            await xp.sendMessage(chat.id, { text: `🏳️ @${chat.sender.split('@')[0]} menyerah!\n\n👑 Pemenangnya adalah @${winner.split('@')[0]}`, mentions: [chat.sender, winner] })
            delete global.chessGame[chat.id]
        }

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
      }
    }
  })

  ev.on({
    name: 'auto farming',
    cmd: ['farm', 'autofarm', 'autofarming'],
    tags: 'Game Menu',
    desc: 'mengaktifkan auto farming',
    owner: !1,
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
        const input = args[0]?.toLowerCase(),
              user = Object.values(db().key).find(u => u.jid === chat.sender),
              opsi = !!user?.game?.farm,
              type = v => v ? 'Aktif' : 'Tidak',
              modefarm = type(user?.game?.farm)

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) {
          return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modefarm}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })
        }

        user.game.farm = input === 'on'
        save.db()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek bank',
    cmd: ['cekbank'],
    tags: 'Game Menu',
    desc: 'cek saldo bank',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const bankDb = JSON.parse(fs.readFileSync(bankData, 'utf-8')),
              saldo = bankDb.key?.saldo || 0

        let txt = `BANK BOT ${botName}\n`
            txt += `${line}\n`
            txt += `Akun: Bank Pusat\n`
            txt += `Saldo: Rp ${saldo.toLocaleString('id-ID')}\n`
            txt += `${line}`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'nabung',
    cmd: ['nabung', 'isiatm'],
    tags: 'Game Menu',
    desc: 'mengisi saldo bank orang',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        if (!args) return xp.sendMessage(chat.id, { text: 'contoh: .isiatm 10000' }, { quoted: m })

        const userDb = Object.values(db().key).find(u => u.jid === chat.sender),
              nominal = Number(args[0])

        if (!userDb || !nominal) {
          return xp.sendMessage(chat.id, { text: !userDb ? 'kamu belum terdaftar coba lagi' : 'nominal tidak valid\ncontoh: .isiatm 10000' }, { quoted: m })
        }

        if (userDb.moneyDb?.money < nominal) return xp.sendMessage(chat.id, { text: `uang kamu hanya tersisa ${userDb.moneyDb?.money.toLocaleString('id-ID')}` }, { quoted: m })

        userDb.moneyDb.money -= nominal
        userDb.moneyDb.moneyInBank += nominal
        save.db()

        await xp.sendMessage(chat.id, { text: `Rp ${nominal.toLocaleString('id-ID')} berhasil masukan ke bank` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'rampok',
    cmd: ['rampok'],
    tags: 'Game Menu',
    desc: 'merampok orang',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.2,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.participant || quoted?.mentionedJid?.[0],
              targetdb = Object.values(db().key).find(t => t.jid === target),
              usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!target || !targetdb) return xp.sendMessage(chat.id, { text: !target ? 'reply/tag target' : 'target belum terdaftar' }, { quoted: m })

        if (usrdb.game?.robbery?.cost <= 0) return xp.sendMessage(chat.id, { text: 'kesempatan merampok habis coba kembali besok' }, { quoted: m })

        const mention = target.replace(/@s\.whatsapp\.net$/, ''),
              moneyTarget = targetdb.moneyDb.money,
              moneyUsr = usrdb.moneyDb.money

        if (target === chat.sender) return

        if (moneyTarget <= 0) return xp.sendMessage(chat.id, { text: 'target miskin' }, { quoted: m })

        const chance = Math.floor(Math.random() * 100) + 1,
              escapeChance = chance >= 45
                ? Math.floor(Math.random() * 21) + 25
                : Math.floor(Math.random() * 21) + 10,
              escapeRoll = Math.floor(Math.random() * 100) + 1

        if (escapeRoll <= escapeChance) {
          return xp.sendMessage(chat.id, { text: `Target berhasil *lolos!*` }, { quoted: m })
        }

        const persen = chance > 100 ? 100 : chance,
              stolin = Math.floor(moneyTarget * (persen / 100)),
              finalSt = stolin < 1 ? 1 : stolin

        targetdb.moneyDb.money -= finalSt
        usrdb.moneyDb.money += finalSt
        usrdb.game.robbery.cost -= 1

        save.db()

        let txt = `${head}\n`
            txt += `${body} ${btn} *Berhasil Merampok:* Rp ${finalSt.toLocaleString('id-ID')} dari @${mention}\n`
            txt += `${body} ${btn} *Saldo Kamu:* Rp ${usrdb.moneyDb?.money.toLocaleString('id-ID')}\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, { text: txt, mentions: [target] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'sambung kata',
    cmd: ['sambungkata', 'samkat'],
    tags: 'Game Menu',
    desc: 'game sambung kata',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const { sambungKata } = await global.func(),
              user = Object.values(db().key).find(u => u.jid === chat.sender),
              key = Object.values(sambungKata),
              list = key[Math.floor(Math.random() * key.length)]

        const msg = await xp.sendMessage(chat.id, { text: `sambung kata dimulai\nsoal: ${list.soal}\n\nreply chat ini untuk menjawab` }, { quoted: m })

        const __sambungKata = path.join(dirname, '../temp/history_sambung_kata.json')

        let history = {}

        if (fs.existsSync(__sambungKata)) {
          history = JSON.parse(fs.readFileSync(__sambungKata, 'utf-8') || '{}')
        }

        history.key ??= {}
        history.key[chat.sender] ??= {}

        history.key[chat.sender][msg.key.id] = {
          name: chat.pushName,
          id: msg.key.id,
          chat: chat.id,
          no: user?.noId || chat.sender,
          soal: list.soal,
          key: list.jawaban,
          chance: 3,
          status: !0,
          set: Date.now()
        }

        fs.writeFileSync(__sambungKata, JSON.stringify(history, null, 2))
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'slot',
    cmd: ['isi', 'spin', 'slot', 'gacha'],
    tags: 'Game Menu',
    desc: 'gacha uang',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const saldoBank = JSON.parse(fs.readFileSync(bankData, 'utf-8')),
              user = Object.values(db().key).find(u => u.jid === chat.sender),
              delay = ms => new Promise(res => setTimeout(res, ms)),
              sym = ['🕊️','🦀','🦎','🍀','💎','🍒','❤️','🎊'],
              randSym = () => sym[Math.floor(Math.random() * sym.length)]

        if (!user) return xp.sendMessage(chat.id, { text: '❌ Kamu belum terdaftar' }, { quoted: m })

        const inputBet = args[0]?.toLowerCase()
        let saldo = user.moneyDb?.money || 0
        let isi = 0

        // Fitur All In (Otomatis menyesuaikan dengan saldo setelah dipotong pajak sistem)
        if (inputBet === 'all') {
            isi = saldo
        } else {
            isi = parseInt(inputBet)
        }

        if (!inputBet || (inputBet !== 'all' && isNaN(isi)) || isi <= 0) {
            return xp.sendMessage(chat.id, { text: '⚠️ Masukkan jumlah taruhan yang valid!\n💬 *Contoh:* .isi 10000 atau .isi all' }, { quoted: m })
        }

        // Akal-akalan menembus pajak siluman 12%
        if (isi > saldo) {
            // Kita hitung mundur saldo sebelum kena pajak 12%
            const saldoSebelumPajak = Math.floor(saldo / 0.88)
            
            // Kalau nominal taruhannya wajar (hanya beda karena pajak), kita paksa All In
            if (isi <= saldoSebelumPajak + 10) {
                isi = saldo
            } else {
                return xp.sendMessage(chat.id, { text: `⚠️ Saldo kamu tidak cukup! Sisa saldo: Rp ${saldo.toLocaleString('id-ID')}` }, { quoted: m })
            }
        }

        // ==========================================
        // 1. TENTUKAN HASIL AKHIR DULUAN
        // ==========================================
        const menang = Math.random() < 0.5 
        
        const hasilTengah = menang 
            ? Array(3).fill(randSym())  
            : (() => {
                let r; do { r = [randSym(), randSym(), randSym()] } while (r[0] === r[1] && r[1] === r[2]);
                return r; 
              })();

        const baris1 = [randSym(), randSym(), randSym()]
        const baris3 = [randSym(), randSym(), randSym()]

        let rsMoney = menang ? isi * 2 : -isi
        let isiBank = saldoBank.key?.saldo || 0
        
        if (menang) {
          const hadiah = isiBank >= rsMoney ? rsMoney : isiBank
          user.moneyDb.money += hadiah
          saldoBank.key.saldo = isiBank >= rsMoney ? isiBank - rsMoney : 0
          rsMoney = hadiah
        } else {
          user.moneyDb.money -= isi 
          saldoBank.key.saldo += isi
        }

        const saveBank = d => fs.writeFileSync(bankData, JSON.stringify(d, null, 2))
        save.db()
        saveBank(saldoBank)

        // ==========================================
        // 2. MULAI ANIMASI PUTAR (SPIN)
        // ==========================================
        const pesanAwal = await xp.sendMessage(chat.id, { text: '🎰 *Mesin slot sedang ditarik...*' }, { quoted: m })

        for (let i = 0; i < 4; i++) {
          await delay(500) 
          
          let frameTxt = `
╭───🎰 GACHA UANG 🎰───╮
│       ${randSym()} : ${randSym()} : ${randSym()}
│     > ${randSym()} : ${randSym()} : ${randSym()} <
│       ${randSym()} : ${randSym()} : ${randSym()}
╰────────────────────╯
             🔄 *Memutar...*`.trim()
             
          await xp.sendMessage(chat.id, { text: frameTxt, edit: pesanAwal.key })
        }

        // ==========================================
        // 3. TAMPILKAN HASIL AKHIR
        // ==========================================
        await delay(600) 
        
        const txtAkhir = `
╭───🎰 GACHA UANG 🎰───╮
│       ${baris1.join(' : ')}
│     > ${hasilTengah.join(' : ')} <
│       ${baris3.join(' : ')}
╰────────────────────╯
      ${menang ? `🎉 *JACKPOT!* Menang +Rp ${rsMoney.toLocaleString('id-ID')}` : `💥 *ZONK!* Kalah -Rp ${isi.toLocaleString('id-ID')}`}
`.trim()

        await xp.sendMessage(chat.id, { text: txtAkhir, edit: pesanAwal.key })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
        if (typeof err === 'function') err(`error pada ${cmd}`, e)
        if (typeof call === 'function') call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'tarik saldo',
    cmd: ['tariksaldo', 'tarik'],
    tags: 'Game Menu',
    desc: 'mengambil saldo dari bank',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        if (!args) return xp.sendMessage(chat.id, { text: 'masukan nominal\ncontoh: .tarik 1000' }, { quoted: m })

        const nominal = Number(args[0]),
              usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!nominal || !usrdb) {
          return xp.sendMessage(chat.id, { text: !nominal ? 'nominal tidak valid' : 'kamu belum terdaftar coba lagi' }, { quoted: m })
        }

        const moneyBank = usrdb.moneyDb?.moneyInBank
        if (moneyBank < nominal) return xp.sendMessage(chat.id, { text: `saldo bank kamu hanya tersisa Rp ${moneyBank.toLocaleString('id-ID')}` }, { quoted: m })

        usrdb.moneyDb.moneyInBank -= nominal
        usrdb.moneyDb.money += nominal
        save.db()

        await xp.sendMessage(chat.id, { text: `Rp ${nominal.toLocaleString('id-ID')} berhasil di tarik dari bank` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'transfer',
    cmd: ['tf', 'transfer'],
    tags: 'Game Menu',
    desc: 'mentransfer uang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.5,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.participant || quoted?.mentionedJid?.[0],
              targetDb = Object.values(db().key).find(u => u.jid === target),
              userDb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!target || !args?.[0]) return xp.sendMessage(chat.id, { text: !target ? 'reply/tag orang yang akan menerima transfer' : 'nominal tidak valid\ncontoh: .tf @pengguna/reply 10000' }, { quoted: m })

        const nominal = Number(args[1]) || Number(args[0])
        if (!nominal || nominal < 1e0)
          return xp.sendMessage(chat.id, { text: 'nominal tidak valid' }, { quoted: m })

        if (!userDb || !targetDb) return xp.sendMessage(chat.id, { text: !userDb ? 'data kamu tidak ditemukan di database' : 'data penerima tidak ditemukan di database' }, { quoted: m })

        const uMoney = userDb.moneyDb.money

        if (uMoney < nominal) return xp.sendMessage(chat.id, { text: `saldo kamu tersisa Rp ${userDb.moneyDb?.money.toLocaleString('id-ID')}` }, { quoted: m })

        userDb.moneyDb.money -= nominal
        targetDb.moneyDb.money += nominal
        save.db()

        let txt = `Rp ${nominal.toLocaleString('id-ID')} berhasil ditransfer`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
  
    // ==========================================
  // ⚔️ FITUR RPG: BERBURU (HUNTING)
  // ==========================================
  ev.on({
    name: 'berburu',
    cmd: ['berburu', 'hunt', 'adventure'],
    tags: 'Game Menu',
    desc: 'Berpetualang melawan monster untuk EXP & Uang',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0, 

    run: async (xp, m, { chat, cmd }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return xp.sendMessage(chat.id, { text: '❌ Kamu belum terdaftar' }, { quoted: m })

        // 1. Inisialisasi status RPG user jika belum ada
        user.rpg = user.rpg || { hp: 100, potion: 3, level: 1, exp: 0 }
        
        if (user.rpg.hp < 20) {
          return xp.sendMessage(chat.id, { text: `⚠️ HP kamu terlalu rendah (${user.rpg.hp}/100) untuk berpetualang!\nKetik *.heal* untuk memulihkan HP.` }, { quoted: m })
        }

        const delay = ms => new Promise(res => setTimeout(res, ms))
        const pesanAwal = await xp.sendMessage(chat.id, { text: '🚶‍♂️ *Memasuki Hutan Dua Dunia...*' }, { quoted: m })

        await delay(1500) // Animasi jalan
        
        // 2. Database Monster
        const monsters = [
          { name: 'Slime Lendir', hpDamage: 5, reward: 50, exp: 10, emoji: '🦠' },
          { name: 'Goblin Pencuri', hpDamage: 10, reward: 150, exp: 25, emoji: '👺' },
          { name: 'Serigala Liar', hpDamage: 15, reward: 200, exp: 35, emoji: '🐺' },
          { name: 'Golem Batu', hpDamage: 25, reward: 500, exp: 50, emoji: '🪨' },
          { name: 'Naga Kegelapan', hpDamage: 45, reward: 1500, exp: 100, emoji: '🐉' } // Boss langka
        ]
        
        // Pilih monster secara acak
        const musuh = monsters[Math.floor(Math.random() * monsters.length)]
        
        let frameFight = `⚔️ *MENGHADAPI MONSTER* ⚔️\n\nSeekor *${musuh.name}* ${musuh.emoji} muncul di hadapanmu!\n\n_Menyerang..._`
        await xp.sendMessage(chat.id, { text: frameFight, edit: pesanAwal.key })
        
        await delay(2000) // Animasi bertarung

        // 3. Kalkulasi Hasil Pertarungan
        user.rpg.hp -= musuh.hpDamage
        user.moneyDb.money += musuh.reward
        user.rpg.exp += musuh.exp
        
        // Peluang drop item Potion (30% chance)
        let dropPotion = false
        if (Math.random() < 0.3) {
           user.rpg.potion += 1
           dropPotion = true
        }

        // 4. Sistem Level Up Otomatis (Setiap kelipatan 100 EXP)
        let levelUpMsg = ''
        const expNeeded = user.rpg.level * 100
        if (user.rpg.exp >= expNeeded) {
           user.rpg.level += 1
           user.rpg.exp -= expNeeded
           user.rpg.hp = 100 // Darah otomatis penuh saat naik level
           levelUpMsg = `\n\n🎉 *LEVEL UP!* Kamu sekarang Level ${user.rpg.level}!\nDarahmu dipulihkan sepenuhnya.`
        }

        save.db()

        // 5. Tampilkan Hasil Akhir
        const hasilTxt = `⚔️ *HASIL PERTARUNGAN* ⚔️\n\nKamu berhasil menebas *${musuh.name}* ${musuh.emoji}!\n\n🩸 *HP Berkurang:* -${musuh.hpDamage} (Sisa: ${user.rpg.hp})\n💰 *Loot Uang:* +Rp ${musuh.reward.toLocaleString('id-ID')}\n✨ *EXP Didapat:* +${musuh.exp}${dropPotion ? '\n🧪 *Drop Item:* 1x Potion' : ''}${levelUpMsg}`

        await xp.sendMessage(chat.id, { text: hasilTxt, edit: pesanAwal.key })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
        if (typeof err === 'function') err(`error pada ${cmd}`, e)
        if (typeof call === 'function') call(xp, e, m)
      }
    }
  })

  // ==========================================
  // 🧪 FITUR RPG: HEAL (MINUM POTION)
  // ==========================================
  ev.on({
    name: 'heal',
    cmd: ['heal', 'minum', 'potion'],
    tags: 'Game Menu',
    desc: 'Memulihkan HP menggunakan Potion',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return xp.sendMessage(chat.id, { text: '❌ Kamu belum terdaftar' }, { quoted: m })

        user.rpg = user.rpg || { hp: 100, potion: 3, level: 1, exp: 0 }

        if (user.rpg.hp >= 100) {
          return xp.sendMessage(chat.id, { text: '✅ HP kamu sudah penuh (100/100). Simpan Potion-mu buat nanti.' }, { quoted: m })
        }

        if (user.rpg.potion <= 0) {
           return xp.sendMessage(chat.id, { text: '⚠️ Kamu kehabisan Potion 🧪!\nDapatkan lagi dari memenangkan *.berburu*.' }, { quoted: m })
        }

        // Minum 1 Potion nambah 50 HP
        user.rpg.potion -= 1
        user.rpg.hp += 50
        if (user.rpg.hp > 100) user.rpg.hp = 100 // Batas maksimal darah adalah 100

        save.db()

        await xp.sendMessage(chat.id, { text: `🧪 *GLUK GLUK GLUK...*\n\nKamu meminum 1 Potion.\n🩸 *HP Sekarang:* ${user.rpg.hp}/100\n🎒 *Sisa Potion:* ${user.rpg.potion}` }, { quoted: m })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
      }
    }
  })

  // ==========================================
  // 👤 FITUR RPG: CEK STATUS KARAKTER
  // ==========================================
  ev.on({
    name: 'status rpg',
    cmd: ['stat', 'status', 'profilerpg'],
    tags: 'Game Menu',
    desc: 'Cek level, darah, dan item RPG kamu',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return xp.sendMessage(chat.id, { text: '❌ Kamu belum terdaftar' }, { quoted: m })

        user.rpg = user.rpg || { hp: 100, potion: 3, level: 1, exp: 0 }
        const expNeeded = user.rpg.level * 100
        const nama = chat.pushName || 'Petualang'

        let txt = `🛡️ *STATUS PETUALANG* 🛡️\n\n`
        txt += `👤 *Nama:* arewwp\n` // Menggunakan format fallback nama
        txt += `🔰 *Level:* ${user.rpg.level}\n`
        txt += `✨ *EXP:* ${user.rpg.exp} / ${expNeeded}\n`
        txt += `🩸 *Darah (HP):* ${user.rpg.hp}/100\n`
        txt += `🧪 *Potion:* ${user.rpg.potion} botol\n`
        txt += `💰 *Dompet:* Rp ${user.moneyDb?.money?.toLocaleString('id-ID') || 0}\n\n`
        txt += `_Ketik .berburu untuk mulai petualangan!_`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
      }
    }
  })
    // ==========================================
  // 🎣 FITUR MEMANCING & GACHA IKAN
  // ==========================================
  ev.on({
    name: 'memancing',
    cmd: ['mancing', 'fishing', 'catch'],
    tags: 'Game Menu',
    desc: 'Memancing ikan di sungai',
    owner: !1,
    prefix: !0,
    money: 10, // Biaya beli umpan (Otomatis potong saldo)
    exp: 1,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return xp.sendMessage(chat.id, { text: '❌ Kamu belum terdaftar' }, { quoted: m })

        // 1. Inisialisasi Tas/Inventory ikan jika pemain baru pertama kali mancing
        user.game = user.game || {}
        user.game.inventory = user.game.inventory || { sampah: 0, udang: 0, ikan_kecil: 0, kepiting: 0, ikan_besar: 0, gurita: 0, hiu: 0 }

        const delay = ms => new Promise(res => setTimeout(res, ms))

        const pesanAwal = await xp.sendMessage(chat.id, { text: '🎣 *Melempar kail ke sungai...*' }, { quoted: m })

        // 2. Animasi Memancing
        const anims = [
          "🎣      🌊🌊🌊🌊",
          "🎣     🌊🌊🌊🌊",
          "🎣    🌊🌊🌊🌊",
          "🎣   🌊🌊🌊🌊",
          "🎣  💦🌊🌊🌊",
          "🎣 ❗💦🌊🌊"
        ]

        for (let frame of anims) {
          await delay(500)
          await xp.sendMessage(chat.id, { text: frame, edit: pesanAwal.key })
        }

        // 3. Sistem Gacha/Peluang Ikan
        const rand = Math.random() * 100
        let ikan = '', emoji = '', tipe = ''

        if (rand < 20) { ikan = 'sampah'; emoji = '🥾'; tipe = 'Sepatu Bekas'; }
        else if (rand < 45) { ikan = 'udang'; emoji = '🦐'; tipe = 'Udang'; }
        else if (rand < 70) { ikan = 'ikan_kecil'; emoji = '🐟'; tipe = 'Ikan Kecil'; }
        else if (rand < 85) { ikan = 'kepiting'; emoji = '🦀'; tipe = 'Kepiting'; }
        else if (rand < 95) { ikan = 'ikan_besar'; emoji = '🐡'; tipe = 'Ikan Buntal'; }
        else if (rand < 99) { ikan = 'gurita'; emoji = '🦑'; tipe = 'Gurita'; }
        else { ikan = 'hiu'; emoji = '🦈'; tipe = 'Hiu Langka'; }

        // 4. Masukkan hasil pancingan ke database pemain
        user.game.inventory[ikan] += 1
        save.db()

        await delay(600)
        
        // 5. Tampilkan hasil
        const hasilTxt = `🎣 *MEMANCING*\n\nBerhasil menarik kail!\nKamu mendapatkan: *${emoji} ${tipe}*\n\n_Ketik .jualikan untuk menukar hasil tangkapanmu dengan uang._`
        await xp.sendMessage(chat.id, { text: hasilTxt, edit: pesanAwal.key })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
        if (typeof err === 'function') err(`error pada ${cmd}`, e)
        if (typeof call === 'function') call(xp, e, m)
      }
    }
  })

  // ==========================================
  // 🛒 FITUR PASAR/JUAL IKAN
  // ==========================================
  ev.on({
    name: 'jual ikan',
    cmd: ['jualikan', 'sellfish', 'pasarikan'],
    tags: 'Game Menu',
    desc: 'Menjual hasil pancingan',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return xp.sendMessage(chat.id, { text: '❌ Kamu belum terdaftar' }, { quoted: m })

        const inv = user.game?.inventory
        // Cek apakah tas ikan kosong
        if (!inv || Object.values(inv).every(v => v === 0)) {
          return xp.sendMessage(chat.id, { text: '⚠️ Keranjang ikanmu kosong! Pergi memancing dulu dengan mengetik *.mancing*' }, { quoted: m })
        }

        // 1. Daftar Harga Pasar (Bisa kamu edit sesuka hati)
        const harga = {
          sampah: 5,        // Kasih harga dikit biar nggak rugi-rugi amat
          udang: 50,
          ikan_kecil: 100,
          kepiting: 250,
          ikan_besar: 500,
          gurita: 1000,
          hiu: 5000         // Jackpot
        }

        const emoji = {
          sampah: '🥾', udang: '🦐', ikan_kecil: '🐟', kepiting: '🦀', ikan_besar: '🐡', gurita: '🦑', hiu: '🦈'
        }

        let totalPendapatan = 0
        let struk = '🛒 *NOTA PENJUALAN IKAN*\n\n'

        // 2. Kalkulasi semua ikan di inventory
        for (let item in harga) {
          if (inv[item] > 0) {
            const jumlah = inv[item]
            const subtotal = jumlah * harga[item]
            totalPendapatan += subtotal
            
            struk += `${emoji[item]} ${item.replace('_', ' ').toUpperCase()} : ${jumlah} x Rp ${harga[item]} = Rp ${subtotal.toLocaleString('id-ID')}\n`
            
            // 3. Kosongkan slot ikan tersebut setelah dijual
            inv[item] = 0
          }
        }

        // 4. Tambahkan uang penjualan ke saldo utama
        user.moneyDb = user.moneyDb || { money: 0 }
        user.moneyDb.money += totalPendapatan
        save.db()

        struk += `\n💰 *Total Pendapatan:* Rp ${totalPendapatan.toLocaleString('id-ID')}\n💳 *Saldo Sekarang:* Rp ${user.moneyDb.money.toLocaleString('id-ID')}`

        await xp.sendMessage(chat.id, { text: struk }, { quoted: m })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
        if (typeof err === 'function') err(`error pada ${cmd}`, e)
        if (typeof call === 'function') call(xp, e, m)
      }
    }
  })
}
