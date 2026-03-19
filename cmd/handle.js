import c from "chalk"
import fs from "fs"
import p from "path"
import EventEmitter from "events"
import getMessageContent from '../system/msg.js'
import { authUser, role } from '../system/db/data.js'
import { own } from '../system/helper.js'
import { cekSpam, _tax } from '../system/function.js'
import { ocrs } from './ocrs.js'
import { pathToFileURL } from "url"

const dirs = [
    p.join(dirname, "../cmd/command"),
    p.join(dirname, "../cmd/detector")
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
          err(c.redBright.bold(`Error ${def.name || c2}: `), e)
        }
      }

      super.on(lc, handler)
      def.handlers.set(lc, handler)
    }

    ;(this.cmd ??= []).push(def)
  }
}

const ev = new CmdEmitter()

const unloadFile = file => {
  if (!file || !ev.cmd) return

  const targets = ev.cmd.filter(x => x.file === file)
  if (!targets.length) return

  for (const t of targets) {
    if (t.handlers?.size) {
      for (const [cmd, fn] of t.handlers)
        ev.removeListener(cmd, fn)
    }
  }

  ev.cmd = ev.cmd.filter(x => x.file !== file)
}

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

  // Tampilan log terminal yang lebih keren dan rapi
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
          log(c.cyanBright.bold(`${f} diedit`))
          loadFile({ file: f, dir: d }, true)
        }, 300)
      })
    } catch {
      for (const f of fs.readdirSync(d).filter(x => x.endsWith(".js"))) {
        fs.watchFile(p.join(d, f), () => {
          log(c.cyanBright.bold(`${f} diedit`))
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

    // 1. Definisikan chat lebih awal agar bisa dikirim ke event detector
    const chat = global.chat(m)

    // 2. Pancarkan event 'message' untuk semua file detector sebelum pengecekan command
    ev.emit('message', xp, m, { chat, text, store })

    const bank = JSON.parse(fs.readFileSync(p.join(dirname, './db/bank.json'), 'utf-8')),
          pfx = [].concat(global.prefix),
          pre = pfx.find(p => text.startsWith(p)) || '',
          cmdText = pre ? text.slice(pre.length).trim() : text.trim(),
          [cmd, ...args] = cmdText.split(/\s+/),
          _cmdLow = cmd?.toLowerCase()
          
    // 3. Hentikan eksekusi command jika bukan command (event 'message' untuk detector sudah jalan di atas)
    if (!_cmdLow) return
    if (await ocrs(xp, m)) return

    const sender = chat.sender?.replace(/@s\.whatsapp\.net$/, ''),
          usr = Object.values(db().key).find(u => u.jid === chat.sender),
          ownerNum = [].concat(global.ownerNumber).map(n => n?.replace(/[^0-9]/g, '')),
          evData = ev.cmd?.find(e =>
            e.name?.toLowerCase() === _cmdLow ||
            e.cmd?.some(c => c.toLowerCase() === _cmdLow)
          )

    if (!evData || ((evData.prefix ?? !0) ? !pre : pre)) return

    // ==========================================
    // SISTEM BLOKIR GRUP TIDAK TERDAFTAR (SILENT)
    // ==========================================
    if (chat.group) {
      const isRegistered = !!getGc(chat) // Cek apakah grup ada di database
      
      // Jika grup BELUM terdaftar, dan command BUKAN 'daftargc', dan BUKAN command khusus Owner
      if (!isRegistered && !['daftargc', 'daftargrup'].includes(_cmdLow) && !evData.owner) {
        return // Langsung hentikan eksekusi tanpa mengirim pesan apapun (Silent)
      }
    }
    // ==========================================

    let sub = null

    if (evData.ocrs?.length && args[0]) {
      const check = args[0].toLowerCase()
      if (evData.ocrs.includes(check)) {
        sub = check
        args.shift()
      }
    }

    await authUser(m)

    if (!usr ? (xp.sendMessage(chat.id, { text: 'ulangi' }, { quoted: m }), true) : ((!global.public || evData.owner) && !ownerNum.includes(sender)) ? true : await cekSpam(xp, m)) return

    const exp = evData.exp ?? 0.1,
          expInt = Math.round(exp * 10)

    let needSv = !1,
        cost = evData.money

    if (usr) {
      usr.cmd = (usr.cmd || 0) + 1
      usr.exp = (usr.exp || 0) + expInt
      role()
      needSv = !0
    }

    if (!cost || cost <= 0) cost = await _tax(xp, m)

    if (cost > 0) {
      if ((usr.moneyDb?.money || 0) < cost)
        return xp.sendMessage(chat.id, { text: `uang kamu tersisa Rp ${usr.moneyDb.money.toLocaleString('id-ID')}\n` + `butuh: Rp ${cost.toLocaleString('id-ID')}` }, { quoted: m })

      usr.moneyDb.money -= cost
      bank.key.saldo += cost

      fs.writeFileSync(
        p.join(dirname, './db/bank.json'),
        JSON.stringify(bank, null, 2),
        'utf-8'
      )

      needSv = !0
    }

    needSv && await save.db()
    
    await xp.sendPresenceUpdate('composing', chat.id).catch(() => {})

    ev.emit(_cmdLow, xp, m, {
      args,
      chat,
      text,
      cmd: _cmdLow,
      prefix: pre,
      ocrs: sub,
      store
    })
  } catch (e) {
    err('error pada handleCmd', e)
  }
}

watch()
export { handleCmd, loadAll, ev }

