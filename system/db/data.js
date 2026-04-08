import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import supabase from './supabase.js' // 👈 Import Supabase

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const database = path.join(dirname, 'database.json'),
      dataGc = path.join(dirname, 'datagc.json'),
      datagame = path.join(dirname, 'datagame.json'),
      bankdb = path.join(dirname, 'bank.json')

let init = (() => {
  const load = (file, def = { key: {} }) => {
    if (!fs.existsSync(file))
      return fs.writeFileSync(file, JSON.stringify(def, null, 2)), def

    try {
      const data = JSON.parse(fs.readFileSync(file))
      return data ? data : (fs.writeFileSync(file, JSON.stringify(def, null, 2)), def)
    } catch (e) {
      console.error(`${path.basename(file)} rusak`, e)
      fs.writeFileSync(file, JSON.stringify(def, null, 2))
      return def
    }
  }

  const inBank = () => load(bankdb, { key: { saldo: 0, tax: '12%' } }),
        gm = () => load(datagame, { key: { farm: {} } })

  return {
    db: load(database),
    gc: load(dataGc),
    gm: gm(),
    bnk: inBank()
  }
})()

const db = () => init.db,
      gc = () => init.gc,
      gm = () => init.gm,
      bnk = () => init.bnk

const getUsr = jid => Object.values(db().key).find(u => u.jid === jid)

const getGc = chat => gc()?.key && Object.values(gc().key).find(g => String(g?.id) === String(chat.id)) || null

// ==========================================
// OPTIMASI DATABASE: Auto-Save Interval
// ==========================================
let needSaveDb = !1,
    needSaveGc = !1,
    needSaveGm = !1

const save = {
  db() { needSaveDb = !0 },
  gc() { needSaveGc = !0 },
  gm() { needSaveGm = !0 }
}

setInterval(async () => {
  if (needSaveDb) {
    try {
      await fs.promises.writeFile(database, JSON.stringify(init.db, null, 2))
      needSaveDb = !1
    } catch (e) { if(typeof erl !== 'undefined') erl(e, 'save.db') }
  }
  if (needSaveGc) {
    try {
      await fs.promises.writeFile(dataGc, JSON.stringify(init.gc, null, 2))
      needSaveGc = !1
    } catch (e) { if(typeof erl !== 'undefined') erl(e, 'save.gc') }
  }
  if (needSaveGm) {
    try {
      await fs.promises.writeFile(datagame, JSON.stringify(init.gm, null, 2))
      needSaveGm = !1
    } catch (e) { if(typeof erl !== 'undefined') erl(e, 'save.gm') }
  }
}, 60000) 
// ==========================================

const listRole = [
  'Gak Kenal',
  'Baru Kenal',
  'Temen Biasa',
  'Temen Ngobrol',
  'Temen Gosip',
  'Temen Lama',
  'Temen Hangout',
  'Temen Dekat',
  'Temen Akrab',
  'Temen Baik',
  'Sahabat',
  'Pacar',
  'Soulmate'
]

const role = jid => {
  const user = getUsr(jid)
  if (!user?.ai) return

  const exp = user.exp || 0,
        maxExp = 2000,
        len = listRole.length,
        step = maxExp / len,
        idx = Math.min(len - 1, Math.floor(exp / step)),
        newRole = listRole[idx]

  user.ai.role !== newRole && (
    user.ai.role = newRole,
    !0
  )
}

const randomId = m => {
  const chat = global.chat(m),
        letters = 'abcdefghijklmnopqrstuvwxyz',
        pick = s => Array.from({ length: 5 }, () => s[Math.floor(Math.random() * s.length)]),
        jid = chat.sender?.replace(/@s\.whatsapp\.net$/, ''),
        base = [...pick(letters), ...jid.slice(-4)]

  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }

  return base.join('')
}

const authUser = async (m) => {
  try {
    const chat = global.chat(m),
          group = !!chat?.group,
          e = o => Object.values(o || {}).some(u => u.jid === chat.sender),
          time = global.time.timeIndo("Asia/Jakarta", "DD-MM-YYYY")

    if (
      !chat.sender?.endsWith('@s.whatsapp.net') ||
      (group && chat.sender && chat.sender !== chat.sender)
    ) return

    const nama = chat.pushName?.trim().slice(0, 20) || 'Petualang'

    // 1. Simpan ke JSON Lokal (Jika belum terdaftar)
    if (!e(db().key)) {
      let k = nama, i = 1
      while (db().key[k]) k = `${nama}_${i++}`

      db().key[k] = {
        jid: chat.sender,
        noId: randomId(m),
        acc: time,
        ban: !1,
        cmd: 0,
        exp: 0,
        moneyDb: {
          money: 2e5,
          moneyInBank: 0
        },
        ai: {
          bell: !1,
          chat: 0,
          role: listRole[0]
        },
        afk: {
          status: !1,
          reason: '',
          afkStart: ''
        },
        game: {
          farm: !1,
          dead: !1,
          robbery: {
            cost: 3
          },
          buff: {},
          debuff: {}
        }
      }
      save.db()
    }

    // 2. ✨ INTEGRASI SUPABASE CLOUD ✨
    // Menyinkronkan data pengguna secara background ke Supabase.
    // ignoreDuplicates: true memastikan data lama di cloud tidak keriset.
    try {
      await supabase.from('users').upsert([{ jid: chat.sender, name: nama }], { onConflict: 'jid', ignoreDuplicates: true })
      await supabase.from('inventory').upsert([{ jid: chat.sender }], { onConflict: 'jid', ignoreDuplicates: true })
      await supabase.from('game_stats').upsert([{ jid: chat.sender }], { onConflict: 'jid', ignoreDuplicates: true })
    } catch (err) {
      // Abaikan error jika koneksi sedang bermasalah agar bot tetap berjalan
    }

  } catch (e) {
    console.error('error pada authUser', e)
  }
}

const authFarm = async m => {
  try {
    const chat = global.chat(m),
          userDb = getUsr(chat.sender),
          gameDb = Object.values(gm().key.farm).find(u => u.jid === chat.sender),
          group = !!chat?.group,
          time = global.time.timeIndo("Asia/Jakarta", "DD-MM-YYYY HH:mm:ss"),
          nama = chat.pushName?.trim().slice(0, 20),
          costMny =
            (userDb?.moneyDb?.money ?? 0) +
            (userDb?.moneyDb?.moneyInBank ?? 0)

    if (
      !chat.sender?.endsWith('@s.whatsapp.net') ||
      gameDb
    ) return

    let k = nama, i = 1
    while (gm().key.farm[k]) k = `${nama}_${i++}`

    gm().key.farm[k] = {
      jid: chat.sender,
      set: time,
      exp: userDb?.exp || 0,
      moneyDb: {
        money: costMny
      }
    }

    save.gm()
  } catch (e) {
    console.log('error pada authFarm', e)
  }
}

export {
  init,
  db,
  gc,
  gm,
  bnk,
  authFarm,
  getGc,
  save,
  role,
  randomId,
  authUser
}
