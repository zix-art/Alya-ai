import supabase from './db/supabase.js'

const sfg = {
  timer: 24 * 60 * 60 * 1000, // 24 Jam
  cost: 1000,
  sleep: ms => new Promise(r => setTimeout(r, ms))
}

const th = { timer: 120000 } // 2 Menit untuk jawab sambung kata

// ==========================================
// 🚀 RAM CACHE UNTUK GAME (PENGGANTI history_sambung_kata.json)
// Jauh lebih cepat dan tidak bikin storage HP penuh!
// ==========================================
const sambungKataSessions = new Map()

let runTimerHistory = !1,
    runfarm = !1,
    runRobberyCost = !1

async function cost_robbery() {
  if (runRobberyCost) return
  runRobberyCost = !0

  while (!0) {
    await sfg.sleep(sfg.timer)

    try {
      // ☁️ Ambil user yang punya game_data dari Supabase
      const { data: users } = await supabase.from('users').select('id, game_data')
      if (!users) continue

      for (const usr of users) {
        let gd = usr.game_data || {}
        
        // Cek apakah dia punya data robbery
        if (gd.robbery !== undefined || gd.farm !== undefined) {
            gd.robbery = gd.robbery || {}
            gd.robbery.cost = (gd.robbery.cost || 0) + 3
            
            // Update ke Cloud di background
            supabase.from('users').update({ game_data: gd }).eq('id', usr.id).then()
        }
      }
    } catch (e) {
      console.error('error pada robberyCostLoop', e)
    }
  }
}

async function autofarm() {
  if (runfarm) return
  runfarm = !0

  while (!0) {
    try {
      // ☁️ Ambil data user dari Supabase
      const { data: users } = await supabase.from('users').select('id, bank, game_data')
      
      if (users) {
          for (const usr of users) {
            let gd = usr.game_data || {}
            
            // Skip jika user tidak main farm atau uang di bank > 100 juta
            if (!gd.farm) continue
            if ((usr.bank || 0) > 1e8) continue
    
            const now = Date.now()
            const last = gd.farm.last_set || 0
            const diff = now - last
    
            // Skip jika belum 24 jam
            if (diff < sfg.timer) continue
    
            const exp = gd.farm.exp || 1,
                  multiplier = Math.floor(exp / 10) || 1,
                  cycle = Math.floor(25 / 2),
                  reward = sfg.cost * multiplier * cycle
    
            // Tambahkan hadiah ke bank dan reset waktu farm
            let newBank = (usr.bank || 0) + reward
            gd.farm.last_set = now
    
            // Update ke Supabase
            supabase.from('users').update({ bank: newBank, game_data: gd }).eq('id', usr.id).then()
          }
      }

    } catch (e) {
      console.error('error pada autofarm', e)
    }

    await sfg.sleep(sfg.timer)
  }
}

async function sambungkata(xp, m) {
  const chat = global.chat(m),
        q = m.message?.extendedTextMessage?.contextInfo,
        jawaban = m.message?.conversation || m.message?.extendedTextMessage?.text,
        idBot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net',
        sender = chat.sender

  // Pastikan membalas pesan bot
  if (!q?.stanzaId || !jawaban || q.participant !== idBot) return

  // Cari sesi game di RAM Cache berdasarkan ID Pesan Bot yang dibalas
  const sessionKey = q.stanzaId
  const data = sambungKataSessions.get(sessionKey)

  // Pastikan game ada, dan yang jawab adalah orang yang memulai game
  if (!data || data.sender !== sender) return

  const jawab = jawaban.trim().toLowerCase(),
        benar = data.key.toLowerCase()

  data.chance = jawab === benar ? data.chance : (data.chance ?? 1) - 1

  // Jika jawaban SALAH
  if (jawab !== benar) {
    if (data.chance <= 0) {
        sambungKataSessions.delete(sessionKey) // Hapus dari memori
        return xp.sendMessage(chat.id, { text:`❌ Kesempatan habis!\nJawaban benar: *${data.key}*` }, { quoted:m })
    } else {
        return xp.sendMessage(chat.id, { text:`⚠️ Jawaban salah!\nChance tersisa: ${data.chance}` }, { quoted:m })
    }
  }

  // Jika jawaban BENAR
  const { getUserDataSupa } = await import('./function.js')
  let usr = await getUserDataSupa(sender)

  const lvl = Math.floor((usr.exp || 0) / 1e2) || 1,
        reward = 1e3 * lvl

  // Tambahkan uang ke Bank Supabase
  let newBank = (usr.bank || 0) + reward
  await supabase.from('users').update({ bank: newBank }).eq('id', sender)

  sambungKataSessions.delete(sessionKey) // Hapus dari memori
  return xp.sendMessage(chat.id, { text:`✅ Jawaban benar!\nHadiah masuk ke Bank: Rp ${reward.toLocaleString('id-ID')}` }, { quoted:m })
}

function timerhistory(xp) {
  if (runTimerHistory) return
  runTimerHistory = !0

  // Mengecek game yang timeout setiap 15 detik
  setInterval(async () => {
    try {
      const now = Date.now()

      // Looping data dari RAM Map
      for (const [sessionKey, d] of sambungKataSessions.entries()) {
         if (now - d.set > th.timer) {
            
            sambungKataSessions.delete(sessionKey) // Hapus dari RAM
            
            await xp.sendMessage(d.chat, {
                text: `⏳ @${d.sender.split('@')[0]} waktu habis!\nJawaban yang bener: *${d.key}*\nUntuk soal: _${d.soal}_`,
                mentions: [d.sender]
            }).catch(() => !1)
         }
      }
    } catch (e) {
      console.error(e)
    }
  }, 15000)
}

// Export sambungKataSessions agar bisa diakses oleh command pembuat gamenya nanti
export { autofarm, sambungkata, timerhistory, cost_robbery, sambungKataSessions }
