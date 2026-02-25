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

  // صفحة تسجيل الدخول مع خلفية السماء والغيوم
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية السماء */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-500">
        {/* الشمس */}
        <div className="absolute top-12 right-12 w-24 h-24 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400/50">
          <div className="absolute inset-0 bg-yellow-200 rounded-full animate-pulse opacity-60"></div>
        </div>

        {/* الغيوم المتحركة */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
          <div className="cloud cloud-4"></div>
          <div className="cloud cloud-5"></div>
        </div>

        {/* طيور صغيرة */}
        <div className="absolute top-20 left-1/4">
          <div className="bird bird-1"></div>
        </div>
        <div className="absolute top-32 left-1/3">
          <div className="bird bird-2"></div>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="flex-1 flex items-center justify-center w-full">
        {isCheckingAuth && !showLoginForm ? (
          // شاشة التحميل
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="h-8 w-8 text-sky-600" />
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <p className="text-white font-medium">جاري التحميل...</p>
          </div>
        ) : (
          // نموذج تسجيل الدخول
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-800">نظام إدارة المهام</CardTitle>
                <CardDescription className="mt-2 text-gray-600">
                  قم بتسجيل الدخول للوصول إلى لوحة التحكم
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700">اسم المستخدم</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="text-right h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-sky-400 focus:ring-sky-400"
                    dir="rtl"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-right h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-sky-400 focus:ring-sky-400"
                    dir="rtl"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-lg" disabled={isLoading}>
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
      </div>

      {/* اسم الشركة في الأسفل */}
      <div className="relative z-10 pb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
          شركة الفهد للتجارة والصناعة والمقاولات
        </h2>
      </div>

      {/* أنماط CSS للحركة */}
      <style jsx>{`
        /* الغيوم */
        .cloud {
          position: absolute;
          background: white;
          border-radius: 100px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .cloud::before,
        .cloud::after {
          content: '';
          position: absolute;
          background: white;
          border-radius: 50%;
        }
        
        .cloud-1 {
          width: 200px;
          height: 60px;
          top: 10%;
          animation: float-cloud 30s linear infinite;
        }
        .cloud-1::before {
          width: 80px;
          height: 80px;
          top: -40px;
          left: 30px;
        }
        .cloud-1::after {
          width: 60px;
          height: 60px;
          top: -30px;
          right: 30px;
        }
        
        .cloud-2 {
          width: 150px;
          height: 45px;
          top: 25%;
          animation: float-cloud 25s linear infinite;
          animation-delay: -10s;
        }
        .cloud-2::before {
          width: 60px;
          height: 60px;
          top: -30px;
          left: 20px;
        }
        .cloud-2::after {
          width: 45px;
          height: 45px;
          top: -20px;
          right: 25px;
        }
        
        .cloud-3 {
          width: 100px;
          height: 35px;
          top: 45%;
          animation: float-cloud 20s linear infinite;
          animation-delay: -5s;
          opacity: 0.9;
        }
        .cloud-3::before {
          width: 45px;
          height: 45px;
          top: -25px;
          left: 15px;
        }
        .cloud-3::after {
          width: 35px;
          height: 35px;
          top: -18px;
          right: 15px;
        }
        
        .cloud-4 {
          width: 180px;
          height: 50px;
          top: 60%;
          animation: float-cloud 35s linear infinite;
          animation-delay: -15s;
          opacity: 0.85;
        }
        .cloud-4::before {
          width: 70px;
          height: 70px;
          top: -35px;
          left: 25px;
        }
        .cloud-4::after {
          width: 55px;
          height: 55px;
          top: -28px;
          right: 25px;
        }
        
        .cloud-5 {
          width: 120px;
          height: 40px;
          top: 75%;
          animation: float-cloud 28s linear infinite;
          animation-delay: -20s;
          opacity: 0.8;
        }
        .cloud-5::before {
          width: 50px;
          height: 50px;
          top: -25px;
          left: 20px;
        }
        .cloud-5::after {
          width: 40px;
          height: 40px;
          top: -20px;
          right: 20px;
        }
        
        @keyframes float-cloud {
          0% {
            left: -250px;
          }
          100% {
            left: 100%;
          }
        }
        
        .bird {
          width: 10px;
          height: 5px;
          background: transparent;
          position: relative;
        }
        
        .bird::before,
        .bird::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 3px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
        }
        
        .bird::before {
          left: 0;
          transform: rotate(-20deg);
          animation: wing 0.3s ease-in-out infinite alternate;
        }
        
        .bird::after {
          right: 0;
          transform: rotate(20deg);
          animation: wing 0.3s ease-in-out infinite alternate-reverse;
        }
        
        .bird-1 {
          animation: fly-bird 15s linear infinite;
        }
        
        .bird-2 {
          animation: fly-bird 18s linear infinite;
          animation-delay: -5s;
        }
        
        @keyframes wing {
          0% {
            transform: rotate(-30deg);
          }
          100% {
            transform: rotate(30deg);
          }
        }
        
        @keyframes fly-bird {
          0% {
            transform: translateX(-100px);
          }
          100% {
            transform: translateX(calc(100vw + 100px));
          }
        }
      `}</style>
    </div>
  );
}
