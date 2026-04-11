import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { bell } from '../cmd/interactive.js'
// import { bnk } from './db/data.js' // <-- Hapus karena sudah pakai Supabase
import { tmpFiles } from './tmpfiles.js'

// ☁️ IMPORT KONEKSI SUPABASE
import supabase from './db/supabase.js'

const memoryCache = {},
      groupCache = new Map(),
      spamData = {}

let imgCache = {}

// ==========================================
// 🚀 SISTEM CACHE SUPABASE (ANTI-DELAY)
// Menyimpan data di RAM secara sementara agar tidak spam request API
// ==========================================
const dbGroupCache = new Map()
const dbUserCache = new Map()

async function getGroupDataSupa(id) {
    if (dbGroupCache.has(id)) return dbGroupCache.get(id)
    
    let { data } = await supabase.from('groups').select('*').eq('id', id).single()
    if (!data) {
        // Jika belum ada di Supabase, buat default
        data = { id, antilink: false, welcome: false, mute: false }
        await supabase.from('groups').insert([data])
    }
    
    dbGroupCache.set(id, data)
    return data
}

async function getUserDataSupa(id) {
    if (dbUserCache.has(id)) return dbUserCache.get(id)
    
    let { data } = await supabase.from('users').select('*').eq('id', id).single()
    if (!data) {
        data = { id, money: 1000, bank: 0, exp: 0, role: 'Warga', afk_status: false, afk_reason: '', afk_start: '' }
        await supabase.from('users').insert([{ id, money: 1000 }])
    }
    
    dbUserCache.set(id, data)
    return data
}
// ==========================================

async function getMetadata(id, xp, retry = 2) {
  if (groupCache.has(id)) return groupCache.get(id)
  try {
    const m = await xp.groupMetadata(id)
    groupCache.set(id, m)
    setTimeout(() => groupCache.delete(id), 12e4)
    return m
  } catch (e) {
    return retry > 0
      ? (await new Promise(r => setTimeout(r, 1e3)), getMetadata(id, xp, retry - 1))
      : null
  }
}

async function saveLidCache(metadata) {
  for (const p of metadata?.participants || []) {
    const phone = p.phoneNumber?.replace(/@.*/, ""),
          lid = p.id?.endsWith("@lid") ? p.id : null
    if (phone && lid) global.lidCache[phone] = lid
  }
}

function replaceLid(o, v = new WeakSet()) {
  if (!o) return o
  if (typeof o == "object") {
    if (v.has(o)) return o
    v.add(o)
    if (Array.isArray(o)) return o.map(i => replaceLid(i, v))
    if (Buffer.isBuffer(o) || o instanceof Uint8Array) return o
    for (const k in o) o[k] = replaceLid(o[k], v)
    return o
  }
  if (typeof o == "string") {
    const e = Object.entries(global.lidCache ?? {})
    if (/@lid$/.test(o)) {
      const p = e.find(([, v]) => v === o)?.[0]
      if (p) return `${p}@s.whatsapp.net`
    }
    return o
      .replace(/@(\d+)@lid/g, (_, i) => {
        const p = e.find(([, v]) => v === `${i}@lid`)?.[0]
        return p ? `@${p}` : `@${i}@lid`
      })
      .replace(/@(\d+)(?!@)/g, (m, l) => {
        const p = e.find(([, v]) => v === `${l}@lid`)?.[0]
        return p ? `@${p}` : m
      })
  }
  return o
}

async function call(xp, e, m) {
  // Biarkan sama seperti aslinya
  try {
    const err = (typeof e === 'string' ? e : e?.stack || e?.message || String(e)).replace(/file:\/\/\/[^\s)]+/g, '').replace(/at\s+/g, '\n→ ').trim(),
          chat = global.chat(m),
          txt = `Tolong bantu jelaskan error ini dengan bahasa alami dan ramah pengguna:\n\n${e}`,
          res = await bell(txt, m, xp)

    res?.msg ? await xp.sendMessage(chat.id, { text: res.msg }, { quoted: m }) : await xp.sendMessage(chat.id, { text: `Gagal memproses error: ${res?.message || 'tidak diketahui'}` }, { quoted: m })
  } catch (errSend) {
    await xp.sendMessage(m?.chat || m?.key?.remoteJid || 'unknown', { text: `Gagal menjalankan call(): ${errSend?.message || String(errSend)}` }, { quoted: m })
  }
}

const cleanMsg = obj => {
  if (obj == null) return
  if (Array.isArray(obj)) {
    const arr = obj.map(cleanMsg).filter(v => v !== undefined)
    return arr.length ? arr : undefined
  }
  if (typeof obj === 'object') {
    if (Buffer.isBuffer(obj) || ArrayBuffer.isView(obj)) return obj
    const cleaned = Object.entries(obj).reduce((acc, [k, v]) => {
      const c = cleanMsg(v)
      if (c !== undefined) acc[k] = c
      return acc
    }, {})
    return Object.keys(cleaned).length ? cleaned : undefined
  }
  return obj
}

async function func() {
  const url = 'https://raw.githubusercontent.com/MaouDabi0/Dabi-Ai-Documentation/main/assets/func.js',
        code = await fetch(url).then(r => r.text()),
        data = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64'),
        md = await import(data),
        funcs = md.default

  return Object.assign(global, funcs), funcs
}

async function filter(xp, m, text) {
  const chat = global.chat(m)
  
  // 🔥 AMBIL DATA DARI SUPABASE CACHE (MENGHINDARI DELAY fs.readFileSync)
  const gcData = chat.group ? await getGroupDataSupa(chat.id) : null
  const meta = await grupify(xp, m)

  if (!meta) return

  const { usrAdm, botAdm } = meta

  const filter = {
    link: async t => typeof t == 'string' && /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]{20,24}/i.test(t.trim().replace(/\s+/g, '').replace(/\/{2,}/g, '/')),
    linkCh: async t => typeof t == 'string' && /(?:https?:\/\/)?whatsapp\.com\/channel\/[A-Za-z0-9]+/i.test(t.trim().replace(/\s+/g, '').replace(/\/{2,}/g, '/')),

    antiLink: async () => {
      const txt = m.message?.extendedTextMessage?.text || m.message?.conversation || ''
      if (!gcData || !botAdm) return !1

      const isLink = await filter.link(txt)
      
      // Menggunakan gcData.antilink (kolom Supabase)
      if (gcData.antilink && botAdm && !usrAdm && isLink) {
        const senderJid = m.key.participant || m.participant

        await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
        await xp.groupParticipantsUpdate(chat.id, [senderJid], 'remove').catch(() => {})

        return !0 
      }
      return !1
    },
    
    antiBadSticker: async () => {
        // Untuk stiker bisa kamu sesuaikan strukturnya di Supabase nanti
        return !1
    },

    antiTagSw: async () => {
      const isStatusMention = m.message?.groupStatusMentionMessage
      if (!gcData || !botAdm) return !1

      // Sesuaikan nama kolom jika ada antitagsw di Supabase
      if (gcData.antitagsw && botAdm && !usrAdm && isStatusMention) {
        const senderJid = m.key.participant || m.participant

        await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
        await xp.sendMessage(chat.id, { 
          text: `🚫 *ANTI TAG STATUS*\n\n@${senderJid.split('@')[0]} otomatis dikeluarkan dari grup karena mengirim Tag Status Broadcast.`,
          mentions: [senderJid]
        }).catch(() => {})
        await xp.groupParticipantsUpdate(chat.id, [senderJid], 'remove').catch(() => {})

        return !0 
      }
      return !1
    },

    badword: async () => { return !1 },
    antiCh: async () => { return !1 },
    antitag: async () => { return !1 }
  }

  return filter
}

async function cekSpam(xp, m) {
  const chat = global.chat(m)

  if (chat.group) {
      // Cek langsung dari memory cache apakah grup terdaftar
      const isRegistered = dbGroupCache.has(chat.id)
      
      const senderNum = chat.sender?.split('@')[0] || ''
      const ownerNum = [].concat(global.ownerNumber || []).map(n => n?.replace(/[^0-9]/g, ''))
      const isOwner = ownerNum.includes(senderNum)

      const text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || ''
      const txtLow = text.toLowerCase()
      
      const isDaftarCmd = txtLow.includes('daftargc') || txtLow.includes('daftargrup') || txtLow.includes('sewa')

      if (!isRegistered && !isDaftarCmd && !isOwner) return !0 
  }

  const user = m.key.participant || chat.sender
  const now = Date.now()
  const target = m.key?.jadibot ? user + '.jadibot' : user

  if (!spamData[target]) {
    return spamData[target] = { count: 1, time: { last: now } }, !1
  }

  const diff = now - spamData[target].time.last

  if (diff <= 1e3) {
    spamData[target].count++
    spamData[target].time.last = now

    if (spamData[target].count >= 2) {
      await xp.sendMessage(chat.id, { text: 'jangan spam' }, { quoted: m })
      return spamData[target].count = 0, !0
    }
    return !1
  }

  return diff >= 5e3
    ? (spamData[target] = { count: 1, time: { last: now } }, !1)
    : (spamData[target].time.last = now, !1)
}

async function _imgTmp() {
  if (!fs.existsSync('./system/set/thumb-dabi.png')) return

  const img = fs.readFileSync('./system/set/thumb-dabi.png')

  if (!img || imgCache.url) {
    if (!img) return

    const res = imgCache.url ? await fetch(imgCache.url,{method:'HEAD'}).catch(_=>!1) : null
    if (res && res.ok) return imgCache.url
    if (imgCache.url) delete imgCache.url
  }

  return imgCache.url = await tmpFiles(img)
}

async function afk(xp, m) {
  if (!m?.key || m.key.fromMe) return
  const chat = global.chat(m)
  if (!chat.group) return

  const sender = chat.sender
  const self = await getUserDataSupa(sender) // 🔥 Menggunakan Supabase
  
  const ctx = m.message?.extendedTextMessage?.contextInfo
  const target = Array.isArray(ctx?.mentionedJid) ? ctx.mentionedJid[0] : ctx?.participant
  
  let targetUser = null
  if (target) targetUser = await getUserDataSupa(target)

  const now = global.time.timeIndo('Asia/Jakarta', 'DD-MM HH:mm:ss')
  const calc = a => {
      if (!a?.afk_start) return 'baru saja'
      const [d, mo, h, mi, s] = a.afk_start.match(/\d+/g).map(Number),
            [nd, nmo, nh, nmi, ns] = now.match(/\d+/g).map(Number),
            diff = ((new Date(new Date().getFullYear(), nmo - 1, nd, nh, nmi, ns) -
                    new Date(new Date().getFullYear(), mo - 1, d, h, mi, s)) / 1e3) | 0
      return diff < 8.64e4 ? diff < 60 ? 'baru saja' : diff < 3.6e3 ? `${(diff / 60 | 0)} menit yang lalu` : `${(diff / 3.6e3 | 0)} jam yang lalu` : `${(diff / 8.64e4 | 0)} hari yang lalu`
  }

  if (targetUser?.afk_status) return xp.sendMessage(chat.id, { text: `jangan tag dia, dia sedang afk\nWaktu AFK: ${calc(targetUser)}` }, { quoted: m })

  if (!self?.afk_status) return

  const reason = self.afk_reason || 'tidak ada alasan',
        dur = calc(self),
        tag = !m?.message,
        text = tag ? `@${sender.split('@')[0]} kembali dari AFK: "${reason}"\nWaktu AFK: ${dur}` : `Kamu kembali dari AFK: "${reason}"\nWaktu AFK: ${dur}`

  // Update AFK status di Supabase & Cache
  self.afk_status = false
  self.afk_reason = ''
  self.afk_start = ''
  dbUserCache.set(sender, self)
  
  await supabase.from('users').update({ afk_status: false, afk_reason: null, afk_start: null }).eq('id', sender)

  return xp.sendMessage(chat.id, { text, ...(tag ? { mentions: [sender] } : {}) }, { quoted: m })
}

async function _tax(xp, m) {
  const chat = global.chat(m),
        usrDb = await getUserDataSupa(chat.sender), // 🔥 Menggunakan Supabase
        taxStr = '0%', // Bisa kamu hubungkan ke tabel setting di Supabase nanti
        tax = parseInt(taxStr.replace('%', '')) || 0,
        money = usrDb?.money || 0

  return Math.floor(money * tax / 100)
}

async function filterMsg(m, chat, text) {
  // Biarkan sama seperti aslinya
  global.cacheCmd ??= []
  if (!chat?.group || !text) return !0

  const id = m.key.remoteJid,
        no = chat.sender,
        jadibot = 'jadibot' in (m.key || {}),
        time = m.messageTimestamp,
        cacheMsg = { id, no, jadibot, text, time },
        same = global.cacheCmd.find(v => v.id === id && v.no === no && v.text === text && v.time === time)

  if (same) {
    if (same.jadibot && !jadibot) global.cacheCmd = global.cacheCmd.filter(v => v !== same)
    else if (!same.jadibot && jadibot) return !1
    if (!same.jadibot && jadibot) return !1
    if (same.jadibot && !jadibot) global.cacheCmd = global.cacheCmd.filter(v => v !== same)
    else if (same.jadibot && jadibot) {
      if (Math.random() < 5e-1) return !1
      global.cacheCmd = global.cacheCmd.filter(v => v !== same)
    } else return !1
  }

  if (!same && jadibot) {
    global.cacheCmd.push(cacheMsg)
    return await new Promise(resolve => {
      setTimeout(() => {
        const mainExists = global.cacheCmd.find(v => v.id === id && v.no === no && v.text === text && v.time === time && !v.jadibot)
        if (mainExists ? !0 : !1) {
          global.cacheCmd = global.cacheCmd.filter(v => v !== cacheMsg)
          return resolve(!1)
        }
        resolve(!0)
      }, 5e1)
    })
  }

  global.cacheCmd.push(cacheMsg)
  setTimeout(() => {
    global.cacheCmd = global.cacheCmd.filter(v => !(v.id === id && v.no === no && v.time === time))
  }, 3e5)

  return !0
}

export {
  getMetadata,
  replaceLid,
  saveLidCache,
  call,
  cleanMsg,
  groupCache,
  imgCache,
  func,
  filter,
  cekSpam,
  afk,
  filterMsg,
  _imgTmp,
  _tax,
  getGroupDataSupa, // Export cache helper jika dibutuhkan di file lain
  getUserDataSupa
}
