# JAUN Creative Request System

ระบบจัดการคำขอบริการ Creative สำหรับ JAUN Creative Studio

## 🚀 การติดตั้ง

### ขั้นตอนที่ 1: ตั้งค่า Google Sheets

1. ดูคู่มือใน `../google-sheets-setup/README.md`
2. สร้าง Google Sheets + Apps Script
3. Deploy และเก็บ URL ไว้

### ขั้นตอนที่ 2: ตั้งค่า Google Cloud Project (สำหรับ Google Sign-In)

1. ไปที่ [console.cloud.google.com](https://console.cloud.google.com)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. ไปที่ **APIs & Services** → **OAuth consent screen**
   - เลือก **External**
   - กรอกข้อมูลที่จำเป็น (App name, User support email, Developer email)
   - เพิ่ม Scope: `email`, `profile`
   - บันทึก
4. ไปที่ **APIs & Services** → **Credentials**
5. กด **+ CREATE CREDENTIALS** → **OAuth client ID**
6. เลือก **Web application**
7. ตั้งชื่อ: `JAUN Creative Web`
8. เพิ่ม **Authorized JavaScript origins**:
   - `http://localhost:3000` (สำหรับ dev)
   - `http://localhost:5500` (สำหรับ Live Server)
   - `https://your-app.vercel.app` (หลัง deploy)
9. กด **Create**
10. Copy **Client ID** (รูปแบบ: `xxxxx.apps.googleusercontent.com`)

### ขั้นตอนที่ 3: ตั้งค่าไฟล์ config.js

เปิดไฟล์ `js/config.js` และแก้ไข:

```javascript
// ใส่ URL จาก Google Apps Script
API_URL: 'https://script.google.com/macros/s/xxxxx/exec',

// ใส่ Client ID จาก Google Cloud
GOOGLE_CLIENT_ID: 'xxxxx.apps.googleusercontent.com',

// ใส่อีเมล Super Admin
SUPER_ADMIN_EMAILS: [
  'your-boss@gmail.com',
  'your-ceo@gmail.com'
],

// ใส่ domain ของ Admin
ADMIN_DOMAIN: '@jaun.com',
```

### ขั้นตอนที่ 4: ทดสอบในเครื่อง

```bash
# ใช้ Live Server หรือ Python HTTP Server
cd website
python3 -m http.server 5500
# เปิด http://localhost:5500
```

### ขั้นตอนที่ 5: Deploy บน Vercel

1. สมัคร [vercel.com](https://vercel.com)
2. เชื่อมต่อ GitHub
3. Push โค้ดขึ้น GitHub
4. Import repository ใน Vercel
5. Deploy!
6. **สำคัญ**: เพิ่ม URL ที่ได้ไปใน Google Cloud Console → OAuth credentials → Authorized JavaScript origins

## 📁 โครงสร้างไฟล์

```
website/
├── index.html          # Main HTML
├── css/
│   └── styles.css      # Design system
├── js/
│   ├── config.js       # ⚠️ ต้องแก้ไข!
│   ├── api.js          # API calls
│   ├── auth.js         # Google Sign-In
│   ├── utils.js        # Utilities
│   ├── components.js   # UI Components
│   ├── pages.js        # Page renderers
│   └── app.js          # Main app
└── assets/
    └── favicon.svg     # Logo
```

## 📋 Features

- ✅ Google Sign-In
- ✅ Role-based access (User, Admin, Super Admin)
- ✅ 5 ประเภทบริการ (Graphic, Video, Photo, Tech, Sales)
- ✅ ระบบ Revision tracking
- ✅ Admin Dashboard + Analytics
- ✅ Super Admin: จัดการผู้ใช้ + ลบข้อมูล
- ✅ Responsive design
- ✅ XSS Protection

## 🔐 ระบบสิทธิ์

| Role | เงื่อนไข | สิทธิ์ |
|------|---------|--------|
| **User** | อีเมลทั่วไป | สร้าง/แก้ไขคำขอตัวเอง |
| **Admin** | อีเมล `@jaun.com` | จัดการคำขอทั้งหมด |
| **Super Admin** | อีเมลใน `SUPER_ADMIN_EMAILS` | ลบข้อมูล + จัดการผู้ใช้ |

## 🎨 Brand Colors

- Navy Blue: `#1B2A5C`
- Cerulean Blue: `#45ABC5`
- Light Sky Blue: `#48DBFF`
- Burnt Orange: `#E56905`
- Vibrant Orange: `#FF7F00`
- Medium Grey: `#A9A9A9`
