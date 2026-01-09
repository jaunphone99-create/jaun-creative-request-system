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
            width: 280
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
            Utils.showLoading();

            // Decode JWT token
            const payload = this.decodeJWT(response.credential);

            if (!payload) {
                throw new Error('Invalid token');
            }

            const userData = {
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            };

            // Upsert user ใน Google Sheets
            const result = await API.upsertUser(userData);

            // กำหนด role
            const role = this.getUserRole(userData.email);

            // เก็บ user data
            this.currentUser = {
                ...userData,
                ...result.data,
                role: role
            };

            // เก็บใน localStorage
            localStorage.setItem('jaun_user', JSON.stringify(this.currentUser));

            Utils.hideLoading();
            Utils.showToast(`ยินดีต้อนรับ ${this.currentUser.name}!`, 'success');

            // Navigate to appropriate dashboard
            App.navigate(role === 'user' ? 'userDashboard' : 'adminDashboard');

        } catch (error) {
            Utils.hideLoading();
            console.error('Login error:', error);
            Utils.showToast('เข้าสู่ระบบไม่สำเร็จ: ' + error.message, 'error');
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
