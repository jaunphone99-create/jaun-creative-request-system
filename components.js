/**
 * JAUN Creative Request System - UI Components
 * Reusable UI components
 */

const Components = {
  /**
   * สร้าง Header
   */
  header(user) {
    const roleLabel = {
      superadmin: '⭐ Super Admin',
      admin: '🛡️ Admin',
      user: '👤 User'
    };

    return `
      <header class="header">
        <div class="container">
          <div class="header-inner">
            <div class="header-brand">
              <svg class="header-logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#1B2A5C"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-family="Montserrat" font-weight="700" font-size="16">J</text>
              </svg>
              <div>
                <div class="header-title">${CONFIG.COMPANY_NAME}</div>
                <div style="font-size: 0.75rem; color: var(--color-medium-grey);">Creative Request System</div>
              </div>
            </div>
            <div class="header-user">
              <div class="header-user-info">
                <div class="header-user-name">${Utils.escapeHtml(user.name)}</div>
                <div class="header-user-role">${roleLabel[user.role] || 'User'} | ${Utils.escapeHtml(user.department || 'ไม่ระบุแผนก')}</div>
              </div>
              ${user.picture ? `<img src="${user.picture}" alt="Avatar" class="header-avatar" referrerpolicy="no-referrer">` : ''}
              <button class="btn btn-danger btn-sm" onclick="Auth.logout()">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      </header>
    `;
  },

  /**
   * สร้าง Stat Card
   */
  statCard(value, label, colorClass = '') {
    return `
      <div class="stat-card ${colorClass}">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${Utils.escapeHtml(label)}</div>
      </div>
    `;
  },

  /**
   * สร้าง Status Badge
   */
  statusBadge(status) {
    const statusInfo = Utils.getStatus(status);
    if (!statusInfo) return `<span class="badge">${status}</span>`;

    return `<span class="badge badge-${status}">${statusInfo.label}</span>`;
  },

  /**
   * สร้าง Service Card
   */
  serviceCard(service, isActive = false) {
    return `
      <div class="service-card ${isActive ? 'active' : ''}" data-service="${service.id}" onclick="Pages.selectService('${service.id}')">
        <div class="service-icon">${service.icon}</div>
        <div class="service-name">${Utils.escapeHtml(service.name)}<br><small>${Utils.escapeHtml(service.nameTh)}</small></div>
      </div>
    `;
  },

  /**
   * สร้าง Request Card สำหรับ User
   */
  userRequestCard(request) {
    const service = Utils.getService(request.serviceType);
    const statusInfo = Utils.getStatus(request.status);

    let actionButtons = '';
    let alertBox = '';

    // ปุ่มดูรายละเอียด - แสดงเสมอ
    let viewDetailBtn = `
        <button class="btn btn-secondary btn-sm" onclick="Components.showRequestDetail('${request.id}')">
          👁️ ดูรายละเอียด
        </button>
      `;

    // ถ้าสถานะเป็น revision ให้แสดงข้อความจาก admin และปุ่มแก้ไข
    if (request.status === 'revision') {
      alertBox = `
        <div class="alert alert-warning">
          <strong>💬 ข้อความจากแอดมิน:</strong><br>
          ${Utils.escapeHtml(request.adminComment || 'กรุณาตรวจสอบและแก้ไขข้อมูล')}
        </div>
      `;
      actionButtons = `
        <button class="btn btn-warning" onclick="App.navigate('editRequest', '${request.id}')">
          ✏️ แก้ไขคำขอนี้
        </button>
      `;
    }

    // ถ้าเสร็จแล้วและมี link
    if (request.status === 'completed' && request.completedFileLink) {
      actionButtons = `
        <a href="${Utils.escapeHtml(request.completedFileLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-success">
          📥 ดาวน์โหลดไฟล์งาน
        </a>
      `;
    }

    // ถ้าถูกปฏิเสธ
    if (request.status === 'rejected' && request.rejectionReason) {
      alertBox = `
        <div class="alert alert-danger">
          <strong>❌ เหตุผลที่ปฏิเสธ:</strong><br>
          ${Utils.escapeHtml(request.rejectionReason)}
        </div>
      `;
    }

    // รวมปุ่มทั้งหมด
    let allButtons = viewDetailBtn + actionButtons;

    return `
      <div class="request-card">
        <div class="request-header">
          <div class="request-title-area">
            <span class="request-icon">${service?.icon || '📄'}</span>
            <div>
              <h3 class="request-title">${Utils.escapeHtml(request.projectName)}</h3>
              <div class="request-subtitle">${service?.name || request.serviceType} - ${service?.nameTh || ''}</div>
            </div>
          </div>
          ${this.statusBadge(request.status)}
        </div>
        
        <div class="request-details">
          ${request.details ? `<p><strong>รายละเอียด:</strong> ${Utils.escapeHtml(request.details.substring(0, 100))}${request.details.length > 100 ? '...' : ''}</p>` : ''}
          ${request.deadline ? `<p class="request-meta"><strong>วันที่ต้องการ:</strong> ${Utils.formatDate(request.deadline)}</p>` : ''}
          ${request.appointmentDate ? `<p class="request-meta"><strong>วันที่ถ่าย:</strong> ${Utils.formatDateTime(request.appointmentDate)}</p>` : ''}
          ${request.location ? `<p class="request-meta"><strong>สาขา/สถานที่:</strong> ${Utils.escapeHtml(request.location)}</p>` : ''}
          ${request.revisionCount > 0 ? `<p class="request-meta text-warning"><strong>🔄 แก้ไขแล้ว:</strong> ${request.revisionCount} ครั้ง</p>` : ''}
        </div>
        
        ${alertBox}
        
        <div class="request-actions">${allButtons}</div>
      </div>
    `;
  },

  /**
   * สร้าง Request Card สำหรับ Admin
   */
  adminRequestCard(request, user) {
    const service = Utils.getService(request.serviceType);
    const statusInfo = Utils.getStatus(request.status);

    let actionButtons = '';

    // ปุ่มดูรายละเอียด - แสดงเสมอ
    let viewDetailBtn = `
        <button class="btn btn-secondary btn-sm" onclick="Components.showRequestDetail('${request.id}')">
          👁️ ดูรายละเอียด
        </button>
      `;

    // ปุ่มตามสถานะ
    if (request.status === 'pending') {
      actionButtons = `
        <button class="btn btn-success" onclick="Pages.approveRequest('${request.id}')">✅ อนุมัติ</button>
        <button class="btn btn-warning" onclick="Pages.sendRevision('${request.id}')">🔄 ส่งกลับแก้ไข</button>
        <button class="btn btn-danger" onclick="Pages.rejectRequest('${request.id}')">❌ ปฏิเสธ</button>
      `;
    } else if (request.status === 'progress') {
      actionButtons = `
        <button class="btn btn-success" onclick="Pages.completeRequest('${request.id}')">✅ แจ้งงานเสร็จ</button>
      `;
    }

    // Super Admin สามารถลบได้
    if (Auth.isSuperAdmin(Auth.getUser()?.email)) {
      actionButtons += `
        <button class="btn btn-danger btn-sm" onclick="Pages.deleteRequest('${request.id}')">🗑️ ลบ</button>
      `;
    }

    // รวมปุ่มทั้งหมด
    let allButtons = viewDetailBtn + actionButtons;

    return `
      <div class="request-card">
        <div class="request-header">
          <div class="request-title-area">
            <span class="request-icon">${service?.icon || '📄'}</span>
            <div>
              <h3 class="request-title">${Utils.escapeHtml(request.projectName)}</h3>
              <div class="request-subtitle">${service?.name || request.serviceType}</div>
              <div class="request-meta mt-sm">
                👤 ${Utils.escapeHtml(user?.name || request.submittedBy)} | 
                🏢 ${Utils.escapeHtml(user?.department || 'N/A')} | 
                📅 ${Utils.formatDate(request.submittedAt)}
              </div>
            </div>
          </div>
          ${this.statusBadge(request.status)}
        </div>
        
        <div class="request-details">
          ${request.details ? `<p><strong>รายละเอียด:</strong> ${Utils.escapeHtml(request.details.substring(0, 100))}${request.details.length > 100 ? '...' : ''}</p>` : ''}
          ${request.deadline ? `<p class="request-meta"><strong>วันที่ต้องการ:</strong> ${Utils.formatDate(request.deadline)}</p>` : ''}
          ${request.appointmentDate ? `<p class="request-meta"><strong>วันที่ถ่าย:</strong> ${Utils.formatDateTime(request.appointmentDate)}</p>` : ''}
          ${request.revisionCount > 0 ? `<p class="request-meta text-warning"><strong>🔄 แก้ไขแล้ว:</strong> ${request.revisionCount} ครั้ง</p>` : ''}
        </div>
        
        <div class="request-actions">${allButtons}</div>
      </div>
    `;
  },

  /**
   * ดึงรายละเอียดเฉพาะของแต่ละ service type
   */
  getServiceSpecificDetails(request) {
    let html = '';

    if (request.serviceType === 'graphic') {
      if (request.purpose) html += `<p><strong>วัตถุประสงค์:</strong> ${Utils.escapeHtml(request.purpose)}</p>`;
      if (request.imageSize) html += `<p><strong>ขนาด:</strong> ${Utils.escapeHtml(request.imageSize)}</p>`;
      if (request.referenceLink) html += `<p><strong>รูปอ้างอิง:</strong> ${Utils.escapeHtml(request.referenceLink)}</p>`;
    } else if (request.serviceType === 'video') {
      if (request.videoFormat) html += `<p><strong>รูปแบบ:</strong> ${Utils.escapeHtml(request.videoFormat)}</p>`;
      if (request.videoDuration) html += `<p><strong>ความยาว:</strong> ${Utils.escapeHtml(request.videoDuration)}</p>`;
      if (request.tiktokRef) html += `<p><strong>TikTok Ref:</strong> <a href="${Utils.escapeHtml(request.tiktokRef)}" target="_blank">ดูที่นี่</a></p>`;
    } else if (request.serviceType === 'photo') {
      if (request.appointmentDate) html += `<p><strong>วันที่ถ่าย:</strong> ${Utils.formatDateTime(request.appointmentDate)}</p>`;
      if (request.location) html += `<p><strong>สถานที่:</strong> ${Utils.escapeHtml(request.location)}</p>`;
      if (request.productType) html += `<p><strong>ประเภทสินค้า:</strong> ${Utils.escapeHtml(request.productType)}</p>`;
      if (request.productDetails) html += `<p><strong>รายละเอียดสินค้า:</strong> ${Utils.escapeHtml(request.productDetails)}</p>`;
    } else if (request.serviceType === 'tech' || request.serviceType === 'sales') {
      if (request.location) html += `<p><strong>สาขา:</strong> ${Utils.escapeHtml(request.location)}</p>`;
      if (request.driveLink) html += `<p><strong>ลิงก์ไฟล์:</strong> <a href="${Utils.escapeHtml(request.driveLink)}" target="_blank">ดูที่นี่</a></p>`;
    }

    return html;
  },

  /**
   * สร้าง Form Fields ตาม Service Type
   */
  getFormFields(serviceType, existingData = {}) {
    // Common fields for all
    let commonFields = `
      <div class="form-group">
        <label class="form-label">ชื่อโครงการ (Project Title) *</label>
        <input type="text" class="form-input" name="projectName" value="${Utils.escapeHtml(existingData.projectName || '')}" required placeholder="ระบุหมายเลขอินวอยด์, คำสั่งซื้อ หรือรายละเอียด">
      </div>
      <div class="form-group">
        <label class="form-label">รายละเอียด (Description) *</label>
        <textarea class="form-textarea" name="details" required placeholder="อธิบายรายละเอียดงานที่ต้องการ">${Utils.escapeHtml(existingData.details || '')}</textarea>
      </div>
    `;

    // Tech/Sales - different fields
    if (serviceType === 'tech' || serviceType === 'sales') {
      return commonFields + `
        <div class="form-group">
          <label class="form-label">สาขา *</label>
          <select class="form-select" name="location" required>
            <option value="">เลือกสาขา</option>
            ${Utils.createSelectOptions(CONFIG.FORM_OPTIONS.branches, existingData.location)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ลิงก์ไฟล์คลิป (Google Drive) *</label>
          <input type="url" class="form-input" name="driveLink" value="${Utils.escapeHtml(existingData.driveLink || '')}" required placeholder="https://drive.google.com/...">
        </div>
      `;
    }

    // Add deadline for other types
    commonFields += `
      <div class="form-group">
        <label class="form-label">วันที่ต้องการ (Due Date) *</label>
        <input type="date" class="form-input" name="deadline" value="${existingData.deadline || ''}" required>
      </div>
    `;

    // Service-specific fields
    if (serviceType === 'graphic') {
      return commonFields + `
        <div class="form-group">
          <label class="form-label">วัตถุประสงค์</label>
          <select class="form-select" name="purpose">
            ${Utils.createSelectOptions(CONFIG.FORM_OPTIONS.purposes, existingData.purpose)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ขนาดและสัดส่วน</label>
          <select class="form-select" name="imageSize">
            ${Utils.createSelectOptions(CONFIG.FORM_OPTIONS.imageSizes, existingData.imageSize)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">🖼️ รูปภาพอ้างอิง / ตัวอย่าง</label>
          <textarea class="form-textarea" name="referenceLink" rows="4" placeholder="วางลิงก์รูปภาพจาก Google Drive หรือ Imgur&#10;สามารถวางได้หลายลิงก์ แต่ละรูปคั่นด้วย Enter&#10;&#10;ตัวอย่าง:&#10;https://drive.google.com/file/d/xxx&#10;https://imgur.com/abc123">${Utils.escapeHtml(existingData.referenceLink || '')}</textarea>
          <small style="color: var(--color-medium-grey);">💡 วางลิงก์รูปภาพได้หลายรูป แต่ละรูปคั่นด้วยการขึ้นบรรทัดใหม่</small>
        </div>
      `;
    }

    if (serviceType === 'video') {
      return commonFields + `
        <div class="form-group">
          <label class="form-label">รูปแบบวิดีโอ</label>
          <select class="form-select" name="videoFormat">
            ${Utils.createSelectOptions(CONFIG.FORM_OPTIONS.videoFormats, existingData.videoFormat)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ความยาวโดยประมาณ</label>
          <select class="form-select" name="videoDuration">
            ${Utils.createSelectOptions(CONFIG.FORM_OPTIONS.videoDurations, existingData.videoDuration)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ลิงก์ TikTok ตัวอย่าง (ถ้ามี)</label>
          <input type="url" class="form-input" name="tiktokRef" value="${Utils.escapeHtml(existingData.tiktokRef || '')}" placeholder="https://tiktok.com/...">
        </div>
      `;
    }

    // Photography - ไม่ต้องมี Description และ Due Date ใช้ appointmentDate แทน
    if (serviceType === 'photo') {
      // ใช้เฉพาะ projectName field
      let photoFields = `
      <div class="form-group">
        <label class="form-label">ชื่อโครงการ / รายละเอียดงานถ่าย *</label>
        <input type="text" class="form-input" name="projectName" value="${Utils.escapeHtml(existingData.projectName || '')}" required placeholder="ระบุหมายเลขอินวอยด์, คำสั่งซื้อ หรือรายละเอียดสินค้าที่จะถ่าย">
      </div>
      <div class="form-group">
        <label class="form-label">📅 วันและเวลาที่ต้องการถ่าย *</label>
        <input type="datetime-local" class="form-input" name="appointmentDate" value="${existingData.appointmentDate || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">📍 สถานที่ถ่าย *</label>
        <select class="form-select" name="location" required>
          <option value="">เลือกสถานที่</option>
          ${Utils.createSelectOptions(CONFIG.FORM_OPTIONS.photoLocations, existingData.location)}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">📱 ประเภทสินค้า</label>
        <select class="form-select" name="productType">
          ${Utils.createSelectOptions(CONFIG.FORM_OPTIONS.productTypes, existingData.productType)}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">📝 รายละเอียดสินค้าที่จะถ่าย</label>
        <textarea class="form-textarea" name="productDetails" placeholder="รายละเอียดสินค้าที่จะถ่าย เช่น สี รุ่น สภาพ ฯลฯ">${Utils.escapeHtml(existingData.productDetails || '')}</textarea>
      </div>
    `;
      return photoFields;
    }

    return commonFields;
  },

  /**
   * Empty state
   */
  emptyState(icon, message) {
    return `
      <div class="text-center" style="padding: 60px 20px; color: var(--color-medium-grey);">
        <div style="font-size: 4rem; margin-bottom: 16px;">${icon}</div>
        <p style="font-size: 1.1rem;">${Utils.escapeHtml(message)}</p>
      </div>
    `;
  },

  /**
   * แสดง Modal รายละเอียดคำขอทั้งหมด
   */
  showRequestDetail(requestId) {
    const request = Pages.getRequestById(requestId);
    if (!request) {
      Utils.showToast('ไม่พบข้อมูลคำขอ', 'error');
      return;
    }

    const service = Utils.getService(request.serviceType);
    const user = Pages.getUserByEmail(request.submittedBy);
    const statusInfo = Utils.getStatus(request.status);

    // สร้างรายละเอียดตาม service type
    let serviceDetails = '';

    if (request.serviceType === 'graphic') {
      serviceDetails = `
            <div class="detail-section">
              <h4>📐 ข้อมูลงานกราฟิก</h4>
              ${request.purpose ? `<p><strong>วัตถุประสงค์:</strong> ${Utils.escapeHtml(request.purpose)}</p>` : ''}
              ${request.imageSize ? `<p><strong>ขนาด:</strong> ${Utils.escapeHtml(request.imageSize)}</p>` : ''}
              ${request.referenceLink ? `
                <p><strong>รูปภาพอ้างอิง:</strong></p>
                <div class="reference-links">${this.formatReferenceLinks(request.referenceLink)}</div>
              ` : ''}
            </div>
          `;
    } else if (request.serviceType === 'video') {
      serviceDetails = `
            <div class="detail-section">
              <h4>🎬 ข้อมูลงานวิดีโอ</h4>
              ${request.videoFormat ? `<p><strong>รูปแบบ:</strong> ${Utils.escapeHtml(request.videoFormat)}</p>` : ''}
              ${request.videoDuration ? `<p><strong>ความยาว:</strong> ${Utils.escapeHtml(request.videoDuration)}</p>` : ''}
              ${request.tiktokRef ? `<p><strong>TikTok อ้างอิง:</strong> <a href="${Utils.escapeHtml(request.tiktokRef)}" target="_blank">ดูที่นี่</a></p>` : ''}
            </div>
          `;
    } else if (request.serviceType === 'photo') {
      serviceDetails = `
            <div class="detail-section">
              <h4>📸 ข้อมูลงานถ่ายภาพ</h4>
              ${request.appointmentDate ? `<p><strong>วันเวลาถ่าย:</strong> ${Utils.formatDateTime(request.appointmentDate)}</p>` : ''}
              ${request.location ? `<p><strong>สถานที่:</strong> ${Utils.escapeHtml(request.location)}</p>` : ''}
              ${request.productType ? `<p><strong>ประเภทสินค้า:</strong> ${Utils.escapeHtml(request.productType)}</p>` : ''}
              ${request.productDetails ? `<p><strong>รายละเอียดสินค้า:</strong> ${Utils.escapeHtml(request.productDetails)}</p>` : ''}
            </div>
          `;
    } else if (request.serviceType === 'tech' || request.serviceType === 'sales') {
      serviceDetails = `
            <div class="detail-section">
              <h4>🎥 ข้อมูลงานตัดต่อ</h4>
              ${request.location ? `<p><strong>สาขา:</strong> ${Utils.escapeHtml(request.location)}</p>` : ''}
              ${request.driveLink ? `<p><strong>ลิงก์ไฟล์:</strong> <a href="${Utils.escapeHtml(request.driveLink)}" target="_blank">ดูที่นี่</a></p>` : ''}
            </div>
          `;
    }

    // สร้าง Modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="request-detail-modal" onclick="Components.closeRequestDetail(event)">
          <div class="modal-content modal-lg" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h2>${service?.icon || '📄'} ${Utils.escapeHtml(request.projectName)}</h2>
              <button class="modal-close" onclick="Components.closeRequestDetail()">&times;</button>
            </div>
            <div class="modal-body">
              <!-- ข้อมูลพื้นฐาน -->
              <div class="detail-section">
                <h4>📋 ข้อมูลพื้นฐาน</h4>
                <div class="detail-grid">
                  <div><strong>ประเภทบริการ:</strong> ${service?.name || request.serviceType} (${service?.nameTh || ''})</div>
                  <div><strong>สถานะ:</strong> <span class="badge badge-${request.status}">${statusInfo?.label || request.status}</span></div>
                  <div><strong>ผู้ส่งคำขอ:</strong> ${Utils.escapeHtml(user?.name || request.submittedBy)}</div>
                  <div><strong>แผนก:</strong> ${Utils.escapeHtml(user?.department || 'N/A')}</div>
                  <div><strong>วันที่ส่ง:</strong> ${Utils.formatDateTime(request.submittedAt)}</div>
                  ${request.deadline ? `<div><strong>กำหนดส่ง:</strong> ${Utils.formatDate(request.deadline)}</div>` : ''}
                  ${request.revisionCount > 0 ? `<div><strong>แก้ไขแล้ว:</strong> ${request.revisionCount} ครั้ง</div>` : ''}
                </div>
              </div>

              ${request.details ? `
              <!-- รายละเอียดงาน -->
              <div class="detail-section">
                <h4>📝 รายละเอียดงาน</h4>
                <p style="white-space: pre-wrap;">${Utils.escapeHtml(request.details)}</p>
              </div>
              ` : ''}

              ${serviceDetails}

              ${request.adminComment ? `
              <!-- ข้อความจากแอดมิน -->
              <div class="detail-section" style="background: #FEF3C7;">
                <h4>💬 ข้อความจากแอดมิน</h4>
                <p>${Utils.escapeHtml(request.adminComment)}</p>
              </div>
              ` : ''}

              ${request.rejectionReason ? `
              <!-- เหตุผลที่ปฏิเสธ -->
              <div class="detail-section" style="background: #FEE2E2;">
                <h4>❌ เหตุผลที่ปฏิเสธ</h4>
                <p>${Utils.escapeHtml(request.rejectionReason)}</p>
              </div>
              ` : ''}

              ${request.completedFileLink ? `
              <!-- ไฟล์งานที่เสร็จ -->
              <div class="detail-section" style="background: #D1FAE5;">
                <h4>✅ งานเสร็จสมบูรณ์</h4>
                <a href="${Utils.escapeHtml(request.completedFileLink)}" target="_blank" class="btn btn-success">📥 ดาวน์โหลดไฟล์งาน</a>
              </div>
              ` : ''}
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="Components.closeRequestDetail()">ปิด</button>
            </div>
          </div>
        </div>
      `;

    // เพิ่ม modal เข้าไปใน DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  /**
   * ปิด Modal รายละเอียด
   */
  closeRequestDetail(event) {
    if (event && event.target.id !== 'request-detail-modal') return;
    const modal = document.getElementById('request-detail-modal');
    if (modal) modal.remove();
  },

  /**
   * แปลงลิงก์รูปภาพหลายรูปเป็น HTML
   */
  formatReferenceLinks(linksText) {
    if (!linksText) return '';
    const links = linksText.split(/[\n,]/).filter(link => link.trim());
    return links.map(link => {
      const trimmedLink = link.trim();
      if (trimmedLink.startsWith('http')) {
        return `<a href="${Utils.escapeHtml(trimmedLink)}" target="_blank" class="reference-link">🔗 ${Utils.escapeHtml(trimmedLink.substring(0, 50))}...</a>`;
      }
      return `<span>${Utils.escapeHtml(trimmedLink)}</span>`;
    }).join('');
  }
};

// Freeze Components
Object.freeze(Components);
