# 🌸 Alya-Ai - WhatsApp Bot

Base script WhatsApp Bot Multi-Device (MD) menggunakan library Baileys. Script ini lumayan ringan tapi fiturnya udah lumayan padat, cocok buat dijadiin bot pribadi atau bot grup. 

Udah support AI, Jadibot (numpang bot via pairing code), Game, sama sistem management grup yang lumayan ketat.

## ✨ Fitur Andalan
- 🧠 **Smart AI** (Termai API + Voice Note balasan)
- 🤖 **Jadibot** (Bisa buka cabang bot pakai nomor lain via pairing code)
- 🎮 **Game & RPG** (Sambung kata, auto-farm, robbery)
- 🛡️ **Group Security** (Anti-link, Anti-badword, Anti-tag all, Auto-kick pasif)
- 🗂️ **Database Lokal** (Auto-save interval biar RAM gak bocor)
- 🎭 **Reaction Command** (Jalanin perintah cuma modal react emoji di chat)

---

## ⚙️ Persyaratan
Sebelum gas jalanin sc ini, pastiin alat-alat tempur di bawah ini udah ke-install:
- [Node.js](https://nodejs.org/en/) (Minimal v18 ke atas)
- [FFmpeg](https://ffmpeg.org/) (Wajib buat fitur stiker & audio)
- Git 

---

## 🚀 Cara Install & Run

### 📱 1. Via Termux (Android)
Kalau lu *run* di HP, mending sambil di-pantau aja karena kadang OS suka nge-kill proses Termux kalau RAM penuh.

1. Buka Termux, ketik command ini satu-satu:
   ```bash
   pkg update && pkg upgrade -y
   pkg install nodejs ffmpeg git yarn -y
   ```
2. Clone repo ini (atau ekstrak kalau lu punya file zip-nya):
   ```bash
   git clone [https://github.com/zix-art/Alya-ai.git](https://github.com/zix-art/Alya-ai.git)
   cd Alya-ai
   ```
3. Install module/dependencies:
   ```bash
   npm install
   ```
4. Jalanin botnya:
   ```bash
   npm start
   ```
5. Nanti bakal muncul tulisan disuruh masukin nomor WA. Masukin nomor bot lu (awalan 62), terus cek notif WA buat masukin **Pairing Code**.

### 💻 2. Via Panel Pterodactyl / Ocean (VPS)
Kalau mau on 24 jam tanpa bikin HP panas, ini paling *recommended*.

1. Login ke Panel lu.
2. Buat server baru, pastikan pilih **Egg Node.js** (Minimal versi 18/20).
3. Masuk ke menu **Files**, upload file script ini (bisa di-zip dulu trus di-unarchive di dalam panel).
4. Pastikan file `package.json` ada di luar (jangan di dalam folder lagi).
5. Masuk ke menu **Console**, lalu klik **Start**.
6. Panel biasanya bakal otomatis jalanin `npm install`. Tunggu aja prosesnya.
7. Kalau module udah ke-install, bot bakal minta nomor HP buat **Pairing Code** di konsol. Masukin nomor bot lu, terus masukin kodenya ke WA.
8. *Note:* Pastikan di server VPS/Panel lu udah terinstall `ffmpeg`. Kalau belum, minta tolong admin panelnya buat tambahin.

---

## 🛠️ Konfigurasi
Sebelum botnya disebarin, jangan lupa edit setingan utamanya biar bot ngenalin lu sebagai owner.

Buka file: `system/set/config.json`
```json
{
  "ownerSetting": {
    "ownerNumber": ["62888xxxxxx"], 
    "ownerName": "Izx"
  },
  "apikey": {
    "termai": {
      "key": "KODE_API_LU" 
    }
  }
}
```

---

## 📝 Catatan Penting
- Script ini murni pakai **Pairing Code**, gak pakai scan QR lagi biar lebih gampang loginnya.
- Folder `session` bakal otomatis kebuat di dalam folder `connect/` pas lu berhasil login. Jaga folder ini baik-baik, jangan disebar!
- Kalau bot sering *disconnect* / *rate limit*, matikan dulu botnya sekitar 15-30 menit baru nyalain lagi biar gak kena blokir sementar dari pihak WA.

---

## 🙏 Thanks To
- [Baileys](https://github.com/WhiskeySockets/Baileys) - Base library WhatsApp
- Izx / Yuli - Developer

*Enjoy coding! Kalo ada error, biasakan baca log di console dulu ngab.* ☕
