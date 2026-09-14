
/**
 * ชุดไอคอนเส้นของระบบ
 *
 * ทำไมไม่ใช้อิโมจิ: อิโมจิถูกวาดโดยระบบปฏิบัติการ หน้าตาจึงต่างกันคนละแบบ
 * ใน Mac / Windows / Android และสีสันฉูดฉาดไม่เข้ากับ CI ของบริษัท
 *
 * ไอคอนพวกนี้รับสีจาก CSS ผ่าน currentColor และปรับขนาดตาม font-size
 * ของข้อความรอบๆ เอง (ดู .icon ใน styles.css) จึงวางแทนอิโมจิได้ตรงตำแหน่งเดิม
 *
 * รูปทรงอ้างอิงจากชุด Lucide (สัญญาอนุญาต ISC ใช้ได้ฟรี)
 */
const Icons = {
    _p: {
        clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
        x: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
        file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
        refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        plus: '<path d="M5 12h14M12 5v14"/>',
        building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
        trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
        pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
        chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
        search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
        arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
        image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
        bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
        pin: '<path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
        ruler: '<path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/>',
        video: '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>',
        camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
        film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M17 7.5h4M3 12h18M3 16.5h4M17 16.5h4"/>',
        link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
        arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
        dot: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>'
    },

    /**
     * คืนโค้ด SVG ของไอคอน
     * @param {string} name  ชื่อไอคอน (ดูรายการใน _p)
     * @param {string} cls   คลาสเพิ่มเติม เช่น 'icon-lg'
     */
    get(name, cls) {
        const path = this._p[name];
        if (!path) {
            console.warn('ไม่มีไอคอนชื่อ: ' + name);
            return '';
        }
        return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" '
            + 'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" '
            + 'aria-hidden="true">' + path + '</svg>';
    }
};

Object.freeze(Icons);

/**
 * JAUN Creative Request System - Utilities
 * ฟังก์ชันช่วยเหลือต่างๆ
 */

const Utils = {
    /**
     * แสดง Toast notification
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
      <span>${this.getToastIcon(type)}</span>
      <span>${this.escapeHtml(message)}</span>
    `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * ดึง icon ตาม toast type
     */
    getToastIcon(type) {
        const icons = {
            success: Icons.get('check'),
            error: Icons.get('x'),
            warning: Icons.get('alert'),
            info: Icons.get('message')
        };
        return icons[type] || icons.info;
    },

    /**
     * แสดง Loading overlay
     */
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    /**
     * ซ่อน Loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    /**
     * Escape HTML เพื่อป้องกัน XSS
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    /**
     * Escape สำหรับใส่ใน attribute เช่น value="..."
     * escapeHtml ใช้ textContent -> innerHTML ซึ่งแปลงแค่ & < > (ไม่แปลง ")
     * ถ้าค่ามีเครื่องหมาย " จะไปปิด attribute ก่อนกำหนด ทำให้ข้อความถูกตัดหาย
     */
    escapeAttr(text) {
        return this.escapeHtml(text).replace(/"/g, '&quot;');
    },

    /**
     * Format วันที่เป็นภาษาไทย
     */
    formatDate(dateString) {
        if (!dateString) return '-';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    },

    /**
     * Format วันที่และเวลา
     */
    formatDateTime(dateString) {
        if (!dateString) return '-';

        try {
            const date = new Date(dateString);
            return date.toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    },

    /**
     * ดึงข้อมูล Service จาก ID
     */
    getService(serviceId) {
        return CONFIG.SERVICES.find(s => s.id === serviceId);
    },

    /**
     * ดึงข้อมูล Status
     */
    getStatus(statusKey) {
        return CONFIG.STATUS_CONFIG[statusKey];
    },

    /**
     * สร้าง UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * ตรวจสอบว่า URL ถูกต้องหรือไม่
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    /**
     * สร้าง options สำหรับ Select element
     */
    createSelectOptions(options, selectedValue = '') {
        return options.map(opt => {
            const value = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            const selected = value === selectedValue ? 'selected' : '';
            return `<option value="${this.escapeHtml(value)}" ${selected}>${this.escapeHtml(label)}</option>`;
        }).join('');
    },

    /**
     * สร้าง Modal
     */
    createModal(title, content, footer = '') {
        const modalHtml = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">${this.escapeHtml(title)}</h3>
            <button class="modal-close" onclick="Utils.closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      </div>
    `;

        // Remove existing modal
        this.closeModal();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Close on overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', this.handleEscapeKey);
    },

    /**
     * ปิด Modal
     */
    closeModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.remove();
        }
        document.removeEventListener('keydown', this.handleEscapeKey);
    },

    /**
     * Handle Escape key
     */
    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            Utils.closeModal();
        }
    },

    /**
     * Confirm dialog
     */
    confirm(title, message) {
        return new Promise((resolve) => {
            const content = `<p>${this.escapeHtml(message)}</p>`;
            const footer = `
        <button class="btn btn-secondary" onclick="Utils.closeModal(); window._confirmResolve(false);">ยกเลิก</button>
        <button class="btn btn-primary" onclick="Utils.closeModal(); window._confirmResolve(true);">ยืนยัน</button>
      `;

            window._confirmResolve = resolve;
            this.createModal(title, content, footer);
        });
    },

    /**
     * Prompt dialog
     */
    prompt(title, label, placeholder = '') {
        return new Promise((resolve) => {
            const content = `
        <div class="form-group">
          <label class="form-label">${this.escapeHtml(label)}</label>
          <textarea id="prompt-input" class="form-textarea" placeholder="${this.escapeHtml(placeholder)}" rows="3"></textarea>
        </div>
      `;
            const footer = `
        <button class="btn btn-secondary" onclick="Utils.closeModal(); window._promptResolve(null);">ยกเลิก</button>
        <button class="btn btn-primary" onclick="const v = document.getElementById('prompt-input').value; Utils.closeModal(); window._promptResolve(v);">ยืนยัน</button>
      `;

            window._promptResolve = resolve;
            this.createModal(title, content, footer);

            // Focus input
            setTimeout(() => {
                const input = document.getElementById('prompt-input');
                if (input) input.focus();
            }, 100);
        });
    }
};

// Freeze Utils object
Object.freeze(Utils);
