/**
 * JAUN Creative Request System - Dashboard
 * ตัวคำนวณตัวชี้วัด + กราฟสำหรับหน้า Admin
 *
 * ทุกตัวเลขคิดจากข้อมูลที่โหลดมาแล้วทั้งหมดในหน่วยความจำ ไม่ยิง API เพิ่ม
 * (Apps Script ช้าและไม่เสถียร การคำนวณฝั่งเบราว์เซอร์จึงเร็วกว่ามาก)
 */

const Metrics = {
  DAY: 86400000,
  OPEN_STATUS: ['pending', 'progress', 'revision'],

  has(v) { return v !== null && v !== undefined && String(v).trim() !== ''; },

  /* บางแถวเก็บปีเป็น พ.ศ. (เช่น 2569-02-06) ถ้าไม่แปลงกลับ
     JavaScript จะอ่านเป็นอีก 543 ปีข้างหน้า แล้วนับงานที่ส่งช้าว่าทันกำหนด */
  time(v) {
    if (!this.has(v)) return null;
    const d = new Date(v);
    let t = d.getTime();
    if (!isFinite(t)) return null;
    if (d.getUTCFullYear() > 2100) { d.setUTCFullYear(d.getUTCFullYear() - 543); t = d.getTime(); }
    return t;
  },

  median(arr) {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b), n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  },

  ageDays(t, now) { return (now - t) / this.DAY; },

  /**
   * เวลาตั้งแต่ส่งจนปิด จัดกลุ่มตาม "วันที่ส่ง" ไม่ใช่ "วันที่ปิด"
   *
   * ถ้าจัดตามวันที่ปิด งานที่ใช้เวลานานจะไปกองอยู่ในเดือนหลังๆ
   * ทำให้ดูเหมือนทีมช้าลงทั้งที่ไม่ได้ช้า (ตรวจแล้วกลับทิศจริง)
   *
   * windowDays คือ "เวลาสังเกต" ที่บังคับให้เท่ากันทั้งสองช่วงที่เอามาเทียบ
   * จำเป็นมาก เพราะงานที่เพิ่งส่งเมื่อวานยังไงก็ใช้เวลาได้ไม่เกิน 1 วัน
   * ถ้าเอามาปนกับงานเก่าที่มีเวลาเต็มที่ ช่วงล่าสุดจะดูเร็วกว่าเสมอทั้งที่ไม่จริง
   * จึงตัดงานที่อายุยังไม่ถึง windowDays ออก และตัดยอดทุกค่าไว้ที่ windowDays
   * (ตรวจยืนยันด้วย Kaplan-Meier ซึ่งเป็นวิธีมาตรฐานสำหรับข้อมูลที่ยังไม่จบ ได้ผลตรงกัน)
   *
   * งานที่ยังไม่ปิดนับด้วยอายุปัจจุบัน ซึ่งเป็นค่าต่ำสุดที่เป็นไปได้
   * งานที่ถูกตีกลับไม่นับ เพราะไม่มีวันปิด
   */
  leadTimesBySubmitCohort(requests, now, loDays, hiDays, windowDays) {
    const out = [];
    let submitted = 0;
    requests.forEach(r => {
      const sub = this.time(r.submittedAt);
      if (sub === null) return;
      const age = this.ageDays(sub, now);
      if (age < loDays || age >= hiDays) return;
      submitted++;
      if (windowDays && age < windowDays) return;   // ยังมีเวลาไม่ครบ เทียบไม่ได้
      let days;
      if (r.status === 'completed') {
        const done = this.time(r.completedAt);
        if (done === null || done < sub) return;
        days = (done - sub) / this.DAY;
      } else if (this.OPEN_STATUS.includes(r.status)) {
        days = age;
      } else {
        return;
      }
      out.push(windowDays ? Math.min(days, windowDays) : days);
    });
    out.submittedInWindow = submitted;
    return out;
  },

  openJobs(requests, now) {
    return requests
      .filter(r => this.OPEN_STATUS.includes(r.status) && this.time(r.submittedAt) !== null)
      .map(r => ({ ...r, ageDays: this.ageDays(this.time(r.submittedAt), now) }))
      .sort((a, b) => b.ageDays - a.ageDays);
  },

  ageBuckets(open) {
    const b = [
      { label: 'ไม่เกิน 3 วัน', n: 0, color: '#0A825B' },
      { label: '4–14 วัน',     n: 0, color: '#21417E' },
      { label: '15–30 วัน',    n: 0, color: '#A06606' },
      { label: 'เกิน 30 วัน',   n: 0, color: '#D03B3B' }
    ];
    open.forEach(r => {
      const a = r.ageDays;
      if (a <= 3) b[0].n++; else if (a <= 14) b[1].n++; else if (a <= 30) b[2].n++; else b[3].n++;
    });
    return b;
  },

  /* ส่งทันกำหนด - deadline เก็บเป็นต้นวัน จึงถือว่าทันถ้าส่งภายในสิ้นวันนั้น
     นับงานที่ยังเปิดอยู่แต่เลยกำหนดแล้วเป็น "ไม่ทัน" ด้วย
     ไม่งั้นงานที่ค้างจนเลยกำหนดจะหายไปจากตัวหาร ทำให้ตัวเลขดูดีเกินจริง */
  onTime(requests, now) {
    const done = requests.filter(r => r.status === 'completed' && this.has(r.deadline) && this.has(r.completedAt));
    const hit = done.filter(r => this.time(r.completedAt) <= this.time(r.deadline) + this.DAY - 1);
    const openLate = requests.filter(r =>
      this.OPEN_STATUS.includes(r.status) && this.has(r.deadline) && this.time(r.deadline) + this.DAY - 1 < now);
    const denom = done.length + openLate.length;
    return { hit: hit.length, denom, openLate: openLate.length, pct: denom ? Math.round(100 * hit.length / denom) : null };
  },

  monthlyFlow(requests, now) {
    const inM = {}, outM = {};
    requests.forEach(r => {
      const s = this.time(r.submittedAt);
      if (s !== null) { const k = this.monthKey(s); inM[k] = (inM[k] || 0) + 1; }
      if (r.status === 'completed') {
        const c = this.time(r.completedAt);
        if (c !== null) { const k = this.monthKey(c); outM[k] = (outM[k] || 0) + 1; }
      }
    });
    const keys = [...new Set([...Object.keys(inM), ...Object.keys(outM)])].sort();
    const curKey = this.monthKey(now);
    return keys.map(k => ({
      key: k,
      inCount: inM[k] || 0,
      outCount: outM[k] || 0,
      partial: k === curKey            // เดือนปัจจุบันยังไม่ครบ อย่าอ่านเทียบเดือนเต็ม
    }));
  },

  monthKey(t) { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); },

  byService(requests, now) {
    const map = {};
    requests.forEach(r => {
      const k = r.serviceType || '(ไม่ระบุ)';
      const m = map[k] || (map[k] = { id: k, total: 0, rejected: 0, open: 0, leads: [] });
      m.total++;
      if (r.status === 'rejected') m.rejected++;
      if (this.OPEN_STATUS.includes(r.status)) m.open++;
      if (r.status === 'completed') {
        const s = this.time(r.submittedAt), c = this.time(r.completedAt);
        if (s !== null && c !== null && c >= s) m.leads.push((c - s) / this.DAY);
      }
    });
    return Object.values(map).map(m => ({
      ...m,
      medianDays: this.median(m.leads),
      n: m.leads.length,
      rejectPct: Math.round(100 * m.rejected / m.total),
      sharePct: Math.round(100 * m.total / requests.length)
    })).sort((a, b) => b.total - a.total);
  },

  /* ใช้ชื่อแผนกที่ติดมากับคำขอเอง (ครบ 596/596) ไม่ join ตารางผู้ใช้
     เพราะผู้ใช้ที่ถูกลบไปแล้วจะทำให้คำขอหายจากกราฟ
     รวมชื่อที่สะกดต่างกันโดยตัดช่องว่างทิ้ง (iPhoneแลกเงิน / iPhone แลกเงิน) */
  byDepartment(requests) {
    const map = {};
    requests.forEach(r => {
      const raw = this.has(r.submitterDepartment) ? String(r.submitterDepartment).trim() : '(ไม่ระบุแผนก)';
      const key = raw.replace(/\s+/g, '');
      const m = map[key] || (map[key] = { name: raw, total: 0, rejected: 0 });
      m.total++;
      if (r.status === 'rejected') m.rejected++;
    });
    return Object.values(map).map(m => ({ ...m, rejectPct: Math.round(100 * m.rejected / m.total) }))
      .sort((a, b) => b.total - a.total);
  },

  /* จัดกลุ่มเหตุผลตีกลับจากข้อความที่แอดมินพิมพ์เอง จึงเป็นการประมาณ
     แยกแค่ 2 กลุ่มที่แยกได้จริงด้วยคำเดียว ที่เหลือรวมเป็น "อื่นๆ"
     (เคยลองแยก "ส่งซ้ำ" แต่ทำซ้ำไม่ได้ คำว่า ซ้ำ ในข้อมูลหมายถึงเนื้อหาซ้ำ ไม่ใช่ส่งซ้ำ) */
  rejectionReasons(requests) {
    const rej = requests.filter(r => r.status === 'rejected');
    let clip = 0, other = 0;
    const samples = {};
    rej.forEach(r => {
      const t = this.has(r.rejectionReason) ? String(r.rejectionReason).trim() : '';
      if (/คลิป/.test(t)) { clip++; samples[t] = (samples[t] || 0) + 1; } else other++;
    });
    const top = Object.entries(samples).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => ({ text: t, n }));
    return { total: rej.length, clip, other, top, filled: rej.filter(r => this.has(r.rejectionReason)).length };
  }
};

/* ชื่อบริการภาษาไทยจาก CONFIG ถ้าหาไม่เจอให้ใช้ id เดิม */
function serviceName(id) {
  const s = (typeof CONFIG !== 'undefined' ? CONFIG.SERVICES : []).find(x => x.id === id);
  return s ? s.nameTh : id;
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const Charts = {
  instances: {},

  destroy(chartId) {
    if (this.instances[chartId]) {
      this.instances[chartId].destroy();
      delete this.instances[chartId];
    }
  },

  destroyAll() { Object.keys(this.instances).forEach(id => this.destroy(id)); },

  /* ค่าเริ่มต้นของ Chart.js ใช้ฟอนต์ระบบและหมุนป้ายเป็นแนวเฉียงเมื่อที่ไม่พอ
     ซึ่งอ่านยากมากกับตัวอักษรไทย จึงตั้งทับไว้ที่เดียว */
  applyDefaults() {
    if (typeof Chart === 'undefined' || this._defaultsDone) return;
    Chart.defaults.font.family = "'Prompt', 'Poppins', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#616774';
    Chart.defaults.plugins.tooltip.backgroundColor = '#0B1E41';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont = { family: "'Prompt', sans-serif", weight: '600' };
    Chart.defaults.plugins.tooltip.bodyFont = { family: "'Prompt', sans-serif" };
    this._defaultsDone = true;
  },

  // ==================== ส่วนที่ 1: ตัวเลขสรุปหัวหน้า ====================

  /**
   * การ์ดตัวเลขหลัก - ทุกใบต้องบอก "คิดจากกี่รายการ" กำกับเสมอ
   * เพราะบางตัวชี้วัดคิดได้จากข้อมูลบางส่วนเท่านั้น ถ้าไม่บอกจะเข้าใจผิดว่าวัดครบทั้งระบบ
   */
  renderKpis(requests, now) {
    const M = Metrics;
    const open = M.openJobs(requests, now);
    const stuck = open.filter(r => r.ageDays > 30);
    const oldest = open.length ? Math.round(open[0].ageDays) : 0;

    /* W คือเวลาสังเกตที่ให้ทั้งสองช่วงเท่ากัน 30 วัน
       ไม่งั้นช่วงล่าสุดจะมีงานที่เพิ่งส่งเมื่อวานปนอยู่ แล้วดูเร็วกว่าเสมอทั้งที่ไม่จริง */
    const W = 30;
    const recent = M.leadTimesBySubmitCohort(requests, now, W, 90, W);
    const prior = M.leadTimesBySubmitCohort(requests, now, 90, 180, W);
    const medRecent = M.median(recent), medPrior = M.median(prior);
    let leadTrend = 'ยังเทียบไม่ได้';
    let leadTone = 'flat';
    if (medRecent != null && medPrior != null && medPrior > 0) {
      const pct = Math.round((medRecent - medPrior) / medPrior * 100);
      leadTone = pct < 0 ? 'good' : (pct > 0 ? 'bad' : 'flat');
      leadTrend = pct === 0 ? 'เท่าเดิม' : (pct < 0 ? `เร็วขึ้น ${Math.abs(pct)}%` : `ช้าลง ${pct}%`);
    }

    const rej = requests.filter(r => r.status === 'rejected').length;
    const rejPct = Math.round(100 * rej / requests.length);

    const ot = M.onTime(requests, now);
    const withDeadline = requests.filter(r => M.has(r.deadline));
    const dlServices = [...new Set(withDeadline.map(r => serviceName(r.serviceType)))];

    const tiles = [
      {
        label: 'งานที่ยังไม่ปิด',
        value: open.length,
        unit: 'งาน',
        sub: stuck.length
          ? `ในนั้น <strong>${stuck.length} งานค้างเกิน 30 วัน</strong> · เก่าสุด ${oldest} วัน`
          : 'ไม่มีงานค้างเกิน 30 วัน',
        tone: stuck.length ? 'bad' : 'good',
        coverage: `คิดจากทั้ง ${requests.length} รายการ`,
        full: true
      },
      {
        label: 'เวลาตั้งแต่ส่งจนปิดงาน',
        value: medRecent != null ? medRecent.toFixed(1) : '—',
        unit: 'วัน',
        sub: `เทียบช่วง 90 วันก่อนหน้า (${medPrior != null ? medPrior.toFixed(1) : '—'} วัน) — <strong>${leadTrend}</strong>`,
        tone: leadTone,
        coverage: `เทียบเฉพาะงานที่มีเวลาแล้วอย่างน้อย ${W} วันเท่ากันทั้งสองช่วง — ${recent.length} จาก ${recent.submittedInWindow} งานที่รับเข้ามาในช่วงนี้ · ไม่นับงานที่ถูกตีกลับ · งานที่ยังค้างนับด้วยอายุปัจจุบัน`,
        full: false
      },
      {
        label: 'งานที่ถูกตีกลับ',
        value: rejPct,
        unit: '%',
        sub: `${rej} จาก ${requests.length} งาน`,
        tone: 'flat',
        coverage: `คิดจากทั้ง ${requests.length} รายการ`,
        full: false
      },
      {
        label: 'ส่งทันกำหนด',
        value: ot.pct != null ? ot.pct : '—',
        unit: '%',
        sub: `${ot.hit} จาก ${ot.denom} งาน${ot.openLate ? ` (รวมงานค้างที่เลยกำหนดแล้ว ${ot.openLate} งาน)` : ''}`,
        tone: ot.pct != null && ot.pct >= 80 ? 'good' : 'bad',
        coverage: `มีแค่ ${dlServices.join(' และ ')} ที่ฟอร์มถามวันกำหนดส่ง — พูดแทนงาน ${Math.round(100 * withDeadline.length / requests.length)}% ของระบบ`,
        partial: true,
        full: false
      }
    ];

    return `
      <div class="kpi-grid">
        ${tiles.map(t => `
          <div class="kpi-tile ${t.full ? 'kpi-tile-wide' : ''} ${t.partial ? 'kpi-tile-partial' : ''}">
            <div class="kpi-label">${t.label}</div>
            <div class="kpi-value kpi-${t.tone}">${t.value}<span class="kpi-unit">${t.unit}</span></div>
            <div class="kpi-sub">${t.sub}</div>
            <div class="kpi-coverage">${Icons.get('info')} ${t.coverage}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ==================== ส่วนที่ 2: งานค้าง ====================

  renderStuckWork(requests, now) {
    const M = Metrics;
    const open = M.openJobs(requests, now);
    if (!open.length) {
      return `<div class="panel"><div class="panel-head"><h3>งานที่ยังไม่ปิด</h3></div>
        <p class="panel-empty">${Icons.get('check')} ไม่มีงานค้างอยู่เลย</p></div>`;
    }
    const buckets = M.ageBuckets(open);
    const top = open.slice(0, 5);
    const statusLabel = s => (CONFIG.STATUS_CONFIG[s] && CONFIG.STATUS_CONFIG[s].label) || s;

    return `
      <div class="panel">
        <div class="panel-head">
          <h3>งานที่ยังไม่ปิด ${open.length} งาน — แยกตามอายุ</h3>
          <p class="panel-note">นับจากวันที่ส่งคำขอถึงวันนี้</p>
        </div>

        <div class="agebar">
          ${buckets.filter(b => b.n > 0).map(b => `
            <div class="agebar-seg" style="flex: ${b.n}; background: ${b.color};" title="${b.label} ${b.n} งาน">
              <span class="agebar-n">${b.n}</span>
            </div>`).join('')}
        </div>
        <div class="agebar-key">
          ${buckets.map(b => `
            <span class="agebar-key-item">
              <span class="agebar-dot" style="background: ${b.color}"></span>${b.label} <strong>${b.n}</strong>
            </span>`).join('')}
        </div>

        <div class="panel-sub">งานที่ค้างนานที่สุด — ต้องตัดสินใจว่าจะทำต่อหรือปิดทิ้ง</div>
        <ul class="stuck-list">
          ${top.map(r => `
            <li class="stuck-item">
              <span class="stuck-days ${r.ageDays > 30 ? 'stuck-days-bad' : ''}">${Math.round(r.ageDays)}<small>วัน</small></span>
              <span class="stuck-body">
                <span class="stuck-name">${Utils.escapeHtml(r.projectName || '(ไม่มีชื่อโครงการ)')}</span>
                <span class="stuck-meta">${statusLabel(r.status)} · ${serviceName(r.serviceType)} · ${Utils.escapeHtml(r.submitterDepartment || 'ไม่ระบุแผนก')}</span>
              </span>
              <button class="btn btn-sm btn-secondary" onclick="Components.showRequestDetail('${r.id}')">${Icons.get('eye')} ดู</button>
            </li>`).join('')}
        </ul>
      </div>
    `;
  },

  // ==================== ส่วนที่ 3: งานเข้า เทียบ งานที่ปิดได้ ====================

  renderFlowChart(canvasId, requests, now) {
    this.destroy(canvasId);
    this.applyDefaults();
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    /* เก็บแค่ 13 เดือนท้าย ไม่งั้นพอข้อมูลเกินปี ชื่อเดือนจะซ้ำกันจนอ่านไม่รู้เรื่อง
       และป้ายจะเบียดกันเพิ่มขึ้นทุกเดือนที่ผ่านไป */
    const all = Metrics.monthlyFlow(requests, now);
    const rows = all.slice(-13);
    const multiYear = new Set(rows.map(m => m.key.slice(0, 4))).size > 1;
    const labels = rows.map(m => {
      const [y, mm] = m.key.split('-');
      /* ปีในระบบเป็น ค.ศ. แต่คนไทยอ่าน พ.ศ. จึงบวก 543 แล้วเอาสองหลักท้าย */
      const yr = multiYear ? ' ' + String(Number(y) + 543).slice(-2) : '';
      return THAI_MONTHS[Number(mm) - 1] + yr + (m.partial ? '*' : '');
    });

    this.instances[canvasId] = new Chart(canvas, {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'งานเข้า',
            data: rows.map(m => m.inCount),
            /* เดือนปัจจุบันยังนับไม่ครบ ใช้สีอ่อนกว่าเพื่อไม่ให้อ่านเป็นขาลง
               แต่ต้องไม่อ่อนจนมองไม่เห็น #7E90B4 ได้ความคมชัด 3.05:1 ผ่านเกณฑ์ 3:1 พอดี
               (#A7B4CE ที่ลองก่อนหน้าได้แค่ 2.02:1 จางจนแท่งหายไปจากสายตา) */
            backgroundColor: rows.map(m => m.partial ? '#7E90B4' : '#21417E'),
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.62,
            categoryPercentage: 0.78,
            order: 2
          },
          {
            type: 'line',
            label: 'ทำเสร็จ',
            /* สีส้มเข้ม เพราะส้มสดของแบรนด์บนพื้นขาวได้ความคมชัดแค่ 2.83:1 ไม่ผ่านเกณฑ์ 3:1 */
            data: rows.map(m => m.outCount),
            borderColor: '#C35608',
            borderWidth: 3,
            tension: 0.35,
            fill: false,
            pointBackgroundColor: '#F86E0B',
            pointBorderColor: '#FBFBFB',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 14, usePointStyle: true, sort: (a, b) => a.datasetIndex - b.datasetIndex }
          },
          tooltip: {
            callbacks: {
              afterBody: items => rows[items[0].dataIndex].partial ? 'เดือนนี้ยังไม่จบ ตัวเลขจะเพิ่มอีก' : ''
            }
          }
        },
        scales: {
          /* ไม่หมุนป้าย: ชื่อเดือนไทยย่อสั้นพอ บังคับ maxRotation 0 กันไม่ให้ Chart.js หมุนเอง */
          /* ห้ามหมุนป้ายเด็ดขาด (ตัวอักษรไทยเอียงแล้วอ่านไม่ออก)
             ถ้าที่ไม่พอให้ข้ามป้ายบางอันแทน ซึ่งยังอ่านออก */
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 8 } },
          y: { beginAtZero: true, border: { display: false }, grid: { color: '#EAE8E7' }, ticks: { precision: 0 } }
        }
      }
    });
  },

  // ==================== ส่วนที่ 4-6: รายการจัดอันดับ (ไม่ใช้ Chart.js) ====================

  /**
   * แถวจัดอันดับพร้อมแถบในบรรทัด
   *
   * ใช้ HTML แทนกราฟแท่งเพราะ: ชื่อบริการ/แผนกภาษาไทยยาว 12-18 ตัวอักษร
   * พอเอาไปเป็นแกนของ Chart.js จะถูกหมุนเป็นแนวเฉียงจนอ่านไม่ออก
   * ส่วนข้อความ HTML นอนราบเสมอ เลือกคัดลอกได้ และโปรแกรมอ่านหน้าจอก็อ่านได้
   */
  rankRows(items) {
    const max = Math.max(...items.map(i => i.value), 1);
    return items.map(i => `
      <li class="rank-row">
        <div class="rank-head">
          <span class="rank-name">${Utils.escapeHtml(i.name)}</span>
          <span class="rank-value">${i.value}<small>${i.unit || ''}</small></span>
        </div>
        <div class="rank-track">
          <div class="rank-fill" style="width: ${Math.max(2, Math.round(100 * i.value / max))}%; background: ${i.color || '#21417E'}"></div>
        </div>
        ${i.detail ? `<div class="rank-detail">${i.detail}</div>` : ''}
      </li>`).join('');
  },

  renderServiceTable(requests, now) {
    const rows = Metrics.byService(requests, now);
    /* เทียบกับค่ากลางของทั้งสตูดิโอ ไม่ใช่เลขที่ตั้งขึ้นมาเอง
       และไม่ลงสีถ้าคิดจากงานน้อยกว่า 20 ชิ้น เพราะค่ากลางยังไม่นิ่งพอจะตัดสิน */
    const MIN_N = 20;
    const allLeads = rows.flatMap(r => r.leads);
    const overall = Metrics.median(allLeads);
    return `
      <div class="panel">
        <div class="panel-head">
          <h3>บริการไหนกินเวลาและกินคิวมากที่สุด</h3>
          <p class="panel-note">ถ้าจะแก้จุดเดียวให้ได้ผลมากที่สุด ให้ดูแถวบนสุด</p>
        </div>
        <div class="svc-table" role="table">
          <div class="svc-head" role="row">
            <span role="columnheader">บริการ</span>
            <span role="columnheader">จำนวนงาน</span>
            <span role="columnheader">เวลาทำ</span>
            <span role="columnheader">ตีกลับ</span>
            <span role="columnheader">ค้างอยู่</span>
          </div>
          ${rows.map(s => {
            const judged = s.medianDays != null && s.n >= MIN_N && overall != null;
            const slow = judged && s.medianDays > overall;
            const fast = judged && s.medianDays < overall / 2;
            const hiRej = s.rejectPct >= 20;
            return `
            <div class="svc-row" role="row">
              <span class="svc-name" role="cell">
                ${Utils.escapeHtml(serviceName(s.id))}
                <span class="svc-track"><span class="svc-fill" style="width:${s.sharePct}%"></span></span>
              </span>
              <span role="cell"><strong>${s.total}</strong> <small>${s.sharePct}%</small></span>
              <span role="cell" class="${slow ? 'val-bad' : (fast ? 'val-good' : '')}">
                ${s.medianDays != null ? s.medianDays.toFixed(1) + ' วัน' : '—'}
                <small>n=${s.n}${judged ? '' : ' · น้อยเกินจะตัดสิน'}</small>
              </span>
              <span role="cell" class="${hiRej ? 'val-bad' : ''}">${s.rejectPct}%</span>
              <span role="cell">${s.open}</span>
            </div>`;
          }).join('')}
        </div>
        <p class="panel-foot">
          "เวลาทำ" คือค่ากลางของงานที่ปิดจบแล้วเท่านั้น n คือจำนวนงานที่คิดได้ — งานที่ยังค้างไม่ถูกนับ ของจริงจึงนานกว่านี้<br>
          <span class="val-bad">สีแดง</span> = ช้ากว่าค่ากลางของทั้งสตูดิโอ (${overall != null ? overall.toFixed(1) : '—'} วัน) ·
          <span class="val-good">สีเขียว</span> = เร็วกว่าครึ่งหนึ่งของค่ากลาง · บริการที่มีงานน้อยกว่า ${MIN_N} ชิ้นไม่ลงสี
        </p>
      </div>`;
  },

  renderDepartments(requests) {
    const rows = Metrics.byDepartment(requests).map(d => ({
      name: d.name,
      value: d.total,
      unit: ' งาน',
      color: '#21417E',
      detail: `ถูกตีกลับ <strong class="${d.rejectPct >= 20 ? 'val-bad' : ''}">${d.rejectPct}%</strong>`
    }));
    return `
      <div class="panel">
        <div class="panel-head">
          <h3>งานมาจากแผนกไหน</h3>
          <p class="panel-note">รวมชื่อที่สะกดต่างกันเป็นแผนกเดียวแล้ว</p>
        </div>
        <ul class="rank-list">${this.rankRows(rows)}</ul>
      </div>`;
  },

  renderRejectionReasons(requests) {
    const r = Metrics.rejectionReasons(requests);
    if (!r.total) return '';
    const rows = [
      { name: 'เกี่ยวกับคลิป (ไม่มีคลิป / คลิปไม่สมบูรณ์)', value: r.clip, unit: ' งาน', color: '#D03B3B',
        detail: r.top.length ? 'พบบ่อยสุด: ' + r.top.map(t => `"${Utils.escapeHtml(t.text)}" ${t.n} ครั้ง`).join(' · ') : '' },
      { name: 'เหตุผลอื่นๆ', value: r.other, unit: ' งาน', color: '#616774',
        detail: 'เป็นเหตุผลเฉพาะเรื่อง กระจายกันไป ไม่มีกลุ่มก้อนชัดเจน' }
    ];
    return `
      <div class="panel">
        <div class="panel-head">
          <h3>ทำไมงานถึงถูกตีกลับ ${r.total} งาน</h3>
          <p class="panel-note">จัดกลุ่มจากข้อความที่แอดมินพิมพ์เอง จึงเป็นการประมาณ (กรอกเหตุผลครบ ${r.filled}/${r.total})</p>
        </div>
        <ul class="rank-list">${this.rankRows(rows)}</ul>
      </div>`;
  },

  // ==================== ประกอบทั้งหมด ====================

  /** คืน HTML ทั้งบล็อกให้ pages.js เอาไปวาง (กราฟ Chart.js วาดทีหลังใน renderAll) */
  dashboardHtml(requests) {
    if (!requests || !requests.length) {
      return `<div class="panel"><p class="panel-empty">ยังไม่มีข้อมูลพอสำหรับสรุปผล</p></div>`;
    }
    const now = Date.now();
    return `
      ${this.renderKpis(requests, now)}
      ${this.renderStuckWork(requests, now)}
      <div class="panel">
        <div class="panel-head">
          <h3>งานเข้า เทียบ งานที่ทำเสร็จ รายเดือน</h3>
          <p class="panel-note">ดูว่าปริมาณงานที่รับเข้ามาแต่ละเดือนขึ้นหรือลง และเดือนไหนทำเสร็จได้มากน้อยแค่ไหน</p>
        </div>
        <div class="panel-chart"><canvas id="chart-flow"></canvas></div>
        <p class="panel-foot">
          ห้ามอ่านช่องว่างระหว่างแท่งกับเส้นว่าเป็น "งานค้างที่เพิ่มขึ้น" เพราะสองเส้นนี้นับคนละกลุ่มกัน:
          แท่งนับงานตามเดือนที่รับเข้ามา ส่วนเส้นนับตามเดือนที่ทำเสร็จ (ซึ่งอาจเป็นงานของเดือนก่อนๆ)
          และงานที่ถูกตีกลับ ${requests.filter(r => r.status === 'rejected').length} งานไม่มีวันที่บันทึกไว้
          จึงไม่ปรากฏบนเส้นเลย ทั้งที่ออกจากคิวไปแล้ว<br>
          ตัวเลขงานค้างจริงอยู่ที่กล่องด้านบน · * เดือนปัจจุบันยังไม่จบ ตัวเลขจะเพิ่มอีก
        </p>
      </div>
      ${this.renderServiceTable(requests, now)}
      <div class="panel-pair">
        ${this.renderDepartments(requests)}
        ${this.renderRejectionReasons(requests)}
      </div>
    `;
  },

  /** วาดกราฟ Chart.js หลัง HTML ถูกใส่ลง DOM แล้ว */
  renderAll(requests) {
    this.destroyAll();
    if (!requests || !requests.length) return;
    setTimeout(() => this.renderFlowChart('chart-flow', requests, Date.now()), 60);
  }
};
