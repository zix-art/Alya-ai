import fetch from 'node-fetch'
import { vn } from '../interactive.js'

export default function fun(ev) {
  ev.on({
    name: 'arti nama',
    cmd: ['artinama', 'maknanama'],
    tags: 'Fun Menu',
    desc: 'Mencari arti dan makna dari sebuah nama',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, { chat, cmd, prefix, text }) => {
      try {
        if (!text) return xp.sendMessage(chat.id, { 
            text: `⚠️ *Namanya siapa komandan?*\n\nContoh penggunaan:\n*${prefix}${cmd} arep*` 
        }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '🔍', key: m.key } })

        // 🛠️ DIPERBAIKI: Menggunakan fetch agar tidak crash gara-gara require('axios')
        const response = await fetch('https://berinama.com/wp-json/baby-names/v1/meaning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: text })
        })
        
        const data = await response.json()

        if (!data || !data.meaning) {
            await xp.sendMessage(chat.id, { react: { text: '❌', key: m.key } })
            return xp.sendMessage(chat.id, { text: `❌ Maaf, arti nama *${text}* tidak ditemukan di database.` }, { quoted: m })
        }

        let hasilArti = data.meaning.replace(/&amp;/g, '&')
        let teks = `✨ *CEK ARTI NAMA* ✨\n\n👤 *Nama yang dicari:* ${text.toUpperCase()}\n\n${hasilArti}`

        await xp.sendMessage(chat.id, { text: teks }, { quoted: m })
        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error(`Error pada ${cmd}:`, e)
        xp.sendMessage(chat.id, { text: `❌ Terjadi kesalahan saat mencari arti nama. Server API mungkin sedang sibuk.` }, { quoted: m })
      }
    }
  })
  
  ev.on({
    name: 'cek bh',
    cmd: ['cekbh', 'bh'],
    tags: 'Fun Menu',
    desc: 'Cek detail bra seseorang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo
        const user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender
        const target = user.replace(/@s\.whatsapp\.net$/, '')

        const sizes = ['Tepos', '30', '32A', '32B', '32C', '34A', '34B', '34C', '36A', '36B', '36C', '38A', '38B', '38C', '40A', '40B', '40C', '42A', '42B', '42C']
        const colors = ['Merah', 'Biru', 'Hijau', 'Kuning', 'Hitam', 'Putih', 'Oranye', 'Ungu', 'Coklat', 'Abu-abu', 'Merah Muda', 'Krem', 'Toska', 'Emas', 'Transparan']
        const shapes = ['Underwired', 'Push-up', 'Balconette', 'Padded', 'Halter', 'Bikini', 'Bralette', 'Sport', 'Tube', 'Bridal', 'T-shirt', 'Tidak pakai']

        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
        const teks = `👙 *CEK KONDISI BH*\n\nTarget: @${target}\nUkuran: ${rand(sizes)}\nWarna: ${rand(colors)}\nModel: ${rand(shapes)}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek cd',
    cmd: ['cekcd', 'cd', 'sempak'],
    tags: 'Fun Menu',
    desc: 'Cek kondisi sempak seseorang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo
        const user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender
        const target = user.replace(/@s\.whatsapp\.net$/, '')

        const models = ['Boxer', 'Briefs', 'G-String', 'Renda-renda', 'Kolor bapak', 'Sempak segitiga', 'Thong', 'Tidak pakai sama sekali']
        const motifs = ['Polos', 'Macan tutul', 'Hello Kitty', 'Spongebob', 'Doraemon ngakak', 'Batik', 'Garis-garis', 'Warna pudar']
        const kondisi = ['Baru beli', 'Bolong di tengah', 'Karetnya udah kendor', 'Belum dicuci 3 hari', 'Banyak noda misterius', 'Jahitannya lepas lepas', 'Nyempil parah', 'Bau terasi', 'Udah tipis kek tisu']

        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
        const teks = `🩲 *CEK KONDISI SEMPAK*\n\nTarget: @${target}\nModel: ${rand(models)}\nMotif: ${rand(motifs)}\nKondisi: ${rand(kondisi)}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek kodam',
    cmd: ['cekkodam', 'cekkhodam', 'kodam', 'khodam'],
    tags: 'Fun Menu',
    desc: 'Cek khodam pendamping di dalam dirimu',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, { chat, cmd, args }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo
        const user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender
        const target = user.replace(/@s\.whatsapp\.net$/, '')

        const nama = args.length > 0 ? args.join(' ') : `@${target}`
        const listKhodam = ["Naga Indosiar 🐉", "Kucing Oyen Barbar 🐈", "Macan Cisewu 🐯", "Knalpot Racing Mberr 🏍️", "Panci Gosong 🥘", "Tuyul Kesandung 👻", "Jin Tomang 🧞", "Sapu Lidi Emak 🧹", "Seblak Ceker Pedas 🍜", "Kipas Angin Maspion 💨", "Pocong Breakdance 🕺", "Kuntilanak Ngesot 🧛‍♀️", "Singa Ompong 🦁", "Lele Terbang 🐟", "Kecoa Nungging 🪳", "Tikus Got 🐀", "Nyamuk DBD 🦟", "Batu Bata 🧱", "Galon Le Minerale 💧", "Kambing Guling 🐐", "Tuyul Muallaf 👳‍♂️", "Cacing Kremi 🪱", "Karet Gelang 🥢", "Ular Kadut 🐍", "Mio Karbu 🛵", "Kosong (Lu NPC) 🗿"]
        const randomKhodam = listKhodam[Math.floor(Math.random() * listKhodam.length)]
        
        let arti = (randomKhodam === "Kosong (Lu NPC) 🗿") ? "Kasihan banget hidup lu hampa tanpa khodam awokawok 🤣" : (randomKhodam === "Kecoa Nungging 🪳" || randomKhodam === "Tikus Got 🐀") ? "Jorok banget khodam lu anjir 🤮" : "Rawrr! Sangat menakutkan! 🔥"
        const teks = `🔮 *CEK KHODAM PENDAMPING* 🔮\n\n👤 Nama : ${nama}\n👻 Khodam : *${randomKhodam}*\n\n_${arti}_`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek ganteng',
    cmd: ['cekganteng'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 5 ? 'AWOAKAK BURIQQQ!!! Muka atau sampah ini?!' : persen <= 15 ? 'Serius ya, makin lama liat muka lo gw bisa muntah!' : persen <= 25 ? 'Mungkin karena lo sering maksiat, susah dapet jodoh lu.' : persen <= 35 ? 'Yang sabar ya, emang takdir.' : persen <= 50 ? 'Dijamin cewek susah deketin lo, semoga diberkati.' : persen <= 60 ? 'Lu setengah ganteng, cukuplah buat standar.' : persen <= 75 ? 'Lumayan ganteng juga lu, gak salah lagi dah.' : persen <= 85 ? 'Dijamin cewek gak akan kecewa.' : persen <= 95 ? 'Cewek-cewek pasti pingsan kalo ngeliat lo, AARRGGHHH!!!' : 'LU EMANG COWOK TERGANTENG!!!'
        let teks = `@${target} *${persen}%*\n\n${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
        if (persen > 60) await xp.sendMessage(chat.id, { sticker: { url: 'https://cdn.neoapis.xyz/f/izx4li.webp' } }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek cantik',
    cmd: ['cekcantik'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              user = quoted?.participant || quoted?.mentionedJid?.[0] || m.key?.participant || chat.id,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 5 ? 'Waduh, nyari cantik di mana nih?! Kaca rumah bisa retak!' : persen <= 15 ? 'Muka lo mirip spanduk dipasang lama kena hujan angin.' : persen <= 25 ? 'Sering ngegosip kali ya, makin luntur tuh cantik. Pake topeng aja.' : persen <= 35 ? 'Lumayan lah, bisa buat nge-gofood gratis sesekali.' : persen <= 50 ? 'Ga jelek, tapi ga cakep juga. Standar lah...' : persen <= 60 ? 'Setengah cantik setengah biasa, tapi asik diajak ngobrol.' : persen <= 75 ? 'Udah mulai kelihatan nih cantiknya, lumayan bikin kesemsem!' : persen <= 85 ? 'Wow, cakep banget lo! Cantik maksimal bikin iri.' : persen <= 95 ? 'Bener-bener bikin semua orang terpana, superstar vibes!' : 'LU EMANG WANITA TERCANTIK!!!'
        let teks = `@${target} *${persen}%*\n\n${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
        if (persen > 60) await xp.sendMessage(chat.id, { sticker: { url: ['https://cdn.neoapis.xyz/f/u8vndg.webp', 'https://cdn.neoapis.xyz/f/4g4r15.webp'][Math.floor(Math.random() * 2)] } }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  // ☁️ CEK DOMPET MIGRATED TO SUPABASE CLOUD
  ev.on({
    name: 'cek dompet',
    cmd: ['cekdompet', 'dompet', 'bank'],
    tags: 'Fun Menu',
    desc: 'mengecek dompet orang',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo
        const target = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender
        const userJid = target || m.key?.participant

        // Mengambil data dari cache/database Supabase
        const { getUserDataSupa } = await import('../../system/function.js')
        const getUser = await getUserDataSupa(userJid)

        if (!getUser) return xp.sendMessage(chat.id, { text: '❌ Pengguna belum terdaftar di database.' }, { quoted: m })

        const moneyDb = getUser.money || 0
        const mention = userJid.replace(/@s\.whatsapp\.net$/, '')
        const fmtMoney = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR'}).format(moneyDb)
        
        const txt = `💼 *DOMPET DIGITAL*\n\n👤 Target: @${mention}\n💰 Saldo: *${fmtMoney}*\n\n> _Data tersinkronisasi dengan Cloud_`

        await xp.sendMessage(chat.id, { text: txt, mentions: [userJid] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek dosa',
    cmd: ['cekdosa'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender,
              { cekDosa } = await global.func(),
              listDosa = [...cekDosa].sort(() => Math.random() - .5).slice(0, 10),
              user = target.replace(/@s\.whatsapp\.net$/, '')

        let teks = `Top 10 dosa besar @${user}\n`
        listDosa.forEach((d, i) => teks += `${i + 1}. ${d}\n`)

        await xp.sendMessage(chat.id, { text: teks.trim(), mentions: [target] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek femboy',
    cmd: ['cekfemboy'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'masih aman bang' : persen <= 34 ? 'agak agak sih' : persen <= 51 ? 'dah gila sih' : persen <= 67 ? 'anomali ini mah' : persen <= 84 ? 'gangguan jiwa' : persen <= 93 ? 'fiks femboy' : 'femboy out aja'
        await xp.sendMessage(chat.id, { text: `@${target} ${persen}% ${txt}`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })  

  ev.on({
    name: 'cek iq',
    cmd: ['cekiq'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              rand = Math.floor(Math.random() * 3.4e1) + 7.4e1,
              persen = rand <= 81 ? 81 : rand <= 87 ? 87 : rand <= 94 ? 94 : rand <= 100 ? 100 : 107,
              txt = persen === 81 ? 'IQ rendah tapi masih normal' : persen === 87 ? 'IQ lumayan, masih bisa mikir' : persen === 94 ? 'IQ standar manusia cerdas' : persen === 100 ? 'IQ di atas rata-rata' : 'IQ jenius tingkat dewa'
        await xp.sendMessage(chat.id, { text: `@${target} IQ kamu *${persen}*\n${txt}`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek jodoh',
    cmd: ['cekjodoh'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 105, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: '❌ Fitur ini cuma bisa dipake buat ngerusuh di grup ngab!' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo,
              tags = quoted?.mentionedJid || [],
              reply = quoted?.participant,
              metadata = await xp.groupMetadata(chat.id)

        const target = metadata.participants.map(v => v.id).filter(id => id !== xp.user.id)
        const mention = tags.length >= 2 ? tags : tags.length === 1 ? [tags[0]] : reply ? [reply] : []

        const persen = (Math.floor(Math.random() * 1e2) + 1),
              randomPick = (list, exclude = []) => list.filter(id => !exclude.includes(id))[Math.floor(Math.random() * list.filter(id => !exclude.includes(id)).length)]
        
        const cnd = persen <= 10 ? 'Ampas banget mending jauhan dah ntar malah baku hantam 🥊' : persen <= 25 ? 'Hadeh, bagaikan air sama minyak. Ga nyambung blass! 🛢️' : persen <= 40 ? 'Lumayan sih, tapi kayaknya mentok di friendzone alias jadi temen curhat doang 🗿' : persen <= 55 ? 'Eciee... mulutnya bilang najis aslinya salting brutal tuh awokawok! 🫣' : persen <= 70 ? 'Wah chemistry-nya dapet nih! Minimal gas jalan bareng lah weekend ini 🍿' : persen <= 85 ? 'Tunggu apa lagi sih? Pelet udah bekerja, tinggal sebar undangan! 💌' : persen <= 95 ? 'Bau-bau pelaminan udah kecium nih yeee. Dunia milik berdua yang lain ngekos! 👩‍❤️‍👨' : 'UDAH JODOH DUNIA AKHIRAT INI MAH! GAS KE KUA SEKARANG JUGA BOSKUHH!!! 🔥💍'

        const tgr1 = mention.length >= 1 ? mention[0] : randomPick(target),
              tgr2 = mention.length >= 2 ? mention[1] : randomPick(target, [tgr1])

        const teks = `💖 *CEK KECOCOKAN JODOH* 💖\n\n@${tgr1.split('@')[0]} ✖️ @${tgr2.split('@')[0]}\n📊 Cocok: *${persen}%*\n\n💬 _${cnd}_`
        await xp.sendMessage(chat.id, { text: teks, mentions: [tgr1, tgr2] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'motivasi tough love',
    cmd: ['motivasi'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, '')
        const persen = Math.floor(Math.random() * 101)
        let txt = persen <= 15 ? 'WOY BANGUN DARI MIMPI LU! Jangan cengeng terus kek anak kecil! Hidup itu keras, jangan nunggu disuapin terus. Minimal usaha lah daripada nangis-nangis gak jelas! 🤡🔥' : persen <= 30 ? 'Hadeuh... Gitu doang trauma? Lemah amat mental lu! Udah gausah kebanyakan drama, hidup lu itu bukan sinetron. Cepetan bangkit atau bakal jadi pecundang selamanya! 🤡💩' : persen <= 50 ? 'Ngapain lu masih disini nangisin masa lalu? Move on dong, goblog! Masih banyak yang harus dipikirin daripada cuma mikirin satu orang doang. Udah gausah sok trauma, muka lu emang pantes dapet gitu! 🤡💩' : persen <= 70 ? 'Dengerin ya bos! Trauma itu cuma alasan buat orang-orang males kek lu! Jangan ngerasa paling menderita sedunia, banyak yang lebih susah dari lu tapi gak secengeng lu! Minimal usaha lah anjir! 🤡🔥' : persen <= 85 ? 'Hahaha! Masa lalu mulu yang dibahas, pantesan idup lu suram terus! Cepetan tobat dan usaha buat masa depan, jangan cuma jadi beban keluarga doang. Dunia gak peduli sama air mata lu! 🤡💩' : 'WOY BEBAN KELUARGA!! Cepetan usaha dan jangan cuma jadi sampah di dunia ini! Trauma itu cuma khayalan lu doang buat menghindari kenyataan keras! Kapan lu mau sukses kalo cuma nangis terus?! 🤡🔥'
        await xp.sendMessage(chat.id, { text: `👤 @${target}\n📊 Tingkat Galau: *${persen}%*\n\n*Kata Kata* _${txt}_`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'cek trauma',
    cmd: ['cektrauma'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, '')
        const persen = Math.floor(Math.random() * 101)
        let txt = persen <= 20 ? 'Sok keras lu padahal aslinya rapuh. Sok-sokan trauma, padahal pacaran aja cuma seumur jagung, itu pun lu doang yang modalin! Muka lu emang pantes ditipu. 🤡💸' : persen <= 40 ? 'Trauma di-ghosting wkwkwk. Udah ngetik panjang lebar balesannya cuma "Y". Pantesan idup lu kek orang depresi, mental lu mental kerupuk! 👻' : persen <= 60 ? 'Trauma jadi badut! 🤡 Nemenin dari nol, eh pas udah sembuh balikan sama mantannya. Kasihan dijadiin tempat transit! 🚌💨' : persen <= 80 ? 'Trauma diselingkuhin! Udah tau muka lu pas-pasan, eh masih aja ditinggalin demi yang lebih glowing. 🤣' : persen <= 95 ? 'GAGAL MOVE ON KRONIS!! Tiap malem masih nge-stalk sosmed mantan kan lu ngaku?! Sadar woy, dia udah lupa sama lu! 🗑️' : 'THE REAL KORBAN JANJI MANIS!! 💔 Udah angan-angan nikah, eh malah dapet undangan nikahannya dia! Sakit jiwa lu lama-lama. 🚑'
        await xp.sendMessage(chat.id, { text: `💔 *CEK TINGKAT TRAUMA* 💔\n\n👤 @${target}\n📊 Tingkat Trauma: *${persen}%*\n\n💬 _${txt}_`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'cek isi otak',
    cmd: ['cekisiotak', 'isiotak'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, '')
        const rng = Math.floor(Math.random() * 100) + 1
        let persen = rng <= 15 ? Math.floor(Math.random() * 31) : Math.floor(Math.random() * 70) + 31
        let txt = persen <= 10 ? 'Tumben otak lu bersih. Sok suci banget lu, padahal aslinya sering nyari link pemersatu bangsa kan? 🗿' : persen <= 30 ? 'Pura-pura polos anjir. Di luar keliatan alim, di dalem otak lu udah ada bibit sangean. 🤡' : persen <= 50 ? 'Balance nih. 50% mikirin beban idup, 50% lagi mikirin hal ngeres. ⚖️' : persen <= 70 ? 'Tampang doang polos, isi otak lu selangkangan mulu. Tobat bos! 💀' : persen <= 80 ? 'Udah di tahap kronis ini mah. Liat knalpot motor aja lu nafsu kan?! 🕳️' : persen <= 95 ? 'ANJIR CABUL DETECTED!! 🚨 Otak lu isinya lendir semua! 🤮' : 'THE REAL RAJA SANGE!!! 👑🔥 ASTAGFIRULLAH OTAK LU 100% DOSA SEMUA!'
        await xp.sendMessage(chat.id, { text: `🧠 *CEK ISI OTAK* 🧠\n\n👤 @${target}\n📊 Tingkat Cabul: *${persen}%*\n\n💬 _${txt}_`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek jomok',
    cmd: ['cekgay', 'cekjomok'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, ''), persen = Math.floor(Math.random() * 101)
        let txt = persen <= 17 ? 'masih aman bang' : persen <= 34 ? 'agak agak sih' : persen <= 51 ? 'agak lain sih' : persen <= 67 ? 'gay banget lho ya' : persen <= 84 ? 'gangguan jiwa' : persen <= 93 ? 'fiks gay' : 'orang jomok'
        await xp.sendMessage(chat.id, { text: `@${target} ${persen}% ${txt}`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek lesbi',
    cmd: ['ceklesbi'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, ''), persen = Math.floor(Math.random() * 101)
        let txt = persen <= 17 ? 'masih aman mbak' : persen <= 34 ? 'agak agak sih' : persen <= 51 ? 'agak lain sih' : persen <= 67 ? 'lesbi banget lho ya' : persen <= 84 ? 'gangguan jiwa' : persen <= 93 ? 'fiks lesbi' : 'orang gila'
        await xp.sendMessage(chat.id, { text: `@${target} ${persen}%\n${txt}`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek mesum',
    cmd: ['cekmesum'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, mention = user.replace(/@s\.whatsapp\.net$/, ''), persen = Math.floor(Math.random() * 101)
        let txt = persen <= 17 ? 'masih aman' : persen <= 34 ? 'agak agak sih' : persen <= 51 ? 'mencurigakan' : persen <= 67 ? 'cabul banget jir' : persen <= 84 ? 'dasar mesum' : persen <= 93 ? 'fiks cabul' : 'orang gila'
        await xp.sendMessage(chat.id, { text: `@${mention} ${persen}% ${txt}`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'cek hitam',
    cmd: ['cekhitam', 'item'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, ''), persen = Math.floor(Math.random() * 101)
        let txt = persen <= 10 ? 'Buset terang banget lu. Fiks anak rumahan gapernah nyentuh rumput. 💡' : persen <= 25 ? 'Putih sih, tapi putih pucet kek mayat idup. Sering-sering berjemur napa. 👻' : persen <= 40 ? 'Standar Indo lah. Nanggung amat idup lu, item engga putih engga. 🗿' : persen <= 60 ? 'Mulai keliatan aura-aura kuli proyeknya nih. Sering maen layangan ya? 🪁' : persen <= 75 ? 'Waduh gosong! Lu mandi pake kecap Bango apa luluran pake oli bekas dah? 🛢️' : persen <= 90 ? 'Anjir item bat! Kalo mati lampu fiks lu ikutan ngilang 😭' : persen <= 99 ? 'LU BUKAN ITEM LAGI, LU UDAH MENYATU DENGAN BAYANGAN! 🌑💀' : 'VANTABLACK!!! MALAIKAT AJA SUSAH NYARI LU KALO MALEM! 👑🏴'
        await xp.sendMessage(chat.id, { text: `⬛ *CEK TINGKAT KEGELAPAN* ⬛\n\n👤 @${target}\n📊 Tingkat Item: *${persen}%*\n\n💬 _${txt}_`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek hoki',
    cmd: ['cekhoki', 'hoki'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, '')
        const rng = Math.floor(Math.random() * 100) + 1
        let persen = rng <= 85 ? Math.floor(Math.random() * 81) : Math.floor(Math.random() * 20) + 81
        let txt = persen <= 10 ? 'Sial banget lu hari ini anjir, mending rebahan aja di kamar! 💀' : persen <= 30 ? 'Apes bener dah, ati-ati dompet ilang. 🗿' : persen <= 50 ? 'Hoki lu standar NPC. Biasa aja. 💤' : persen <= 70 ? 'Lumayan hoki sih, bolehlah nyoba gacha game. 🎲' : persen <= 80 ? 'Wih hoki lu lagi bagus nih! Rezeki nomplok menanti. 💸' : persen <= 95 ? 'HOKI PARAH!! Lu abis nyelametin negara apa gimana dah?! 🏆' : 'ANJIR LUCK NUT NUTAN!!! LU ANAK EMAS DEVELOPER YA?! 🤯🔥'
        await xp.sendMessage(chat.id, { text: `🎰 *CEK HOKI HARI INI* 🎰\n\n👤 @${target}\n📊 Tingkat Hoki: *${persen}%*\n\n💬 _${txt}_`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek pedo',
    cmd: ['cekpedo'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, ''), persen = Math.floor(Math.random() * 101)
        let txt = persen <= 17 ? 'masih aman' : persen <= 34 ? 'mencurigakan' : persen <= 51 ? 'tanda² pedo' : persen <= 67 ? 'pedo banget' : persen <= 84 ? 'fiks pedo' : persen <= 93 ? 'pedo,\nlapor fbi' : 'orang gila'
        await xp.sendMessage(chat.id, { text: `@${target} ${persen}%\n${txt}`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'cek sifat',
    cmd: ['ceksifat'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, { sifatList } = await global.func(), target = user.replace(/@s\.whatsapp\.net$/, '')
        const sifat = sifatList[Math.floor(Math.random() * sifatList.length)]
        await xp.sendMessage(chat.id, { text: `@${target}\nSifat kamu: *${sifat}*`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'claim',
    cmd: ['claim'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
         if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })
          const q = m.message?.extendedTextMessage?.contextInfo, target = q?.participant || q?.mentionedJid?.[0]
          if (!target) return xp.sendMessage(chat.id, { text: `reply atau tag target` }, { quoted: m })
          await xp.sendMessage(chat.id, { text: `@${target.replace(/@s\.whatsapp\.net$/, '')} telah di claim oleh @${chat.sender.replace(/@s\.whatsapp\.net$/, '')} `, mentions: [target, chat.sender] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })
  
  ev.on({
    name: 'cek centil',
    cmd: ['cekcentil', 'centil', 'caper'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 100, exp: 0.1,
    run: async (xp, m, { chat, cmd }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo, user = quoted?.participant || quoted?.mentionedJid?.[0] || chat.sender, target = user.replace(/@s\.whatsapp\.net$/, ''), persen = Math.floor(Math.random() * 101)
        let txt = persen <= 15 ? 'Kaku banget kek kanebo kering jemuran! Boro-boro centil, dideketin lawan jenis aja lu panik terus kabur. 🪵' : persen <= 30 ? 'Centilnya nanggung anjir. Mau sok imut caper tapi masih malu-malu kucing. 🐱' : persen <= 50 ? 'Standar pick-me lah. Kalo lagi sepi kalem, tapi giliran ada crush lu nimbrung. 😒' : persen <= 70 ? 'Wah mulai bahaya nih. Dikit-dikit caper, dikit-dikit bikin stori WA sok galau. 🙄' : persen <= 85 ? 'CENTIL PARAH!! Tiap ada lawan jenis langsung nge-gas caper! 💅🤮' : persen <= 95 ? 'SUHU CAPER DETECTED!! 🚨 Semua orang digodain, sana-sini di-chat "lagi apa?". 🏆' : 'THE REAL RATU/RAJA GATEL!!! 👑🐍 SANA MANDI KEMBANG TUJUH RUPA BIAR LUNTUR TUH GATELNYA! 🚿💨'
        await xp.sendMessage(chat.id, { text: `💅 *CEK TINGKAT KECENTILAN* 💅\n\n👤 @${target}\n📊 Tingkat Centil: *${persen}%*\n\n💬 _${txt}_`, mentions: [user] }, { quoted: m })
      } catch (e) { call(xp, e, m) }
    }
  })

  ev.on({
    name: 'elevenlabs',
    cmd: ['elevenlabs'],
    tags: 'Fun Menu',
    owner: !1, prefix: !0, money: 1000, exp: 0.1,
    run: async (xp, m, { args, chat, cmd, prefix }) => {
      try {
        const vnList = ['prabowo', 'yanzgpt', 'bella', 'megawati', 'echilling', 'adam', 'thomas_shelby', 'michi_jkt48', 'nokotan', 'jokowi', 'boboiboy', 'keqing', 'anya', 'yanami_anna', 'MasKhanID', 'Myka', 'raiden', 'CelzoID', 'dabi'], vnTxt = vnList.map(v => `- ${v}`).join('\n')

        if (args.length < 2) return xp.sendMessage(chat.id, { text: `contoh penggunaan:\n${prefix}${cmd} <voice> <text>\ndaftar voice:\n${vnTxt}` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const [vnRaw, ...txtPart] = args, vnLow = vnRaw.toLowerCase(), txtLn = txtPart.join(' '), pitch = 0, speed = 0.9
        
        // Memastikan global variabel termaiWeb dan termaiKey terbaca dengan aman
        const urlAPI = `${global.termaiWeb || 'https://api.termai.cc'}/api/text2speech/elevenlabs?text=${encodeURIComponent(txtLn)}&voice=${vnLow}&pitch=${pitch}&speed=${speed}&key=${global.termaiKey || 'Bell409'}`
        
        const url = await fetch(urlAPI)

        if (!vnList.includes(vnLow)) return xp.sendMessage(chat.id, { text: `voice tidak valid\nlist voice:\n${vnTxt}`})
        if (!url.ok) throw new Error(`HTTP ${url.status}`)

        const audio = Buffer.from(await url.arrayBuffer())
        await vn(xp, audio, m)
      } catch (e) {
        console.error(`error pada ${cmd}`, e)
        xp.sendMessage(chat.id, { text: '❌ Terjadi kesalahan pada fitur Elevenlabs.' }, { quoted: m })
      }
    }
  })
}
