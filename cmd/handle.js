import c from "chalk"
import fs from "fs"
import p from "path"
import EventEmitter from "events"
import getMessageContent from '../system/msg.js'
import { authUser, role } from '../system/db/data.js' // Nanti ini juga harus kita rombak
import { own } from '../system/helper.js'
import { cekSpam, _tax } from '../system/function.js'
import { ocrs } from './ocrs.js'
import { pathToFileURL } from "url"

// ☁️ IMPORT SUPABASE YANG BARU DIBUAT
import supabase from '../system/db/supabase.js' 

const dirs = [
    p.join(process.cwd(), "./cmd/command")
]

const _idCmd = def => {
  const fl = def.file || 'unknown',
        name = (def.name || 'noname')
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .join('+'),
        cmds = []
          .concat(def.cmd || [])
          .map(x => x.toLowerCase())
          .sort()
          .join('+')

  return `file=${fl}&name=${name}&cmd=${cmds}`
}

class CmdEmitter extends EventEmitter {
  on(def, listener) {
    if (typeof def !== "object" || !def.cmd || !def.run)
      return super.on(def, listener)

    def.name && (this.pluginName = def.name)

    const cmds = Array.isArray(def.cmd) ? def.cmd : [def.cmd]

    def.file ??= global.lastCmdUpdate?.file
    def.call ??= 0
    def.set ??= Date.now()
    def.id ??= _idCmd(def)
    def.handlers ??= new Map()

    for (const c2 of cmds) {
      const lc = c2.toLowerCase()

      const handler = async (xp, m, extra) => {
        try {
          if (def.owner && !own(m)) return
          def.call += 1
          await def.run(xp, m, extra)
        } catch (e) {
          console.error(c.redBright.bold(`Error ${def.name || c2}: `), e)
        }
      }

      super.on(lc, handler)
      def.handlers.set(lc, handler)
    }

    ;(this.cmd ??= []).push(def)
  }
}

const ev = new CmdEmitter()

const loadFile = async (obj, reload = true) => {
  try {
    const { file: f, dir } = obj
    const fp = p.join(dir, f)

    const mod = await import(fp + `?v=${Date.now()}`)
    mod.default(ev)

  } catch (e) {
    console.log('file error', obj.file)
    console.error('detail error:', e)
  }
}

const loadAll = async () => {
  for (const d of dirs) {
    const files = fs.readdirSync(d).filter(x => x.endsWith(".js"))

    for (const f of files) {
      await loadFile({ file: f, dir: d }, true)
    }
  }

  const cmds = ev.cmd?.map(x => x.name) || []
  const total = cmds.length

  console.log(
    c.cyanBright.bold(`\n╭─── [ 🚀 C O D E _ B O T   C M D ] ───⬣\n`) +
    c.whiteBright(`│ `) + c.greenBright(`Total     : `) + c.yellowBright.bold(`${total} Commands Terdaftar\n`) +
    c.whiteBright(`│ `) + c.greenBright(`Commands  : `) + c.white(cmds.join(c.magenta(' • '))) +
    c.cyanBright.bold(`\n╰────────────────────────────────────────⬣\n`)
  )
}

const watch = () => {
  const Deb_timer = {}

  for (const d of dirs) {
    try {
      fs.watch(d, (_, f) => {
        if (!f?.endsWith(".js")) return
        clearTimeout(Deb_timer[f])
        Deb_timer[f] = setTimeout(() => {
          console.log(c.cyanBright.bold(`${f} diedit`))
          loadFile({ file: f, dir: d }, true)
        }, 300)
      })
    } catch {
      for (const f of fs.readdirSync(d).filter(x => x.endsWith(".js"))) {
        fs.watchFile(p.join(d, f), () => {
          console.log(c.cyanBright.bold(`${f} diedit`))
          loadFile({ file: f, dir: d }, true)
        })
      }
    }
  }
}

const handleCmd = async (m, xp, store) => {
  try {
    const { text } = getMessageContent(m)
    if (!text || !m.key) return

    const chat = global.chat(m)
    
    // ==========================================
    // ✨ CCTV TRACKER SILENT READER (Diubah ke Supabase)
    // ==========================================
    if (chat.group && chat.sender) {
        const waktuAsli = m.messageTimestamp ? (m.messageTimestamp * 1000) : Date.now()
        // Langsung tembak ke cloud tanpa await (anti delay)
        supabase.from('users').update({ last_chat: waktuAsli }).eq('id', chat.sender).then()
    }
    // ==========================================

    ev.emit('message', xp, m, { chat, text, store })

    // HAPUS PEMBACAAN bank.json DARI SINI
    // const bank = JSON.parse(fs.readFileSync(p.join(dirname, './db/bank.json'), 'utf-8'))

    const pfx = [].concat(global.prefix),
          pre = pfx.find(p => text.startsWith(p)) || '',
          cmdText = pre ? text.slice(pre.length).trim() : text.trim(),
          [cmd, ...args] = cmdText.split(/\s+/),
          _cmdLow = cmd?.toLowerCase()
          
    if (!_cmdLow) return
    if (await ocrs(xp, m)) return

    const sender = chat.sender?.replace(/@s\.whatsapp\.net$/, ''),
          ownerNum = [].concat(global.ownerNumber).map(n => n?.replace(/[^0-9]/g, '')),
          evData = ev.cmd?.find(e =>
            e.name?.toLowerCase() === _cmdLow ||
            e.cmd?.some(c => c.toLowerCase() === _cmdLow)
          )

    if (!evData || ((evData.prefix ?? !0) ? !pre : pre)) return

    let sub = null

    if (evData.ocrs?.length && args[0]) {
      const check = args[0].toLowerCase()
      if (evData.ocrs.includes(check)) {
        sub = check
        args.shift()
      }
    }

    // ==========================================
    // ☁️ SUPABASE: AMBIL DATA USER
    // ==========================================
    let { data: usr, error } = await supabase.from('users').select('*').eq('id', chat.sender).single()
    
    // Jika belum terdaftar di database Supabase, daftarkan otomatis
    if (!usr) {
        const { data: newUser } = await supabase.from('users')
            .insert([{ id: chat.sender, money: 1000, bank: 0, exp: 0 }])
            .select().single()
        usr = newUser
    }

    // Cek apakah bukan owner
    if (((!global.public || evData.owner) && !ownerNum.includes(sender)) ? true : await cekSpam(xp, m)) return

    const exp = evData.exp ?? 0.1,
          expInt = Math.round(exp * 10)

    let cost = evData.money

    if (usr) {
      usr.exp = (usr.exp || 0) + expInt
      // role() // Harus disesuaikan karena pakai data Supabase
    }

    if (!cost || cost <= 0) cost = await _tax(xp, m)

    if (cost > 0) {
      if ((usr.money || 0) < cost)
        return xp.sendMessage(chat.id, { text: `⚠️ Uang kamu tersisa Rp ${(usr.money||0).toLocaleString('id-ID')}\nButuh: Rp ${cost.toLocaleString('id-ID')}` }, { quoted: m })

      // Update Saldo User ke Supabase
      usr.money -= cost
      await supabase.from('users').update({ 
          money: usr.money, 
          exp: usr.exp 
      }).eq('id', chat.sender)
    } else {
      // Update Exp doang kalau command gratis
      await supabase.from('users').update({ exp: usr.exp }).eq('id', chat.sender)
    }

    // save.db() <-- HAPUS INI KARENA UDAH PAKAI SUPABASE
    
    await xp.sendPresenceUpdate('composing', chat.id).catch(() => {})

    ev.emit(_cmdLow, xp, m, {
      args,
      chat,
      text,
      cmd: _cmdLow,
      prefix: pre,
      ocrs: sub,
      store,
      dbUser: usr // Pass data dari supabase ke fungsi command
    })
  } catch (e) {
    console.error('error pada handleCmd', e)
  }
}

watch()
export { handleCmd, loadAll, ev }
