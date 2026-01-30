const express = require('express');
const cors = require('cors');
const { IgApiClient } = require('instagram-private-api');
const app = express();

// السماح بالاتصال من واجهة HTML
app.use(cors());
app.use(express.json());

// تهيئة مكتبة إنستغرام
const ig = new IgApiClient();

// --- 🔐 إعدادات الحساب (تم التعديل حسب طلبك) ---
const MY_USERNAME = 'rir_gw';
const MY_PASSWORD = 'basm1998';

let loggedInUser;

/**
 * دالة تسجيل الدخول
 * تقوم بتسجيل الدخول مرة واحدة عند تشغيل السيرفر
 */
async function loginToInsta() {
    console.log(`🔄 جاري محاولة تسجيل الدخول بالحساب: ${MY_USERNAME}...`);
    
    // محاكاة جهاز أندرويد لتجنب الشكوك
    ig.state.generateDevice(MY_USERNAME);

    try {
        // تنفيذ عملية الدخول
        loggedInUser = await ig.account.login(MY_USERNAME, MY_PASSWORD);
        console.log('✅ تم تسجيل الدخول بنجاح! السيرفر جاهز للفحص.');
    } catch (e) {
        console.error('❌ خطأ في تسجيل الدخول:');
        console.error(e.message);
        console.log('💡 نصيحة المهندس: تأكد من أن الحساب لا يطلب "تحقق بخطوتين" (2FA) أو أنه لم يتم حظره مؤقتاً.');
    }
}

/**
 * رابط الاتصال (API)
 * يستقبل طلب POST من ملف HTML ويقوم بالفحص
 */
app.post('/check-user', async (req, res) => {
    const targetUsername = req.body.target;
    
    // التحقق من وجود جلسة دخول نشطة
    if (!loggedInUser) {
        return res.status(500).json({ 
            username: targetUsername, 
            status: "خطأ: السيرفر غير متصل بإنستغرام",
            followers: "-",
            isPrivate: false 
        });
    }

    try {
        console.log(`🔍 جاري فحص الحساب: ${targetUsername}...`);

        // 1. البحث عن الـ ID الخاص بالمستخدم المستهدف
        const id = await ig.user.getIdByUsername(targetUsername);
        
        // 2. جلب المعلومات الكاملة (Info)
        const userInfo = await ig.user.info(id);
        
        // 3. خوارزمية تحليل الحالة (بسيطة وفعالة)
        let status = "نشط";
        
        // إذا كان عدد المنشورات 0، احتمال كبير أنه خامل أو جديد
        if (userInfo.media_count === 0) {
            status = "خامل / جديد (0 منشورات)";
        } 
        
        // إرسال النتيجة إلى الواجهة
        res.json({
            username: userInfo.username,
            followers: userInfo.follower_count,
            isPrivate: userInfo.is_private,
            status: status,
            mediaCount: userInfo.media_count
        });

    } catch (error) {
        // في حال لم يتم العثور على الحساب أو حدث خطأ
        console.log(`⚠️ لم يتم العثور على: ${targetUsername}`);
        res.json({ 
            username: targetUsername, 
            status: "غير موجود (User Not Found)", 
            followers: "0", 
            isPrivate: false 
        });
    }
});

// تشغيل السيرفر على المنفذ 3000
app.listen(3000, async () => {
    console.log('🚀 السيرفر يعمل الآن على الرابط: http://localhost:3000');
    // استدعاء دالة الدخول فور تشغيل السيرفر
    await loginToInsta();
});
