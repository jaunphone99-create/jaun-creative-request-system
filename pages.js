/**
 * JAUN Creative Request System - Page Renderers
 * แต่ละหน้าของแอปพลิเคชัน
 */

const Pages = {
  // ==================== ข้อมูล ====================
  allUsers: [],
  allRequests: [],
  selectedService: null,
  editingRequest: null,

  /**
   * โหลดข้อมูลทั้งหมด
   */
  async loadData() {
    try {
      const result = await API.getAll();
      this.allUsers = result.data.users || [];
      this.allRequests = result.data.requests || [];
      return true;
    } catch (error) {
      console.error('Load data error:', error);
      Utils.showToast('ไม่สามารถโหลดข้อมูลได้: ' + error.message, 'error');
      return false;
    }
  },

  /**
   * ดึง user จาก email
   */
  getUserByEmail(email) {
    return this.allUsers.find(u => u.email === email);
  },

  /**
   * ดึง request จาก id
   */
  getRequestById(id) {
    return this.allRequests.find(r => r.id === id);
  },

  // ==================== LOGIN PAGE ====================

  renderLogin() {
    return `
      <div class="login-page">
        <div class="login-card fade-in">
          <svg class="login-logo" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#1B2A5C"/>
            <text x="40" y="52" text-anchor="middle" fill="white" font-family="Montserrat" font-weight="800" font-size="32">J</text>
          </svg>
          <h1 class="login-title">${CONFIG.COMPANY_NAME}</h1>
          <p class="login-subtitle">${CONFIG.WELCOME_MESSAGE}</p>
          
          <!-- Google Sign-In Container -->
          <div id="google-signin-button" style="display: flex; justify-content: center; min-height: 50px; align-items: center;">
            <div class="loading-spinner" style="border-color: rgba(27, 42, 92, 0.2); border-top-color: #1B2A5C;"></div>
            <span style="margin-left: 10px; color: var(--color-medium-grey);">กำลังโหลด...</span>
          </div>
          
          <!-- Fallback Button (hidden by default) -->
          <button id="google-fallback-btn" class="btn btn-google btn-lg btn-block hidden" onclick="Auth.triggerGooglePrompt()">
            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            ลงชื่อเข้าใช้ด้วย Google
          </button>
          
          <div class="login-divider">
            <span>หรือ</span>
          </div>
          
          <p style="color: var(--color-medium-grey); font-size: 0.9rem;">
            ใช้บัญชี Google ของบริษัทเพื่อเข้าสู่ระบบ
          </p>
        </div>
      </div>
    `;
  },

  afterRenderLogin() {
    // Wait for Google script to load
    this.waitForGoogle(() => {
      Auth.init();
      Auth.renderButton('google-signin-button');
    });
  },

  // Helper to wait for Google script
  waitForGoogle(callback, maxRetries = 20) {
    let retries = 0;
    const checkGoogle = () => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        // Clear loading state and render button
        callback();
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(checkGoogle, 250);
      } else {
        // Show fallback button after timeout
        console.warn('Google Sign-In script failed to load');
        const container = document.getElementById('google-signin-button');
        const fallback = document.getElementById('google-fallback-btn');
        if (container) container.innerHTML = '<span style="color: var(--color-danger);">⚠️ กรุณารีเฟรชหน้าเว็บ</span>';
        if (fallback) fallback.classList.remove('hidden');
      }
    };
    checkGoogle();
  },

  // ==================== USER DASHBOARD ====================

  async renderUserDashboard() {
    Utils.showLoading();
    await this.loadData();
    Utils.hideLoading();

    const user = Auth.getUser();
    const userRequests = this.allRequests.filter(r => r.submittedBy === user.email);

    const pendingCount = userRequests.filter(r => r.status === 'pending').length;
    const revisionCount = userRequests.filter(r => r.status === 'revision').length;
    const completedCount = userRequests.filter(r => r.status === 'completed').length;

    // ถ้ายังไม่มีแผนก ให้เลือกก่อน
    let departmentSelector = '';
    if (!user.department) {
      departmentSelector = `
        <div class="card mb-lg">
          <div class="alert alert-info">
            <strong>⚠️ กรุณาเลือกแผนกของคุณก่อนใช้งาน</strong>
          </div>
          <div class="form-group">
            <label class="form-label">เลือกแผนก</label>
            <select class="form-select" id="department-select">
              <option value="">เลือกแผนก</option>
              ${Utils.createSelectOptions(CONFIG.DEPARTMENTS)}
            </select>
          </div>
          <button class="btn btn-primary" onclick="Pages.saveDepartment()">บันทึกแผนก</button>
        </div>
      `;
    }

    return `
      ${Components.header(user)}
      <main class="main-content">
        <div class="container">
          ${departmentSelector}
          
          <!-- Stats -->
          <div class="stat-grid">
            ${Components.statCard(userRequests.length, 'คำขอทั้งหมด', 'stat-primary')}
            ${Components.statCard(pendingCount, 'รออนุมัติ', 'stat-warning')}
            ${Components.statCard(revisionCount, 'ต้องแก้ไข', 'stat-orange')}
            ${Components.statCard(completedCount, 'เสร็จสมบูรณ์', 'stat-success')}
          </div>
          
          <!-- Create Request Button -->
          <button class="btn btn-primary btn-lg btn-block mb-xl" onclick="App.navigate('createRequest')" ${!user.department ? 'disabled' : ''}>
            ➕ สร้างคำขอใหม่
          </button>
          
          <!-- Requests List -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">📋 คำขอของฉัน</h2>
            </div>
            <div class="card-body">
              ${userRequests.length === 0
        ? Components.emptyState('📋', 'ยังไม่มีคำขอ คลิกปุ่มด้านบนเพื่อสร้างคำขอใหม่')
        : userRequests.map(r => Components.userRequestCard(r)).join('')
      }
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async saveDepartment() {
    const select = document.getElementById('department-select');
    if (!select || !select.value) {
      Utils.showToast('กรุณาเลือกแผนก', 'error');
      return;
    }

    try {
      Utils.showLoading();
      await API.updateUserDepartment(Auth.getUser().email, select.value);

      // Update local user
      Auth.currentUser.department = select.value;
      localStorage.setItem('jaun_user', JSON.stringify(Auth.currentUser));

      Utils.hideLoading();
      Utils.showToast('บันทึกแผนกเรียบร้อย', 'success');
      App.navigate('userDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  // ==================== CREATE REQUEST ====================

  renderCreateRequest() {
    const user = Auth.getUser();
    this.selectedService = null;

    // Group services by category
    const categorizedServices = this.getServicesByCategory();

    return `
      ${Components.header(user)}
      <main class="main-content">
        <div class="container" style="max-width: 900px;">
          <button class="btn btn-secondary mb-lg" onclick="App.navigate('userDashboard')">
            ← กลับ
          </button>
          
          <h1 class="mb-lg">สร้างคำขอใหม่</h1>
          
          <!-- Service Selection -->
          <div class="card mb-lg">
            <div class="card-header">
              <h2 class="card-title">เลือกประเภทบริการ</h2>
            </div>
            <div class="card-body">
              ${Object.entries(categorizedServices).map(([catId, services]) => {
      const category = CONFIG.SERVICE_CATEGORIES[catId];
      return `
                  <div class="service-category">
                    <div class="service-category-title">${category?.name || catId} - ${category?.nameTh || ''}</div>
                    <div class="service-grid">
                      ${services.map(s => Components.serviceCard(s)).join('')}
                    </div>
                  </div>
                `;
    }).join('')}
            </div>
          </div>
          
          <!-- Dynamic Form -->
          <div id="request-form-container" class="card hidden">
            <div class="card-header">
              <h2 class="card-title">รายละเอียดคำขอ</h2>
            </div>
            <div class="card-body">
              <form id="request-form">
                <input type="hidden" name="serviceType" id="service-type-input">
                <div id="form-fields"></div>
                <button type="submit" class="btn btn-primary btn-lg btn-block mt-lg">
                  ✅ ส่งคำขอ
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  // Helper function to group services by category
  getServicesByCategory() {
    const grouped = {};
    CONFIG.SERVICES.forEach(service => {
      const cat = service.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    });
    return grouped;
  },

  afterRenderCreateRequest() {
    const form = document.getElementById('request-form');
    if (form) {
      form.addEventListener('submit', this.handleCreateRequest.bind(this));
    }
  },

  selectService(serviceId) {
    this.selectedService = serviceId;

    // Update UI
    document.querySelectorAll('.service-card').forEach(card => {
      card.classList.remove('active');
      if (card.dataset.service === serviceId) {
        card.classList.add('active');
      }
    });

    // Show form
    const container = document.getElementById('request-form-container');
    const fields = document.getElementById('form-fields');
    const serviceTypeInput = document.getElementById('service-type-input');

    if (container && fields && serviceTypeInput) {
      serviceTypeInput.value = serviceId;
      fields.innerHTML = Components.getFormFields(serviceId);
      container.classList.remove('hidden');
      container.scrollIntoView({ behavior: 'smooth' });
    }
  },

  async handleCreateRequest(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const data = {
      serviceType: formData.get('serviceType'),
      projectName: formData.get('projectName'),
      details: formData.get('details'),
      deadline: formData.get('deadline') || '',
      purpose: formData.get('purpose') || '',
      imageSize: formData.get('imageSize') || '',
      referenceLink: formData.get('referenceLink') || '',
      videoFormat: formData.get('videoFormat') || '',
      videoDuration: formData.get('videoDuration') || '',
      tiktokRef: formData.get('tiktokRef') || '',
      appointmentDate: formData.get('appointmentDate') || '',
      location: formData.get('location') || '',
      productType: formData.get('productType') || '',
      productDetails: formData.get('productDetails') || '',
      driveLink: formData.get('driveLink') || '',
      submittedBy: Auth.getUser().email
    };

    try {
      Utils.showLoading();
      await API.createRequest(data);
      Utils.hideLoading();
      Utils.showToast('ส่งคำขอเรียบร้อย!', 'success');
      App.navigate('userDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  // ==================== EDIT REQUEST ====================

  async renderEditRequest(requestId) {
    Utils.showLoading();
    await this.loadData();
    Utils.hideLoading();

    const user = Auth.getUser();
    const request = this.getRequestById(requestId);

    if (!request) {
      return `
        ${Components.header(user)}
        <main class="main-content">
          <div class="container">
            <div class="alert alert-danger">ไม่พบคำขอนี้</div>
            <button class="btn btn-secondary" onclick="App.navigate('userDashboard')">← กลับ</button>
          </div>
        </main>
      `;
    }

    this.editingRequest = request;
    const service = Utils.getService(request.serviceType);

    return `
      ${Components.header(user)}
      <main class="main-content">
        <div class="container" style="max-width: 900px;">
          <button class="btn btn-secondary mb-lg" onclick="App.navigate('userDashboard')">
            ← กลับ
          </button>
          
          <h1 class="mb-md">แก้ไขคำขอ: ${Utils.escapeHtml(request.projectName)}</h1>
          <p class="text-grey mb-lg">${service?.icon} ${service?.name || request.serviceType}</p>
          
          ${request.adminComment ? `
            <div class="alert alert-warning mb-lg">
              <strong>💬 ข้อความจากแอดมิน:</strong><br>
              ${Utils.escapeHtml(request.adminComment)}
            </div>
          ` : ''}
          
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">แก้ไขข้อมูล</h2>
            </div>
            <div class="card-body">
              <form id="edit-form">
                <input type="hidden" name="id" value="${request.id}">
                ${Components.getFormFields(request.serviceType, request)}
                <button type="submit" class="btn btn-primary btn-lg btn-block mt-lg">
                  ✅ บันทึกการแก้ไข
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  afterRenderEditRequest() {
    const form = document.getElementById('edit-form');
    if (form) {
      form.addEventListener('submit', this.handleEditRequest.bind(this));
    }
  },

  async handleEditRequest(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const requestId = formData.get('id');
    const updates = {
      projectName: formData.get('projectName'),
      details: formData.get('details'),
      deadline: formData.get('deadline') || '',
      purpose: formData.get('purpose') || '',
      imageSize: formData.get('imageSize') || '',
      referenceLink: formData.get('referenceLink') || '',
      videoFormat: formData.get('videoFormat') || '',
      videoDuration: formData.get('videoDuration') || '',
      tiktokRef: formData.get('tiktokRef') || '',
      appointmentDate: formData.get('appointmentDate') || '',
      location: formData.get('location') || '',
      productType: formData.get('productType') || '',
      productDetails: formData.get('productDetails') || '',
      driveLink: formData.get('driveLink') || '',
      status: 'pending',
      revisionCount: (this.editingRequest?.revisionCount || 0) + 1
    };

    try {
      Utils.showLoading();
      await API.updateRequest(requestId, updates);
      Utils.hideLoading();
      Utils.showToast('บันทึกการแก้ไขเรียบร้อย!', 'success');
      App.navigate('userDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  // ==================== ADMIN DASHBOARD ====================

  // Get requests with upcoming deadlines (within 1-2 days)
  getUpcomingDeadlines() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingRequests = this.allRequests
      .filter(r => {
        // Only check pending or in-progress requests with deadline
        if (!r.deadline || (r.status !== 'pending' && r.status !== 'progress')) return false;

        const deadline = new Date(r.deadline);
        deadline.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 2; // Within 2 days
      })
      .map(r => {
        const deadline = new Date(r.deadline);
        deadline.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return { ...r, daysLeft: diffDays };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return upcomingRequests;
  },

  async renderAdminDashboard() {
    Utils.showLoading();
    await this.loadData();
    Utils.hideLoading();

    const user = Auth.getUser();
    const isSuperAdmin = Auth.isSuperAdmin(user.email);

    const totalRequests = this.allRequests.length;
    const pendingCount = this.allRequests.filter(r => r.status === 'pending').length;
    const progressCount = this.allRequests.filter(r => r.status === 'progress').length;
    const completedCount = this.allRequests.filter(r => r.status === 'completed').length;
    const revisionCount = this.allRequests.filter(r => r.status === 'revision').length;

    // Get upcoming deadlines
    const upcomingDeadlines = this.getUpcomingDeadlines();

    // Analytics
    const serviceCounts = {};
    this.allRequests.forEach(r => {
      serviceCounts[r.serviceType] = (serviceCounts[r.serviceType] || 0) + 1;
    });

    const deptCounts = {};
    this.allRequests.forEach(r => {
      const reqUser = this.getUserByEmail(r.submittedBy);
      if (reqUser) {
        deptCounts[reqUser.department] = (deptCounts[reqUser.department] || 0) + 1;
      }
    });

    // Data usage warning
    const dataUsage = this.allUsers.length + this.allRequests.length;
    const showWarning = dataUsage >= 900;

    return `
      ${Components.header(user)}
      <main class="main-content">
        <div class="container">
          ${showWarning ? `
            <div class="alert alert-danger">
              <strong>⚠️ คำเตือน:</strong> ใช้พื้นที่ ${dataUsage}/999 รายการ - กรุณาลบข้อมูลเก่าเพื่อเคลียร์พื้นที่
            </div>
          ` : ''}
          
          ${upcomingDeadlines.length > 0 ? `
            <!-- Deadline Warning Section -->
            <div class="card mb-lg" style="border: 2px solid #F97316; background: linear-gradient(135deg, #FFF7ED, #FFEDD5);">
              <div class="card-header" style="background: linear-gradient(135deg, #F97316, #EA580C); color: white; border-radius: 8px 8px 0 0;">
                <h2 class="card-title" style="color: white; display: flex; align-items: center; gap: 8px;">
                  ⚠️ งานใกล้ครบกำหนด (${upcomingDeadlines.length} รายการ)
                </h2>
              </div>
              <div class="card-body" style="padding: 16px;">
                ${upcomingDeadlines.map(r => {
      const service = Utils.getService(r.serviceType);
      const reqUser = this.getUserByEmail(r.submittedBy);
      const isUrgent = r.daysLeft <= 1;
      const urgentColor = isUrgent ? '#DC2626' : '#F97316';
      const urgentBg = isUrgent ? '#FEE2E2' : '#FFF7ED';
      const urgentIcon = isUrgent ? '🔴' : '🟠';

      let daysText = '';
      if (r.daysLeft < 0) {
        daysText = `เกินกำหนด ${Math.abs(r.daysLeft)} วัน!`;
      } else if (r.daysLeft === 0) {
        daysText = 'ครบกำหนดวันนี้!';
      } else if (r.daysLeft === 1) {
        daysText = 'เหลือ 1 วัน';
      } else {
        daysText = `เหลือ ${r.daysLeft} วัน`;
      }

      return `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${urgentBg}; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${urgentColor};">
                      <span style="font-size: 1.5rem;">${urgentIcon}</span>
                      <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1F2937;">${Utils.escapeHtml(r.projectName)}</div>
                        <div style="font-size: 0.85rem; color: #6B7280;">
                          ${service?.icon || ''} ${service?.nameTh || r.serviceType} • 
                          ${reqUser ? Utils.escapeHtml(reqUser.name) : 'ไม่ทราบผู้ส่ง'}
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 700; color: ${urgentColor}; font-size: 0.95rem;">${daysText}</div>
                        <div style="font-size: 0.8rem; color: #9CA3AF;">📅 ${Utils.formatDate(r.deadline)}</div>
                      </div>
                      <button class="btn btn-sm" style="background: ${urgentColor}; color: white;" onclick="Components.showRequestDetail('${r.id}')">
                        ดู
                      </button>
                    </div>
                  `;
    }).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Stats -->
          <div class="stat-grid">
            ${Components.statCard(totalRequests, 'คำขอทั้งหมด', 'stat-primary')}
            ${Components.statCard(pendingCount, 'รออนุมัติ', 'stat-warning')}
            ${Components.statCard(progressCount, 'กำลังดำเนินการ', 'stat-info')}
            ${Components.statCard(completedCount, 'เสร็จสมบูรณ์', 'stat-success')}
            ${Components.statCard(revisionCount, 'ส่งกลับแก้ไข', 'stat-orange')}
          </div>
          
          ${isSuperAdmin ? `
            <!-- Super Admin Section -->
            <div class="card mb-lg" style="border: 2px solid var(--color-navy-blue);">
              <div class="card-header">
                <h2 class="card-title">⭐ Super Admin Panel</h2>
                <button class="btn btn-primary btn-sm" onclick="Pages.showUserManagement()">
                  👥 จัดการผู้ใช้
                </button>
              </div>
              <div class="card-body">
                <div class="stat-grid">
                  ${Components.statCard(this.allUsers.filter(u => Auth.getUserRole(u.email) === 'user').length, 'Users', '')}
                  ${Components.statCard(this.allUsers.filter(u => Auth.getUserRole(u.email) === 'admin').length, 'Admins', '')}
                  ${Components.statCard(this.allUsers.filter(u => Auth.isSuperAdmin(u.email)).length, 'Super Admins', '')}
                  ${Components.statCard(`${((dataUsage / 999) * 100).toFixed(1)}%`, 'พื้นที่ใช้งาน', '')}
                </div>
              </div>
            </div>
            
            <!-- Analytics Charts Section -->
            <div class="card mb-lg">
              <div class="card-header">
                <h2 class="card-title">📊 Analytics Dashboard</h2>
              </div>
              <div class="card-body">
                <div class="charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                  <div class="chart-container" style="background: var(--color-light-grey); border-radius: 12px; padding: 16px; height: 280px;">
                    <canvas id="chart-requests-by-day"></canvas>
                  </div>
                  <div class="chart-container" style="background: var(--color-light-grey); border-radius: 12px; padding: 16px; height: 280px;">
                    <canvas id="chart-requests-by-service"></canvas>
                  </div>
                  <div class="chart-container" style="background: var(--color-light-grey); border-radius: 12px; padding: 16px; height: 280px;">
                    <canvas id="chart-requests-by-dept"></canvas>
                  </div>
                  <div class="chart-container" style="background: var(--color-light-grey); border-radius: 12px; padding: 16px; height: 280px;">
                    <canvas id="chart-requests-by-status"></canvas>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Create Request Button -->
          <button class="btn btn-primary btn-lg btn-block mb-lg" onclick="App.navigate('createRequest')">
            ➕ สร้างคำขอใหม่
          </button>
          
          <!-- Search & Filter -->
          <div class="card mb-lg">
            <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
              <input type="text" class="form-input" id="search-input" placeholder="ค้นหาตามชื่อ, โครงการ..." style="flex: 1; min-width: 200px;" oninput="Pages.filterRequests()">
              <select class="form-select" id="status-filter" style="width: auto;" onchange="Pages.filterRequests()">
                <option value="">สถานะทั้งหมด</option>
                <option value="pending">รออนุมัติ</option>
                <option value="progress">กำลังดำเนินการ</option>
                <option value="revision">ส่งกลับแก้ไข</option>
                <option value="completed">เสร็จสมบูรณ์</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
              <select class="form-select" id="service-filter" style="width: auto;" onchange="Pages.filterRequests()">
                <option value="">บริการทั้งหมด</option>
                ${CONFIG.SERVICES.map(s => `<option value="${s.id}">${s.icon} ${s.nameTh}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <!-- Requests List -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">📋 คำขอทั้งหมด</h2>
            </div>
            <div class="card-body" id="requests-list">
              ${this.renderRequestsList(this.allRequests)}
            </div>
          </div>
        </div>
      </main>
    `;
  },

  afterRenderAdminDashboard() {
    // Render charts if Super Admin
    const user = Auth.getUser();
    if (Auth.isSuperAdmin(user.email) && typeof Charts !== 'undefined') {
      Charts.renderAll(this.allRequests, this.allUsers);
    }
  },

  renderRequestsList(requests, groupByService = true) {
    if (requests.length === 0) {
      return Components.emptyState('📋', 'ยังไม่มีคำขอ');
    }

    // ถ้าต้องการแยกตามประเภทบริการ
    if (groupByService) {
      const grouped = {};
      // จัดกลุ่มตามประเภทบริการแต่ละตัว
      requests.forEach(r => {
        const serviceId = r.serviceType;
        if (!grouped[serviceId]) grouped[serviceId] = [];
        grouped[serviceId].push(r);
      });

      let html = '';
      // แสดงตามลำดับใน CONFIG.SERVICES
      CONFIG.SERVICES.forEach(service => {
        const serviceRequests = grouped[service.id] || [];
        if (serviceRequests.length > 0) {
          html += `
            <div class="service-section" style="margin-bottom: 24px;">
              <div class="service-section-header" style="display: flex; align-items: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, ${service.color}15, ${service.color}05); border-radius: 12px; margin-bottom: 16px; border-left: 4px solid ${service.color};">
                <span style="font-size: 2rem;">${service.icon}</span>
                <div>
                  <h3 style="margin: 0; color: ${service.color}; font-size: 1.1rem;">${service.name}</h3>
                  <span style="color: var(--color-medium-grey); font-size: 0.9rem;">${service.nameTh} (${serviceRequests.length} รายการ)</span>
                </div>
              </div>
              <div class="service-requests">
                ${serviceRequests.map(r => {
            const user = this.getUserByEmail(r.submittedBy);
            return Components.adminRequestCard(r, user);
          }).join('')}
              </div>
            </div>
          `;
        }
      });
      return html;
    }

    // แบบไม่แยก
    return requests.map(r => {
      const user = this.getUserByEmail(r.submittedBy);
      return Components.adminRequestCard(r, user);
    }).join('');
  },

  filterRequests() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const serviceFilter = document.getElementById('service-filter');
    const container = document.getElementById('requests-list');

    if (!searchInput || !statusFilter || !container) return;

    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const serviceValue = serviceFilter?.value || '';

    let filtered = this.allRequests;

    if (searchTerm) {
      filtered = filtered.filter(r => {
        const user = this.getUserByEmail(r.submittedBy);
        const projectName = r.projectName ? String(r.projectName).toLowerCase() : '';
        const details = r.details ? String(r.details).toLowerCase() : '';
        return projectName.includes(searchTerm) ||
          details.includes(searchTerm) ||
          (user && user.name && user.name.toLowerCase().includes(searchTerm)) ||
          (user && user.department && user.department.toLowerCase().includes(searchTerm));
      });
    }

    if (statusValue) {
      filtered = filtered.filter(r => r.status === statusValue);
    }

    if (serviceValue) {
      filtered = filtered.filter(r => r.serviceType === serviceValue);
    }

    // ถ้ากรองตามบริการเฉพาะ ไม่ต้องแยกหมวด
    const groupByService = !serviceValue;
    container.innerHTML = this.renderRequestsList(filtered, groupByService);
  },

  // ==================== ADMIN ACTIONS ====================

  async approveRequest(requestId) {
    try {
      Utils.showLoading();
      await API.updateRequest(requestId, { status: 'progress' });
      Utils.hideLoading();
      Utils.showToast('อนุมัติคำขอเรียบร้อย', 'success');
      App.navigate('adminDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  async sendRevision(requestId) {
    const comment = await Utils.prompt('ส่งกลับแก้ไข', 'ระบุสิ่งที่ต้องแก้ไข', 'เช่น: กรุณาแก้ไขรายละเอียด...');
    if (comment === null) return;
    if (!comment.trim()) {
      Utils.showToast('กรุณาระบุสิ่งที่ต้องแก้ไข', 'error');
      return;
    }

    try {
      Utils.showLoading();
      await API.updateRequest(requestId, { status: 'revision', adminComment: comment });
      Utils.hideLoading();
      Utils.showToast('ส่งกลับแก้ไขเรียบร้อย', 'success');
      App.navigate('adminDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  async rejectRequest(requestId) {
    const reason = await Utils.prompt('ปฏิเสธคำขอ', 'ระบุเหตุผลที่ปฏิเสธ', 'เช่น: ไม่สามารถดำเนินการได้เนื่องจาก...');
    if (reason === null) return;
    if (!reason.trim()) {
      Utils.showToast('กรุณาระบุเหตุผล', 'error');
      return;
    }

    try {
      Utils.showLoading();
      await API.updateRequest(requestId, { status: 'rejected', rejectionReason: reason });
      Utils.hideLoading();
      Utils.showToast('ปฏิเสธคำขอเรียบร้อย', 'success');
      App.navigate('adminDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  async completeRequest(requestId) {
    const fileLink = await Utils.prompt('แจ้งงานเสร็จ', 'ลิงก์ไฟล์งานที่เสร็จ', 'https://drive.google.com/...');
    if (fileLink === null) return;
    if (!fileLink.trim()) {
      Utils.showToast('กรุณาใส่ลิงก์ไฟล์', 'error');
      return;
    }

    try {
      Utils.showLoading();
      await API.updateRequest(requestId, { status: 'completed', completedFileLink: fileLink });
      Utils.hideLoading();
      Utils.showToast('แจ้งงานเสร็จเรียบร้อย', 'success');
      App.navigate('adminDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  async deleteRequest(requestId) {
    const confirmed = await Utils.confirm('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ที่จะลบคำขอนี้? การกระทำนี้ไม่สามารถยกเลิกได้');
    if (!confirmed) return;

    try {
      Utils.showLoading();
      await API.deleteRequest(requestId, Auth.getUser().email);
      Utils.hideLoading();
      Utils.showToast('ลบคำขอเรียบร้อย', 'success');
      App.navigate('adminDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  },

  // ==================== USER MANAGEMENT ====================

  showUserManagement() {
    // Get request counts per user
    const userRequestCounts = {};
    this.allRequests.forEach(r => {
      userRequestCounts[r.submittedBy] = (userRequestCounts[r.submittedBy] || 0) + 1;
    });

    const content = `
      <!-- Search Box -->
      <div style="margin-bottom: 16px;">
        <input type="text" class="form-input" id="user-search" placeholder="🔍 ค้นหาผู้ใช้..." oninput="Pages.filterUserList()" style="width: 100%;">
      </div>
      
      <!-- User Stats -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
        <div style="text-align: center; padding: 12px; background: #EFF6FF; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #2563EB;">${this.allUsers.filter(u => Auth.getUserRole(u.email) === 'user').length}</div>
          <div style="font-size: 0.85rem; color: #6B7280;">👤 Users</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #ECFDF5; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">${this.allUsers.filter(u => Auth.getUserRole(u.email) === 'admin').length}</div>
          <div style="font-size: 0.85rem; color: #6B7280;">🛡️ Admins</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #FEF3C7; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #D97706;">${this.allUsers.filter(u => Auth.isSuperAdmin(u.email)).length}</div>
          <div style="font-size: 0.85rem; color: #6B7280;">⭐ Super Admins</div>
        </div>
      </div>
      
      <!-- User List -->
      <div id="user-list-container" style="max-height: 350px; overflow-y: auto;">
        ${this.allUsers.map(user => {
      const role = Auth.isSuperAdmin(user.email) ? 'superadmin' : Auth.isAdmin(user.email) ? 'admin' : 'user';
      const roleLabel = role === 'superadmin' ? '⭐ Super Admin' : role === 'admin' ? '🛡️ Admin' : '👤 User';
      const roleColor = role === 'superadmin' ? '#D97706' : role === 'admin' ? '#059669' : '#2563EB';
      const requestCount = userRequestCounts[user.email] || 0;
      const isMe = user.email === Auth.getUser().email;
      const canChangeRole = !Auth.isSuperAdmin(user.email) && !isMe;

      return `
          <div class="user-item" data-name="${Utils.escapeHtml(user.name).toLowerCase()}" data-email="${user.email.toLowerCase()}" style="padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <strong style="font-size: 1.1rem;">${Utils.escapeHtml(user.name)}</strong>
                  ${isMe ? '<span class="badge badge-progress">คุณ</span>' : ''}
                </div>
                <div style="font-size: 0.9rem; color: #6B7280; margin-bottom: 8px;">
                  📧 ${Utils.escapeHtml(user.email)}
                </div>
                <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.85rem; color: #6B7280;">
                  <span>🏢 ${Utils.escapeHtml(user.department || 'ไม่ระบุ')}</span>
                  <span>📋 ${requestCount} คำขอ</span>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <span style="padding: 4px 12px; border-radius: 20px; background: ${roleColor}20; color: ${roleColor}; font-weight: 600; font-size: 0.85rem;">
                  ${roleLabel}
                </span>
                ${canChangeRole ? `
                  <div style="display: flex; gap: 4px;">
                    ${role === 'user' ? `
                      <button class="btn btn-success btn-sm" onclick="Pages.promoteToAdmin('${user.email}')" title="เลื่อนขั้นเป็น Admin">
                        ⬆️ Admin
                      </button>
                    ` : `
                      <button class="btn btn-warning btn-sm" onclick="Pages.demoteToUser('${user.email}')" title="ลดขั้นเป็น User">
                        ⬇️ User
                      </button>
                    `}
                    <button class="btn btn-danger btn-sm" onclick="Pages.deleteUser('${user.id}')" title="ลบผู้ใช้">
                      🗑️
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
    }).join('')}
      </div>
    `;

    Utils.createModal('👥 จัดการผู้ใช้งาน (' + this.allUsers.length + ' คน)', content, 'modal-lg');
  },

  filterUserList() {
    const searchInput = document.getElementById('user-search');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase();
    const items = document.querySelectorAll('.user-item');

    items.forEach(item => {
      const name = item.dataset.name || '';
      const email = item.dataset.email || '';
      const visible = name.includes(query) || email.includes(query);
      item.style.display = visible ? 'block' : 'none';
    });
  },

  async promoteToAdmin(email) {
    const confirmed = await Utils.confirm('เลื่อนขั้นเป็น Admin', `ต้องการเลื่อนขั้น ${email} เป็น Admin หรือไม่?`);
    if (!confirmed) return;

    // Add to ADMIN_EMAILS in localStorage
    const adminEmails = JSON.parse(localStorage.getItem('jaun_admin_emails') || '[]');
    if (!adminEmails.includes(email)) {
      adminEmails.push(email);
      localStorage.setItem('jaun_admin_emails', JSON.stringify(adminEmails));
    }

    Utils.closeModal();
    Utils.showToast(`เลื่อนขั้น ${email} เป็น Admin เรียบร้อย`, 'success');
    App.navigate('adminDashboard');
  },

  async demoteToUser(email) {
    const confirmed = await Utils.confirm('ลดขั้นเป็น User', `ต้องการลดขั้น ${email} เป็น User หรือไม่?`);
    if (!confirmed) return;

    // Remove from ADMIN_EMAILS in localStorage
    const adminEmails = JSON.parse(localStorage.getItem('jaun_admin_emails') || '[]');
    const index = adminEmails.indexOf(email);
    if (index > -1) {
      adminEmails.splice(index, 1);
      localStorage.setItem('jaun_admin_emails', JSON.stringify(adminEmails));
    }

    Utils.closeModal();
    Utils.showToast(`ลดขั้น ${email} เป็น User เรียบร้อย`, 'success');
    App.navigate('adminDashboard');
  },

  async deleteUser(userId) {
    const confirmed = await Utils.confirm('ยืนยันการลบผู้ใช้', 'คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?');
    if (!confirmed) return;

    try {
      Utils.showLoading();
      await API.deleteUser(userId, Auth.getUser().email);
      Utils.hideLoading();
      Utils.closeModal();
      Utils.showToast('ลบผู้ใช้เรียบร้อย', 'success');
      App.navigate('adminDashboard');
    } catch (error) {
      Utils.hideLoading();
      Utils.showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  }
};
