/**
 * JAUN Creative Request System - API Module
 * จัดการการเชื่อมต่อกับ Google Apps Script
 */

const API = {
    // ลองใหม่กี่ครั้งเมื่อเรียกไม่สำเร็จ
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 600,
    /**
     * เวลารอสูงสุดของแต่ละครั้ง (ค่อยๆ เพิ่ม)
     *
     * ปกติเซิร์ฟเวอร์ตอบใน 3-6 วินาที ครั้งแรกจึงตัดที่ 8 วินาที
     * เพื่อให้เจอปัญหาเร็ว แต่บางครั้งมันตอบช้าถึง 20 วินาทีแบบสำเร็จจริง
     * ถ้าตัดที่ 8 วินาทีทุกครั้งจะกลายเป็นพังทั้งที่เซิร์ฟเวอร์กำลังจะตอบ
     * จึงยืดเวลาให้ในครั้งหลังๆ (รวมแล้วไม่เกิน ~40 วินาที)
     */
    TIMEOUTS_MS: [8000, 13000, 19000],

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * เรียก API พร้อมลองใหม่อัตโนมัติ
     *
     * ทำไมต้องมี: Google Apps Script คืนหน้า HTML แทน JSON เป็นบางครั้ง
     * (redirect ไป googleusercontent แล้วพลาด) เดิมเจอทีเดียวคือขึ้น error
     * ให้ผู้ใช้รีเฟรชเอง ทั้งที่ลองใหม่อีกครั้งมักผ่าน
     *
     * สำคัญ: ลองใหม่เฉพาะตอน "ติดต่อไม่ได้" หรือ "ตอบกลับผิดรูปแบบ" เท่านั้น
     * ถ้าเซิร์ฟเวอร์ตอบ JSON มาแล้วว่า success:false (เช่น ไม่มีสิทธิ์)
     * ถือว่าได้คำตอบจริงแล้ว ไม่ลองซ้ำ
     */
    async _request(url, options, label, allowRetry = true) {
        const maxTries = allowRetry ? this.MAX_RETRIES : 1;
        let lastError;

        for (let attempt = 1; attempt <= maxTries; attempt++) {
            let data;

            const controller = new AbortController();
            const limit = this.TIMEOUTS_MS[attempt - 1] || this.TIMEOUTS_MS[this.TIMEOUTS_MS.length - 1];
            const timer = setTimeout(() => controller.abort(), limit);

            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                const text = await response.text();

                if (!text.trim().startsWith('{')) {
                    throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ (HTTP ${response.status})`);
                }

                data = JSON.parse(text);
            } catch (error) {
                lastError = error.name === 'AbortError'
                    ? new Error('เซิร์ฟเวอร์ใช้เวลานานเกินไป')
                    : error;
                console.warn(`API ${label} ไม่สำเร็จ (ครั้งที่ ${attempt}/${maxTries}): ${lastError.message}`);

                if (attempt < maxTries) {
                    // บอกผู้ใช้ว่ากำลังลองใหม่ ไม่ให้นั่งมองวงกลมหมุนเงียบๆ
                    if (typeof Utils !== 'undefined') {
                        Utils.showToast(`เชื่อมต่อไม่สำเร็จ กำลังลองใหม่ (${attempt}/${maxTries - 1})...`, 'warning');
                    }
                    await this._sleep(this.RETRY_DELAY_MS * attempt);
                    continue;
                }
                throw lastError;
            } finally {
                clearTimeout(timer);
            }

            // ได้ JSON แล้ว = เซิร์ฟเวอร์ตอบจริง ไม่ต้องลองใหม่
            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }
            return data;
        }
    },

    /**
     * เรียก API แบบ GET (อ่านอย่างเดียว ลองใหม่ได้เสมอ)
     */
    async get(params = {}) {
        const url = new URL(CONFIG.API_URL);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        return this._request(url.toString(), { method: 'GET', mode: 'cors' },
            params.action || 'get');
    },

    /**
     * เรียก API แบบ POST
     *
     * allowRetry: ตั้งเป็น false สำหรับคำสั่งที่ทำซ้ำไม่ได้ (เช่น createRequest)
     * เพราะถ้าเซิร์ฟเวอร์บันทึกสำเร็จแล้วแต่ตอบกลับพัง การลองใหม่จะได้ข้อมูลซ้ำ
     */
    async post(body, allowRetry = true) {
        return this._request(CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(body)
        }, body.action || 'post', allowRetry);
    },

    // ==================== User APIs ====================

    /**
     * ดึงข้อมูล (Users + Requests)
     *
     * ส่ง email ไปด้วยเพื่อให้เซิร์ฟเวอร์กรองให้ก่อนส่งกลับ
     * พนักงานทั่วไปจะได้เฉพาะคำขอของตัวเอง แทนที่จะโหลดทั้ง 596 รายการ
     * แอดมินยังได้ครบเหมือนเดิม
     */
    async getAll(email) {
        const params = { action: 'getAll' };
        if (email) params.email = email;
        return this.get(params);
    },

    /**
     * ดึงข้อมูล User ตาม email
     */
    async getUser(email) {
        return this.get({ action: 'getUser', email });
    },

    /**
     * สร้างหรืออัปเดต User
     */
    async upsertUser(userData) {
        return this.post({
            action: 'upsertUser',
            ...userData
        });
    },

    /**
     * อัปเดตแผนกของ User
     */
    async updateUserDepartment(email, department) {
        return this.post({
            action: 'updateUserDepartment',
            email,
            department
        });
    },

    /**
     * ลบ User (Super Admin only)
     */
    async deleteUser(userId, requestedBy) {
        return this.post({
            action: 'deleteUser',
            id: userId,
            requestedBy
        });
    },

    // ==================== Request APIs ====================

    /**
     * สร้างคำขอใหม่
     *
     * ไม่ลองใหม่อัตโนมัติ (allowRetry = false) เพราะถ้าเซิร์ฟเวอร์บันทึกสำเร็จแล้ว
     * แต่ตอบกลับมาพัง การยิงซ้ำจะทำให้เกิดคำขอซ้ำในชีต
     */
    async createRequest(requestData) {
        return this.post({
            action: 'createRequest',
            ...requestData
        }, false);
    },

    /**
     * อัปเดตคำขอ
     */
    async updateRequest(requestId, updates) {
        return this.post({
            action: 'updateRequest',
            id: requestId,
            ...updates
        });
    },

    /**
     * ลบคำขอ (Super Admin only)
     */
    async deleteRequest(requestId, requestedBy) {
        return this.post({
            action: 'deleteRequest',
            id: requestId,
            requestedBy
        });
    }
};

// Freeze API object
Object.freeze(API);
