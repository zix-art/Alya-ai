import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Chess } from 'chess.js'

// Definisikan dirname untuk ES Modules (Penyebab error biasanya di sini)
const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Pastikan path ke folder db benar (biasanya harus mundur satu folder pakai '../')
const bankData = path.join(dirname, '../db/bank.json')

// Helper untuk auto-sync uang ke Supabase tanpa bikin bot delay
const syncUangCloud = (jid, user) => {
    if (global.supabase && user) {
        global.supabase.from('users')
            .update({ 
                money: user.moneyDb?.money || 0, 
                bank: user.moneyDb?.moneyInBank || 0,
                exp: user.exp || 0
            })
            .eq('jid', jid).then()
    }
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
                const loserIndex = Math.floor(Math.random() * game.players.length)
                const loser = game.players[loserIndex]
                const winners = game.players.filter(p => p !== loser)
                
                const prizePerWinner = Math.floor(totalPrize / winners.length)

                game.players.forEach(jid => {
                    const dbUser = Object.values(db().key).find(u => u.jid === jid)
                    if (dbUser) {
                        if (jid === loser) {
                            dbUser.moneyDb.money -= game.bet 
                        } else {
                            dbUser.moneyDb.money += prizePerWinner 
                        }
                        syncUangCloud(jid, dbUser) // Sync ke Supabase
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
  // 🧩 2. SUSUN KATA BERHADIAH
  // ==========================================
  global.susunKataGame = global.susunKataGame || {}

  ev.on({
    name: 'susun kata',
    cmd: ['susunkata', 'acakata'],
    tags: 'Game Menu',
    desc: 'Tebak acak huruf berhadiah',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat, prefix, cmd }) => {
        if (global.susunKataGame[chat.id]) return xp.sendMessage(chat.id, { text: '⚠️ Masih ada sesi Susun Kata yang belum terjawab di grup ini!' }, { quoted: m })

        const words = ['MEDAN', 'PUZZLE', 'ALYA', 'DATABASE', 'SERVER', 'JAVASCRIPT', 'VERCEL', 'PROGRAMMER', 'WEBSITE', 'INTERNET']
        const jawaban = words[Math.floor(Math.random() * words.length)]
        
        const acak = jawaban.split('').sort(() => 0.5 - Math.random()).join(' - ')
        const hadiah = Math.floor(Math.random() * 500) + 100 

        global.susunKataGame[chat.id] = { jawaban, hadiah }

        let txt = `🧩 *SUSUN KATA* 🧩\n\n`
        txt += `Susun huruf berikut menjadi sebuah kata:\n👉 *${acak}*\n\n`
        txt += `🎁 *Hadiah:* Rp ${hadiah}\n_Ketik *${prefix}jawab <kata>* untuk menebak!_`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
    }
  })

  ev.on({
    name: 'jawab kata',
    cmd: ['jawab'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat }) => {
        const game = global.susunKataGame[chat.id]
        if (!game) return

        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan jawabanmu!' }, { quoted: m })

        if (args[0].toUpperCase() === game.jawaban) {
            const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
            if (usrdb) {
                usrdb.moneyDb.money += game.hadiah
                save.db()
                syncUangCloud(chat.sender, usrdb)
            }
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
    desc: 'Bermain catur dengan member grup',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        const action = args[0]?.toLowerCase()
        const game = global.chessGame[chat.id]

        if (!action) {
            let guide = `♟️ *PANDUAN MAIN CATUR*\n\n1. *${prefix}${cmd} main @tag*\n2. *${prefix}${cmd} jalan e2e4*\n3. *${prefix}${cmd} board*\n4. *${prefix}${cmd} nyerah*`
            return xp.sendMessage(chat.id, { text: guide }, { quoted: m })
        }

        if (action === 'main') {
            if (game) return xp.sendMessage(chat.id, { text: '⚠️ Selesaikan dulu catur di grup ini!' }, { quoted: m })
            
            const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            if (!target) return xp.sendMessage(chat.id, { text: '⚠️ Tag orang yang ingin ditantang!' }, { quoted: m })

            global.chessGame[chat.id] = { chess: new Chess(), white: chat.sender, black: target, turn: 'w' }
            const boardUrl = `https://fen2image.chessvision.ai/${encodeURIComponent(global.chessGame[chat.id].chess.fen())}`

            await xp.sendMessage(chat.id, { 
                image: { url: boardUrl }, 
                caption: `⚔️ *PERTANDINGAN CATUR DIMULAI* ⚔️\n\n⚪ Putih: @${chat.sender.split('@')[0]}\n⚫ Hitam: @${target.split('@')[0]}\n\nPutih jalan duluan. Gunakan *${prefix}${cmd} jalan <posisi>*`,
                mentions: [chat.sender, target]
            }, { quoted: m })
            return
        }

        if (action === 'jalan') {
            if (!game) return xp.sendMessage(chat.id, { text: '⚠️ Tidak ada game catur.' }, { quoted: m })
            const currentPlayer = game.chess.turn() === 'w' ? game.white : game.black
            if (chat.sender !== currentPlayer) return xp.sendMessage(chat.id, { text: '⚠️ Bukan giliranmu!' }, { quoted: m })

            const moveInput = args[1]
            if (!moveInput || moveInput.length !== 4) return xp.sendMessage(chat.id, { text: `⚠️ Format salah! Contoh: *${prefix}${cmd} jalan e2e4*` }, { quoted: m })

            try {
                game.chess.move({ from: moveInput.substring(0, 2), to: moveInput.substring(2, 4), promotion: 'q' })
            } catch (e) {
                return xp.sendMessage(chat.id, { text: '❌ Langkah tidak sah / Ilegal!' }, { quoted: m })
            }

            const boardUrl = `https://fen2image.chessvision.ai/${encodeURIComponent(game.chess.fen())}`
            let statusTxt = `♟️ *CATUR UPDATE*\n\n`
            
            if (game.chess.isCheckmate()) {
                statusTxt += `👑 *SKAKMAT!* @${currentPlayer.split('@')[0]} Menang!`
                await xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: statusTxt, mentions: [currentPlayer] })
                delete global.chessGame[chat.id]
                return
            }

            if (game.chess.isDraw() || game.chess.isStalemate()) {
                await xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: `🤝 *SERI!* Pertandingan berakhir.` })
                delete global.chessGame[chat.id]
                return
            }

            if (game.chess.isCheck()) statusTxt += `⚠️ *SKAK!*\n\n`
            const nextPlayer = game.chess.turn() === 'w' ? game.white : game.black
            statusTxt += `Sekarang giliran @${nextPlayer.split('@')[0]}!`

            await xp.sendMessage(chat.id, { image: { url: boardUrl }, caption: statusTxt, mentions: [nextPlayer] })
        }

        if (action === 'board' && game) {
            await xp.sendMessage(chat.id, { image: { url: `https://fen2image.chessvision.ai/${encodeURIComponent(game.chess.fen())}` }, caption: 'Papan Catur Saat Ini' })
        }

        if (action === 'nyerah' && game && (chat.sender === game.white || chat.sender === game.black)) {
            const winner = chat.sender === game.white ? game.black : game.white
            await xp.sendMessage(chat.id, { text: `🏳️ @${chat.sender.split('@')[0]} menyerah!\n👑 Pemenangnya @${winner.split('@')[0]}`, mentions: [chat.sender, winner] })
            delete global.chessGame[chat.id]
        }
      } catch (e) { console.error(e) }
    }
  })
  
    // ==========================================
  // 🏇 1. BALAP KUDA (Multiplayer Betting)
  // ==========================================
  global.balapKuda = global.balapKuda || {}

  ev.on({
    name: 'balap kuda',
    cmd: ['balapkuda', 'betkuda'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya untuk grup!' }, { quoted: m })

        let game = global.balapKuda[chat.id]
        if (game && game.status === 'playing') return xp.sendMessage(chat.id, { text: '⚠️ Balapan sedang berlangsung, tunggu selesai!' }, { quoted: m })

        if (!args[0] || !args[1]) {
            let txt = `🏇 *ARENA BALAP KUDA* 🏇\n\n`
            txt += `Kuda Tersedia: 1, 2, 3, 4, 5\n\n`
            txt += `*Cara Main:*\n${prefix}${cmd} <nomor_kuda> <taruhan>\n\n`
            txt += `*Contoh:* ${prefix}${cmd} 3 10000\n`
            txt += `_(Pilih kuda nomor 3 dengan taruhan Rp 10.000)_`
            return xp.sendMessage(chat.id, { text: txt }, { quoted: m })
        }

        const noKuda = parseInt(args[0])
        const bet = parseInt(args[1])
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (noKuda < 1 || noKuda > 5) return xp.sendMessage(chat.id, { text: '⚠️ Pilih kuda nomor 1 sampai 5!' }, { quoted: m })
        if (!usrdb || usrdb.moneyDb.money < bet || bet < 100) return xp.sendMessage(chat.id, { text: `❌ Saldo tidak cukup atau bet kurang dari Rp 100!` }, { quoted: m })

        if (!game) {
            global.balapKuda[chat.id] = { status: 'waiting', bets: [], totalPot: 0 }
            game = global.balapKuda[chat.id]
            
            await xp.sendMessage(chat.id, { text: `📢 *LOBI BALAP KUDA DIBUKA!*\n\n@${chat.sender.split('@')[0]} bertaruh Rp ${bet.toLocaleString('id-ID')} untuk Kuda 🐎 ${noKuda}.\n\n_Ketik ${prefix}${cmd} <nomor_kuda> <taruhan> untuk ikut!\nBalapan dimulai dalam 30 detik._`, mentions: [chat.sender] })
            
            setTimeout(async () => {
                const curGame = global.balapKuda[chat.id]
                if (!curGame || curGame.bets.length === 0) return delete global.balapKuda[chat.id]
                
                curGame.status = 'playing'
                const delay = ms => new Promise(res => setTimeout(res, ms))
                let progress = [0, 0, 0, 0, 0] // Posisi 5 kuda
                let frameTxt = ''
                
                const msg = await xp.sendMessage(chat.id, { text: '🏁 *BALAPAN DIMULAI!* 🏁' })

                // Animasi balapan 5 frame
                for (let i = 0; i < 5; i++) {
                    await delay(1000)
                    for (let k = 0; k < 5; k++) { progress[k] += Math.floor(Math.random() * 3) + 1 } // Kuda maju acak 1-3 langkah
                    
                    frameTxt = `🏁 *BALAPAN KUDA* 🏁\n\n`
                    for (let k = 0; k < 5; k++) {
                        let lintasan = '-'.repeat(progress[k]) + '🐎' + '-'.repeat(15 - progress[k] > 0 ? 15 - progress[k] : 0)
                        frameTxt += `[${k+1}] ${lintasan}\n`
                    }
                    await xp.sendMessage(chat.id, { text: frameTxt, edit: msg.key })
                }

                // Cari pemenang
                const maxPos = Math.max(...progress)
                const pemenangKuda = progress.indexOf(maxPos) + 1 // Kuda ke berapa (1-5)
                
                let winTxt = `\n🏆 *BALAPAN SELESAI!*\n\n🐎 Kuda nomor *${pemenangKuda}* memenangkan balapan!\n\n`
                let hasWinner = false

                curGame.bets.forEach(b => {
                    const dbUser = Object.values(db().key).find(u => u.jid === b.jid)
                    if (!dbUser) return
                    
                    if (b.kuda === pemenangKuda) {
                        const winAmount = b.bet * 3 // Menang dikali 3
                        dbUser.moneyDb.money += winAmount
                        winTxt += `🎉 @${b.jid.split('@')[0]} menang *Rp ${winAmount.toLocaleString('id-ID')}*\n`
                        hasWinner = true
                    }
                    syncUangCloud(b.jid, dbUser)
                })

                if (!hasWinner) winTxt += `💀 Tidak ada yang menebak kuda nomor ${pemenangKuda}. Semua taruhan hangus dari bandar!`

                save.db()
                await xp.sendMessage(chat.id, { text: frameTxt + winTxt, edit: msg.key, mentions: curGame.bets.map(b => b.jid) })
                delete global.balapKuda[chat.id]
            }, 30000)
        }

        // Potong uang pendaftar
        usrdb.moneyDb.money -= bet
        game.bets.push({ jid: chat.sender, kuda: noKuda, bet: bet })
        game.totalPot += bet
        save.db()
        syncUangCloud(chat.sender, usrdb)

        if (game.bets.length > 1) {
            await xp.sendMessage(chat.id, { text: `✅ Taruhan diterima: Kuda ${noKuda} (Rp ${bet.toLocaleString('id-ID')})\nTotal Pot: Rp ${game.totalPot.toLocaleString('id-ID')}` }, { quoted: m })
        }

      } catch (e) { console.error(e); delete global.balapKuda[chat.id] }
    }
  })

  // ==========================================
  // 🎲 2. TEBAK DADU / SIC BO
  // ==========================================
  ev.on({
    name: 'tebak dadu',
    cmd: ['dadu', 'sicbo'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!args[0] || !args[1]) {
            let txt = `🎲 *MEJA DADU (SIC BO)* 🎲\n\n`
            txt += `Bot akan mengocok 3 dadu (Max nilai 18).\n`
            txt += `- *Kecil* (Total 3 - 10) | Hadiah x2\n`
            txt += `- *Besar* (Total 11 - 18) | Hadiah x2\n\n`
            txt += `*Cara Main:*\n${prefix}${cmd} besar 5000\n${prefix}${cmd} kecil 10000`
            return xp.sendMessage(chat.id, { text: txt }, { quoted: m })
        }

        const tebakan = args[0].toLowerCase()
        const bet = parseInt(args[1])
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!['besar', 'kecil'].includes(tebakan)) return xp.sendMessage(chat.id, { text: '⚠️ Tebak hanya: besar / kecil' }, { quoted: m })
        if (!usrdb || usrdb.moneyDb.money < bet || bet < 100) return xp.sendMessage(chat.id, { text: '❌ Saldo tidak cukup!' }, { quoted: m })

        const d1 = Math.floor(Math.random() * 6) + 1
        const d2 = Math.floor(Math.random() * 6) + 1
        const d3 = Math.floor(Math.random() * 6) + 1
        const total = d1 + d2 + d3
        const hasil = total <= 10 ? 'kecil' : 'besar'

        const isWin = tebakan === hasil
        
        let msg = `🎲 *HASIL DADU*\n\n[ ${d1} ] - [ ${d2} ] - [ ${d3} ]\nTotal: *${total} (${hasil.toUpperCase()})*\n\n`
        
        if (isWin) {
            const winAmount = bet * 2
            usrdb.moneyDb.money += bet // Kembalikan modal + untung
            msg += `🎉 *MENANG!* Kamu menebak *${tebakan}*.\nHadiah: +Rp ${winAmount.toLocaleString('id-ID')}`
        } else {
            usrdb.moneyDb.money -= bet
            msg += `💀 *KALAH!* Kamu menebak *${tebakan}*.\nHangus: -Rp ${bet.toLocaleString('id-ID')}`
        }

        save.db()
        syncUangCloud(chat.sender, usrdb)
        await xp.sendMessage(chat.id, { text: msg }, { quoted: m })

      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🎟️ 3. LOTRE GRUP (Sistem Arisan)
  // ==========================================
  global.lotreGrup = global.lotreGrup || {}

  ev.on({
    name: 'lotre grup',
    cmd: ['lotre', 'belitiket'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat, prefix, cmd }) => {
      try {
        if (!chat.group) return
        const HARGA_TIKET = 5000
        const MAX_TIKET = 10 // Berapa tiket kejual baru diundi

        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!usrdb || usrdb.moneyDb.money < HARGA_TIKET) return xp.sendMessage(chat.id, { text: `❌ Saldomu kurang! Harga 1 tiket lotre adalah Rp ${HARGA_TIKET.toLocaleString('id-ID')}` }, { quoted: m })

        global.lotreGrup[chat.id] = global.lotreGrup[chat.id] || { tiket: [], totalDuit: 0 }
        let lotre = global.lotreGrup[chat.id]

        // Potong duit
        usrdb.moneyDb.money -= HARGA_TIKET
        lotre.tiket.push(chat.sender)
        lotre.totalDuit += HARGA_TIKET
        save.db()
        syncUangCloud(chat.sender, usrdb)

        if (lotre.tiket.length < MAX_TIKET) {
            let txt = `🎟️ *TIKET LOTRE DIBELI*\n\n@${chat.sender.split('@')[0]} telah membeli 1 tiket!\n`
            txt += `📦 Tiket Terkumpul: ${lotre.tiket.length}/${MAX_TIKET}\n`
            txt += `💰 Panci Jackpot: Rp ${lotre.totalDuit.toLocaleString('id-ID')}\n\n`
            txt += `_Ketik ${prefix}${cmd} untuk membeli tiket lagi. Undian akan otomatis berjalan jika tiket mencapai ${MAX_TIKET}._`
            return xp.sendMessage(chat.id, { text: txt, mentions: [chat.sender] }, { quoted: m })
        }

        // Jika tiket mencapai max, langsung UNDI
        await xp.sendMessage(chat.id, { text: `🎰 *MENGUNDI JACKPOT LOTRE...* 🎰\n\nTiket sudah penuh! Mengacak pemenang dari ${MAX_TIKET} tiket...` })
        
        setTimeout(async () => {
            const pemenangId = lotre.tiket[Math.floor(Math.random() * lotre.tiket.length)]
            const pemenangDb = Object.values(db().key).find(u => u.jid === pemenangId)
            
            if (pemenangDb) {
                pemenangDb.moneyDb.money += lotre.totalDuit
                save.db()
                syncUangCloud(pemenangId, pemenangDb)
            }

            let winTxt = `🎉 *JACKPOT TERPECAHKAN!* 🎉\n\nSelamat kepada @${pemenangId.split('@')[0]} yang telah memenangkan arisan Lotre sebesar *Rp ${lotre.totalDuit.toLocaleString('id-ID')}*!\n\n_Uang telah otomatis ditransfer ke dompetmu._`
            await xp.sendMessage(chat.id, { text: winTxt, mentions: [pemenangId] })
            delete global.lotreGrup[chat.id] // Reset Lotre
        }, 3000)

      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🃏 4. ADU BANDAR (Player vs Player Kartu)
  // ==========================================
  global.bandarGame = global.bandarGame || {}

  ev.on({
    name: 'adu bandar',
    cmd: ['bandar', 'lawanbandar'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!chat.group) return
        let game = global.bandarGame[chat.id]
        const action = args[0]?.toLowerCase()

        if (action === 'buka') {
            if (game) return xp.sendMessage(chat.id, { text: `⚠️ Meja bandar sudah dibuka oleh @${game.bandar.split('@')[0]}!`, mentions: [game.bandar] }, { quoted: m })
            const modal = parseInt(args[1])
            const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
            if (!usrdb || !modal || usrdb.moneyDb.money < modal || modal < 1000) return xp.sendMessage(chat.id, { text: '⚠️ Format: .bandar buka <modal>\nModal minimal Rp 1.000!' }, { quoted: m })

            usrdb.moneyDb.money -= modal
            save.db()
            syncUangCloud(chat.sender, usrdb)

            global.bandarGame[chat.id] = { bandar: chat.sender, modal: modal }
            return xp.sendMessage(chat.id, { text: `🃏 *MEJA BANDAR DIBUKA*\n\n@${chat.sender.split('@')[0]} menjadi bandar dengan modal *Rp ${modal.toLocaleString('id-ID')}*.\n\n_Ketik ${prefix}lawanbandar <taruhan> untuk melawan!_`, mentions: [chat.sender] }, { quoted: m })
        }

        if (cmd === 'lawanbandar') {
            if (!game) return xp.sendMessage(chat.id, { text: '⚠️ Tidak ada meja bandar yang buka.' }, { quoted: m })
            if (chat.sender === game.bandar) return xp.sendMessage(chat.id, { text: '⚠️ Masa ngelawan diri sendiri?' }, { quoted: m })
            
            const bet = parseInt(args[0])
            const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
            if (!usrdb || !bet || usrdb.moneyDb.money < bet) return xp.sendMessage(chat.id, { text: '⚠️ Saldo tidak cukup atau format salah.' }, { quoted: m })
            if (bet > game.modal) return xp.sendMessage(chat.id, { text: `⚠️ Taruhanmu lebih besar dari modal Bandar (Sisa modal bandar: Rp ${game.modal})` }, { quoted: m })

            const bandarDb = Object.values(db().key).find(u => u.jid === game.bandar)
            const botScore = Math.floor(Math.random() * 100) + 1 // Skor penantang
            const bandarScore = Math.floor(Math.random() * 100) + 1 // Skor bandar

            let txt = `🃏 *ADU KARTU*\n\n`
            txt += `Penantang @${chat.sender.split('@')[0]}: *[ ${botScore} ]*\n`
            txt += `Bandar @${game.bandar.split('@')[0]}: *[ ${bandarScore} ]*\n\n`

            if (botScore > bandarScore) { // Penantang menang
                usrdb.moneyDb.money += bet
                game.modal -= bet
                txt += `🎉 Penantang Menang! Sedot Rp ${bet} dari Bandar.`
            } else { // Bandar menang
                usrdb.moneyDb.money -= bet
                game.modal += bet
                txt += `💀 Bandar Menang! Bandar mengambil Rp ${bet} dari Penantang.`
            }

            save.db()
            syncUangCloud(chat.sender, usrdb)
            if (bandarDb && game.modal <= 0) { // Bandar bangkrut
                txt += `\n\n🚨 *BANDAR BANGKRUT!* Meja ditutup.`
                delete global.bandarGame[chat.id]
            } else if (bandarDb) { // Tutup/update modal
                bandarDb.moneyDb.money += game.modal // Ini hanya logic sementara, aslinya uang bandar masuk saat meja ditutup
                // Untuk keamanan aslinya, game modal disimpan terpisah dulu
            }
            
            await xp.sendMessage(chat.id, { text: txt, mentions: [chat.sender, game.bandar] }, { quoted: m })
        }
        
        if (action === 'tutup') {
            if (!game || chat.sender !== game.bandar) return xp.sendMessage(chat.id, { text: '⚠️ Hanya bandar yang bisa menutup meja!' }, { quoted: m })
            const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
            usrdb.moneyDb.money += game.modal // Kembalikan sisa modal + keuntungan ke bandar
            save.db()
            syncUangCloud(chat.sender, usrdb)
            delete global.bandarGame[chat.id]
            return xp.sendMessage(chat.id, { text: `🃏 Meja ditutup. Bandar membawa pulang *Rp ${game.modal.toLocaleString('id-ID')}*.` }, { quoted: m })
        }
      } catch (e) { console.error(e) }
    }
  })
  
  // ==========================================
  // 🚀 1. CRASH (Uji Keserakahan)
  // ==========================================
  global.crashGame = global.crashGame || {}

  ev.on({
    name: 'crash game',
    cmd: ['crash'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!chat.group) return
        const bet = parseInt(args[0])
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (global.crashGame[chat.id] && global.crashGame[chat.id].status === 'playing') {
            return xp.sendMessage(chat.id, { text: '⚠️ Roket sedang terbang! Tunggu ronde ini selesai.' }, { quoted: m })
        }

        if (!bet || bet < 500) return xp.sendMessage(chat.id, { text: `⚠️ Minimal taruhan Rp 500.\nContoh: ${prefix}${cmd} 5000` }, { quoted: m })
        if (!usrdb || usrdb.moneyDb.money < bet) return xp.sendMessage(chat.id, { text: '❌ Saldo tidak cukup.' }, { quoted: m })

        // Buka Lobi
        if (!global.crashGame[chat.id]) {
            global.crashGame[chat.id] = { status: 'waiting', players: [], cashedOut: [] }
            
            await xp.sendMessage(chat.id, { text: `🚀 *LOBI CRASH DIBUKA* 🚀\n\n@${chat.sender.split('@')[0]} memasang taruhan Rp ${bet.toLocaleString('id-ID')}.\n\n_Ketik ${prefix}${cmd} <taruhan> untuk ikut menumpang roket!\nRoket meluncur dalam 20 detik._`, mentions: [chat.sender] })
            
            setTimeout(async () => {
                let game = global.crashGame[chat.id]
                if (!game || game.players.length === 0) return delete global.crashGame[chat.id]
                
                game.status = 'playing'
                
                // Algoritma penentu titik ledak (Crash Point)
                // Banyak meledak di angka kecil (1.0x - 2.0x), jarang tembus besar.
                const e = 100
                const crashPoint = Math.max(1.0, (e / (e - Math.random() * e)) * 0.99).toFixed(2)
                
                let multiplier = 1.0
                const delay = ms => new Promise(res => setTimeout(res, ms))
                const msg = await xp.sendMessage(chat.id, { text: `🚀 *ROKET MELUNCUR!*\n\nMultiplier: *${multiplier.toFixed(2)}x*\n\n_Ketik *.tarik* sebelum roket meledak!_` })

                let isCrashed = false

                // Loop animasi roket naik
                while (!isCrashed) {
                    await delay(1500) // update setiap 1.5 detik
                    multiplier += (Math.random() * 0.4) + 0.1 // Naik secara acak

                    if (multiplier >= crashPoint) {
                        multiplier = crashPoint
                        isCrashed = true
                    }

                    game.currentMultiplier = multiplier.toFixed(2)

                    if (!isCrashed) {
                        await xp.sendMessage(chat.id, { text: `🚀 *TERBANG TINGGI!*\n\nMultiplier: *${multiplier.toFixed(2)}x*\n\n_Ayo ketik *.tarik* sekarang sebelum telat!_`, edit: msg.key })
                    } else {
                        let txt = `💥 *ROKET MELEDAK DI ${multiplier}x!* 💥\n\n`
                        txt += `🎉 *Pemain Selamat (Cair):*\n`
                        
                        let adaSelamat = false
                        game.cashedOut.forEach(p => {
                            txt += `- @${p.jid.split('@')[0]} (Menang Rp ${p.winAmount.toLocaleString('id-ID')})\n`
                            adaSelamat = true
                        })
                        if (!adaSelamat) txt += `_Tidak ada yang selamat._\n`

                        txt += `\n💀 *Pemain Hangus (Serakah):*\n`
                        let adaMati = false
                        game.players.forEach(p => {
                            if (!game.cashedOut.find(c => c.jid === p.jid)) {
                                txt += `- @${p.jid.split('@')[0]} (-Rp ${p.bet.toLocaleString('id-ID')})\n`
                                adaMati = true
                            }
                        })
                        if (!adaMati) txt += `_Tidak ada yang hangus._`

                        await xp.sendMessage(chat.id, { text: txt, edit: msg.key, mentions: game.players.map(p => p.jid) })
                        delete global.crashGame[chat.id]
                    }
                }
            }, 20000)
        }

        // Potong saldo di awal
        usrdb.moneyDb.money -= bet
        save.db()
        syncUangCloud(chat.sender, usrdb)
        
        let game = global.crashGame[chat.id]
        if (!game.players.find(p => p.jid === chat.sender)) {
             game.players.push({ jid: chat.sender, bet: bet })
             if (game.players.length > 1) {
                 await xp.sendMessage(chat.id, { text: `✅ @${chat.sender.split('@')[0]} ikut naik roket! Taruhan: Rp ${bet}`, mentions: [chat.sender] }, { quoted: m })
             }
        }

      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'tarik crash',
    cmd: ['tarik', 'cashout'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
        let game = global.crashGame[chat.id]
        if (!game || game.status !== 'playing') return

        const player = game.players.find(p => p.jid === chat.sender)
        if (!player) return xp.sendMessage(chat.id, { text: '⚠️ Kamu tidak ikut di penerbangan ini!' }, { quoted: m })
        
        if (game.cashedOut.find(c => c.jid === chat.sender)) return xp.sendMessage(chat.id, { text: '⚠️ Kamu sudah loncat dari roket!' }, { quoted: m })

        const currentM = game.currentMultiplier || 1.0
        const winAmount = Math.floor(player.bet * currentM)

        game.cashedOut.push({ jid: chat.sender, winAmount: winAmount })

        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
        if (usrdb) {
            usrdb.moneyDb.money += winAmount
            save.db()
            syncUangCloud(chat.sender, usrdb)
        }

        await xp.sendMessage(chat.id, { text: `🪂 @${chat.sender.split('@')[0]} loncat di titik *${currentM}x* dan membawa pulang *Rp ${winAmount.toLocaleString('id-ID')}*!`, mentions: [chat.sender] })
    }
  })

  // ==========================================
  // 🪟 2. JEMBATAN KACA (Survival Game)
  // ==========================================
  global.kacaGame = global.kacaGame || {}

  ev.on({
    name: 'jembatan kaca',
    cmd: ['jembatankaca', 'kaca'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!chat.group) return
        const BIAYA = 10000

        if (cmd === 'kaca' || cmd === 'jembatankaca') {
            if (global.kacaGame[chat.id]) return xp.sendMessage(chat.id, { text: '⚠️ Game sedang berlangsung, tunggu selesai.' }, { quoted: m })

            global.kacaGame[chat.id] = { status: 'waiting', players: [], pot: 0, step: 1, maxStep: 3, timer: null }
            await xp.sendMessage(chat.id, { text: `🪟 *SQUID GAME: JEMBATAN KACA* 🪟\n\nBiaya Masuk: Rp ${BIAYA.toLocaleString('id-ID')}\nKalian harus menebak kaca mana yang aman (Kiri/Kanan) sebanyak 3 langkah.\n\n_Ketik *${prefix}ikutkaca* untuk berpartisipasi.\nPermainan dimulai dalam 20 detik._` })

            global.kacaGame[chat.id].timer = setTimeout(() => {
                let cur = global.kacaGame[chat.id]
                if (!cur || cur.players.length === 0) {
                    xp.sendMessage(chat.id, { text: '❌ Game dibatalkan karena tidak ada peserta.' })
                    return delete global.kacaGame[chat.id]
                }
                
                cur.status = 'playing'
                cur.votes = { kiri: [], kanan: [] } // Menyimpan pilihan pemain
                cur.answer = Math.random() < 0.5 ? 'kiri' : 'kanan' // Jawaban untuk langkah 1

                let listPemain = cur.players.map(p => `- @${p.split('@')[0]}`).join('\n')
                xp.sendMessage(chat.id, { text: `🚨 *GAME DIMULAI* 🚨\n\nLangkah 1/3: Kaca mana yang aman?\nKetikan pilihan kalian: *${prefix}kiri* atau *${prefix}kanan*\n\n*Peserta (Wajib milih):*\n${listPemain}\n\n_Waktu memilih: 15 detik._`, mentions: cur.players })

                // Timer Langkah 1
                cur.timer = setTimeout(() => evaluasiKaca(xp, chat.id), 15000)
            }, 20000)
            return
        }

        if (cmd === 'ikutkaca') {
            let cur = global.kacaGame[chat.id]
            if (!cur || cur.status !== 'waiting') return
            if (cur.players.includes(chat.sender)) return
            
            const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
            if (!usrdb || usrdb.moneyDb.money < BIAYA) return xp.sendMessage(chat.id, { text: '❌ Uangmu kurang untuk ikut.' }, { quoted: m })

            usrdb.moneyDb.money -= BIAYA
            save.db()
            syncUangCloud(chat.sender, usrdb)
            
            cur.players.push(chat.sender)
            cur.pot += BIAYA
            await xp.sendMessage(chat.id, { text: `✅ @${chat.sender.split('@')[0]} bergabung! Total Pot: Rp ${cur.pot.toLocaleString('id-ID')}`, mentions: [chat.sender] }, { quoted: m })
        }

      } catch (e) { console.error(e) }
    }
  })

  // Command untuk memilih Kiri atau Kanan (Harus di luar block event.on sebelumnya, atau masukin array cmd)
  ev.on({
    name: 'Pilih Kaca',
    cmd: ['kiri', 'kanan'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat, cmd }) => {
        let cur = global.kacaGame[chat.id]
        if (!cur || cur.status !== 'playing') return
        if (!cur.players.includes(chat.sender)) return
        if (cur.votes.kiri.includes(chat.sender) || cur.votes.kanan.includes(chat.sender)) return xp.sendMessage(chat.id, { text: '⚠️ Kamu sudah memilih langkah ini!' }, { quoted: m })

        cur.votes[cmd].push(chat.sender)
        await xp.sendMessage(chat.id, { react: { text: '👀', key: m.key } })
    }
  })

  // Fungsi Evaluasi Jembatan Kaca
  async function evaluasiKaca(xp, chatId) {
      let cur = global.kacaGame[chatId]
      if (!cur) return

      let jawabanBenar = cur.answer
      let pemainSelamat = cur.votes[jawabanBenar]
      let pemainJatuh = cur.votes[jawabanBenar === 'kiri' ? 'kanan' : 'kiri']

      // Yang ga milih (AFK) dianggap jatuh
      cur.players.forEach(p => {
          if (!pemainSelamat.includes(p) && !pemainJatuh.includes(p)) {
              pemainJatuh.push(p)
          }
      })

      let txt = `💥 *KACA PECAH!* 💥\n\nKaca yang aman adalah: *${jawabanBenar.toUpperCase()}*\n\n`
      
      if (pemainJatuh.length > 0) {
          txt += `💀 *Pemain Jatuh & Mati:*\n${pemainJatuh.map(p => `- @${p.split('@')[0]}`).join('\n')}\n\n`
      }

      cur.players = pemainSelamat // Update pemain yang sisa

      if (cur.players.length === 0) {
          txt += `❌ *SEMUA PEMAIN MATI!*\nTotal hadiah Rp ${cur.pot.toLocaleString('id-ID')} hangus.`
          await xp.sendMessage(chatId, { text: txt, mentions: pemainJatuh })
          return delete global.kacaGame[chatId]
      }

      if (cur.step >= cur.maxStep) {
          // Game Selesai - Ada yang selamat sampai ujung
          const hadiahPerOrang = Math.floor(cur.pot / cur.players.length)
          txt += `🎉 *SELAMAT! KALIAN MENCAPAI UJUNG JEMBATAN!*\n\nPemain yang selamat masing-masing mendapatkan *Rp ${hadiahPerOrang.toLocaleString('id-ID')}*:\n${cur.players.map(p => `- @${p.split('@')[0]}`).join('\n')}`
          
          cur.players.forEach(p => {
              const usrdb = Object.values(db().key).find(u => u.jid === p)
              if (usrdb) {
                  usrdb.moneyDb.money += hadiahPerOrang
                  syncUangCloud(p, usrdb)
              }
          })
          save.db()

          await xp.sendMessage(chatId, { text: txt, mentions: [...pemainJatuh, ...cur.players] })
          return delete global.kacaGame[chatId]
      }

      // Lanjut ke langkah berikutnya
      cur.step++
      cur.votes = { kiri: [], kanan: [] }
      cur.answer = Math.random() < 0.5 ? 'kiri' : 'kanan'

      txt += `🚶‍♂️ *PEMAIN YANG TERSISA:*\n${cur.players.map(p => `- @${p.split('@')[0]}`).join('\n')}\n\n`
      txt += `🚨 *LANGKAH ${cur.step}/${cur.maxStep}*\nKetik *.kiri* atau *.kanan* sekarang! Waktu 15 detik.`

      await xp.sendMessage(chatId, { text: txt, mentions: [...pemainJatuh, ...cur.players] })
      
      cur.timer = setTimeout(() => evaluasiKaca(xp, chatId), 15000)
  }

  // ==========================================
  // 💣 5. OPER BOM WAKTU
  // ==========================================
  global.bomWaktu = global.bomWaktu || {}

  ev.on({
    name: 'bom waktu',
    cmd: ['bom', 'ikutbom', 'lempar'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat, cmd, prefix }) => {
      try {
        if (!chat.group) return
        const BIAYA = 5000
        let game = global.bomWaktu[chat.id]

        if (cmd === 'bom') {
            if (game) return xp.sendMessage(chat.id, { text: '⚠️ Game bom sudah ada, ketik .ikutbom' }, { quoted: m })
            global.bomWaktu[chat.id] = { status: 'waiting', players: [], pot: 0, timer: null, currentHolder: null }
            await xp.sendMessage(chat.id, { text: `💣 *BOM WAKTU DIBUAT* 💣\n\nBiaya pendaftaran: Rp ${BIAYA}\nKetik *${prefix}ikutbom* untuk bergabung.\nGame otomatis mulai setelah ada 2+ pemain dan tidak ada yang mendaftar lagi dalam 15 detik.` })
            
            // Auto start timer
            global.bomWaktu[chat.id].timer = setTimeout(() => {
                 let cur = global.bomWaktu[chat.id]
                 if (cur && cur.players.length >= 2) startBom(xp, chat)
                 else {
                     xp.sendMessage(chat.id, { text: '❌ Batal, pemain kurang dari 2.' })
                     delete global.bomWaktu[chat.id]
                 }
            }, 15000)
            return
        }

        if (cmd === 'ikutbom') {
            if (!game || game.status !== 'waiting') return
            const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
            if (!usrdb || usrdb.moneyDb.money < BIAYA || game.players.includes(chat.sender)) return
            
            usrdb.moneyDb.money -= BIAYA
            game.players.push(chat.sender)
            game.pot += BIAYA
            save.db()
            
            // Reset start timer
            clearTimeout(game.timer)
            game.timer = setTimeout(() => startBom(xp, chat), 15000)
            
            await xp.sendMessage(chat.id, { text: `✅ @${chat.sender.split('@')[0]} join! (Total: ${game.players.length})`, mentions: [chat.sender] }, { quoted: m })
        }

        if (cmd === 'lempar') {
            if (!game || game.status !== 'playing' || game.currentHolder !== chat.sender) return xp.sendMessage(chat.id, { text: '⚠️ Kamu sedang tidak memegang bom!' }, { quoted: m })
            const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            if (!target || !game.players.includes(target)) return xp.sendMessage(chat.id, { text: '⚠️ Target tidak ada atau tidak ikut bermain!' }, { quoted: m })
            if (target === chat.sender) return
            
            game.currentHolder = target
            await xp.sendMessage(chat.id, { text: `🤾‍♂️ Bom dilempar ke @${target.split('@')[0]}!\nCepat ketik *.lempar @tag_lain*`, mentions: [target] })
        }

        async function startBom(xp, chat) {
            let cur = global.bomWaktu[chat.id]
            cur.status = 'playing'
            cur.currentHolder = cur.players[Math.floor(Math.random() * cur.players.length)]
            
            const ledakanMs = Math.floor(Math.random() * 20000) + 10000 // 10 - 30 detik
            
            await xp.sendMessage(chat.id, { text: `🚨 *BOM DIAKTIFKAN!* 🚨\n\nTotal Pot: Rp ${cur.pot}\nBom saat ini dipegang oleh @${cur.currentHolder.split('@')[0]}!\n\n_Buru-buru tag temanmu dengan *.lempar @tag*_`, mentions: [cur.currentHolder] })
            
            setTimeout(async () => {
                 let finalGame = global.bomWaktu[chat.id]
                 if (!finalGame) return
                 
                 const loser = finalGame.currentHolder
                 const winners = finalGame.players.filter(p => p !== loser)
                 const prize = Math.floor(finalGame.pot / winners.length)
                 
                 let winTxt = `💥 *DOOOOAAAARRRR!!!* 💥\n\nBom meledak di tangan @${loser.split('@')[0]}!\n\n🎉 *Pemenang yang selamat:*\n`
                 winners.forEach(w => {
                     const wDb = Object.values(db().key).find(u => u.jid === w)
                     if (wDb) {
                         wDb.moneyDb.money += prize
                         syncUangCloud(w, wDb)
                     }
                     winTxt += `- @${w.split('@')[0]} (+Rp ${prize})\n`
                 })
                 save.db()
                 await xp.sendMessage(chat.id, { text: winTxt, mentions: finalGame.players })
                 delete global.bomWaktu[chat.id]
            }, ledakanMs)
        }
      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🏦 4. SISTEM BANK & EKONOMI
  // ==========================================
  ev.on({
    name: 'cek bank',
    cmd: ['cekbank', 'bank'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      try {
        const bankDb = JSON.parse(fs.readFileSync(bankData, 'utf-8'))
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
        let txt = `🏦 *BANK PUSAT ALYA*\n\n💰 Saldo Bank Bot: Rp ${bankDb.key?.saldo?.toLocaleString('id-ID') || 0}\n💳 Tabungan Kamu: Rp ${usrdb?.moneyDb?.moneyInBank?.toLocaleString('id-ID') || 0}`
        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'nabung',
    cmd: ['nabung', 'isiatm', 'deposit'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan nominal! Contoh: .nabung 10000' }, { quoted: m })
        const userDb = Object.values(db().key).find(u => u.jid === chat.sender)
        const nominal = parseInt(args[0])

        if (!userDb || !nominal || nominal <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Nominal tidak valid.' }, { quoted: m })
        if (userDb.moneyDb.money < nominal) return xp.sendMessage(chat.id, { text: `⚠️ Uang dompetmu tidak cukup! Sisa: Rp ${userDb.moneyDb.money.toLocaleString('id-ID')}` }, { quoted: m })

        userDb.moneyDb.money -= nominal
        userDb.moneyDb.moneyInBank += nominal
        save.db()
        syncUangCloud(chat.sender, userDb)

        await xp.sendMessage(chat.id, { text: `✅ Berhasil menabung Rp ${nominal.toLocaleString('id-ID')} ke Bank!` }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'tarik saldo',
    cmd: ['tariksaldo', 'tarik', 'withdraw'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan nominal! Contoh: .tarik 10000' }, { quoted: m })
        const nominal = parseInt(args[0])
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!nominal || !usrdb) return xp.sendMessage(chat.id, { text: '⚠️ Nominal tidak valid.' }, { quoted: m })
        if (usrdb.moneyDb.moneyInBank < nominal) return xp.sendMessage(chat.id, { text: `⚠️ Saldo ATM kamu hanya sisa Rp ${usrdb.moneyDb.moneyInBank.toLocaleString('id-ID')}` }, { quoted: m })

        usrdb.moneyDb.moneyInBank -= nominal
        usrdb.moneyDb.money += nominal
        save.db()
        syncUangCloud(chat.sender, usrdb)

        await xp.sendMessage(chat.id, { text: `✅ Berhasil menarik Rp ${nominal.toLocaleString('id-ID')} dari Bank!` }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'transfer',
    cmd: ['tf', 'transfer', 'pay'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya bisa digunakan di grup' }, { quoted: m })
        const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!target || !args[1]) return xp.sendMessage(chat.id, { text: '⚠️ Format salah! Contoh: .tf @user 10000' }, { quoted: m })

        const nominal = parseInt(args[1])
        const targetDb = Object.values(db().key).find(u => u.jid === target)
        const userDb = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!nominal || nominal <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Nominal tidak valid' }, { quoted: m })
        if (!userDb || !targetDb) return xp.sendMessage(chat.id, { text: '❌ Data pengirim/penerima tidak ditemukan.' }, { quoted: m })
        if (userDb.moneyDb.money < nominal) return xp.sendMessage(chat.id, { text: `⚠️ Uangmu tidak cukup.` }, { quoted: m })

        userDb.moneyDb.money -= nominal
        targetDb.moneyDb.money += nominal
        save.db()
        syncUangCloud(chat.sender, userDb)
        syncUangCloud(target, targetDb)

        await xp.sendMessage(chat.id, { text: `💸 Berhasil transfer Rp ${nominal.toLocaleString('id-ID')} ke @${target.split('@')[0]}`, mentions: [target] }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🥷 5. RAMPOK (Player PvP Economy)
  // ==========================================
  ev.on({
    name: 'rampok',
    cmd: ['rampok', 'rob'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Perintah ini hanya bisa digunakan di grup' }, { quoted: m })
        const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        
        const usrdb = Object.values(db().key).find(u => u.jid === chat.sender)
        const targetdb = Object.values(db().key).find(t => t.jid === target)

        if (!target || !targetdb) return xp.sendMessage(chat.id, { text: '⚠️ Reply/tag target yang ingin dirampok!' }, { quoted: m })
        if (target === chat.sender) return xp.sendMessage(chat.id, { text: '⚠️ Nggak usah merampok diri sendiri.' }, { quoted: m })
        if (usrdb.game?.robbery?.cost <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Kesempatan merampok habis, coba besok.' }, { quoted: m })
        if (targetdb.moneyDb.money <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Target terlalu miskin.' }, { quoted: m })

        const chance = Math.floor(Math.random() * 100) + 1
        const escapeChance = chance >= 45 ? Math.floor(Math.random() * 21) + 25 : Math.floor(Math.random() * 21) + 10
        const escapeRoll = Math.floor(Math.random() * 100) + 1

        if (escapeRoll <= escapeChance) {
          usrdb.game.robbery.cost -= 1
          return xp.sendMessage(chat.id, { text: `🚨 Target berhasil *lolos*! Kamu gagal merampok.` }, { quoted: m })
        }

        const persen = chance > 100 ? 100 : chance
        let stolin = Math.floor(targetdb.moneyDb.money * (persen / 100))
        if (stolin < 1) stolin = 1

        targetdb.moneyDb.money -= stolin
        usrdb.moneyDb.money += stolin
        usrdb.game.robbery.cost -= 1
        save.db()
        syncUangCloud(chat.sender, usrdb)
        syncUangCloud(target, targetdb)

        let txt = `🥷 *PERAMPOKAN BERHASIL*\n\nBerhasil mencuri *Rp ${stolin.toLocaleString('id-ID')}* dari @${target.split('@')[0]}\n💰 Saldo Kamu: Rp ${usrdb.moneyDb.money.toLocaleString('id-ID')}`
        await xp.sendMessage(chat.id, { text: txt, mentions: [target] }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🎰 6. GACHA SLOT & GAME KASINO LAINNYA
  // ==========================================
  ev.on({
    name: 'slot',
    cmd: ['isi', 'spin', 'slot', 'gacha'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat }) => {
      try {
        const saldoBank = JSON.parse(fs.readFileSync(bankData, 'utf-8'))
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        const delay = ms => new Promise(res => setTimeout(res, ms))
        const sym = ['🕊️','🦀','🦎','🍀','💎','🍒','❤️','🎊']
        const randSym = () => sym[Math.floor(Math.random() * sym.length)]

        if (!user) return xp.sendMessage(chat.id, { text: '❌ Kamu belum terdaftar' }, { quoted: m })

        const inputBet = args[0]?.toLowerCase()
        let saldo = user.moneyDb?.money || 0
        let isi = inputBet === 'all' ? saldo : parseInt(inputBet)

        if (!inputBet || isNaN(isi) || isi <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan jumlah taruhan yang valid!' }, { quoted: m })
        
        if (isi > saldo) {
            const saldoAwal = Math.floor(saldo / 0.88) // Kompensasi pajak 12%
            if (isi <= saldoAwal + 10) isi = saldo; else return xp.sendMessage(chat.id, { text: `⚠️ Saldo tidak cukup! Sisa: Rp ${saldo.toLocaleString('id-ID')}` }, { quoted: m })
        }

        const menang = Math.random() < 0.5 
        const hasilTengah = menang ? Array(3).fill(randSym()) : (() => { let r; do { r = [randSym(), randSym(), randSym()] } while (r[0] === r[1] && r[1] === r[2]); return r; })()
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

        save.db()
        syncUangCloud(chat.sender, user)
        fs.writeFileSync(bankData, JSON.stringify(saldoBank, null, 2))

        const pesanAwal = await xp.sendMessage(chat.id, { text: '🎰 *Mesin ditarik...*' }, { quoted: m })

        for (let i = 0; i < 4; i++) {
          await delay(500) 
          let frameTxt = `╭───🎰 GACHA 🎰───╮\n│  ${randSym()} : ${randSym()} : ${randSym()}\n│> ${randSym()} : ${randSym()} : ${randSym()} <\n│  ${randSym()} : ${randSym()} : ${randSym()}\n╰─────────────────╯\n   🔄 *Memutar...*`
          await xp.sendMessage(chat.id, { text: frameTxt, edit: pesanAwal.key })
        }

        await delay(600) 
        const txtAkhir = `╭───🎰 GACHA 🎰───╮\n│  ${baris1.join(' : ')}\n│> ${hasilTengah.join(' : ')} <\n│  ${baris3.join(' : ')}\n╰─────────────────╯\n${menang ? `🎉 *JACKPOT!* Menang +Rp ${rsMoney.toLocaleString('id-ID')}` : `💥 *ZONK!* Kalah -Rp ${isi.toLocaleString('id-ID')}`}`
        await xp.sendMessage(chat.id, { text: txtAkhir, edit: pesanAwal.key })

      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 🏕️ 7. SISTEM RPG (Berburu, Tambang, Heal, Duel)
  // ==========================================
  ev.on({
    name: 'berburu',
    cmd: ['berburu', 'hunt', 'adventure'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return
        user.rpg = user.rpg || { hp: 100, potion: 3, level: 1, exp: 0 }
        
        if (user.rpg.hp < 20) return xp.sendMessage(chat.id, { text: `⚠️ HP terlalu rendah (${user.rpg.hp}/100)! Ketik .heal.` }, { quoted: m })

        const delay = ms => new Promise(res => setTimeout(res, ms))
        const pesanAwal = await xp.sendMessage(chat.id, { text: '🚶‍♂️ *Memasuki Hutan...*' }, { quoted: m })
        await delay(1500) 
        
        const monsters = [
          { name: 'Slime', hpDamage: 5, reward: 50, exp: 10, emoji: '🦠' },
          { name: 'Goblin', hpDamage: 10, reward: 150, exp: 25, emoji: '👺' },
          { name: 'Serigala', hpDamage: 15, reward: 200, exp: 35, emoji: '🐺' },
          { name: 'Naga', hpDamage: 45, reward: 1500, exp: 100, emoji: '🐉' }
        ]
        
        const musuh = monsters[Math.floor(Math.random() * monsters.length)]
        await xp.sendMessage(chat.id, { text: `⚔️ Seekor *${musuh.name}* ${musuh.emoji} muncul!\n_Menyerang..._`, edit: pesanAwal.key })
        await delay(2000) 

        user.rpg.hp -= musuh.hpDamage
        user.moneyDb.money += musuh.reward
        user.rpg.exp += musuh.exp
        
        let dropPotion = false
        if (Math.random() < 0.3) { user.rpg.potion += 1; dropPotion = true }

        let levelUpMsg = ''
        if (user.rpg.exp >= (user.rpg.level * 100)) {
           user.rpg.level += 1; user.rpg.exp = 0; user.rpg.hp = 100 
           levelUpMsg = `\n🎉 *LEVEL UP!* Sekarang Level ${user.rpg.level}!`
        }

        save.db()
        syncUangCloud(chat.sender, user)
        if (global.supabase) global.supabase.from('game_stats').update({ hp: user.rpg.hp }).eq('jid', chat.sender).then()

        const hasilTxt = `⚔️ *HASIL PERTARUNGAN*\n\nMenebas *${musuh.name}* ${musuh.emoji}!\n🩸 HP: -${musuh.hpDamage} (Sisa: ${user.rpg.hp})\n💰 Uang: +Rp ${musuh.reward}\n✨ EXP: +${musuh.exp}${dropPotion ? '\n🧪 Drop: 1 Potion' : ''}${levelUpMsg}`
        await xp.sendMessage(chat.id, { text: hasilTxt, edit: pesanAwal.key })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'heal',
    cmd: ['heal', 'minum', 'potion'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return
        user.rpg = user.rpg || { hp: 100, potion: 3, level: 1, exp: 0 }

        if (user.rpg.hp >= 100) return xp.sendMessage(chat.id, { text: '✅ HP kamu sudah penuh!' }, { quoted: m })
        if (user.rpg.potion <= 0) return xp.sendMessage(chat.id, { text: '⚠️ Potion habis!' }, { quoted: m })

        user.rpg.potion -= 1
        user.rpg.hp += 50
        if (user.rpg.hp > 100) user.rpg.hp = 100 

        save.db()
        if (global.supabase) global.supabase.from('game_stats').update({ hp: user.rpg.hp }).eq('jid', chat.sender).then()

        await xp.sendMessage(chat.id, { text: `🧪 *GLUK GLUK...*\nMeminum 1 Potion.\n🩸 HP: ${user.rpg.hp}/100\n🎒 Sisa: ${user.rpg.potion}` }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  ev.on({
    name: 'tambang',
    cmd: ['tambang', 'mining'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender)
        if (!user) return
        user.game = user.game || {}; user.game.inventory = user.game.inventory || { batu: 0, besi: 0, emas: 0, diamond: 0, pedang: 0 }; user.game.cooldown = user.game.cooldown || {}

        const timeNow = Date.now(); const cooldownTime = 5 * 60 * 1000 
        if (timeNow - (user.game.cooldown.tambang || 0) < cooldownTime) {
            const sisaWaktu = Math.ceil((cooldownTime - (timeNow - user.game.cooldown.tambang)) / 1000)
            return xp.sendMessage(chat.id, { text: `⏳ *Kelelahan!*\nTunggu ${Math.floor(sisaWaktu / 60)}m ${sisaWaktu % 60}d lagi.` }, { quoted: m })
        }

        const rand = Math.random() * 100
        const b = rand < 50 ? Math.floor(Math.random() * 5) + 1 : 0
        const bs = rand < 30 ? Math.floor(Math.random() * 3) + 1 : 0
        const em = rand < 10 ? 1 : 0; const dm = rand < 2 ? 1 : 0

        user.game.inventory.batu += b; user.game.inventory.besi += bs; user.game.inventory.emas += em; user.game.inventory.diamond += dm
        user.game.cooldown.tambang = timeNow 
        save.db()
        
        if (global.supabase) global.supabase.from('inventory').update({ batu: user.game.inventory.batu, besi: user.game.inventory.besi, emas: user.game.inventory.emas, diamond: user.game.inventory.diamond }).eq('jid', chat.sender).then()

        let txt = `⛏️ *TAMBANG*\nMendapatkan:\n🪨 Batu: +${b} | ⚙️ Besi: +${bs}\n🪙 Emas: +${em} | 💎 Diamond: +${dm}`
        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) { console.error(e) }
    }
  })

  // ==========================================
  // 📊 8. LEADERBOARD & STATUS
  // ==========================================
  ev.on({
    name: 'top global',
    cmd: ['topglobal', 'sultan'],
    tags: 'Game Menu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      const allUsers = Object.values(db().key)
      const sortedUsers = allUsers.map(u => ({ jid: u.jid, total: (u.moneyDb?.money || 0) + (u.moneyDb?.moneyInBank || 0) })).sort((a, b) => b.total - a.total).slice(0, 10) 

      let txt = `🏆 *TOP 10 SULTAN ALYA* 🏆\n\n`
      sortedUsers.forEach((u, i) => { txt += `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎗️'} *${i + 1}.* @${u.jid.split('@')[0]} \n   💰 Rp ${u.total.toLocaleString('id-ID')}\n` })
      await xp.sendMessage(chat.id, { text: txt, mentions: sortedUsers.map(u => u.jid) }, { quoted: m })
    }
  })

}
