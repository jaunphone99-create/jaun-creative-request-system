/**
 * JAUN Creative Request System - API Module
 * จัดการการเชื่อมต่อกับ Google Apps Script
 */

const API = {
    /**
     * เรียก API แบบ GET
     */
    async get(params = {}) {
        try {
            const url = new URL(CONFIG.API_URL);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'cors'
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }

            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },

    /**
     * เรียก API แบบ POST
     */
    async post(body) {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }

            return data;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },

    // ==================== User APIs ====================

    /**
     * ดึงข้อมูลทั้งหมด (Users + Requests)
     */
    async getAll() {
        return this.get({ action: 'getAll' });
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
     */
    async createRequest(requestData) {
        return this.post({
            action: 'createRequest',
            ...requestData
        });
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
