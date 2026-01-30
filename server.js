const express = require('express');
const cors = require('cors');
const { IgApiClient } = require('instagram-private-api');
const app = express();

app.use(cors()); // للسماح لملف HTML بالاتصال
app.use(express.json());

const ig = new IgApiClient();

// --- إعدادات حسابك (أدخل بياناتك هنا) ---
// نصيحة المهندس: استخدم حساباً وهمياً لتجنب الحظر
const MY_USERNAME = 'YOUR_USERNAME_HERE';
const MY_PASSWORD = 'YOUR_PASSWORD_HERE';

let loggedInUser;

// دالة تسجيل الدخول (تتم مرة واحدة عند تشغيل السيرفر)
async function loginToInsta() {
    ig.state.generateDevice(MY_USERNAME);
    try {
        loggedInUser = await ig.account.login(MY_USERNAME, MY_PASSWORD);
        console.log('✅ تم تسجيل الدخول بنجاح بحساب: ' + MY_USERNAME);
    } catch (e) {
        console.error('❌ فشل تسجيل الدخول:', e.message);
    }
}

// نقطة الاتصال (API) التي يستدعيها ملف HTML
app.post('/check-user', async (req, res) => {
    const targetUsername = req.body.target;
    
    try {
        // البحث عن معرف المستخدم (User ID)
        const id = await ig.user.getIdByUsername(targetUsername);
        
        // جلب معلومات المستخدم
        const userInfo = await ig.user.info(id);
        
        // تحليل الحالة (خوارزمية بسيطة)
        // إذا كان عدد المنشورات 0، نعتبره خاملاً مبدئياً
        let status = "نشط";
        if (userInfo.media_count === 0) status = "خامل / جديد";
        
        // ملاحظة: لجلب تاريخ آخر منشور، نحتاج لطلب إضافي (Feed)
        // ولكن هذا يكفي للنسخة الأولية
        
        res.json({
            username: userInfo.username,
            followers: userInfo.follower_count,
            isPrivate: userInfo.is_private,
            status: status
        });

    } catch (error) {
        res.json({ 
            username: targetUsername, 
            status: "غير موجود أو خطأ", 
            followers: "-", 
            isPrivate: false 
        });
    }
});

// تشغيل السيرفر وانتظار تسجيل الدخول
app.listen(3000, async () => {
    console.log('🚀 السيرفر يعمل على http://localhost:3000');
    await loginToInsta();
});
