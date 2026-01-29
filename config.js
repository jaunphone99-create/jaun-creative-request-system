const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwsGkrioNd78PTX-5JKFs50qcAHVmbGj9z8ENGWm9EBRLNfwtibnqZ9iG8fBGqqKOuV/exec',
  GOOGLE_CLIENT_ID: '307862598138-jlg31911d06k4sabolmsjc7k0uuur4cd.apps.googleusercontent.com',
  COMPANY_NAME: 'JAUN Creative Studio',
  WELCOME_MESSAGE: 'ยินดีต้อนรับสู่ระบบจัดการคำขอ',
  SUPER_ADMIN_EMAILS: ['sanalohit01@gmail.com', 'jaunphone.99@gmail.com'],
  ADMIN_EMAILS: ['jaunpowercilp@gmail.com', 'loveininor@gmail.com'],
  ADMIN_DOMAIN: '@jaun.com',
  DEPARTMENTS: ['Creative', 'หน้าร้านสาขา 2', 'หน้าร้านสาขา 4', 'บัญชีการเงิน', 'HR', 'ผู้บริหาร CEO', 'iPhoneแลกเงิน', 'WinSure Plus', 'JChoice Plus', 'ช่างซ่อม'],
  SERVICES: [
    { id: 'graphic', name: 'Graphic Design Support', nameTh: 'งานกราฟิก', icon: '🎨', color: '#1B2A5C', category: 'creative' },
    { id: 'video', name: 'Video Content Support', nameTh: 'งานวิดีโอคอนเทนต์', icon: '🎬', color: '#45ABC5', category: 'creative' },
    { id: 'photo', name: 'Photography Support', nameTh: 'งานถ่ายภาพ', icon: '📸', color: '#48DBFF', category: 'creative' },
    { id: 'tech', name: 'Technician Video Editing', nameTh: 'ตัดต่อวิดีโอช่าง', icon: '🔧', color: '#E56905', category: 'editing' },
    { id: 'sales', name: 'Sales Video Editing', nameTh: 'ตัดต่อวิดีโอขาย', icon: '💼', color: '#FF7F00', category: 'editing' }
  ],
  SERVICE_CATEGORIES: {
    creative: { name: '🎨 Creative Work', nameTh: 'งานสร้างสรรค์', description: 'กราฟิก วิดีโอ ถ่ายภาพ' },
    editing: { name: '🎥 Video Editing', nameTh: 'งานตัดต่อวิดีโอ', description: 'ตัดต่อคลิปช่างและคลิปขาย' }
  },
  STATUS_CONFIG: {
    pending: { label: 'รออนุมัติ', color: '#D97706', bg: '#FEF3C7' },
    progress: { label: 'กำลังดำเนินการ', color: '#2563EB', bg: '#DBEAFE' },
    revision: { label: 'ส่งกลับแก้ไข', color: '#EA580C', bg: '#FFEDD5' },
    completed: { label: 'เสร็จสมบูรณ์', color: '#059669', bg: '#D1FAE5' },
    rejected: { label: 'ปฏิเสธ', color: '#DC2626', bg: '#FEE2E2' }
  },
  FORM_OPTIONS: {
    purposes: ['ภาพหน้าปก', 'โปรไฟล์', 'โปรโมชั่น', 'ขายบอกราคา', 'โปรโมทสินค้า', 'แนะนำบริการ', 'แนะนำให้รู้จัก', 'ให้ความรู้', 'ใช้ในหน่วยงาน', 'อื่นๆ'],
    imageSizes: ['Facebook 1200x628', 'Facebook 1920x1920', 'Facebook 1080x1350', 'TikTok 1080x1920', 'TikTok 200x200', 'Instagram 1080x1080', 'Instagram Story 1080x1920', 'อื่นๆ'],
    videoFormats: ['TikTok 9:16', 'Instagram Reels 9:16', 'YouTube 16:9', 'YouTube Shorts 9:16', 'Facebook 16:9', 'Facebook Reels 9:16'],
    videoDurations: ['15 วินาที', '30 วินาที', '1 นาที', '2-3 นาที', '3-5 นาที', 'มากกว่า 5 นาที'],
    branches: ['สาขา 1', 'สาขา 2', 'สาขา 3', 'สาขา 4'],
    photoLocations: ['หน้าร้านสาขา 2', 'หน้าร้านสาขา 4'],
    productTypes: ['iPhone', 'iPad', 'AirPods', 'Apple Watch']
  }
};
Object.freeze(CONFIG);
