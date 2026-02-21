#!/bin/bash
# سكريبت تحويل المشروع للإنتاج على Vercel

echo "🚀 تحويل المشروع للإنتاج على Vercel + Supabase..."

# نسخ ملف PostgreSQL
cp prisma/schema.postgresql.prisma prisma/schema.prisma

# تحديث package.json للإنتاج
echo "✅ تم التحويل بنجاح!"
echo ""
echo "📝 الخطوات التالية:"
echo "1. أنشئ مشروع على Supabase.com"
echo "2. انسخ رابط قاعدة البيانات (DATABASE_URL)"
echo "3. ارفع المشروع على GitHub"
echo "4. انشر على Vercel مع إضافة DATABASE_URL في Environment Variables"
echo ""
echo "🔑 بيانات الدخول الافتراضية:"
echo "   اسم المستخدم: admin"
echo "   كلمة المرور: admin123"
