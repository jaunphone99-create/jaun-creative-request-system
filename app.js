/**
 * JAUN Creative Request System - Main Application
 * Entry point และ router
 */

const App = {
    currentView: 'login',
    currentParams: null,

    /**
     * เริ่มต้นแอปพลิเคชัน
     */
    async init() {
        console.log('🚀 Initializing JAUN Creative Request System...');

        // ตรวจสอบ config
        if (CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            this.showConfigError();
            return;
        }

        // ตรวจสอบ session
        if (Auth.checkSession()) {
            const user = Auth.getUser();
            this.currentView = user.role === 'user' ? 'userDashboard' : 'adminDashboard';
        }

        // Render
        await this.render();

        console.log('✅ App initialized');
    },

    /**
     * แสดงข้อผิดพลาดเมื่อยังไม่ได้ตั้งค่า
     */
    showConfigError() {
        const app = document.getElementById('app');
        app.innerHTML = `
      <div class="login-page">
        <div class="login-card fade-in">
          <h1 class="login-title" style="color: var(--color-danger);">${Icons.get('alert')} ยังไม่ได้ตั้งค่า</h1>
          <p class="login-subtitle">กรุณาแก้ไขไฟล์ <code>js/config.js</code></p>
          
          <div class="alert alert-danger text-left">
            <p><strong>สิ่งที่ต้องแก้ไข:</strong></p>
            <ol style="margin: 16px 0; padding-left: 20px;">
              <li>ใส่ URL ของ Google Apps Script ที่ <code>API_URL</code></li>
              <li>ใส่ Google Client ID ที่ <code>GOOGLE_CLIENT_ID</code></li>
              <li>แก้ไข <code>SUPER_ADMIN_EMAILS</code> ตามต้องการ</li>
            </ol>
          </div>
          
          <p style="color: var(--color-medium-grey); font-size: 0.9rem;">
            ดูคู่มือใน README.md
          </p>
        </div>
      </div>
    `;
    },

    /**
     * Navigate ไปหน้าอื่น
     */
    async navigate(view, params = null) {
        /**
         * แยก "วาดหน้าเดิมซ้ำ" ออกจาก "เปลี่ยนหน้าจริง"
         *
         * ทุกครั้งที่แอดมินกดอนุมัติ/ปฏิเสธ ระบบจะเรียก navigate('adminDashboard')
         * ทั้งที่อยู่หน้านั้นอยู่แล้ว ถ้าเลื่อนขึ้นบนสุดทุกครั้ง คนที่ไล่เคลียร์งาน
         * ที่อยู่กลางรายการจะต้องเลื่อนลงมาใหม่ทุกรอบ
         */
        const isRefresh = this.currentView === view;
        const scrollY = window.scrollY;

        this.currentView = view;
        this.currentParams = params;
        await this.render();

        /**
         * ต้องใส่ behavior: 'instant' เพราะ CSS ตั้ง scroll-behavior: smooth ไว้
         * (มีไว้ให้ลิงก์ในหน้าเลื่อนนุ่มๆ) ถ้าไม่กำหนด การกู้ตำแหน่งจะกลายเป็น
         * แอนิเมชันไล่ลงมาหลังกดปุ่ม ซึ่งดูกระตุกและช้ากว่าเดิม
         *
         * render() อาจเด้งกลับหน้า login เองถ้า session หลุด กรณีนั้นถือว่าเปลี่ยนหน้า
         */
        const top = (isRefresh && this.currentView === view) ? scrollY : 0;
        window.scrollTo({ top, behavior: 'instant' });
    },

    /**
     * Render หน้าปัจจุบัน
     */
    async render() {
        const app = document.getElementById('app');
        if (!app) return;

        let html = '';

        switch (this.currentView) {
            case 'login':
                html = Pages.renderLogin();
                break;

            case 'userDashboard':
                if (!Auth.isLoggedIn()) {
                    html = Pages.renderLogin();
                    this.currentView = 'login';
                } else {
                    html = await Pages.renderUserDashboard();
                }
                break;

            case 'adminDashboard':
                if (!Auth.isLoggedIn()) {
                    html = Pages.renderLogin();
                    this.currentView = 'login';
                } else {
                    html = await Pages.renderAdminDashboard();
                }
                break;

            case 'createRequest':
                if (!Auth.isLoggedIn()) {
                    html = Pages.renderLogin();
                    this.currentView = 'login';
                } else {
                    html = Pages.renderCreateRequest();
                }
                break;

            case 'editRequest':
                if (!Auth.isLoggedIn()) {
                    html = Pages.renderLogin();
                    this.currentView = 'login';
                } else {
                    html = await Pages.renderEditRequest(this.currentParams);
                }
                break;

            default:
                html = Pages.renderLogin();
                this.currentView = 'login';
        }

        app.innerHTML = html;

        // Call after-render hooks
        this.afterRender();
    },

    /**
     * เรียก after-render hooks
     */
    afterRender() {
        switch (this.currentView) {
            case 'login':
                Pages.afterRenderLogin();
                break;
            case 'adminDashboard':
                Pages.afterRenderAdminDashboard();
                break;
            case 'createRequest':
                Pages.afterRenderCreateRequest();
                break;
            case 'editRequest':
                Pages.afterRenderEditRequest();
                break;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
