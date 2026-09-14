/**
 * JAUN Creative Request System - Authentication Module
 * จัดการ Google Sign-In และสิทธิ์ผู้ใช้
 */

const Auth = {
    currentUser: null,
    isInitialized: false,

    /**
     * Initialize Google Sign-In
     */
    init() {
        if (this.isInitialized) return;

        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true
        });

        this.isInitialized = true;
    },

    /**
     * แสดงปุ่ม Google Sign-In
     */
    renderButton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        google.accounts.id.renderButton(container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 356   // ให้เต็มความกว้างการ์ด (เพดานของ Google คือ 400)
        });
    },

    /**
     * แสดง One Tap prompt
     */
    showOneTap() {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
                console.log('One Tap not displayed:', notification.getNotDisplayedReason());
            }
        });
    },

    /**
     * Fallback: Trigger Google Sign-In popup manually
     */
    triggerGooglePrompt() {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            this.init();
            google.accounts.id.prompt();
        } else {
            Utils.showToast('กรุณารีเฟรชหน้าเว็บแล้วลองใหม่', 'error');
        }
    },

    /**
     * Handle credential response จาก Google
     */
    async handleCredentialResponse(response) {
        try {
            // ข้อมูลตัวตนมาจาก JWT ที่ Google เซ็นรับรองมาแล้ว ไม่ต้องถามชีต
            const payload = this.decodeJWT(response.credential);

            if (!payload) {
                throw new Error('Invalid token');
            }

            const userData = {
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            };

            const role = this.getUserRole(userData.email);

            /**
             * เข้าระบบทันที ไม่รอเขียนลงชีต
             *
             * เดิมรอ API.upsertUser() ให้เสร็จก่อนถึงจะเข้าได้ ซึ่งวัดได้ 33 วินาที
             * ตอน Apps Script ตอบช้า และถ้าคำสั่งนั้นล้มเหลว จะเข้าระบบไม่ได้เลย
             * ทั้งที่ Google ยืนยันตัวตนให้แล้ว - เป็นที่มาของอาการ "เข้าได้บ้างไม่ได้บ้าง"
             *
             * การบันทึกลงชีตย้ายไปทำเบื้องหลังแทน (ดู syncUserRecord)
             * ส่วนแผนกจะถูกเติมให้เองตอนโหลดข้อมูลหน้า Dashboard
             */
            this.currentUser = { ...userData, role: role };
            localStorage.setItem('jaun_user', JSON.stringify(this.currentUser));

            Utils.showToast(`ยินดีต้อนรับ ${this.currentUser.name}!`, 'success');
            App.navigate(role === 'user' ? 'userDashboard' : 'adminDashboard');

            this.syncUserRecord(userData);

        } catch (error) {
            Utils.hideLoading();
            console.error('Login error:', error);
            Utils.showToast('เข้าสู่ระบบไม่สำเร็จ: ' + error.message, 'error');
        }
    },

    /**
     * บันทึกผู้ใช้ลงชีตแบบเบื้องหลัง (สร้างแถวใหม่ถ้ายังไม่มี + อัปเดตเวลาเข้าใช้ล่าสุด)
     *
     * ล้มเหลวได้โดยไม่กระทบการใช้งาน เพราะผู้ใช้เข้าระบบไปแล้ว
     * ถ้าพลาดรอบนี้ รอบหน้าที่ล็อกอินจะบันทึกให้เอง
     */
    async syncUserRecord(userData) {
        try {
            const result = await API.upsertUser(userData);
            if (!result || !result.data || !this.currentUser) return;
            if (this.currentUser.email !== userData.email) return;   // เปลี่ยนผู้ใช้ไปแล้ว

            // เติมข้อมูลจากชีต (แผนก, รหัส) แต่ role ต้องคงค่าที่คำนวณจาก CONFIG
            this.currentUser = {
                ...this.currentUser,
                ...result.data,
                picture: this.currentUser.picture,
                role: this.currentUser.role
            };
            localStorage.setItem('jaun_user', JSON.stringify(this.currentUser));
        } catch (error) {
            console.warn('บันทึกข้อมูลผู้ใช้ลงชีตไม่สำเร็จ (ไม่กระทบการใช้งาน):', error.message);
        }
    },

    /**
     * Decode JWT token
     */
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('JWT decode error:', error);
            return null;
        }
    },

    /**
     * ตรวจสอบว่าเป็น Super Admin หรือไม่
     */
    isSuperAdmin(email) {
        return CONFIG.SUPER_ADMIN_EMAILS.includes(email);
    },

    /**
     * ตรวจสอบว่าเป็น Admin หรือไม่
     */
    isAdmin(email) {
        // ตรวจสอบจาก ADMIN_EMAILS list หรือ ADMIN_DOMAIN หรือ localStorage
        const dynamicAdmins = JSON.parse(localStorage.getItem('jaun_admin_emails') || '[]');
        return email && (
            (CONFIG.ADMIN_EMAILS && CONFIG.ADMIN_EMAILS.includes(email)) ||
            dynamicAdmins.includes(email) ||
            email.endsWith(CONFIG.ADMIN_DOMAIN)
        );
    },

    /**
     * ดึง Role จาก email
     */
    getUserRole(email) {
        if (this.isSuperAdmin(email)) return 'superadmin';
        if (this.isAdmin(email)) return 'admin';
        return 'user';
    },

    /**
     * ตรวจสอบ session จาก localStorage
     */
    checkSession() {
        const savedUser = localStorage.getItem('jaun_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                // ⭐ Refresh role ทุกครั้งจาก CONFIG (เผื่อ config เปลี่ยน)
                this.currentUser.role = this.getUserRole(this.currentUser.email);
                // Update localStorage with refreshed role
                localStorage.setItem('jaun_user', JSON.stringify(this.currentUser));
                return true;
            } catch (e) {
                localStorage.removeItem('jaun_user');
            }
        }
        return false;
    },

    /**
     * Logout
     */
    logout() {
        google.accounts.id.disableAutoSelect();
        this.currentUser = null;
        localStorage.removeItem('jaun_user');
        // ทิ้งข้อมูลที่เก็บไว้ ไม่งั้นคนที่ล็อกอินต่อจะเห็นข้อมูลของคนก่อน
        if (typeof Pages !== 'undefined') {
            Pages.invalidateCache();
            Pages.allRequests = [];
            Pages.allUsers = [];
            Pages.adminFilters = { search: '', status: '', service: '' };
        }
        Utils.showToast('ออกจากระบบเรียบร้อย', 'success');
        App.navigate('login');
    },

    /**
     * ตรวจสอบว่า login อยู่หรือไม่
     */
    isLoggedIn() {
        return this.currentUser !== null;
    },

    /**
     * ดึง current user
     */
    getUser() {
        return this.currentUser;
    }
};
