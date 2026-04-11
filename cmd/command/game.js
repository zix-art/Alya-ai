import axios from 'axios'
import { Chess } from 'chess.js'
import supabase from '../../system/db/supabase.js'
import { getUserDataSupa } from '../../system/function.js'

// ☁️ Helper untuk menyimpan data ke Cloud di background tanpa bikin delay
const svCloud = (jid, user) => {
    supabase.from('users').update({ 
        money: user.money || 0, 
        bank: user.bank || 0,
        exp: user.exp || 0,
        game_data: user.game_data || {}
    }).eq('id', jid).then()
}

export default function game(ev) {
  
  // ==========================================
  // 🔫 1. RUSSIAN ROULETTE (Taruhan Multiplayer)
  // ==========================================
  global.rouletteGame = global.rouletteGame || {}

  ev.on({
    name: 'russian roulette',
    cmd: ['roulette', 'russian'],
    tags: 'Game Menu',
    desc: 'Taruhan hidup dan mati bersama member grup',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya bisa dimainkan di grup' }, { quoted: m })
        
        if (global.rouletteGame[chat.id]) return xp.sendMessage(chat.id, { text: '⚠️ Selesaikan dulu game Roulette yang sedang berlangsung di grup ini!' }, { quoted: m })

        if (!args[0] || isNaN(args[0]) || parseInt(args[0]) < 100) return xp.sendMessage(chat.id, { text: `⚠️ Masukkan nominal taruhan minimal Rp 100\n💬 *Contoh:* ${prefix}${cmd} 5000` }, { quoted: m })

        const bet = parseInt(args[0])
        const usrdb = await getUserDataSupa(chat.sender)

        if (usrdb.money < bet) return xp.sendMessage(chat.id, { text: `❌ Saldomu tidak cukup untuk bertaruh Rp ${bet.toLocaleString('id-ID')}` }, { quoted: m })

        global.rouletteGame[chat.id] = { bet: bet, players: [chat.sender], status: 'waiting' }

        let txt = `🔫 *RUSSIAN ROULETTE DIBUKA* 🔫\n\nAlya sedang memutar silinder peluru...\n\n💰 *Taruhan Masuk:* Rp ${bet.toLocaleString('id-ID')}\n🙋‍♂️ *Pemain:* 1\n\n_Ketik *${prefix}ikut* untuk bergabung! Game akan dimulai dalam 30 detik._`
        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })

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
                const loserIndex = Math.floor(Math.random() * game.players.length)
                const loser = game.players[loserIndex]
                const winners = game.players.filter(p => p !== loser)
                const prizePerWinner = Math.floor(totalPrize / winners.length)

                for (const jid of game.players) {
                    let dbUser = await getUserDataSupa(jid)
                    if (jid === loser) dbUser.money -= game.bet 
                    else dbUser.money += prizePerWinner 
                    svCloud(jid, dbUser)
                }

                let winMentions = winners.map(w => `- @${w.split('@')[0]}`).join('\n')
                let endTxt = `💥 *DORRR!!!*\n\nPistol meledak di kepala @${loser.split('@')[0]}! (Uang hangus)\n\n🎉 *PEMENANG (Selamat):*\n${winMentions}\n\nMasing-masing mendapatkan *Rp ${prizePerWinner.toLocaleString('id-ID')}*!`

                await xp.sendMessage(chat.id, { text: endTxt, mentions: game.players })
                delete global.rouletteGame[chat.id]

            }, 4000)

        }, 30000)

      } catch (e) { console.error(e); delete global.rouletteGame[chat.id] }
    }
  })

  ev.on({
    name: 'ikut roulette',
    cmd: ['ikut'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      const game = global.rouletteGame[chat.id]
      if (!game || game.status !== 'waiting') return
      if (game.players.includes(chat.sender)) return xp.sendMessage(chat.id, { text: '⚠️ Kamu sudah terdaftar di lobi ini.' }, { quoted: m })

      const usrdb = await getUserDataSupa(chat.sender)
      if (usrdb.money < game.bet) return xp.sendMessage(chat.id, { text: `❌ Saldomu tidak cukup! Membutuhkan Rp ${game.bet.toLocaleString('id-ID')}` }, { quoted: m })

      game.players.push(chat.sender)
      await xp.sendMessage(chat.id, { text: `✅ @${chat.sender.split('@')[0]} bergabung ke meja judi! (Total: ${game.players.length} orang)`, mentions: [chat.sender] }, { quoted: m })
    }
  })

  // ==========================================
  // 🧩 2. SUSUN KATA BERHADIAH
  // ==========================================
  global.susunKataGame = global.susunKataGame || {}

  ev.on({
    name: 'susun kata',
    cmd: ['susunkata', 'acakata'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { chat, prefix }) => {
        if (global.susunKataGame[chat.id]) return xp.sendMessage(chat.id, { text: '⚠️ Masih ada sesi Susun Kata yang belum terjawab di grup ini!' }, { quoted: m })
        const words = ['MEDAN', 'PUZZLE', 'ALYA', 'DATABASE', 'SERVER', 'JAVASCRIPT', 'VERCEL', 'PROGRAMMER', 'WEBSITE', 'INTERNET']
        const jawaban = words[Math.floor(Math.random() * words.length)]
        const acak = jawaban.split('').sort(() => 0.5 - Math.random()).join(' - ')
        const hadiah = Math.floor(Math.random() * 500) + 100 

        global.susunKataGame[chat.id] = { jawaban, hadiah }
        let txt = `🧩 *SUSUN KATA* 🧩\n\nSusun huruf berikut menjadi sebuah kata:\n👉 *${acak}*\n\n🎁 *Hadiah:* Rp ${hadiah}\n_Ketik *${prefix}jawab <kata>* untuk menebak!_`
        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
    }
  })

  ev.on({
    name: 'jawab kata',
    cmd: ['jawab'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat }) => {
        const game = global.susunKataGame[chat.id]
        if (!game) return
        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan jawabanmu!' }, { quoted: m })

        if (args[0].toUpperCase() === game.jawaban) {
            const usrdb = await getUserDataSupa(chat.sender)
            usrdb.money += game.hadiah
            svCloud(chat.sender, usrdb)
            
            await xp.sendMessage(chat.id, { text: `🎉 *BENAR!*\n\nKata yang tepat adalah *${game.jawaban}*.\nKamu mendapatkan hadiah Rp ${game.hadiah}!`, mentions: [chat.sender] }, { quoted: m })
            delete global.susunKataGame[chat.id]
        } else {
            await xp.sendMessage(chat.id, { text: '❌ Salah, coba lagi!' }, { quoted: m })
        }
    }
  })

  // ==========================================
  // ♟️ 3. SISTEM CATUR (CHESS.JS)
  // ==========================================
  global.chessGame = global.chessGame || {}

  ev.on({
    name: 'catur',
    cmd: ['catur', 'chess'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        const action = args[0]?.toLowerCase()
        const game = global.chessGame[chat.id]

        if (!action) return xp.sendMessage(chat.id, { text: `♟️ *PANDUAN MAIN CATUR*\n\n1. *${prefix}${cmd} main @tag*\n2. *${prefix}${cmd} jalan e2e4*\n3. *${prefix}${cmd} board*\n4. *${prefix}${cmd} nyerah*` }, { quoted: m })

        if (action === 'main') {
            if (game) return xp.sendMessage(chat.id, { text: '⚠️ Selesaikan dulu catur di grup ini!' }, { quoted: m })
            const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            if (!target) return xp.sendMessage(chat.id, { text: '⚠️ Tag orang yang ingin ditantang!' }, { quoted: m })

            global.chessGame[chat.id] = { chess: new Chess(), white: chat.sender, black: target, turn: 'w' }
            const boardUrl = `https://fen2image.chessvision.ai/${encodeURIComponent(global.chessGame[chat.id].chess.fen())}`

            return xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: `⚔️ *PERTANDINGAN CATUR DIMULAI* ⚔️\n\n⚪ Putih: @${chat.sender.split('@')[0]}\n⚫ Hitam: @${target.split('@')[0]}\n\nPutih jalan duluan. Gunakan *${prefix}${cmd} jalan <posisi>*`, mentions: [chat.sender, target] }, { quoted: m })
        }

        if (action === 'jalan') {
            if (!game) return xp.sendMessage(chat.id, { text: '⚠️ Tidak ada game catur.' }, { quoted: m })
            const currentPlayer = game.chess.turn() === 'w' ? game.white : game.black
            if (chat.sender !== currentPlayer) return xp.sendMessage(chat.id, { text: '⚠️ Bukan giliranmu!' }, { quoted: m })

            const moveInput = args[1]
            if (!moveInput || moveInput.length !== 4) return xp.sendMessage(chat.id, { text: `⚠️ Format salah! Contoh: *${prefix}${cmd} jalan e2e4*` }, { quoted: m })

            try { game.chess.move({ from: moveInput.substring(0, 2), to: moveInput.substring(2, 4), promotion: 'q' }) } 
            catch (e) { return xp.sendMessage(chat.id, { text: '❌ Langkah tidak sah / Ilegal!' }, { quoted: m }) }

            const boardUrl = `https://fen2image.chessvision.ai/${encodeURIComponent(game.chess.fen())}`
            let statusTxt = `♟️ *CATUR UPDATE*\n\n`
            
            if (game.chess.isCheckmate()) {
                statusTxt += `👑 *SKAKMAT!* @${currentPlayer.split('@')[0]} Menang!`
                delete global.chessGame[chat.id]
                return xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: statusTxt, mentions: [currentPlayer] })
            }

            if (game.chess.isDraw() || game.chess.isStalemate()) {
                delete global.chessGame[chat.id]
                return xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: `🤝 *SERI!* Pertandingan berakhir.` })
            }

            if (game.chess.isCheck()) statusTxt += `⚠️ *SKAK!*\n\n`
            const nextPlayer = game.chess.turn() === 'w' ? game.white : game.black
            statusTxt += `Sekarang giliran @${nextPlayer.split('@')[0]}!`

            await xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: statusTxt, mentions: [nextPlayer] })
        }

        if (action === 'board' && game) await xp.sendMessage(chat.id, { image: { url: `https://fen2image.chessvision.ai/${encodeURIComponent(game.chess.fen())}` }, caption: 'Papan Catur Saat Ini' })
        
        if (action === 'nyerah' && game && (chat.sender === game.white || chat.sender === game.black)) {
            const winner = chat.sender === game.white ? game.black : game.white
            await xp.sendMessage(chat.id, { text: `🏳️ @${chat.sender.split('@')[0]} menyerah!\n👑 Pemenangnya @${winner.split('@')[0]}`, mentions: [chat.sender, winner] })
            delete global.chessGame[chat.id]
        }
      } catch (e) { console.error(e) }
    }
  })
  
  // ==========================================
  // 🏇 4. BALAP KUDA (Multiplayer Betting)
  // ==========================================
  global.balapKuda = global.balapKuda || {}

  ev.on({
    name: 'balap kuda',
    cmd: ['balapkuda', 'betkuda'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya untuk grup!' }, { quoted: m })

        let game = global.balapKuda[chat.id]
        if (game && game.status === 'playing') return xp.sendMessage(chat.id, { text: '⚠️ Balapan sedang berlangsung, tunggu selesai!' }, { quoted: m })

        if (!args[0] || !args[1]) {
            return xp.sendMessage(chat.id, { text: `🏇 *ARENA BALAP KUDA* 🏇\n\nKuda Tersedia: 1, 2, 3, 4, 5\n\n*Cara Main:*\n${prefix}${cmd} <no_kuda> <taruhan>\n*Contoh:* ${prefix}${cmd} 3 10000` }, { quoted: m })
        }

        const noKuda = parseInt(args[0]), bet = parseInt(args[1])
        const usrdb = await getUserDataSupa(chat.sender)

        if (noKuda < 1 || noKuda > 5) return xp.sendMessage(chat.id, { text: '⚠️ Pilih kuda nomor 1 sampai 5!' }, { quoted: m })
        if (usrdb.money < bet || bet < 100) return xp.sendMessage(chat.id, { text: `❌ Saldo tidak cukup atau bet kurang dari Rp 100!` }, { quoted: m })

        if (!game) {
            global.balapKuda[chat.id] = { status: 'waiting', bets: [], totalPot: 0 }
            game = global.balapKuda[chat.id]
            
            await xp.sendMessage(chat.id, { text: `📢 *LOBI BALAP KUDA DIBUKA!*\n\n@${chat.sender.split('@')[0]} bertaruh Rp ${bet.toLocaleString('id-ID')} untuk Kuda 🐎 ${noKuda}.\n\n_Ketik ${prefix}${cmd} <nomor_kuda> <taruhan> untuk ikut!\nBalapan dimulai dalam 30 detik._`, mentions: [chat.sender] })
            
            setTimeout(async () => {
                const curGame = global.balapKuda[chat.id]
                if (!curGame || curGame.bets.length === 0) return delete global.balapKuda[chat.id]
                
                curGame.status = 'playing'
                let progress = [0, 0, 0, 0, 0], frameTxt = ''
                const msg = await xp.sendMessage(chat.id, { text: '🏁 *BALAPAN DIMULAI!* 🏁' })

                for (let i = 0; i < 5; i++) {
                    await new Promise(res => setTimeout(res, 1000))
                    for (let k = 0; k < 5; k++) { progress[k] += Math.floor(Math.random() * 3) + 1 } 
                    frameTxt = `🏁 *BALAPAN KUDA* 🏁\n\n`
                    for (let k = 0; k < 5; k++) {
                        let lintasan = '-'.repeat(progress[k]) + '🐎' + '-'.repeat(15 - progress[k] > 0 ? 15 - progress[k] : 0)
                        frameTxt += `[${k+1}] ${lintasan}\n`
                    }
                    await xp.sendMessage(chat.id, { text: frameTxt, edit: msg.key })
                }

                const maxPos = Math.max(...progress)
                const pemenangKuda = progress.indexOf(maxPos) + 1 
                let winTxt = `\n🏆 *BALAPAN SELESAI!*\n\n🐎 Kuda nomor *${pemenangKuda}* memenangkan balapan!\n\n`
                let hasWinner = false

                for (const b of curGame.bets) {
                    const dbUser = await getUserDataSupa(b.jid)
                    if (b.kuda === pemenangKuda) {
                        const winAmount = b.bet * 3 
                        dbUser.money += winAmount
                        winTxt += `🎉 @${b.jid.split('@')[0]} menang *Rp ${winAmount.toLocaleString('id-ID')}*\n`
                        hasWinner = true
                    }
                    svCloud(b.jid, dbUser)
                }

                if (!hasWinner) winTxt += `💀 Tidak ada yang menebak kuda nomor ${pemenangKuda}. Semua taruhan hangus dari bandar!`

                await xp.sendMessage(chat.id, { text: frameTxt + winTxt, edit: msg.key, mentions: curGame.bets.map(b => b.jid) })
                delete global.balapKuda[chat.id]
            }, 30000)
        }

        usrdb.money -= bet
        game.bets.push({ jid: chat.sender, kuda: noKuda, bet: bet })
        game.totalPot += bet
        svCloud(chat.sender, usrdb)

        if (game.bets.length > 1) await xp.sendMessage(chat.id, { text: `✅ Taruhan diterima: Kuda ${noKuda} (Rp ${bet.toLocaleString('id-ID')})\nTotal Pot: Rp ${game.totalPot.toLocaleString('id-ID')}` }, { quoted: m })

      } catch (e) { console.error(e); delete global.balapKuda[chat.id] }
    }
  })

  // ==========================================
  // 🎲 5. TEBAK DADU / SIC BO
  // ==========================================
  ev.on({
    name: 'tebak dadu',
    cmd: ['dadu', 'sicbo'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!args[0] || !args[1]) {
            return xp.sendMessage(chat.id, { text: `🎲 *MEJA DADU (SIC BO)* 🎲\n\nBot akan mengocok 3 dadu (Max 18).\n- *Kecil* (Total 3 - 10) | Hadiah x2\n- *Besar* (Total 11 - 18) | Hadiah x2\n\n*Cara Main:*\n${prefix}${cmd} besar 5000\n${prefix}${cmd} kecil 10000` }, { quoted: m })
        }

        const tebakan = args[0].toLowerCase(), bet = parseInt(args[1])
        const usrdb = await getUserDataSupa(chat.sender)

        if (!['besar', 'kecil'].includes(tebakan)) return xp.sendMessage(chat.id, { text: '⚠️ Tebak hanya: besar / kecil' }, { quoted: m })
        if (usrdb.money < bet || bet < 100) return xp.sendMessage(chat.id, { text: '❌ Saldo tidak cukup!' }, { quoted: m })

        const d1 = Math.floor(Math.random() * 6) + 1, d2 = Math.floor(Math.random() * 6) + 1, d3 = Math.floor(Math.random() * 6) + 1
        const total = d1 + d2 + d3, hasil = total <= 10 ? 'kecil' : 'besar'
        
        let msg = `🎲 *HASIL DADU*\n\n[ ${d1} ] - [ ${d2} ] - [ ${d3} ]\nTotal: *${total} (${hasil.toUpperCase()})*\n\n`
        
        if (tebakan === hasil) {
            usrdb.money += bet 
            msg += `🎉 *MENANG!* Kamu menebak *${tebakan}*.\nHadiah: +Rp ${(bet*2).toLocaleString('id-ID')}`
        } else {
            usrdb.money -= bet
            msg += `💀 *KALAH!* Kamu menebak *${tebakan}*.\nHangus: -Rp ${bet.toLocaleString('id-ID')}`
        }

        svCloud(chat.sender, usrdb)
        await xp.sendMessage(chat.id, { text: msg }, { quoted: m })

      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🏦 6. SISTEM BANK & EKONOMI (Migrasi Supabase)
  // ==========================================
  ev.on({
    name: 'cek bank',
    cmd: ['cekbank', 'bank'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { chat }) => {
      try {
        const casinoDb = await getUserDataSupa('casino_bank')
        const usrdb = await getUserDataSupa(chat.sender)
        
        let txt = `🏦 *BANK PUSAT ALYA*\n\n💰 Saldo Bank Casino Bot: Rp ${casinoDb.bank?.toLocaleString('id-ID') || 0}\n💳 Tabungan Pribadimu: Rp ${usrdb.bank?.toLocaleString('id-ID') || 0}`
        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'nabung',
    cmd: ['nabung', 'isiatm', 'deposit'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan nominal! Contoh: .nabung 10000' }, { quoted: m })
        const usrdb = await getUserDataSupa(chat.sender)
        const nominal = parseInt(args[0])

        if (!nominal || nominal <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Nominal tidak valid.' }, { quoted: m })
        if (usrdb.money < nominal) return xp.sendMessage(chat.id, { text: `⚠️ Uang dompetmu tidak cukup! Sisa: Rp ${usrdb.money.toLocaleString('id-ID')}` }, { quoted: m })

        usrdb.money -= nominal
        usrdb.bank += nominal
        svCloud(chat.sender, usrdb)

        await xp.sendMessage(chat.id, { text: `✅ Berhasil menabung Rp ${nominal.toLocaleString('id-ID')} ke Bank!` }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'tarik saldo',
    cmd: ['tariksaldo', 'tarik', 'withdraw'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan nominal! Contoh: .tarik 10000' }, { quoted: m })
        const usrdb = await getUserDataSupa(chat.sender)
        const nominal = parseInt(args[0])

        if (!nominal || nominal <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Nominal tidak valid.' }, { quoted: m })
        if (usrdb.bank < nominal) return xp.sendMessage(chat.id, { text: `⚠️ Saldo ATM kamu hanya sisa Rp ${usrdb.bank.toLocaleString('id-ID')}` }, { quoted: m })

        usrdb.bank -= nominal
        usrdb.money += nominal
        svCloud(chat.sender, usrdb)

        await xp.sendMessage(chat.id, { text: `✅ Berhasil menarik Rp ${nominal.toLocaleString('id-ID')} dari Bank!` }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'transfer',
    cmd: ['tf', 'transfer', 'pay'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya bisa digunakan di grup' }, { quoted: m })
        const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!target || !args[1]) return xp.sendMessage(chat.id, { text: '⚠️ Format salah! Contoh: .tf @user 10000' }, { quoted: m })

        const nominal = parseInt(args[1])
        const usrdb = await getUserDataSupa(chat.sender)
        const targetDb = await getUserDataSupa(target)

        if (!nominal || nominal <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Nominal tidak valid' }, { quoted: m })
        if (usrdb.money < nominal) return xp.sendMessage(chat.id, { text: `⚠️ Uangmu tidak cukup.` }, { quoted: m })

        usrdb.money -= nominal
        targetDb.money += nominal
        svCloud(chat.sender, usrdb)
        svCloud(target, targetDb)

        await xp.sendMessage(chat.id, { text: `💸 Berhasil transfer Rp ${nominal.toLocaleString('id-ID')} ke @${target.split('@')[0]}`, mentions: [target] }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🎰 7. GACHA SLOT KASINO CLOUD
  // ==========================================
  ev.on({
    name: 'slot',
    cmd: ['isi', 'spin', 'slot', 'gacha'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        const casinoDb = await getUserDataSupa('casino_bank')
        const user = await getUserDataSupa(chat.sender)
        const sym = ['🕊️','🦀','🦎','🍀','💎','🍒','❤️','🎊']
        const randSym = () => sym[Math.floor(Math.random() * sym.length)]

        const inputBet = args[0]?.toLowerCase()
        let isi = inputBet === 'all' ? user.money : parseInt(inputBet)

        if (!inputBet || isNaN(isi) || isi <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan taruhan yang valid!' }, { quoted: m })
        if (isi > user.money) return xp.sendMessage(chat.id, { text: `⚠️ Saldo tidak cukup! Sisa: Rp ${user.money.toLocaleString('id-ID')}` }, { quoted: m })

        const menang = Math.random() < 0.45 
        const hasilTengah = menang ? Array(3).fill(randSym()) : (() => { let r; do { r = [randSym(), randSym(), randSym()] } while (r[0] === r[1] && r[1] === r[2]); return r; })()
        const baris1 = [randSym(), randSym(), randSym()], baris3 = [randSym(), randSym(), randSym()]

        let isiBank = casinoDb.bank || 0
        let rsMoney = menang ? isi * 2 : 0
        
        if (menang) {
          const hadiah = isiBank >= rsMoney ? rsMoney : isiBank
          user.money += hadiah
          casinoDb.bank = isiBank >= hadiah ? isiBank - hadiah : 0
          rsMoney = hadiah
        } else {
          user.money -= isi 
          casinoDb.bank += isi
        }

        svCloud(chat.sender, user)
        svCloud('casino_bank', casinoDb)

        const pesanAwal = await xp.sendMessage(chat.id, { text: '🎰 *Mesin ditarik...*' }, { quoted: m })

        for (let i = 0; i < 4; i++) {
          await new Promise(res => setTimeout(res, 500)) 
          let frameTxt = `╭───🎰 GACHA 🎰───╮\n│  ${randSym()} : ${randSym()} : ${randSym()}\n│> ${randSym()} : ${randSym()} : ${randSym()} <\n│  ${randSym()} : ${randSym()} : ${randSym()}\n╰─────────────────╯\n   🔄 *Memutar...*`
          await xp.sendMessage(chat.id, { text: frameTxt, edit: pesanAwal.key })
        }

        await new Promise(res => setTimeout(res, 600)) 
        const txtAkhir = `╭───🎰 GACHA 🎰───╮\n│  ${baris1.join(' : ')}\n│> ${hasilTengah.join(' : ')} <\n│  ${baris3.join(' : ')}\n╰─────────────────╯\n${menang ? `🎉 *JACKPOT!* Menang +Rp ${rsMoney.toLocaleString('id-ID')}` : `💥 *ZONK!* Kalah -Rp ${isi.toLocaleString('id-ID')}`}`
        await xp.sendMessage(chat.id, { text: txtAkhir, edit: pesanAwal.key })

      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🏕️ 8. SISTEM RPG JSONB (Supabase)
  // ==========================================
  ev.on({
    name: 'berburu',
    cmd: ['berburu', 'hunt', 'adventure'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { chat }) => {
      try {
        const user = await getUserDataSupa(chat.sender)
        user.game_data.rpg = user.game_data.rpg || { hp: 100, potion: 3, level: 1, exp: 0 }
        
        if (user.game_data.rpg.hp < 20) return xp.sendMessage(chat.id, { text: `⚠️ HP terlalu rendah (${user.game_data.rpg.hp}/100)! Ketik .heal.` }, { quoted: m })

        const pesanAwal = await xp.sendMessage(chat.id, { text: '🚶‍♂️ *Memasuki Hutan...*' }, { quoted: m })
        await new Promise(res => setTimeout(res, 1500)) 
        
        const monsters = [
          { name: 'Slime', hpDamage: 5, reward: 50, exp: 10, emoji: '🦠' },
          { name: 'Goblin', hpDamage: 10, reward: 150, exp: 25, emoji: '👺' },
          { name: 'Serigala', hpDamage: 15, reward: 200, exp: 35, emoji: '🐺' },
          { name: 'Naga', hpDamage: 45, reward: 1500, exp: 100, emoji: '🐉' }
        ]
        
        const musuh = monsters[Math.floor(Math.random() * monsters.length)]
        await xp.sendMessage(chat.id, { text: `⚔️ Seekor *${musuh.name}* ${musuh.emoji} muncul!\n_Menyerang..._`, edit: pesanAwal.key })
        await new Promise(res => setTimeout(res, 2000)) 

        user.game_data.rpg.hp -= musuh.hpDamage
        user.money += musuh.reward
        user.game_data.rpg.exp += musuh.exp
        
        let dropPotion = false
        if (Math.random() < 0.3) { user.game_data.rpg.potion += 1; dropPotion = true }

        let levelUpMsg = ''
        if (user.game_data.rpg.exp >= (user.game_data.rpg.level * 100)) {
           user.game_data.rpg.level += 1; user.game_data.rpg.exp = 0; user.game_data.rpg.hp = 100 
           levelUpMsg = `\n🎉 *LEVEL UP!* Sekarang Level ${user.game_data.rpg.level}!`
        }

        svCloud(chat.sender, user)

        const hasilTxt = `⚔️ *HASIL PERTARUNGAN*\n\nMenebas *${musuh.name}* ${musuh.emoji}!\n🩸 HP: -${musuh.hpDamage} (Sisa: ${user.game_data.rpg.hp})\n💰 Uang: +Rp ${musuh.reward}\n✨ EXP: +${musuh.exp}${dropPotion ? '\n🧪 Drop: 1 Potion' : ''}${levelUpMsg}`
        await xp.sendMessage(chat.id, { text: hasilTxt, edit: pesanAwal.key })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'heal',
    cmd: ['heal', 'minum', 'potion'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { chat }) => {
      try {
        const user = await getUserDataSupa(chat.sender)
        user.game_data.rpg = user.game_data.rpg || { hp: 100, potion: 3, level: 1, exp: 0 }

        if (user.game_data.rpg.hp >= 100) return xp.sendMessage(chat.id, { text: '✅ HP kamu sudah penuh!' }, { quoted: m })
        if (user.game_data.rpg.potion <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Potion habis!' }, { quoted: m })

        user.game_data.rpg.potion -= 1
        user.game_data.rpg.hp = Math.min(user.game_data.rpg.hp + 50, 100)

        svCloud(chat.sender, user)
        await xp.sendMessage(chat.id, { text: `🧪 *GLUK GLUK...*\nMeminum 1 Potion.\n🩸 HP: ${user.game_data.rpg.hp}/100\n🎒 Sisa: ${user.game_data.rpg.potion}` }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🎥 9. SIMULATOR YOUTUBER JSONB
  // ==========================================
  ev.on({
    name: 'buat akun yt',
    cmd: ['buatyt', 'createyt'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat, prefix, cmd }) => {
      const text = args.join(' ')
      if (!text) return xp.sendMessage(chat.id, { text: `[❗] Mau buat akun YouTube dengan nama apa?\nContoh: *${prefix}${cmd} Bot Gaming*` }, { quoted: m })
      if (text.length > 20) return xp.sendMessage(chat.id, { text: '[❗] Maksimal 20 Karakter ya ngab' }, { quoted: m })

      const usrdb = await getUserDataSupa(chat.sender)
      usrdb.game_data.yt = usrdb.game_data.yt || { subscriber: 0, liketotal: 0, silver: 0, gold: 0, diamond: 0, lastlive: 0 }

      if (usrdb.game_data.yt.subscriber > 0) return xp.sendMessage(chat.id, { text: `[❗] Kamu sudah memiliki channel bernama: *${usrdb.game_data.yt.nameyt}*` }, { quoted: m })

      usrdb.game_data.yt.nameyt = text.trim()
      usrdb.game_data.yt.subscriber += 2
      svCloud(chat.sender, usrdb)

      await xp.sendMessage(chat.id, { text: `*[✔️] Sukses membuat channel YouTube!*\n\n┌∘ - Nama Channel: ${usrdb.game_data.yt.nameyt}\n└∘ - Subscriber: ${usrdb.game_data.yt.subscriber}` }, { quoted: m })
    }
  })

  ev.on({
    name: 'live yt',
    cmd: ['live', 'streaming'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { args, chat, prefix, cmd }) => {
      const text = args.join(' ')
      const usrdb = await getUserDataSupa(chat.sender)
      if (!usrdb.game_data.yt?.nameyt) return xp.sendMessage(chat.id, { text: `[❗] Kamu tidak memiliki akun YouTube, silahkan buat terlebih dahulu,\n\nKetik: *${prefix}buatyt <nama>*` }, { quoted: m })

      const yt = usrdb.game_data.yt
      const timeNow = Date.now(), cooldown = 300000 

      if (timeNow - yt.lastlive < cooldown) {
          const sisa = Math.ceil((cooldown - (timeNow - yt.lastlive)) / 60000)
          return xp.sendMessage(chat.id, { text: `[❗] Kamu lelah setelah nge-live. Silahkan istirahatkan pita suaramu selama *${sisa} menit* lagi.` }, { quoted: m })
      }

      if (!text) return xp.sendMessage(chat.id, { text: `[🔴] Judul Live-nya apa bang?\nContoh: *${prefix}${cmd} Main ML mabar viewer*` }, { quoted: m })

      let money = 0, subs = 0, like = 0, donate = 0, alert = ''

      if (yt.subscriber > 10000000) {
          money = Math.floor(Math.random() * 5000000); subs = Math.floor(Math.random() * 10000); like = Math.floor(Math.random() * 600000); donate = Math.floor(Math.random() * 1500000)
          if (yt.diamond < 1) { yt.diamond = 1; alert = `\n\n🎉 *PENGHARGAAN BARU!*\nKamu mendapatkan 💎 *Diamond Play Button* dari YouTube!`; }
      } else if (yt.subscriber > 1000000) {
          money = Math.floor(Math.random() * 500000); subs = Math.floor(Math.random() * 6000); like = Math.floor(Math.random() * 300000); donate = Math.floor(Math.random() * 5500000)
          if (yt.gold < 1) { yt.gold = 1; alert = `\n\n🎉 *PENGHARGAAN BARU!*\nKamu mendapatkan 🥇 *Gold Play Button* dari YouTube!`; }
      } else if (yt.subscriber > 100000) {
          money = Math.floor(Math.random() * 150000); subs = Math.floor(Math.random() * 1000); like = Math.floor(Math.random() * 30000); donate = Math.floor(Math.random() * 150000)
          if (yt.silver < 1) { yt.silver = 1; alert = `\n\n🎉 *PENGHARGAAN BARU!*\nKamu mendapatkan 🥈 *Silver Play Button* dari YouTube!`; }
      } else if (yt.subscriber > 10000) {
          money = Math.floor(Math.random() * 60000); subs = Math.floor(Math.random() * 200); like = Math.floor(Math.random() * 2000); donate = Math.floor(Math.random() * 70000)
      } else {
          money = Math.floor(Math.random() * 15000); subs = Math.floor(Math.random() * 90); like = Math.floor(Math.random() * 500); donate = Math.floor(Math.random() * 25000)
      }

      usrdb.money += money
      usrdb.bank += donate 
      yt.subscriber += subs
      yt.liketotal += like
      yt.lastlive = timeNow

      svCloud(chat.sender, usrdb)

      const txt = `[ 🔴 *LIVE YOUTUBE* ]\n\n┌──[ *Hasil Streaming* ]\n│👤 *Streamer:* @${chat.sender.split('@')[0]}\n│📹 *Judul:* ${text}\n│💸 *Ads Money:* +Rp ${money.toLocaleString('id-ID')}\n│💳 *Donasi (Masuk ATM):* +Rp ${donate.toLocaleString('id-ID')}\n│👥 *Subs Baru:* +${subs.toLocaleString('id-ID')}\n│👍🏻 *Like Baru:* +${like.toLocaleString('id-ID')}\n└┬───⬤\n  │📊 *Total Like:* ${yt.liketotal.toLocaleString('id-ID')}\n  │📈 *Total Subs:* ${yt.subscriber.toLocaleString('id-ID')}\n  └──────⬤${alert}`
      await xp.sendMessage(chat.id, { text: txt, mentions: [chat.sender] }, { quoted: m })
    }
  })

  // ==========================================
  // 🏆 10. LEADERBOARD SULTAN (Query Supabase Asli)
  // ==========================================
  ev.on({
    name: 'top global',
    cmd: ['topglobal', 'sultan'],
    tags: 'Game Menu',
    owner: !1, prefix: !0,
    run: async (xp, m, { chat }) => {
      try {
        await xp.sendMessage(chat.id, { react: { text: '📊', key: m.key } })

        // ☁️ Query langsung ke Supabase (Mengambil semua user, lalu disortir kekayaannya)
        const { data: allUsers } = await supabase.from('users').select('id, money, bank').neq('id', 'casino_bank')
        
        if (!allUsers) return xp.sendMessage(chat.id, { text: 'Gagal mengambil data Top Global.' }, { quoted: m })

        const sortedUsers = allUsers
            .map(u => ({ jid: u.id, total: (u.money || 0) + (u.bank || 0) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10) 

        let txt = `🏆 *TOP 10 SULTAN ALYA* 🏆\n\n`
        sortedUsers.forEach((u, i) => { 
            txt += `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎗️'} *${i + 1}.* @${u.jid.split('@')[0]} \n   💰 Rp ${u.total.toLocaleString('id-ID')}\n` 
        })
        
        await xp.sendMessage(chat.id, { text: txt, mentions: sortedUsers.map(u => u.jid) }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  // (CATATAN: Command Trivia lainnya seperti Asah Otak, Tebak Kata, dll bisa kamu pertahankan logikanya persis seperti Cak Lontong di atas, dengan mengganti usrdb.moneyDb.money menjadi usrdb.money dan menggunakan svCloud untuk penyimpanannya).

}
