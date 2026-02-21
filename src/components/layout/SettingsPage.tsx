'use client';

import { useStore, roleLabels, departmentLabels } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, User, Key, Shield, Building } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, setUser } = useStore();
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // تغيير كلمة المرور
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* معلومات الحساب */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات الحساب
          </CardTitle>
          <CardDescription>معلومات حسابك الشخصية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user?.name}</h3>
              <p className="text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الدور</p>
              <Badge variant="secondary">
                <Shield className="h-3 w-3 ml-1" />
                {user?.role && roleLabels[user.role]}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">القسم</p>
              <Badge variant="outline">
                <Building className="h-3 w-3 ml-1" />
                {user?.department ? departmentLabels[user.department] : 'غير محدد'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تغيير كلمة المرور */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription>قم بتغيير كلمة مرور حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* المظهر */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            المظهر
          </CardTitle>
          <CardDescription>اختر مظهر التطبيق</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex-1"
            >
              <Sun className="h-4 w-4 ml-2" />
              فاتح
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex-1"
            >
              <Moon className="h-4 w-4 ml-2" />
              داكن
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="flex-1"
            >
              نظام
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات النظام */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>نظام إدارة المهام - الإصدار 1.0.0</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
