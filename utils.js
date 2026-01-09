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
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
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
