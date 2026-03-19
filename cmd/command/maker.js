import axios from 'axios'
import fd from 'form-data'
import fs from 'fs'
import path from 'path'
import { spawn, exec } from 'child_process'
import { downloadMediaMessage } from 'baileys'
import { writeExifImg, writeExifVid, mediaMessage } from '../../system/exif.js'

export default function maker(ev) {
  ev.on({
    name: 'brat',
    cmd: ['brat'],
    tags: 'Maker Menu',
    desc: 'membuat stiker brat',
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
              txt = args.join(' ') || quoted?.conversation,
              name = chat.pushName.replace(/\s+/g, '').toLowerCase(),
              time = global.time.timeIndo("Asia/Jakarta", "HH"),
              url = `https://aqul-brat.hf.space/api/brat?text=${encodeURIComponent(txt)}`

        if (!txt) return xp.sendMessage(chat.id, { text: 'masukan teks atau reply text yang akan dijadikan brat' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const temp = path.join(dirname, '../temp'),
              input = path.join(temp, `input_${name}_${time}.png`),
              output = path.join(temp, `output_${name}_${time}.webp`)

        let data
        try {
          data = (await axios.get(url, { responseType: 'arraybuffer' })).data
        } catch {
          return xp.sendMessage(chat.id, { text: 'gagal mengambil data dari API brat' }, { quoted: m })
        }

        if (!data) return xp.sendMessage(chat.id, { text: 'gagal mengambil data' }, { quoted: m })

        try {
          fs.writeFileSync(input, data)
        } catch {
          return xp.sendMessage(chat.id, { text: 'gagal menyimpan file brat' }, { quoted: m })
        }

        const ff = spawn('ffmpeg', [
          '-i', input,
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease',
          '-c:v', 'libwebp',
          '-lossless', '1',
          output
        ])

        ff.on('close', async code => {
          if (code !== 0) {
            return xp.sendMessage(chat.id, { text: 'gagal memproses gambar brat (ffmpeg error)' }, { quoted: m })
          }

          let final
          try {
            final = await writeExifImg(fs.readFileSync(output), {
              packname: `${botName}`,
              author: `${name}`
            })
          } catch (e) {
            log('error pada metadata', e)
          }

          await xp.sendMessage(chat.id, { sticker: fs.readFileSync(final) }, { quoted: m })

          ;[input, output, final].forEach(p => fs.existsSync(p) && fs.unlinkSync(p))
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  // ==========================================
  // FAKE GROUP ANDROID (Pemisah Tanda Kutip "")
  // ==========================================
  ev.on({
    name: 'fake group',
    cmd: ['fakegroup', 'fakegroupandroid', 'fgandroid', 'fga'],
    tags: 'Maker Menu',
    desc: 'membuat gambar fake group whatsapp android',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        let text = args.join(" ").trim()
        let imageUrl = null

        const urlMatch = text.match(/https?:\/\/\S+/)
        if (urlMatch) {
          imageUrl = urlMatch[0]
          text = text.replace(imageUrl, "").trim()
        }

        // Ambil teks di dalam tanda kutip ""
        const arr = [...text.matchAll(/"([^"]+)"/g)].map(v => v[1])
        
        if (arr.length < 4) {
          return await xp.sendMessage(chat.id, { 
            text: `⚠️ *Format penggunaan :*\n📍 *Parameter:* "Nama Group" "member" "deskripsi" "tanggal"\n\n💬 *Contoh 1:*\n${prefix}${cmd} "GB ISIAN ZI'X X AWENK || GB 1" "941" "?" "12/04/25"\n\n💬 *Contoh 2 (Reply/Kirim Gambar):*\n${prefix}${cmd} "Grup Santai" "800" "Welcome" "01/02/26"` 
          }, { quoted: m })
        }

        const [name, members, desc, date] = arr

        await xp.sendMessage(chat.id, { react: { text: "🕒", key: m.key } })

        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const isImageMsg = q?.imageMessage || m.message?.imageMessage

        if (!imageUrl && isImageMsg) {
          const buf = await downloadMediaMessage({ message: q || m.message }, 'buffer')
          if (buf) {
            const f = new fd()
            f.append('files[]', buf, { filename: 'fga.jpg', contentType: 'image/jpeg' })
            const { data } = await axios.post('https://uguu.se/upload.php', f, { headers: f.getHeaders() })
            imageUrl = data?.files?.[0]?.url
          }
        }

        if (!imageUrl) {
          const sender = m.message?.extendedTextMessage?.contextInfo?.participant || chat.sender
          try {
            imageUrl = await xp.profilePictureUrl(sender, "image")
          } catch {
            imageUrl = "https://i.ibb.co/bjpkpXhm/image-1773651795677.jpg"
          }
        }

        if (!imageUrl) throw new Error("Gagal memproses gambar")

        const api = `https://kazztzyy.my.id/api/maker/fakegroup?image=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(name)}&members=${encodeURIComponent(members)}&desc=${encodeURIComponent(desc)}&date=${encodeURIComponent(date)}`

        await xp.sendMessage(chat.id, {
          image: { url: api },
          caption: "*Fake Group Android berhasil dibuat* ✅\n> *Powered By " + global.botName + "*"
        }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: "✅", key: m.key } })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        await xp.sendMessage(chat.id, { react: { text: "❌", key: m.key } })
        await xp.sendMessage(chat.id, { text: `⚠️ Maaf, terjadi kesalahan saat memproses permintaan anda.\n💡 Detail Error: ${e.message}` }, { quoted: m })
      }
    }
  })

  // ==========================================
  // FAKE GROUP IOS/IPHONE (Pemisah Tanda Kutip "")
  // ==========================================
  ev.on({
    name: 'fake group ios',
    cmd: ['fakegroupios', 'fakegroupiphone', 'fgios', 'fgi'],
    tags: 'Maker Menu',
    desc: 'membuat gambar fake group whatsapp iphone',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        let text = args.join(" ").trim()
        let imageUrl = null

        const urlMatch = text.match(/https?:\/\/\S+/)
        if (urlMatch) {
          imageUrl = urlMatch[0]
          text = text.replace(imageUrl, "").trim()
        }

        // Ambil teks di dalam tanda kutip ""
        const arr = [...text.matchAll(/"([^"]+)"/g)].map(v => v[1])
        
        if (arr.length < 2) {
          return await xp.sendMessage(chat.id, { 
            text: `⚠️ *Format penggunaan :*\n📍 *Parameter:* "Nama Group" "jumlah member"\n\n💬 *Contoh 1:*\n${prefix}${cmd} "GB ISIAN ZI'X X AWENK || GB 1" "941"\n\n💬 *Contoh 2 (Reply/Kirim Gambar):*\n${prefix}${cmd} "Keluarga Cemara" "12"` 
          }, { quoted: m })
        }

        const [name, members] = arr

        await xp.sendMessage(chat.id, { react: { text: "🕒", key: m.key } })

        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const isImageMsg = q?.imageMessage || m.message?.imageMessage

        if (!imageUrl && isImageMsg) {
          const buf = await downloadMediaMessage({ message: q || m.message }, 'buffer')
          if (buf) {
            const f = new fd()
            f.append('files[]', buf, { filename: 'fgi.jpg', contentType: 'image/jpeg' })
            const { data } = await axios.post('https://uguu.se/upload.php', f, { headers: f.getHeaders() })
            imageUrl = data?.files?.[0]?.url
          }
        }

        if (!imageUrl) {
          const sender = m.message?.extendedTextMessage?.contextInfo?.participant || chat.sender
          try {
            imageUrl = await xp.profilePictureUrl(sender, "image")
          } catch {
            imageUrl = "https://i.ibb.co/bjpkpXhm/image-1773651795677.jpg"
          }
        }

        if (!imageUrl) throw new Error("Gagal memproses gambar")

        const api = `https://kazztzyy.my.id/api/maker/fakegroup2?image=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(name)}&members=${encodeURIComponent(members)}`

        await xp.sendMessage(chat.id, {
          image: { url: api },
          caption: "*Fake Group iPhone berhasil dibuat* ✅\n> *Powered By " + global.botName + "*"
        }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: "✅", key: m.key } })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        await xp.sendMessage(chat.id, { react: { text: "❌", key: m.key } })
        await xp.sendMessage(chat.id, { text: `⚠️ Maaf, terjadi kesalahan saat memproses permintaan anda.\n💡 Detail Error: ${e.message}` }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'fake ngl',
    cmd: ['ngl', 'fakengl'],
    tags: 'Maker Menu',
    desc: 'membuat fake ngl',
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
        if (!args.length) return xp.sendMessage(chat.id, { text: 'example: .fakengl halo' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const txt = args.join(' ').trim(),
              emoji = 'whatsapp',
              backgroundColor = 'light',
              url = `${termaiWeb}/api/maker/ngl?text=${encodeURIComponent(txt)}&emoji=${emoji}&backgroundColor=${backgroundColor}&key=${termaiKey}`,
              res = await xp.sendMessage(chat.id, { image: { url }, caption: 'hasil generate', ai: !0 }, { quoted: m })

        res ? !0 : await xp.sendMessage(chat.id, { text: 'gagal membuat fakengl' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'iqc',
    cmd: ['iqc'],
    tags: 'Maker Menu',
    desc: 'membuat quoted chat iphone',
    owner: !1,
    prefix: !0,
    money: 150,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const time = global.time.timeIndo("Asia/Jakarta", "HH:mm"),
              txt = args.join(' ')

        if (!txt?.includes('|')) return xp.sendMessage(chat.id, { text: `contoh penggunaan:\n${prefix}${cmd} text pesan | sim card/catatan\n${prefix}${cmd} halo aku ${botName} | indosat\n${prefix}${cmd} halo aku ${botName} | hari yang cerah` }, { quoted: m })

        const q = txt?.split('|'),
              text = q?.[0]?.trim(),
              crr = q?.[1]?.trim()

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key}})

        let res = await axios.get(`${global.termaiWeb}/api/maker/iqc?text=${encodeURIComponent(text)}&timestamp=${time}&emojiType=ios&statusBarTime=${time}&signal=4&battery=56&carrier=${encodeURIComponent(crr)}&key=${termaiKey}`, {
              responseType: 'arraybuffer'
            }),
            buf = res.data

        await xp.sendMessage(chat.id, { image: buf, caption: `sukses membuat iqc` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'qc',
    cmd: ['qc'],
    tags: 'Maker Menu',
    desc: 'membuat quoted pesan',
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
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              reply  = quoted?.quotedMessage?.conversation,
              user   = quoted?.participant || quoted?.mentionedJid?.[0] || chat.id,
              name   = chat.pushName || m.key?.pushName || m.key.participant,
              defPP  = 'https://c.termai.cc/i0/7DbG.jpg',
              colors = {
                black: '#000000',
                white: '#ffffff',
                darkgrey: '#2F4F4F'
              }

        if (!args.length && !reply) return xp.sendMessage(chat.id, { text: `reply atau masukan teks\ncontoh: .qc white halo dunia\ndaftar warna:\n${Object.keys(colors).join('\n- ')}` }, { quoted: m })

        const [clr, ...rest] = (args.join(' ') || '').split(' '),
              valid = !!colors[clr],
              warna = reply ? (valid ? colors[clr] : colors.white) : (valid ? colors[clr] : !1),
              teks = reply ? (valid ? (rest.join(' ') || reply) : reply) : (valid ? rest.join(' ') : '')

        if (!warna) return xp.sendMessage(chat.id, { text: `masukan warna valid\ncontoh: .qc white halo dunia\ndaftar warna:\n${Object.keys(colors).join('\n- ')}` }, { quoted: m })

        let avatar
        try { avatar = await xp.profilePictureUrl(user, 'image') }
        catch { avatar = defPP }

        const json = {
          type: 'quote',
          format: 'png',
          backgroundColor: warna,
          width: 7e2,
          height: 5.8e2,
          scale: 2,
          messages: [{
            entities: [],
            avatar: !0,
            from: { id: 1, name, photo: { url: avatar } },
            text: teks,
            'm.replyMessage': {}
          }]
        }

        const res = await axios.post('https://bot.lyo.su/quote/generate', json, { headers: { 'Content-Type': 'application/json' } }),
              buff = Buffer.from(res.data.result.image, 'base64'),
              stc  = await writeExifImg(buff, { packname: 'My sticker', author: '© ' + name })

        await xp.sendMessage(chat.id, { sticker: { url: stc } }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'smeme',
    cmd: ['smeme'],
    tags: 'Maker Menu',
    desc: 'Membuat stiker meme dari gambar dengan teks atas dan bawah.',
    owner: !1,
    prefix: !0,
    money: 160,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              img = m.message?.conversation || m.message?.imageMessage?.caption || q?.imageMessage || q?.stickerMessage,
              txt = args?.join(' ')

        if (!img || !txt?.includes('|')) {
          return xp.sendMessage(chat.id, { text: !img ? `reply gambar/stiker\ncontoh: ${prefix + cmd} atas | bawah` : `format salah\ncontoh: ${prefix + cmd} atas | bawah` }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const upUguu = async (buf, name, mime) => {
                const f = new fd()
                f.append('files[]', buf, { filename: name, contentType: mime })

                const { data } = await axios.post(
                  'https://uguu.se/upload.php',
                  f,
                  { headers: f.getHeaders() }
                )

                if (!data?.files?.[0]?.url) throw Error('Upload gagal ke uguu.se')
                return data.files[0].url
              },
              genMemeBuf = async (url, atas, bawah) =>
                Buffer.from(
                  (await axios.get(
                    `https://api.memegen.link/images/custom/${encodeURIComponent(atas)}/${encodeURIComponent(bawah)}.png?background=${encodeURIComponent(url)}`,
                    { responseType: 'arraybuffer' }
                  )).data
                )

        const [atas, bawah] = txt.split('|').map(v => v.trim() || '_'),
              buf = await downloadMediaMessage({ message: q || m.message }, 'buffer')

        if (!buf) throw Error('gagal mendownload media')

        const url = await upUguu(buf, 'smeme.jpg', 'image/jpeg'),
              meme = await genMemeBuf(url, atas, bawah),
              stcPath = await writeExifImg(meme, { packname: `${botName}`, author: `${chat.pushName}` })

        await xp.sendMessage(chat.id, { sticker: fs.readFileSync(stcPath) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'stiker',
    cmd: ['s', 'stiker', 'sticker'],
    tags: 'Maker Menu',
    desc: 'membuat stiker',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              image = quoted?.imageMessage || m.message?.imageMessage,
              video = quoted?.videoMessage || m.message?.videoMessage

        if (!image && !video) return xp.sendMessage(chat.id, { text: 'reply/kirim media dengan caption yang akan dijadikan stiker' }, { quoted: m })

        const media = await downloadMediaMessage({ message: quoted || m.message }, 'buffer')
        if (!media) throw new Error('error saat download media')

        const pack = { packname: footer, author: chat.pushName },
              Spath = image
                ? await writeExifImg(media, pack)
                : await writeExifVid(media, pack)

        if (!Spath) throw new Error('gagal membuat stiker')

        await xp.sendMessage(chat.id, { sticker: fs.readFileSync(Spath) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to img',
    cmd: ['toimg'],
    tags: 'Maker Menu',
    desc: 'konversi stiker ke gambar ( kecuali stiker animasi )',
    owner: !1,
    prefix: !0,
    money: 150,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              stiker = quoted?.stickerMessage || m.message?.stickerMessage,
              temp = path.join(dirname, '../temp'),
              time = global.time.timeIndo("Asia/Jakarta", "HH:mm")

        if (!stiker || stiker.isAnimated || !fs.existsSync(temp)) {
          return xp.sendMessage(chat.id, { text: !stiker ? 'reply/kirim stiker yang ingin dikonversi' : stiker.isAnimated ? 'stiker animasi tidak bisa dikonversi' : 'folder temp belum ada' }, { quoted: m })
        }

        const timeDir = `${time}`,
              webpPath = await mediaMessage({ message: quoted || m.message }, 'buffer'),
              outputPath = path.join(temp, `${webpPath}_${time}.png`)

        exec(`ffmpeg -i "${webpPath}" "${outputPath}"`, async err => {
          await fs.promises.unlink(webpPath).catch(() => {})
          if (err || !fs.existsSync(outputPath)) {
            return xp.sendMessage(chat.id, { text: `gagal mengonversi: ${err.message || 'tidak diketahui'}` }, { quoted: m })
          }

          const buffer = await fs.promises.readFile(outputPath)
          await xp.sendMessage(chat.id, { image: buffer, caption: 'hasil konversi' }, { quoted: m })
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}
