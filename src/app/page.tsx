'use client';

// نظام إدارة المهام - صفحة تسجيل الدخول
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Loader2, LogIn, CheckSquare } from 'lucide-react';
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
        await fetch('/api/init');
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.user) {
          setUser(data.user);
          await fetchInitialData(data.user.id);
        } else {
          setShowLoginForm(true);
        }
      } catch {
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
      const tasksRes = await fetch('/api/tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      const notifRes = await fetch('/api/notifications');
      const notifData = await notifRes.json();
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount || 0);

      if (userId && notifData.unreadCount > 0) {
        const unreadNotifications = notifData.notifications.filter((n: { isRead: boolean }) => !n.isRead);
        const taskNotifications = unreadNotifications.filter((n: { title: string }) => 
          n.title.includes('مهمة') || n.title.includes('إسناد')
        );
        
        if (taskNotifications.length > 0) {
          setTimeout(() => {
            toast.success(`📋 لديك ${taskNotifications.length} مهمة جديدة مسندة إليك!`, { duration: 6000 });
          }, 500);
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

  // صفحة تسجيل الدخول مع خلفية متحركة
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* الخلفية المتحركة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* أشكال متحركة */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* دائرة 1 */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          {/* دائرة 2 */}
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          {/* دائرة 3 */}
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          {/* دائرة 4 */}
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>
        
        {/* نجوم صغيرة */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* محتوى الصفحة */}
      {isCheckingAuth && !showLoginForm ? (
        // شاشة التحميل
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
            <CheckSquare className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <p className="text-white/80">جاري التحميل...</p>
        </div>
      ) : (
        // نموذج تسجيل الدخول
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/10 backdrop-blur-xl relative z-10">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">نظام إدارة المهام</CardTitle>
              <CardDescription className="mt-2 text-white/70">
                قم بتسجيل الدخول للوصول إلى لوحة التحكم
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/90">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-right h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                  dir="rtl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-right h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                  dir="rtl"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-white/20 hover:bg-white/30 text-white border border-white/20" disabled={isLoading}>
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
          </CardContent>
        </Card>
      )}

      {/* أنماط CSS للحركة */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(30px, 10px) scale(1.05);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        
        .animate-blob {
          animation: blob 8s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}</style>
    </div>
  );
}
