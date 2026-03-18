import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Konfigurasi Wink AI
const API = {
  BASE: 'https://wink.ai',
  STRATEGY: 'https://strategy.app.meitudata.com',
  QINIU: 'https://up-qagw.meitudata.com',
};

const CLIENT = {
  ID: '1189857605',
  VERSION: '3.7.1',
  LANGUAGE: 'en_US',
};

const TASK = {
  HD: { type: 2, label: 'HD Image', content_type: 1, beans: 2, free: true },
  ULTRA_HD: { type: 12, label: 'Ultra HD Image', content_type: 1, beans: 4, free: true },
};

const TYPE_PARAMS = { is_mirror: 0, orientation_tag: 1, j_420_trans: '1', return_ext: '2' };
const RIGHT_DETAIL = { source: '4', touch_type: '4', function_id: '630', material_id: '63001' };

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadOrCreateGnum() {
  const tmpDir = path.resolve('./tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  
  const f = path.join(tmpDir, '.wink_gnum');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  
  const ts = Date.now().toString(16);
  const r1 = Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12);
  const r2 = Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12);
  const g = `${ts}-${r1}-10462c6e-288000-${ts}${r2.slice(0, 3)}`;
  
  fs.writeFileSync(f, g);
  return g;
}

class WinkClient {
  constructor() {
    this.gnum = loadOrCreateGnum();
    this.country = 'ID';
    this.timezone = 'Asia/Jakarta';

    this.http = axios.create({
      baseURL: API.BASE,
      timeout: 60000,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': API.BASE,
        'Referer': `${API.BASE}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  _p(extra = {}) {
    return {
      client_id: CLIENT.ID,
      version: CLIENT.VERSION,
      country_code: this.country,
      gnum: this.gnum,
      client_language: CLIENT.LANGUAGE,
      client_timezone: this.timezone,
      ...extra,
    };
  }

  async init() {
    const p = this._p();
    await Promise.allSettled([
      this.http.get('/api/init.json', { params: p }),
      this.http.get('/api/meitu_ai/task_type_config.json', { params: p }),
      this.http.get('/api/meitu_ai_task_group/get_config.json', { params: p }),
    ]);
  }

  async uploadFile(filePath) {
    const ext = path.extname(filePath).toLowerCase() || '.jpg';
    
    const signRes = await this.http.get('/api/file/get_maat_sign.json', {
      params: this._p({ suffix: ext, type: 'temp', count: 1 }),
    });
    const sign = signRes.data?.data;
    if (!sign?.sig) throw new Error('Gagal mendapatkan signature upload AI');

    const policyRes = await axios.get(`${API.STRATEGY}/upload/policy`, {
      params: { app: sign.app || 'wink', count: 1, sig: sign.sig, sigTime: sign.sig_time, sigVersion: sign.sig_version, suffix: ext, type: 'temp' },
      timeout: 15000,
    });
    const qiniu = policyRes.data?.[0]?.qiniu;
    if (!qiniu?.token) throw new Error('Gagal mendapatkan akses server gambar');

    const form = new FormData();
    form.append('token', qiniu.token);
    form.append('key', qiniu.key);
    form.append('file', fs.createReadStream(filePath));

    const uploadRes = await axios.post(qiniu.url || API.QINIU, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });
    
    return { fileKey: qiniu.key, fileUrl: uploadRes.data.url };
  }

  async submitTask(upload, taskCfg) {
    const taskName = `${taskCfg.label.replace(/\s+/g, '_')}-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    const bodyParams = new URLSearchParams({
      ...this._p(),
      type: taskCfg.type,
      source_url: upload.fileUrl,
      content_type: taskCfg.content_type,
      ext_params: JSON.stringify({ task_name: taskName, records: '2' }),
      type_params: JSON.stringify(TYPE_PARAMS),
      right_detail: JSON.stringify(RIGHT_DETAIL),
      with_prepare: 1,
    });

    const res = await this.http.post('/api/meitu_ai/delivery.json', bodyParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const delivery = res.data?.data;
    if (!delivery?.prepare_msg_id) throw new Error('Gagal mengirim antrean AI');

    return { prepareMsgId: delivery.prepare_msg_id };
  }

  async waitForResult(task, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    let msgId = task.prepareMsgId;

    while (Date.now() < deadline) {
      await sleep(2000);
      let res;
      try {
        res = await this.http.get('/api/meitu_ai/query_batch.json', {
          params: { ...this._p(), msg_ids: msgId },
        });
      } catch { continue; }

      const item = res.data?.data?.item_list?.[0];
      if (!item) continue;

      if (msgId.startsWith('wpr_')) {
        const realId = item.result?.result;
        if (realId && realId !== msgId) msgId = realId;
        continue;
      }

      if (item.result?.error_code && item.result.error_code !== 0) {
        throw new Error(`AI Gagal: ${item.result.error_msg}`);
      }

      const media = item.result?.media_info_list;
      if (media?.length && media[0].media_data) {
        return media[0].media_data;
      }
    }
    throw new Error('Timeout! Proses terlalu lama.');
  }
}

// Fungsi utama yang diekspor untuk dipanggil dari command
export async function processRemini(filePath, type = 'hd') {
  const taskCfg = type === 'ultra' ? TASK.ULTRA_HD : TASK.HD;
  const client = new WinkClient();
  
  await client.init();
  const upload = await client.uploadFile(filePath);
  const task = await client.submitTask(upload, taskCfg);
  const resultUrl = await client.waitForResult(task);
  
  return resultUrl;
}
