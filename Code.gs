/**
 * JAUN Creative Request System - Google Apps Script API (v6)
 * ระบบจัดการคำขอ Creative ผ่าน Google Sheets - หัวข้อภาษาไทย
 * 
 * อัปเดต: เพิ่มหัวข้อภาษาไทย + คอลัมน์ใหม่
 */

// ===================== CONFIG =====================
const SUPER_ADMIN_EMAILS = [
  'sanalohit01@gmail.com',
  'jaunphone.99@gmail.com'
];

const ADMIN_EMAILS = [
  'jaunpowercilp@gmail.com',
  'loveininor@gmail.com'
];

const ADMIN_DOMAIN = '@jaun.com';
const USERS_SHEET = 'Users';
const REQUESTS_SHEET = 'Requests';

// ===================== หัวข้อคอลัมน์ภาษาไทย =====================
// Sheet: Users
const USER_HEADERS = [
  'รหัส',           // id
  'อีเมล',          // email
  'ชื่อ-นามสกุล',    // name
  'แผนก',          // department
  'บทบาท',         // role
  'วันที่สร้าง',      // createdAt
  'เข้าใช้ล่าสุด'     // lastLogin
];

// Sheet: Requests (เพิ่มคอลัมน์ใหม่)
const REQUEST_HEADERS = [
  'รหัสคำขอ',              // id (A)
  'ชื่อโครงการ',            // projectName (B)
  'ประเภทบริการ',          // serviceType (C)
  'รายละเอียด',            // details (D)
  'กำหนดส่ง',              // deadline (E)
  'สถานะ',                // status (F)
  'วัตถุประสงค์',           // purpose (G) - Graphic
  'ขนาดรูปภาพ',            // imageSize (H) - Graphic
  'ลิงก์อ้างอิง',            // referenceLink (I) - Graphic
  'รูปแบบวิดีโอ',           // videoFormat (J) - Video
  'ความยาววิดีโอ',          // videoDuration (K) - Video
  'ลิงก์ TikTok อ้างอิง',    // tiktokRef (L) - Video
  'วันที่นัดหมาย',          // appointmentDate (M) - Photo
  'สถานที่',               // location (N) - Photo/Tech/Sales
  'ประเภทสินค้า',          // productType (O) - Photo
  'รายละเอียดสินค้า',       // productDetails (P) - Photo
  'ลิงก์ไดรฟ์',             // driveLink (Q) - Tech/Sales
  'อีเมลผู้ส่ง',             // submittedBy (R)
  'ชื่อผู้ส่งคำขอ',           // submitterName (S) - NEW
  'แผนกผู้ส่ง',             // submitterDepartment (T) - NEW
  'วันที่ส่งคำขอ',           // submittedAt (U)
  'ประวัติการแก้ไข',        // revisionHistory (V)
  'จำนวนครั้งที่แก้ไข',       // revisionCount (W)
  'ความเห็นแอดมิน',        // adminComment (X)
  'ลิงก์ไฟล์งานสำเร็จ',      // completedFileLink (Y)
  'เหตุผลที่ปฏิเสธ',        // rejectionReason (Z)
  'วันที่เสร็จสมบูรณ์'       // completedAt (AA) - NEW
];

// Mapping: ชื่อใน JavaScript -> ตำแหน่งคอลัมน์
const REQUEST_COL_MAP = {
  'id': 0,
  'projectName': 1,
  'serviceType': 2,
  'details': 3,
  'deadline': 4,
  'status': 5,
  'purpose': 6,
  'imageSize': 7,
  'referenceLink': 8,
  'videoFormat': 9,
  'videoDuration': 10,
  'tiktokRef': 11,
  'appointmentDate': 12,
  'location': 13,
  'productType': 14,
  'productDetails': 15,
  'driveLink': 16,
  'submittedBy': 17,
  'submitterName': 18,
  'submitterDepartment': 19,
  'submittedAt': 20,
  'revisionHistory': 21,
  'revisionCount': 22,
  'adminComment': 23,
  'completedFileLink': 24,
  'rejectionReason': 25,
  'completedAt': 26
};

// Mapping สำหรับ Users: ชื่อใน JavaScript -> ตำแหน่งคอลัมน์มาตรฐาน
const USER_COL_MAP = {
  'id': 0,
  'email': 1,
  'name': 2,
  'department': 3,
  'role': 4,
  'createdAt': 5,
  'lastLogin': 6
};

// ===================== UTILITY FUNCTIONS =====================

function generateUUID() {
  return Utilities.getUuid();
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

/**
 * หาตำแหน่งคอลัมน์จริงของแต่ละฟิลด์ โดยอ่านจาก "แถวหัวข้อ" ในชีต
 *
 * ทำไมต้องมี: เดิมโค้ดอ่านด้วยเลขคอลัมน์ตายตัว (เช่น row[1] คืออีเมลเสมอ)
 * ถ้ามีคนแทรก ย้าย หรือเพิ่มคอลัมน์ในชีต เลขจะเลื่อนแต่โค้ดไม่รู้ตัว
 * ผลคืออ่านผิดช่อง -> หาผู้ใช้เดิมไม่เจอ -> สร้างแถวซ้ำ
 * (เกิดขึ้นจริงเมื่อ 26 ม.ค. 2026 ได้ผู้ใช้ซ้ำมา 6 แถว)
 *
 * ถ้าหาหัวข้อไม่เจอ จะถอยไปใช้ตำแหน่งมาตรฐานเดิม เพื่อไม่ให้ระบบล่ม
 * ถ้าหัวข้อซ้ำกัน จะเลือกช่องซ้ายสุด
 */
function resolveColumns(sheet, headers, colMap) {
  const lastCol = sheet.getLastColumn();
  const actual = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];

  const resolved = {};
  Object.keys(colMap).forEach(function (field) {
    const wanted = headers[colMap[field]];
    const found = actual.indexOf(wanted);
    resolved[field] = (found !== -1) ? found : colMap[field];
  });
  return resolved;
}

/**
 * สร้างแถวใหม่โดยวางค่าตามตำแหน่งคอลัมน์จริง (ใช้คู่กับ appendRow)
 * ปลอดภัยกว่าการเรียงค่าใส่ array ตรงๆ เพราะไม่ต้องเดาว่าคอลัมน์ไหนอยู่ลำดับที่เท่าไร
 */
function buildRow(values, cols, sheet) {
  let width = sheet.getLastColumn();
  Object.keys(cols).forEach(function (f) {
    if (cols[f] + 1 > width) width = cols[f] + 1;
  });

  const row = [];
  for (let i = 0; i < width; i++) row.push('');

  Object.keys(values).forEach(function (field) {
    if (cols[field] !== undefined) row[cols[field]] = values[field];
  });
  return row;
}

/**
 * แปลงข้อมูลจาก Sheet เป็น Objects
 * อ่านตำแหน่งคอลัมน์จากหัวข้อในชีต ไม่ใช่เลขตายตัว
 */
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const sheetName = sheet.getName();
  let cols;

  if (sheetName === REQUESTS_SHEET) {
    cols = resolveColumns(sheet, REQUEST_HEADERS, REQUEST_COL_MAP);
  } else if (sheetName === USERS_SHEET) {
    cols = resolveColumns(sheet, USER_HEADERS, USER_COL_MAP);
  } else {
    return [];
  }

  const fields = Object.keys(cols);
  const objects = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = { _rowIndex: i + 1 };

    fields.forEach(function (field) {
      const v = row[cols[field]];
      obj[field] = (v === undefined) ? '' : v;
    });

    objects.push(obj);
  }

  return objects;
}

/**
 * ดึงข้อมูล User จาก email
 */
function getUserInfoByEmail(email) {
  const usersSheet = getSheet(USERS_SHEET);
  if (!usersSheet) return null;
  
  const users = sheetToObjects(usersSheet);
  return users.find(u => u.email === email);
}

function isSuperAdmin(email) {
  return SUPER_ADMIN_EMAILS.includes(email);
}

function isAdmin(email) {
  if (!email) return false;
  return email.endsWith(ADMIN_DOMAIN) || ADMIN_EMAILS.includes(email);
}

function getUserRole(email) {
  if (isSuperAdmin(email)) return 'superadmin';
  if (isAdmin(email)) return 'admin';
  return 'user';
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================== SHEET SETUP =====================

/**
 * สร้างหัวข้อภาษาไทยใน Sheet (รันครั้งเดียว)
 */
function setupThaiHeaders() {
  const ss = getSpreadsheet();
  
  // Setup Users Sheet
  let usersSheet = ss.getSheetByName(USERS_SHEET);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET);
  }
  usersSheet.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS]);
  usersSheet.getRange(1, 1, 1, USER_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1B2A5C')
    .setFontColor('#FFFFFF');
  
  // Setup Requests Sheet
  let requestsSheet = ss.getSheetByName(REQUESTS_SHEET);
  if (!requestsSheet) {
    requestsSheet = ss.insertSheet(REQUESTS_SHEET);
  }
  requestsSheet.getRange(1, 1, 1, REQUEST_HEADERS.length).setValues([REQUEST_HEADERS]);
  requestsSheet.getRange(1, 1, 1, REQUEST_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1B2A5C')
    .setFontColor('#FFFFFF');
  
  // Freeze header row
  usersSheet.setFrozenRows(1);
  requestsSheet.setFrozenRows(1);
  
  Logger.log('✅ สร้างหัวข้อภาษาไทยเรียบร้อย!');
}

// ===================== EMAIL NOTIFICATIONS =====================

/**
 * ส่ง Email แจ้งเตือนไปยัง Admin เมื่อมีคำขอใหม่
 */
function sendNewRequestNotification(requestData, userEmail, userName, userDept) {
  const adminEmails = SUPER_ADMIN_EMAILS.concat(ADMIN_EMAILS || []);
  if (adminEmails.length === 0) return;
  
  const subject = `📬 คำขอใหม่: ${requestData.projectName}`;
  const serviceIcons = { 'graphic': '🎨', 'video': '🎬', 'photo': '📸', 'tech': '🔧', 'sales': '💼' };
  const icon = serviceIcons[requestData.serviceType] || '📋';
  
  const body = `
<html>
<head>
  <style>
    body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1B2A5C, #45ABC5); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 12px 12px; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: 600; color: #1B2A5C; }
    .badge { display: inline-block; padding: 4px 12px; background: #FEF3C7; color: #D97706; border-radius: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${icon} คำขอใหม่</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">JAUN Creative Request System</p>
    </div>
    <div class="content">
      <div class="detail-row"><span class="label">ชื่อโครงการ:</span> ${requestData.projectName}</div>
      <div class="detail-row"><span class="label">ประเภทบริการ:</span> ${requestData.serviceType}</div>
      <div class="detail-row"><span class="label">ชื่อผู้ส่ง:</span> ${userName || 'ไม่ระบุ'}</div>
      <div class="detail-row"><span class="label">แผนก:</span> ${userDept || 'ไม่ระบุ'}</div>
      <div class="detail-row"><span class="label">อีเมล:</span> ${userEmail}</div>
      <div class="detail-row"><span class="label">รายละเอียด:</span><br>${requestData.details || 'ไม่ระบุ'}</div>
      <div class="detail-row"><span class="label">กำหนดส่ง:</span> ${requestData.deadline || 'ไม่ระบุ'}</div>
      <div class="detail-row"><span class="label">สถานะ:</span> <span class="badge">รออนุมัติ</span></div>
      <p style="text-align: center; margin-top: 20px;">กรุณาเข้าสู่ระบบเพื่อดำเนินการอนุมัติหรือปฏิเสธคำขอ</p>
    </div>
  </div>
</body>
</html>`;
  
  adminEmails.forEach(email => {
    try {
      MailApp.sendEmail({ to: email, subject: subject, htmlBody: body });
    } catch (e) {
      console.log('Failed to send email to: ' + email + ' - ' + e.message);
    }
  });
}

/**
 * ส่ง Email แจ้งเตือนผู้ส่งคำขอเมื่อสถานะเปลี่ยน
 */
function sendStatusUpdateNotification(requestData, userEmail, newStatus, comment) {
  const statusLabels = { 'pending': 'รออนุมัติ', 'progress': 'กำลังดำเนินการ', 'revision': 'ส่งกลับแก้ไข', 'completed': 'เสร็จสมบูรณ์', 'rejected': 'ปฏิเสธ' };
  const statusColors = { 'pending': '#D97706', 'progress': '#2563EB', 'revision': '#EA580C', 'completed': '#059669', 'rejected': '#DC2626' };
  
  const label = statusLabels[newStatus] || newStatus;
  const color = statusColors[newStatus] || '#666';
  const subject = `📢 สถานะคำขอเปลี่ยน: ${requestData.projectName} → ${label}`;
  
  const body = `
<html>
<head>
  <style>
    body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1B2A5C, #45ABC5); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 12px 12px; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: 600; color: #1B2A5C; }
    .status-badge { display: inline-block; padding: 6px 16px; background: ${color}20; color: ${color}; border-radius: 20px; font-weight: 600; }
    .comment-box { background: #fff; border-left: 4px solid ${color}; padding: 15px; margin-top: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📢 สถานะอัปเดต</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">JAUN Creative Request System</p>
    </div>
    <div class="content">
      <div class="detail-row"><span class="label">ชื่อโครงการ:</span> ${requestData.projectName}</div>
      <div class="detail-row"><span class="label">สถานะใหม่:</span> <span class="status-badge">${label}</span></div>
      ${comment ? `<div class="comment-box"><span class="label">💬 ข้อความจากแอดมิน:</span><br>${comment}</div>` : ''}
      ${newStatus === 'completed' && requestData.completedFileLink ? `<div class="detail-row"><span class="label">📁 ลิงก์ไฟล์งาน:</span><br><a href="${requestData.completedFileLink}" target="_blank">${requestData.completedFileLink}</a></div>` : ''}
      <p style="text-align: center; margin-top: 20px;">กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติม</p>
    </div>
  </div>
</body>
</html>`;
  
  try {
    MailApp.sendEmail({ to: userEmail, subject: subject, htmlBody: body });
  } catch (e) {
    console.log('Failed to send email to: ' + userEmail + ' - ' + e.message);
  }
}

// ===================== API HANDLERS =====================

function doGet(e) {
  try {
    const action = e.parameter.action || 'getAll';
    
    if (action === 'getAll') {
      const usersSheet = getSheet(USERS_SHEET);
      const requestsSheet = getSheet(REQUESTS_SHEET);
      
      let users = usersSheet ? sheetToObjects(usersSheet) : [];
      let requests = requestsSheet ? sheetToObjects(requestsSheet) : [];
      
      /**
       * ส่งกลับเฉพาะข้อมูลที่ผู้เรียกต้องใช้จริง
       *
       * เดิมส่งคำขอทั้งหมดกลับไปทุกครั้ง (~589 KB) แล้วให้หน้าเว็บกรองทิ้งเอง
       * พนักงานทั่วไปมีคำขอของตัวเองเฉลี่ยแค่ ~19 จาก 596 รายการ
       * แอดมินและ Super Admin ยังได้ข้อมูลครบ เพราะต้องดูงานทุกคน
       *
       * ไม่ส่ง email มา = คืนทุกอย่างเหมือนเดิม เพื่อให้หน้าเว็บเวอร์ชันเก่าใช้งานต่อได้
       *
       * หมายเหตุ: นี่คือการลดขนาดข้อมูลเพื่อความเร็ว ไม่ใช่ระบบความปลอดภัย
       * เพราะ email ที่ส่งมายังเป็นค่าที่ฝั่งผู้ใช้กรอกเองได้ (ยังไม่ได้ตรวจ token)
       *
       * เคยลองใส่ CacheService เก็บผลลัพธ์ไว้ 60 วินาทีแล้ว แต่วัดผลจริงพบว่า
       * ไม่ได้เร็วขึ้น (4.27 vs 4.64 วินาที = อยู่ในช่วงคลาดเคลื่อน)
       * เพราะตัวถ่วงคือค่าโสหุ้ยของ Apps Script เอง ไม่ใช่การอ่านชีต
       * จึงถอดออกเพื่อไม่ให้ซับซ้อนโดยไม่จำเป็น
       */
      const requesterEmail = String(e.parameter.email || '').trim();

      if (requesterEmail && getUserRole(requesterEmail) === 'user') {
        requests = requests.filter(function (r) { return r.submittedBy === requesterEmail; });
        users = users.filter(function (u) { return u.email === requesterEmail; });
      }
      
      return jsonResponse({
        success: true,
        data: { users: users, requests: requests }
      });
    }
    
    if (action === 'getUser') {
      const email = e.parameter.email;
      const usersSheet = getSheet(USERS_SHEET);
      const users = sheetToObjects(usersSheet);
      const user = users.find(u => u.email === email);
      
      return jsonResponse({ success: true, data: user || null });
    }
    
    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

/**
 * ประตูทางเข้าของทุกคำสั่งที่ "เขียน" ลงชีต
 *
 * ทำไมต้องล็อก: ทุกก้อนใน handlePost ทำงานแบบ อ่าน -> ตัดสินใจ -> เขียน
 * ถ้ามีคำขออื่นแทรกเข้ามากลางทาง ข้อมูลที่อ่านไว้จะเก่าไปแล้ว เช่น
 *   - upsertUser : 2 คำขอหาคนเดิมไม่เจอพร้อมกัน -> ได้ผู้ใช้ซ้ำ 2 แถว
 *   - deleteRow  : _rowIndex ที่จำไว้เลื่อนตำแหน่ง -> ลบผิดแถวโดยไม่มี error
 * ScriptLock บังคับให้เข้าทีละคำขอ ทำให้ 3 ขั้นตอนนั้นแทรกกลางไม่ได้
 *
 * หมายเหตุ: doGet ไม่ต้องล็อก เพราะอ่านอย่างเดียว ล็อกไปจะทำให้เว็บช้าเปล่าๆ
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let hasLock = false;

  try {
    hasLock = lock.tryLock(30000);  // ต่อคิวรอไม่เกิน 30 วินาที

    if (!hasLock) {
      return jsonResponse({
        success: false,
        error: 'ระบบกำลังมีผู้ใช้งานอื่นบันทึกข้อมูลอยู่ กรุณาลองใหม่อีกครั้ง'
      });
    }

    return handlePost(e);
  } finally {
    if (hasLock) lock.releaseLock();  // ต้องปล่อยเสมอ ไม่งั้นคิวค้างทั้งระบบ
  }
}

function handlePost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // =============== CREATE/UPDATE USER ===============
    if (action === 'upsertUser') {
      const usersSheet = getSheet(USERS_SHEET);
      const userCols = resolveColumns(usersSheet, USER_HEADERS, USER_COL_MAP);
      const users = sheetToObjects(usersSheet);
      const existingUser = users.find(u => u.email === data.email);
      
      if (existingUser) {
        const rowIndex = existingUser._rowIndex;
        usersSheet.getRange(rowIndex, userCols.lastLogin + 1).setValue(new Date().toISOString());
        return jsonResponse({ 
          success: true, 
          data: { ...existingUser, lastLogin: new Date().toISOString() }, 
          message: 'User updated' 
        });
      } else {
        const now = new Date().toISOString();
        const newUser = {
          id: generateUUID(),
          email: data.email,
          name: data.name,
          department: data.department || '',
          role: getUserRole(data.email),
          createdAt: now,
          lastLogin: now
        };
        usersSheet.appendRow(buildRow(newUser, userCols, usersSheet));
        return jsonResponse({ 
          success: true, 
          data: newUser, 
          message: 'User created' 
        });
      }
    }
    
    // =============== UPDATE USER DEPARTMENT ===============
    if (action === 'updateUserDepartment') {
      const usersSheet = getSheet(USERS_SHEET);
      const users = sheetToObjects(usersSheet);
      const user = users.find(u => u.email === data.email);
      
      if (!user) return jsonResponse({ success: false, error: 'User not found' });
      
      const deptCols = resolveColumns(usersSheet, USER_HEADERS, USER_COL_MAP);
      usersSheet.getRange(user._rowIndex, deptCols.department + 1).setValue(data.department);
      return jsonResponse({ success: true, message: 'Department updated' });
    }
    
    // =============== CREATE REQUEST ===============
    if (action === 'createRequest') {
      const requestsSheet = getSheet(REQUESTS_SHEET);
      
      // ดึงข้อมูลผู้ส่ง
      const userInfo = getUserInfoByEmail(data.submittedBy);
      const submitterName = userInfo ? userInfo.name : '';
      const submitterDept = userInfo ? userInfo.department : '';
      
      const newRequest = {
        id: generateUUID(),
        projectName: data.projectName || '',
        serviceType: data.serviceType || '',
        details: data.details || '',
        deadline: data.deadline || '',
        status: 'pending',
        purpose: data.purpose || '',
        imageSize: data.imageSize || '',
        referenceLink: data.referenceLink || '',
        videoFormat: data.videoFormat || '',
        videoDuration: data.videoDuration || '',
        tiktokRef: data.tiktokRef || '',
        appointmentDate: data.appointmentDate || '',
        location: data.location || '',
        productType: data.productType || '',
        productDetails: data.productDetails || '',
        driveLink: data.driveLink || '',
        submittedBy: data.submittedBy || '',
        submitterName: submitterName,
        submitterDepartment: submitterDept,
        submittedAt: new Date().toISOString(),
        revisionHistory: '[]',
        revisionCount: 0,
        adminComment: '',
        completedFileLink: '',
        rejectionReason: '',
        completedAt: ''
      };
      const createCols = resolveColumns(requestsSheet, REQUEST_HEADERS, REQUEST_COL_MAP);
      requestsSheet.appendRow(buildRow(newRequest, createCols, requestsSheet));
      
      // Email Notification to Admin
      try { 
        sendNewRequestNotification(data, data.submittedBy, submitterName, submitterDept); 
      } catch (e) { 
        console.log('Email failed: ' + e.message); 
      }
      
      return jsonResponse({ success: true, data: { id: newRequest.id }, message: 'Request created' });
    }
    
    // =============== UPDATE REQUEST ===============
    if (action === 'updateRequest') {
      const requestsSheet = getSheet(REQUESTS_SHEET);
      const requests = sheetToObjects(requestsSheet);
      const request = requests.find(r => r.id === data.id);
      
      if (!request) return jsonResponse({ success: false, error: 'Request not found' });
      
      const oldStatus = request.status;
      const rowIndex = request._rowIndex;
      const updateCols = resolveColumns(requestsSheet, REQUEST_HEADERS, REQUEST_COL_MAP);
      
      // อัปเดตแต่ละ field ตาม column map
      Object.keys(data).forEach(key => {
        if (key === 'action' || key === 'id' || key === '_rowIndex') return;
        const colIndex = updateCols[key];
        if (colIndex !== undefined) {
          requestsSheet.getRange(rowIndex, colIndex + 1).setValue(data[key]);
        }
      });
      
      // ถ้าสถานะเปลี่ยนเป็น completed ให้บันทึกวันที่เสร็จสมบูรณ์
      if (data.status === 'completed' && oldStatus !== 'completed') {
        requestsSheet.getRange(rowIndex, updateCols.completedAt + 1).setValue(new Date().toISOString());
      }
      
      // Status Change Notification
      if (data.status && data.status !== oldStatus) {
        try {
          const updatedRequest = { ...request, ...data };
          const comment = data.adminComment || data.rejectionReason || '';
          sendStatusUpdateNotification(updatedRequest, request.submittedBy, data.status, comment);
        } catch (e) { console.log('Email failed: ' + e.message); }
      }
      
      return jsonResponse({ success: true, message: 'Request updated' });
    }
    
    // =============== DELETE REQUEST ===============
    if (action === 'deleteRequest') {
      if (!isSuperAdmin(data.requestedBy)) return jsonResponse({ success: false, error: 'Permission denied' });
      const requestsSheet = getSheet(REQUESTS_SHEET);
      const requests = sheetToObjects(requestsSheet);
      const request = requests.find(r => r.id === data.id);
      if (!request) return jsonResponse({ success: false, error: 'Request not found' });
      requestsSheet.deleteRow(request._rowIndex);
      return jsonResponse({ success: true, message: 'Request deleted' });
    }
    
    // =============== DELETE USER ===============
    if (action === 'deleteUser') {
      if (!isSuperAdmin(data.requestedBy)) return jsonResponse({ success: false, error: 'Permission denied' });
      const usersSheet = getSheet(USERS_SHEET);
      const users = sheetToObjects(usersSheet);
      const user = users.find(u => u.id === data.id);
      if (!user) return jsonResponse({ success: false, error: 'User not found' });
      usersSheet.deleteRow(user._rowIndex);
      return jsonResponse({ success: true, message: 'User deleted' });
    }
    
    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

// ===================== เมลสรุปประจำวัน & แจ้งงานล่าช้า =====================
//
// ระบบเดิมส่งเมลแค่ตอน "มีอะไรเกิดขึ้น" (คำขอใหม่ / สถานะเปลี่ยน)
// แต่ปัญหาจริงคือตอน "ไม่มีอะไรเกิดขึ้น" - งานถูกกดเป็นกำลังดำเนินการแล้วเงียบหายไป
// ส่วนนี้จึงเพิ่มเมลที่ยิงตามเวลา ไม่ใช่ตามเหตุการณ์
//
// วิธีเปิดใช้: เปิดตัวแก้ไขสคริปต์ เลือกฟังก์ชัน setupDailyTriggers แล้วกด Run หนึ่งครั้ง
// วิธีปิด: เลือกฟังก์ชัน removeDailyTriggers แล้วกด Run

const DIGEST_HOUR = 8;          // ส่งเมลสรุปตอนกี่โมง (เวลาไทย)
const STUCK_DAYS = 30;          // งานเปิดค้างเกินกี่วันถือว่าผิดปกติ
const TIMEZONE = 'Asia/Bangkok';
const OVERDUE_PROP_KEY = 'overdueNotifiedIds';

/**
 * แปลงค่าวันที่เป็น timestamp
 *
 * บางแถวเก็บปีเป็น พ.ศ. (เช่น 2569-02-06) ถ้าไม่แปลงกลับเป็น ค.ศ.
 * JavaScript จะอ่านเป็นอีก 543 ปีข้างหน้า แล้วงานที่เลยกำหนดไปแล้ว
 * จะถูกมองว่ายังไม่ถึงกำหนด ทำให้ไม่มีใครได้รับการแจ้งเตือน
 */
function toTime(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() > 2100) d.setUTCFullYear(d.getUTCFullYear() - 543);
  return d.getTime();
}

function daysBetween(fromMs, toMs) {
  return Math.floor((toMs - fromMs) / 86400000);
}

function isOpenStatus(s) {
  return s === 'pending' || s === 'progress' || s === 'revision';
}

function statusLabelTh(s) {
  const m = { pending: 'รออนุมัติ', progress: 'กำลังดำเนินการ', revision: 'ส่งกลับแก้ไข', completed: 'เสร็จสมบูรณ์', rejected: 'ปฏิเสธ' };
  return m[s] || s;
}

function serviceLabelTh(s) {
  const m = { graphic: 'งานกราฟิก', video: 'งานวิดีโอคอนเทนต์', photo: 'งานถ่ายภาพ', tech: 'ตัดต่อวิดีโอช่าง', sales: 'ตัดต่อวิดีโอขาย' };
  return m[s] || s;
}

function formatThaiDate(ms) {
  if (ms === null) return 'ไม่ระบุ';
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const d = new Date(ms);
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}

/** กัน HTML พังและกัน script แปลกปลอมจากข้อความที่พนักงานพิมพ์เอง */
function escapeHtmlGs(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * อ่านงานที่ยังไม่ปิด แล้วแยกเป็นกลุ่มตามความเร่งด่วน
 *
 * "เลยกำหนดส่ง" ใช้ได้เฉพาะงานที่ระบุวันกำหนดส่งไว้ ซึ่งมีแค่งานกราฟิกกับวิดีโอ
 * งานช่าง/ถ่ายภาพ/ขาย ฟอร์มไม่ถามวันกำหนดส่ง จึงต้องใช้ "ค้างนาน" จับแทน
 * ไม่งั้นงานส่วนใหญ่ของระบบจะไม่มีอะไรมาสะกิดเลย
 */
function collectAttentionItems(now) {
  const sheet = getSheet(REQUESTS_SHEET);
  const all = sheetToObjects(sheet);
  const overdue = [];
  const stuck = [];
  const openAll = [];

  all.forEach(function (r) {
    if (!isOpenStatus(r.status)) return;
    const sub = toTime(r.submittedAt);
    if (sub === null) return;
    const age = daysBetween(sub, now);
    const dl = toTime(r.deadline);
    // กำหนดส่งเก็บเป็นต้นวัน จึงถือว่าเลยกำหนดเมื่อพ้นสิ้นวันนั้นไปแล้ว
    const lateDays = dl === null ? null : daysBetween(dl + 86400000 - 1, now);
    const item = {
      id: r.id,
      projectName: r.projectName,
      serviceType: r.serviceType,
      status: r.status,
      submittedBy: r.submittedBy,
      submitterName: r.submitterName,
      submitterDepartment: r.submitterDepartment,
      ageDays: age,
      deadlineMs: dl,
      lateDays: lateDays
    };
    openAll.push(item);
    if (lateDays !== null && lateDays >= 0) overdue.push(item);
    else if (age >= STUCK_DAYS) stuck.push(item);
  });

  overdue.sort(function (a, b) { return b.lateDays - a.lateDays; });
  stuck.sort(function (a, b) { return b.ageDays - a.ageDays; });
  return { overdue: overdue, stuck: stuck, openAll: openAll };
}

/** แถวหนึ่งรายการในตารางของเมล */
function itemRowHtml(it, kind) {
  const isLate = kind === 'overdue';
  const bigColor = isLate ? '#C0392B' : '#A06606';
  const bigText = isLate ? ('เลยกำหนด ' + it.lateDays + ' วัน') : ('ค้างมา ' + it.ageDays + ' วัน');
  const who = escapeHtmlGs(it.submitterName || it.submittedBy || 'ไม่ทราบผู้ส่ง');
  const dept = escapeHtmlGs(it.submitterDepartment || 'ไม่ระบุแผนก');
  return ''
    + '<tr>'
    + '<td style="padding:12px 14px;border-bottom:1px solid #E5E7EB;vertical-align:top;">'
    +   '<div style="font-weight:600;color:#101828;font-size:15px;">' + escapeHtmlGs(it.projectName || '(ไม่มีชื่อโครงการ)') + '</div>'
    +   '<div style="font-size:13px;color:#616774;margin-top:3px;">'
    +     statusLabelTh(it.status) + ' &middot; ' + serviceLabelTh(it.serviceType) + ' &middot; ' + who + ' (' + dept + ')'
    +   '</div>'
    + '</td>'
    + '<td style="padding:12px 14px;border-bottom:1px solid #E5E7EB;text-align:right;white-space:nowrap;vertical-align:top;">'
    +   '<div style="font-weight:700;color:' + bigColor + ';font-size:15px;">' + bigText + '</div>'
    +   '<div style="font-size:12px;color:#616774;margin-top:3px;">'
    +     (it.deadlineMs !== null ? 'กำหนด ' + formatThaiDate(it.deadlineMs) : 'ไม่ได้ระบุกำหนดส่ง')
    +   '</div>'
    + '</td>'
    + '</tr>';
}

function emailShell(headline, subline, innerHtml) {
  return ''
    + '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:16px;background:#EAE8E7;">'
    +   '<div style="background:#0B1E41;border-radius:12px;padding:22px 24px;border-bottom:4px solid #F86E0B;">'
    +     '<div style="color:#FBFBFB;font-size:20px;font-weight:700;">' + headline + '</div>'
    +     '<div style="color:#B9C4DA;font-size:13px;margin-top:6px;">' + subline + '</div>'
    +   '</div>'
    +   '<div style="background:#FBFBFB;border-radius:12px;padding:20px;margin-top:12px;">' + innerHtml + '</div>'
    +   '<div style="text-align:center;color:#616774;font-size:11px;margin-top:14px;">'
    +     'JAUN Creative Request System &middot; เมลนี้ส่งอัตโนมัติทุกเช้า ไม่ต้องตอบกลับ'
    +   '</div>'
    + '</div>';
}

/**
 * เมลสรุปประจำวันถึงแอดมิน - ฉบับเดียวรวมทุกอย่าง
 * ไม่แยกส่งทีละงาน เพราะจะกินโควตาและกลายเป็นเมลขยะจนไม่มีใครอ่าน
 */
function sendAdminDigest(data, now) {
  const admins = SUPER_ADMIN_EMAILS.concat(ADMIN_EMAILS || []);
  if (admins.length === 0) return 0;

  const nOver = data.overdue.length;
  const nStuck = data.stuck.length;
  const nOpen = data.openAll.length;
  if (nOpen === 0) return 0;               // ไม่มีงานค้างเลย ไม่ต้องรบกวน

  let inner = '';
  inner += '<table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:18px;"><tr>'
        +  '<td style="width:33%;text-align:center;padding:10px;background:#EAE8E7;border-radius:10px;">'
        +    '<div style="font-size:26px;font-weight:700;color:#0B1E41;">' + nOpen + '</div>'
        +    '<div style="font-size:12px;color:#616774;">งานที่ยังไม่ปิด</div></td>'
        +  '<td style="width:8px;"></td>'
        +  '<td style="width:33%;text-align:center;padding:10px;background:#FDECEC;border-radius:10px;">'
        +    '<div style="font-size:26px;font-weight:700;color:#C0392B;">' + nOver + '</div>'
        +    '<div style="font-size:12px;color:#616774;">เลยกำหนดส่ง</div></td>'
        +  '<td style="width:8px;"></td>'
        +  '<td style="width:33%;text-align:center;padding:10px;background:#FDF3E4;border-radius:10px;">'
        +    '<div style="font-size:26px;font-weight:700;color:#A06606;">' + nStuck + '</div>'
        +    '<div style="font-size:12px;color:#616774;">ค้างเกิน ' + STUCK_DAYS + ' วัน</div></td>'
        +  '</tr></table>';

  if (nOver > 0) {
    inner += '<div style="font-size:15px;font-weight:700;color:#C0392B;margin:18px 0 8px;">เลยกำหนดส่งแล้ว ' + nOver + ' งาน</div>'
          +  '<table role="presentation" width="100%" style="border-collapse:collapse;">'
          +  data.overdue.map(function (it) { return itemRowHtml(it, 'overdue'); }).join('')
          +  '</table>';
  }

  if (nStuck > 0) {
    const show = data.stuck.slice(0, 10);
    inner += '<div style="font-size:15px;font-weight:700;color:#A06606;margin:22px 0 8px;">ค้างนานผิดปกติ ' + nStuck + ' งาน</div>'
          +  '<div style="font-size:12px;color:#616774;margin-bottom:8px;">'
          +    'งานเหล่านี้ไม่ได้ระบุวันกำหนดส่ง จึงวัดด้วยเวลาที่ค้างแทน &mdash; ต้องตัดสินใจว่าจะทำต่อหรือปิดทิ้ง'
          +  '</div>'
          +  '<table role="presentation" width="100%" style="border-collapse:collapse;">'
          +  show.map(function (it) { return itemRowHtml(it, 'stuck'); }).join('')
          +  '</table>';
    if (nStuck > show.length) {
      inner += '<div style="font-size:12px;color:#616774;margin-top:8px;">และอีก ' + (nStuck - show.length) + ' งาน &mdash; ดูทั้งหมดได้ในระบบ</div>';
    }
  }

  if (nOver === 0 && nStuck === 0) {
    inner += '<div style="text-align:center;color:#0A825B;font-weight:600;padding:10px 0;">'
          +    'ไม่มีงานเลยกำหนดและไม่มีงานค้างนาน &mdash; คิวสะอาด'
          +  '</div>';
  }

  const subject = nOver > 0
    ? 'สรุปงานค้าง: เลยกำหนดส่ง ' + nOver + ' งาน'
    : (nStuck > 0 ? 'สรุปงานค้าง: ค้างนานผิดปกติ ' + nStuck + ' งาน' : 'สรุปงานค้างประจำวัน');

  const html = emailShell(
    'สรุปงานค้างประจำวัน',
    formatThaiDate(now) + ' &middot; งานที่ยังไม่ปิด ' + nOpen + ' งาน',
    inner
  );

  let sent = 0;
  admins.forEach(function (to) {
    try { MailApp.sendEmail({ to: to, subject: subject, htmlBody: html }); sent++; }
    catch (e) { console.log('ส่งเมลสรุปไม่สำเร็จ: ' + to + ' - ' + e.message); }
  });
  return sent;
}

/**
 * แจ้งผู้ส่งคำขอว่างานของตัวเองเลยกำหนดแล้ว - ส่งครั้งเดียวต่อหนึ่งงาน
 *
 * ต้องจำว่าเคยแจ้งงานไหนไปแล้ว ไม่งั้นงานที่เลยกำหนดมา 181 วัน
 * จะส่งเมลซ้ำทุกเช้าจนคนเลิกอ่าน
 *
 * เก็บรายการไว้ใน ScriptProperties ไม่ใช่ในชีต เพราะไม่ต้องเพิ่มคอลัมน์ใหม่
 * และตัดรหัสงานที่ปิดไปแล้วออกทุกครั้ง รายการจึงไม่โตเกินจำนวนงานที่ยังเปิดอยู่
 */
function notifyOverdueRequesters(data, now) {
  const props = PropertiesService.getScriptProperties();
  let notified;
  try { notified = JSON.parse(props.getProperty(OVERDUE_PROP_KEY) || '[]'); }
  catch (e) { notified = []; }
  if (!Array.isArray(notified)) notified = [];

  const openIds = {};
  data.openAll.forEach(function (it) { openIds[it.id] = true; });

  const already = {};
  notified.forEach(function (id) { if (openIds[id]) already[id] = true; });   // ตัดงานที่ปิดแล้วทิ้ง

  let sent = 0;
  data.overdue.forEach(function (it) {
    if (already[it.id]) return;
    if (!it.submittedBy) return;

    const inner = ''
      + '<div style="font-size:15px;color:#101828;margin-bottom:14px;">'
      +   'งานที่คุณส่งเข้ามาเลยวันกำหนดส่งแล้ว ทีมงานเห็นรายการนี้เช่นกัน'
      + '</div>'
      + '<table role="presentation" width="100%" style="border-collapse:collapse;background:#FDECEC;border-radius:10px;">'
      +   '<tr><td style="padding:16px;">'
      +     '<div style="font-weight:700;font-size:17px;color:#101828;">' + escapeHtmlGs(it.projectName || '(ไม่มีชื่อโครงการ)') + '</div>'
      +     '<div style="font-size:13px;color:#616774;margin-top:6px;">' + serviceLabelTh(it.serviceType) + ' &middot; สถานะตอนนี้: ' + statusLabelTh(it.status) + '</div>'
      +     '<div style="font-size:15px;font-weight:700;color:#C0392B;margin-top:10px;">เลยกำหนดส่งมาแล้ว ' + it.lateDays + ' วัน</div>'
      +     '<div style="font-size:13px;color:#616774;margin-top:3px;">กำหนดส่ง ' + formatThaiDate(it.deadlineMs) + ' &middot; ส่งคำขอมาแล้ว ' + it.ageDays + ' วัน</div>'
      +   '</td></tr>'
      + '</table>'
      + '<div style="font-size:13px;color:#616774;margin-top:14px;">'
      +   'ถ้างานนี้ไม่ต้องทำต่อแล้ว หรือต้องการเลื่อนกำหนดส่ง แจ้งทีมงานได้เลยเพื่อเอาออกจากคิว'
      + '</div>';

    const html = emailShell(
      'งานของคุณเลยกำหนดส่งแล้ว',
      escapeHtmlGs(it.projectName || ''),
      inner
    );

    try {
      MailApp.sendEmail({
        to: it.submittedBy,
        subject: 'งานเลยกำหนดส่ง: ' + (it.projectName || 'คำขอของคุณ'),
        htmlBody: html
      });
      already[it.id] = true;
      sent++;
    } catch (e) {
      console.log('ส่งเมลแจ้งล่าช้าไม่สำเร็จ: ' + it.submittedBy + ' - ' + e.message);
    }
  });

  props.setProperty(OVERDUE_PROP_KEY, JSON.stringify(Object.keys(already)));
  return sent;
}

/** ฟังก์ชันที่ trigger เรียกทุกเช้า */
function sendDailySummary() {
  const now = new Date().getTime();
  const data = collectAttentionItems(now);

  // เผื่อโควตาไม่พอ ให้เมลถึงผู้ขอได้ส่งก่อน เพราะเป็นคนที่ต้องตัดสินใจว่าจะเอาไงต่อ
  const toUsers = notifyOverdueRequesters(data, now);
  const toAdmins = sendAdminDigest(data, now);

  const msg = 'สรุปประจำวัน: งานเปิด ' + data.openAll.length
            + ' | เลยกำหนด ' + data.overdue.length
            + ' | ค้างนาน ' + data.stuck.length
            + ' | ส่งถึงผู้ขอ ' + toUsers + ' ฉบับ, ถึงแอดมิน ' + toAdmins + ' ฉบับ'
            + ' | โควตาคงเหลือวันนี้ ' + MailApp.getRemainingDailyQuota();
  console.log(msg);
  return msg;
}

/**
 * ดูผลก่อนส่งจริง - ไม่ส่งเมลหาใครเลย แค่แสดงว่าจะส่งอะไรบ้าง
 * ใช้ตรวจก่อนเปิด trigger
 */
function previewDailySummary() {
  const now = new Date().getTime();
  const data = collectAttentionItems(now);
  const lines = [];
  lines.push('งานที่ยังไม่ปิด: ' + data.openAll.length);
  lines.push('เลยกำหนดส่ง: ' + data.overdue.length);
  data.overdue.forEach(function (it) {
    lines.push('   เลย ' + it.lateDays + ' วัน  ' + it.projectName + '  ->  ' + it.submittedBy);
  });
  lines.push('ค้างเกิน ' + STUCK_DAYS + ' วัน: ' + data.stuck.length);
  data.stuck.slice(0, 10).forEach(function (it) {
    lines.push('   ค้าง ' + it.ageDays + ' วัน  ' + it.projectName);
  });
  const props = PropertiesService.getScriptProperties();
  lines.push('เคยแจ้งงานล่าช้าไปแล้ว: ' + (JSON.parse(props.getProperty(OVERDUE_PROP_KEY) || '[]')).length + ' รายการ');
  lines.push('โควตาเมลคงเหลือวันนี้: ' + MailApp.getRemainingDailyQuota() + ' ฉบับ');
  const out = lines.join('\n');
  console.log(out);
  return out;
}

/** เปิดใช้เมลอัตโนมัติ - กด Run ฟังก์ชันนี้หนึ่งครั้ง */
function setupDailyTriggers() {
  removeDailyTriggers();
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .atHour(DIGEST_HOUR)
    .everyDays(1)
    .inTimezone(TIMEZONE)
    .create();
  const msg = 'เปิดใช้แล้ว: ส่งเมลสรุปทุกวันช่วง ' + DIGEST_HOUR + ':00-' + (DIGEST_HOUR + 1) + ':00 น. เวลาไทย';
  console.log(msg);
  return msg;
}

/** ปิดเมลอัตโนมัติทั้งหมด */
function removeDailyTriggers() {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDailySummary') { ScriptApp.deleteTrigger(t); n++; }
  });
  const msg = 'ลบ trigger เดิมแล้ว ' + n + ' ตัว';
  console.log(msg);
  return msg;
}

/** ล้างประวัติการแจ้งล่าช้า เผื่ออยากให้ระบบแจ้งซ้ำอีกรอบ */
function resetOverdueNotices() {
  PropertiesService.getScriptProperties().deleteProperty(OVERDUE_PROP_KEY);
  return 'ล้างประวัติแล้ว รอบถัดไปจะแจ้งงานที่เลยกำหนดทั้งหมดอีกครั้ง';
}
