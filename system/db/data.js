import supabase from './supabase.js'

// ==========================================
// 🛡️ DUMMY FUNCTION (ANTI-CRASH)
// Mencegah error jika ada fitur lama yang masih memanggil fungsi db() / save.db()
// ==========================================
const init = { db: { key: {} }, gc: { key: {} }, gm: { key: {} }, bnk: { key: {} } }
const db = () => init.db
const gc = () => init.gc
const gm = () => init.gm
const bnk = () => init.bnk
const getGc = () => null

// Fungsi save diubah menjadi kosong agar bot tidak lagi menyimpan JSON ke memori HP
const save = { 
    db: () => {}, 
    gc: () => {}, 
    gm: () => {} 
}
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

// Diubah menjadi Async dan langsung terhubung ke Supabase
const role = async (jid) => {
  try {
      const { data: user } = await supabase.from('users').select('exp, role').eq('id', jid).single()
      if (!user) return
    
      const exp = user.exp || 0,
            maxExp = 2000,
            len = listRole.length,
            step = maxExp / len,
            idx = Math.min(len - 1, Math.floor(exp / step)),
            newRole = listRole[idx]
    
      if (user.role !== newRole) {
          // Update ke Cloud jika role naik tingkat
          await supabase.from('users').update({ role: newRole }).eq('id', jid)
      }
  } catch (e) {
      console.error('Error pengecekan role:', e.message)
  }
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
    const chat = global.chat(m)

    if (!chat.sender?.endsWith('@s.whatsapp.net')) return

    const nama = chat.pushName?.trim().slice(0, 20) || 'Petualang'

    // ==========================================
    // ✨ REGISTRASI OTOMATIS KE SUPABASE CLOUD ✨
    // ==========================================
    const { data: isExist } = await supabase.from('users').select('id').eq('id', chat.sender).single()
    
    // Jika belum terdaftar di Cloud, masukkan data default
    if (!isExist) {
        await supabase.from('users').insert([{ 
            id: chat.sender, 
            name: nama,
            money: 200000, // Uang awal Rp 200.000 (disamakan dengan kode lamamu)
            bank: 0,
            exp: 0,
            role: listRole[0],
            limit_user: 50
        }])
    }

  } catch (e) {
    console.error('Error saat authUser ke Supabase:', e.message)
  }
}

// Fitur Farm auth sudah ditangani oleh gamefunc.js yang baru, jadi ini dikosongkan
const authFarm = async (m) => {} 

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
