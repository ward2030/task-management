'use client';

// نظام إدارة المهام - صفحة تسجيل الدخول
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { toast, Toaster } from 'sonner';
import { Loader2, LogIn, CheckSquare, Bell, ClipboardList } from 'lucide-react';
import MainApp from '@/components/layout/MainApp';

export default function LoginPage() {
  const { user, setUser, setTasks, setUsers, setNotifications, setUnreadCount } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // تهيئة النظام أولاً
        await fetch('/api/init');

        // التحقق من المستخدم الحالي
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.user) {
          setUser(data.user);
          // جلب البيانات
          await fetchInitialData(data.user.id);
        } else {
          // لا يوجد مستخدم مسجل الدخول - أظهر شاشة الدخول
          setShowLoginForm(true);
        }
      } catch {
        // حدث خطأ - أظهر شاشة الدخول
        setShowLoginForm(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [setUser]);

  // جلب البيانات الأولية
  const fetchInitialData = async (userId?: string) => {
    try {
      // جلب المهام
      const tasksRes = await fetch('/api/tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);

      // جلب المستخدمين
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      // جلب الإشعارات
      const notifRes = await fetch('/api/notifications');
      const notifData = await notifRes.json();
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount || 0);

      // إظهار إشعار إذا كان هناك مهام جديدة مسندة للمستخدم
      if (userId && notifData.unreadCount > 0) {
        const unreadNotifications = notifData.notifications.filter((n: { isRead: boolean }) => !n.isRead);
        
        // إشعارات المهام المسندة
        const taskNotifications = unreadNotifications.filter((n: { title: string }) => 
          n.title.includes('مهمة') || n.title.includes('إسناد')
        );
        
        if (taskNotifications.length > 0) {
          setTimeout(() => {
            toast.success(`📋 لديك ${taskNotifications.length} مهمة جديدة مسندة إليك!`, {
              duration: 6000,
              action: {
                label: 'عرض',
                onClick: () => {
                  // سيتم عرض الإشعارات في التطبيق
                },
              },
            });
          }, 500);
        }

        // إشعارات التعليقات
        const commentNotifications = unreadNotifications.filter((n: { title: string }) => 
          n.title.includes('تعليق')
        );
        
        if (commentNotifications.length > 0) {
          setTimeout(() => {
            toast.info(`💬 لديك ${commentNotifications.length} تعليق جديد على مهامك!`, {
              duration: 5000,
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // تسجيل الدخول
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء تسجيل الدخول');
      }

      setUser(data.user);
      await fetchInitialData(data.user.id);
      toast.success('مرحباً بك، ' + data.user.name + '! 👋');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  // إذا كان المستخدم مسجل الدخول، عرض التطبيق
  if (user) {
    return <MainApp />;
  }

  // صفحة تسجيل الدخول
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      {isCheckingAuth && !showLoginForm ? (
        // شاشة التحميل
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <CheckSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      ) : (
        // نموذج تسجيل الدخول
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">نظام إدارة المهام</CardTitle>
              <CardDescription className="mt-2">
                قم بتسجيل الدخول للوصول إلى لوحة التحكم
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-right h-11"
                  dir="rtl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-right h-11"
                  dir="rtl"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center border">
              <p className="font-medium mb-1">شركة الفهد للتجارة والصناعة والمقاولات:</p>
              <p className="font-mono bg-background px-3 py-2 rounded mt-2">
                <span className="text-primary">مشروع المباني المساندة بحائل>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
