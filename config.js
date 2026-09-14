/**
 * JAUN Creative Request System - Configuration
 * แก้ไขค่าด้านล่างตามการตั้งค่าของคุณ
 */

const CONFIG = {
  // ==================== สำคัญ: ต้องแก้ไข ====================

  // URL ของ Google Apps Script Web App ที่ deploy แล้ว
  // ได้จากขั้นตอน Deploy > New deployment > Web app URL
  API_URL: 'https://script.google.com/macros/s/AKfycby0tx-5o0jT3cSBT6SRn9e9Yro7kfdiS_EH3KbzXfE9y86dluuG9oUKwTZjKAf7Z-dL/exec',

  // Google OAuth Client ID
  // ได้จาก Google Cloud Console > APIs & Services > Credentials
  GOOGLE_CLIENT_ID: '307862598138-jlg31911d06k4sabolmsjc7k0uuur4cd.apps.googleusercontent.com',

  // ==================== ตั้งค่าบริษัท ====================

  COMPANY_NAME: 'JAUN Creative Studio',
  WELCOME_MESSAGE: 'ยินดีต้อนรับสู่ระบบจัดการคำขอ',

  // รูปประกอบหน้าเข้าสู่ระบบ (โน้ตบุ๊ก/แก้ว/หนังสือ ตามแบบใน mockup)
  // เว้นว่าง = ไม่แสดงรูป หน้าตายังใช้งานได้ปกติ
  // ใส่เป็น path เช่น 'assets/login-hero.png' แล้วรูปจะขึ้นเองโดยไม่ต้องแก้โค้ดอื่น
  LOGIN_HERO_IMAGE: '',
  LOGIN_HERO_IMAGE_ALT: 'อุปกรณ์ทำงานของทีม JAUN Creative',

  // ==================== Super Admin Emails ====================
  // อีเมลเหล่านี้จะเป็น Super Admin อัตโนมัติ
  SUPER_ADMIN_EMAILS: [
    'sanalohit01@gmail.com',
    'jaunphone.99@gmail.com'
  ],

  // ==================== Admin Emails ====================
  // อีเมลเหล่านี้จะเป็น Admin (จัดการคำขอแต่ไม่มีสิทธิ์ Super Admin)
  ADMIN_EMAILS: [
    'jaunpowercilp@gmail.com',
    'loveininor@gmail.com'
  ],

  // Domain ที่จะเป็น Admin อัตโนมัติ
  ADMIN_DOMAIN: '@jaun.com',

  // ==================== แผนก ====================
  DEPARTMENTS: [
    'Creative',
    'หน้าร้านสาขา 2',
    'หน้าร้านสาขา 4',
    'บัญชีการเงิน',
    'HR',
    'ผู้บริหาร CEO',
    'iPhoneแลกเงิน',
    'WinSure Plus',
    'JChoice Plus',
    'ช่างซ่อม'
  ],

  // ==================== ประเภทบริการ ====================
  // icon    = อิโมจิ ใช้เฉพาะที่ใส่ HTML ไม่ได้ (เช่น <option> ใน dropdown)
  // iconSvg = ไอคอนเส้น ใช้ทุกที่ที่เหลือ รับสีจาก CSS ผ่าน currentColor
  //           จึงเปลี่ยนสีตามสี CI ของแต่ละบริการได้เอง และคมทุกความละเอียดจอ
  SERVICES: [
    {
      id: 'graphic',
      name: 'Graphic Design Support',
      nameTh: 'งานกราฟิก',
      icon: '🎨',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
      color: '#0B1E41',        // JAUN Navy
      category: 'creative'
    },
    {
      id: 'video',
      name: 'Video Content Support',
      nameTh: 'งานวิดีโอคอนเทนต์',
      icon: '🎬',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>',
      color: '#21417E',        // Support Blue
      category: 'creative'
    },
    {
      id: 'photo',
      name: 'Photography Support',
      nameTh: 'งานถ่ายภาพ',
      icon: '📸',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
      color: '#3A63B8',        // ไล่จาก Support Blue
      category: 'creative'
    },
    {
      id: 'tech',
      name: 'Technician Video Editing',
      nameTh: 'ตัดต่อวิดีโอช่าง',
      icon: '🔧',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      color: '#F86E0B',        // JAUN Orange
      category: 'editing'
    },
    {
      id: 'sales',
      name: 'Sales Video Editing',
      nameTh: 'ตัดต่อวิดีโอขาย',
      icon: '💼',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      color: '#C35608',        // ไล่จาก JAUN Orange
      category: 'editing'
    }
  ],

  // ==================== หมวดหมู่บริการ ====================
  SERVICE_CATEGORIES: {
    creative: {
      name: 'Creative Work',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
      nameTh: 'งานสร้างสรรค์',
      description: 'กราฟิก วิดีโอ ถ่ายภาพ'
    },
    editing: {
      name: 'Video Editing',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M17 7.5h4M3 12h18M3 16.5h4M17 16.5h4"/></svg>',
      nameTh: 'งานตัดต่อวิดีโอ',
      description: 'ตัดต่อคลิปช่างและคลิปขาย'
    }
  },

  // ==================== สถานะคำขอ ====================
  STATUS_CONFIG: {
    // หมายเหตุ: สีสถานะไม่ได้อยู่ใน CI เพราะสื่อความหมาย (เขียว=สำเร็จ แดง=ปฏิเสธ)
    // ปรับให้เข้มขึ้นเฉพาะตัวหนังสือ เพราะของเดิมความคมชัดต่ำกว่าเกณฑ์ 4.5:1
    pending: {
      label: 'รออนุมัติ',
      color: '#A75B04',   // เดิม #D97706 = 2.86:1 -> ตอนนี้ 4.55:1
      bg: '#FEF3C7'
    },
    progress: {
      label: 'กำลังดำเนินการ',
      color: '#21417E',   // Support Blue จาก CI = 8.11:1
      bg: '#DBEAFE'
    },
    revision: {
      label: 'ส่งกลับแก้ไข',
      color: '#B24F07',   // ไล่จาก JAUN Orange, เดิม 2.54:1 -> ตอนนี้ 4.57:1
      bg: '#FFEDD5'
    },
    completed: {
      label: 'เสร็จสมบูรณ์',
      color: '#047C57',   // เดิม 3.32:1 -> ตอนนี้ 4.60:1
      bg: '#D1FAE5'
    },
    rejected: {
      label: 'ปฏิเสธ',
      color: '#CA2222',   // เดิม 3.95:1 -> ตอนนี้ 4.57:1
      bg: '#FEE2E2'
    }
  },

  // ==================== ตัวเลือกฟอร์ม ====================
  FORM_OPTIONS: {
    purposes: [
      'ภาพหน้าปก',
      'โปรไฟล์',
      'โปรโมชั่น',
      'ขายบอกราคา',
      'โปรโมทสินค้า',
      'แนะนำบริการ',
      'แนะนำให้รู้จัก',
      'ให้ความรู้',
      'ใช้ในหน่วยงาน',
      'อื่นๆ'
    ],
    imageSizes: [
      'Facebook 1200x628',
      'Facebook 1920x1920',
      'Facebook 1080x1350',
      'TikTok 1080x1920',
      'TikTok 200x200',
      'Instagram 1080x1080',
      'Instagram Story 1080x1920',
      'อื่นๆ'
    ],
    videoFormats: [
      'TikTok 9:16',
      'Instagram Reels 9:16',
      'YouTube 16:9',
      'YouTube Shorts 9:16',
      'Facebook 16:9',
      'Facebook Reels 9:16'
    ],
    videoDurations: [
      '15 วินาที',
      '30 วินาที',
      '1 นาที',
      '2-3 นาที',
      '3-5 นาที',
      'มากกว่า 5 นาที'
    ],
    branches: [
      'สาขา 1',
      'สาขา 2',
      'สาขา 3',
      'สาขา 4'
    ],
    photoLocations: [
      'หน้าร้านสาขา 2',
      'หน้าร้านสาขา 4'
    ],
    productTypes: [
      'iPhone',
      'iPad',
      'AirPods',
      'Apple Watch'
    ]
  }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.SERVICES);
Object.freeze(CONFIG.DEPARTMENTS);
Object.freeze(CONFIG.STATUS_CONFIG);
Object.freeze(CONFIG.FORM_OPTIONS);
