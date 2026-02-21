'use client';

import { useState } from 'react';
import { useStore, roleLabels } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Moon, Sun, Bell, LogOut, User, Check, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const { user, notifications, unreadCount, setNotifications, setUnreadCount, setIsTaskModalOpen, currentPage } = useStore();
  const { theme, setTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  // تنسيق التاريخ
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  // عنوان الصفحة الحالية
  const pageTitles = {
    backlog: 'الباكلوج',
    kanban: 'لوحة الكانبان',
    reports: 'التقارير',
    users: 'إدارة المستخدمين',
    settings: 'الإعدادات',
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">{pageTitles[currentPage]}</h1>
        {(currentPage === 'backlog' || currentPage === 'kanban') && user && (
          <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
            <span>مهمة جديدة</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* زر الوضع الداكن */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* الإشعارات */}
        <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>الإشعارات</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 ml-1" />
                  تحديد الكل كمقروء
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  لا توجد إشعارات
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-0 ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                  >
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* قائمة المستخدم */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.role && roleLabels[user.role]}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
