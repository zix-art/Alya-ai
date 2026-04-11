import { createClient } from '@supabase/supabase-js'

// Kredensial Supabase milikmu
const supabaseUrl = 'https://djnvzveoqeynltpjluep.supabase.co'
const supabaseKey = 'Sb_publishable_lUaAvypwnnyBId-VFsOBvQ_I9x3cDtt'

// Membangun jembatan koneksi
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ Koneksi ke Supabase Cloud berhasil diinisialisasi!')

export default supabase
