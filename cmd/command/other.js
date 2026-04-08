import { downloadContentFromMessage, generateWAMessageFromContent } from 'baileys'

export default function (ev) {

  ev.on({
    name: 'Fake Saluran Tanggapi',
    cmd: ['tanggapi', 'fakesaluran', 'pertanyaan'],
    tags: 'Other Menu',
    desc: 'Membuat pesan saluran dengan tombol interaktif Tanggapi',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: `⚠️ Masukkan pertanyaannya!\nContoh: *${prefix}${cmd} Bagaimana pendapat kalian tentang update bot ini?*` }, { quoted: m })

        const teksPertanyaan = args.join(' ')

        // Membuat struktur pesan interaktif (Button Native Flow)
        const msgButton = generateWAMessageFromContent(chat.id, {
          viewOnceMessage: {
            message: {
              interactiveMessage: {
                header: {
                  title: "📢 *PENGUMUMAN PENTING*",
                  hasMediaAttachment: false
                },
                body: { 
                  text: teksPertanyaan 
                },
                footer: { 
                  text: "Official Update Channel" 
                },
                nativeFlowMessage: {
                  buttons: [
                    {
                      // Memunculkan tombol Quick Reply yang bisa di-klik
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Tanggapi 💬",
                        id: "btn_tanggapi" // ID sistem saat tombol diklik
                      })
                    }
                  ]
                },
                contextInfo: {
                  isForwarded: true,
                  forwardingScore: 999, // Panah ganda
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363142232986470@newsletter", // WA Official Channel JID
                    newsletterName: "Saluran Resmi Alya Bot",
                    serverMessageId: -1
                  }
                }
              }
            }
          }
        }, { quoted: m })

        // Eksekusi pengiriman pesan
        await xp.relayMessage(chat.id, msgButton.message, { messageId: msgButton.key.id })

      } catch (e) {
        console.error(e)
        await xp.sendMessage(chat.id, { text: '❌ Gagal membuat pesan tombol saluran.' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'Fake Video Note',
    cmd: ['fakecatatanvideo', 'vnote', 'cv'],
    tags: 'Other Menu',
    desc: 'Mengubah video menjadi catatan video (pesan bulat)',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat, cmd, prefix }) => {
      try {
        // 1. Deteksi apakah ada video yang di-reply atau dikirim langsung dengan caption
        const isQuotedVideo = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage
        const isVideo = m.message?.videoMessage
        const videoMsg = isQuotedVideo || isVideo

        if (!videoMsg) {
          return xp.sendMessage(chat.id, { 
            text: `⚠️ Balas/Reply video yang ingin diubah!\nContoh: Balas video dengan ketik *${prefix}${cmd}*` 
          }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { text: '⏳ Sedang mengonversi ke catatan video...' }, { quoted: m })

        // 2. Proses download media (Cara Universal Baileys)
        const stream = await downloadContentFromMessage(videoMsg, 'video')
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }

        // 3. Kirim kembali sebagai Video Note (Bulat)
        await xp.sendMessage(chat.id, {
          video: buffer,
          videoNote: true, // 👈 PARAMETER RAHASIA VIDEO BULAT
          mimetype: 'video/mp4'
        }, { quoted: m })

      } catch (e) {
        console.error(e)
        // Gunakan fungsi penanganan error bawaan botmu jika ada
        if (typeof err === 'function') err(`error pada ${cmd}`, e)
        if (typeof call === 'function') call(xp, e, m)
        
        await xp.sendMessage(chat.id, { text: '❌ Terjadi kesalahan saat memproses video.' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'Fake Lokasi',
    cmd: ['fakelokasi', 'lokasi'],
    tags: 'Other Menu',
    desc: 'Mengirim lokasi palsu (Segitiga Bermuda)',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      try {
        await xp.sendMessage(chat.id, {
          location: {
            degreesLatitude: 25.0000,   // Garis Lintang
            degreesLongitude: -71.0000, // Garis Bujur
            name: "Segitiga Bermuda 🌊",
            address: "Pusat Anomali Dunia, Samudra Atlantik"
          }
        }, { quoted: m })
      } catch (e) {
        console.error(e)
      }
    }
  })
  
  ev.on({
    name: 'Pesan Viral',
    cmd: ['fakeviral', 'fakehoax'],
    tags: 'Other Menu',
    desc: 'Membuat pesan seolah diteruskan berkali-kali (Panah Ganda)',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: `⚠️ Ketik beritanya!\nContoh: *${prefix}${cmd} Info loker gaji 50 juta/bulan!*` }, { quoted: m })
        
        const teksBerita = args.join(' ')

        await xp.sendMessage(chat.id, {
            text: teksBerita,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 9999999 // Angka super besar ini yang memicu logo "Panah Ganda"
            }
        }, { quoted: m })

      } catch (e) {
        console.error(e)
      }
    }
  })
  
  ev.on({
    name: 'Pesan Sulap',
    cmd: ['editpesan'],
    tags: 'Other Menu',
    desc: 'Pesan yang bisa berubah sendiri',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { chat }) => {
      try {
        const delay = ms => new Promise(res => setTimeout(res, ms))

        // Bot mengirim pesan pertama
        const sentMsg = await xp.sendMessage(chat.id, { text: '🐒 Muka kamu kok mirip monyet ya...' }, { quoted: m })
        
        await delay(2000) // Tunggu 2 detik

        // Bot mengedit pesan pertama secara otomatis
        await xp.sendMessage(chat.id, { 
            text: '🥰 Eh maaf typo, maksudnya manis kayak madu!', 
            edit: sentMsg.key 
        })
      } catch (e) {
        console.error(e)
      }
    }
  })
  
  ev.on({
    name: 'Readmore Prank',
    cmd: ['readmore', 'spoiler'],
    tags: 'Other Menu',
    desc: 'Membuat teks dengan tombol Baca Selengkapnya',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        const text = args.join(' ')
        if (!text.includes('|')) return xp.sendMessage(chat.id, { text: `⚠️ Gunakan pemisah tanda " | "\n\nContoh: *${prefix}${cmd} Halo semua | ternyata saya belum mandi.*` }, { quoted: m })

        const [teksAtas, teksBawah] = text.split('|')
        
        // Karakter rahasia pembentuk "Read More" (diulang 4000 kali agar WA memotong pesannya)
        const readMoreChar = String.fromCharCode(8206).repeat(4001)

        await xp.sendMessage(chat.id, { text: teksAtas.trim() + readMoreChar + teksBawah.trim() }, { quoted: m })
      } catch (e) {
        console.error(e)
      }
    }
  })
  
    ev.on({
    name: 'Fake Kontak',
    cmd: ['fakekontak', 'kontak'],
    tags: 'Other Menu',
    desc: 'Mengirim kartu kontak palsu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya untuk di grup!' }, { quoted: m })
        
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!target) return xp.sendMessage(chat.id, { text: `⚠️ Tag orangnya dan kasih nama palsunya!\nContoh: *${prefix}${cmd} @tag | Bapak Presiden*` }, { quoted: m })

        const namaPalsu = args.join(' ').split('|')[1]?.trim() || 'Orang Misterius'
        const nomorTarget = target.split('@')[0]

        // Membuat format VCard standar WhatsApp
        const vcard = 'BEGIN:VCARD\n' 
            + 'VERSION:3.0\n' 
            + `FN:${namaPalsu}\n` // Nama yang tampil di kontak
            + 'ORG:Alya Bot Corporation;\n' 
            + `TEL;type=CELL;type=VOICE;waid=${nomorTarget}:+${nomorTarget}\n` 
            + 'END:VCARD'

        await xp.sendMessage(chat.id, {
            contacts: {
                displayName: namaPalsu,
                contacts: [{ vcard }]
            }
        }, { quoted: m })

      } catch (e) {
        console.error(e)
      }
    }
  })
  
  // ==========================================
  // 🗣️ 2. FAKE QUOTE / FITNAH TEMAN
  // ==========================================
  ev.on({
    name: 'Fitnah Orang',
    cmd: ['fitnah', 'fakequote'],
    tags: 'Other Menu',
    desc: 'Bikin fake reply seolah temanmu ngomong sesuatu',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Hanya bisa digunakan di grup!' }, { quoted: m })
        
        // Format: .fitnah @tag | teks palsu target | balasan kita
        const textFull = args.join(' ')
        const splitText = textFull.split('|')

        if (splitText.length < 3) {
            let panduan = `⚠️ Format salah!\n\n`
            panduan += `Gunakan format: *${prefix}${cmd} @tag | teks_dia | teks_kamu*\n\n`
            panduan += `Contoh: *${prefix}${cmd} @62812xxx | Aku pinjam uang dong | Enak aja lu!*`
            return xp.sendMessage(chat.id, { text: panduan }, { quoted: m })
        }

        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!target) return xp.sendMessage(chat.id, { text: '⚠️ Jangan lupa tag targetnya!' }, { quoted: m })

        const teksDia = splitText[1].trim()
        const teksKita = splitText[2].trim()

        // Membuat struktur pesan palsu dari target
        const fakeMessage = {
          key: {
            fromMe: false,
            participant: target,
            id: "BAE5" + Math.random().toString(36).substring(2, 10).toUpperCase() // ID acak biar kelihatan asli
          },
          message: { conversation: teksDia }
        }

        // Mengirim balasan kita dengan me-reply pesan palsu tersebut
        await xp.sendMessage(chat.id, { text: teksKita, mentions: [target] }, { quoted: fakeMessage })

      } catch (e) {
        console.error(e)
      }
    }
  })

  // ==========================================
  // 📢 3. FAKE PENGUMUMAN SALURAN (CHANNEL)
  // ==========================================
  ev.on({
    name: 'Fake Pengumuman',
    cmd: ['sistem', 'pengumuman'],
    tags: 'Other Menu',
    desc: 'Pesan bergaya pengumuman resmi dari Saluran',
    owner: !0, // Khusus Owner
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: '⚠️ Masukkan isi pengumumannya!' }, { quoted: m })
        const teksPesan = args.join(' ')

        const msgChannel = generateWAMessageFromContent(chat.id, {
          extendedTextMessage: {
            text: teksPesan,
            contextInfo: {
              forwardingScore: 999, // Angka besar biar centang / icon forwardnya beda
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363142232986470@newsletter", // Ini JID Channel asli punya WhatsApp Official
                newsletterName: "WhatsApp System Official",
                serverMessageId: 1
              }
            }
          }
        }, { quoted: m })

        await xp.relayMessage(chat.id, msgChannel.message, { messageId: msgChannel.key.id })
      } catch (e) {
        console.error(e)
      }
    }
  })

  // ==========================================
  // 💻 4. FAKE RICH RESPONSE (KOTAK HACKER)
  // ==========================================
  ev.on({
    name: 'Fake Rich Response',
    cmd: ['hacker', 'fakepesan'],
    tags: 'Other Menu',
    desc: 'Kirim pesan dalam kotak kode ala hacker',
    owner: !1,
    prefix: !0,

    run: async (xp, m, { args, chat, prefix, cmd }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: `⚠️ Ketik teks yang mau dimasukkan ke kotak kode.\nContoh: *${prefix}${cmd} Database berhasil diretas.*` }, { quoted: m })
        
        const teksKode = args.join(' ')

        const subcontent = [
          {
            messageType: 5,
            codeMetadata: {
              codeLanguage: "json", // Tampilan teks editor JSON
              codeBlocks: [
                { highlightType: 0, codeContent: "{\n" }, 
                { highlightType: 3, codeContent: `  "SYSTEM": "${teksKode}"\n` }, 
                { highlightType: 0, codeContent: "}" }
              ]
            }
          }
        ]

        const msgRich = generateWAMessageFromContent(chat.id, {
          botForwardedMessage: {
            message: {
              richResponseMessage: {
                messageType: 1,
                submessages: subcontent,
                contextInfo: {
                  forwardingScore: 1,
                  isForwarded: true,
                  forwardedAiBotMessageInfo: {
                    botJid: "13135550002@s.whatsapp.net" // Pakai label Meta AI sekalian biar makin keren
                  }
                }
              }
            }
          }
        }, { quoted: m })

        await xp.relayMessage(chat.id, msgRich.message, { messageId: msgRich.key.id })
      } catch (e) {
        console.error(e)
      }
    }
  })

}