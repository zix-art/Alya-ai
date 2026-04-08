import fs from 'fs'

const dbPath = './system/db/autostiker.json'

// Buat folder & file database otomatis kalo belum ada
if (!fs.existsSync('./system/db')) fs.mkdirSync('./system/db', { recursive: true })
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]))

const lastRandomSticker = new Map()
const lastAdminRoast = new Map()

export const autoStikerProcess = async (xp, m, chat, usrAdm) => {
    // Kalo bukan di grup, abaikan
    if (!chat.group) return

    try {
        const listGc = JSON.parse(fs.readFileSync(dbPath))
        
        // Kalo grup ini belum didaftarkan/di-ON-kan, abaikan
        if (!listGc.includes(chat.id)) return 

        const now = Date.now()
        const groupId = chat.id
        const sender = m.sender || m.key.participant

        // ==========================================
        // 1. CEK ADMIN (Kirim Stiker Roasting)
        // ==========================================
        if (usrAdm) {
            const adminKey = `${groupId}-${sender}`
            const lastAdminTime = lastAdminRoast.get(adminKey) || 0
            
            // Cooldown 1 jam (3600000 ms) biar bot ga nyepam tiap admin ngomong
            // Kalo mau tiap saat admin ngomong dikirim stiker, ubah angka 3600000 jadi 0 (TAPI BAHAYA SPAM WKWK)
            if (now - lastAdminTime > 3600000) {
                const stikerAdmin = [
                    'https://cdn.neoapis.xyz/f/onj2tr.webp',
                    'https://cdn.neoapis.xyz/f/vqdlmd.webp',
                    'https://cdn.neoapis.xyz/f/6akmfi.webp'
                ]
                const pickAdmin = stikerAdmin[Math.floor(Math.random() * stikerAdmin.length)]
                await xp.sendMessage(groupId, { sticker: { url: pickAdmin } }, { quoted: m })
                lastAdminRoast.set(adminKey, now)
                return // Berhenti di sini biar ga dobel ngirim stiker random di bawah
            }
        }

        // ==========================================
        // 2. CEK RANDOM STICKER (Tiap 2 Jam 30 Menit)
        // ==========================================
        const lastRandomTime = lastRandomSticker.get(groupId) || 0
        // 2 Jam 30 Menit = 9000000 milidetik
        if (now - lastRandomTime > 9000000) {
            const stikerRandom = [
                'https://cdn.neoapis.xyz/f/van3wn.webp',
                'https://cdn.neoapis.xyz/f/ygbj35.webp',
                'https://cdn.neoapis.xyz/f/8ijynk.webp'
            ]
            const pickRandom = stikerRandom[Math.floor(Math.random() * stikerRandom.length)]
            await xp.sendMessage(groupId, { sticker: { url: pickRandom } }, { quoted: m })
            lastRandomSticker.set(groupId, now)
        }
    } catch (e) {
        console.error('Error Auto Stiker:', e)
    }
}
