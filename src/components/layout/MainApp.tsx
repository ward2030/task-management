'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import Sidebar from './Sidebar';
import Header from './Header';
import BacklogPage from '@/components/tasks/BacklogPage';
import KanbanPage from '@/components/tasks/KanbanPage';
import CalendarPage from '@/components/tasks/CalendarPage';
import ReportsPage from '@/components/tasks/ReportsPage';
import UsersPage from '@/components/users/UsersPage';
import SettingsPage from './SettingsPage';
import ActivityPage from '@/components/activity/ActivityPage';
import ChatPage from '@/components/chat/ChatPage';
import ArchivePage from '@/components/tasks/ArchivePage';
import TaskModal from '@/components/tasks/TaskModal';
import { Toaster } from '@/components/ui/sonner';

export default function MainApp() {
  const { currentPage, isTaskModalOpen, editingTask, setIsTaskModalOpen, setEditingTask, user, setUser, setTasks, setUsers, setNotifications, setUnreadCount, setMessages, setUnreadMessages } = useStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // جلب الإشعارات الجديدة
        const notifRes = await fetch('/api/notifications');
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);

        // جلب الرسائل الجديدة
        const msgRes = await fetch('/api/messages');
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
        setUnreadMessages(msgData.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [setNotifications, setUnreadCount, setMessages, setUnreadMessages]);

  // تسجيل الخروج
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setTasks([]);
    setUsers([]);
    setNotifications([]);
    setUnreadCount(0);
    setMessages([]);
    setUnreadMessages(0);
  };

  // عرض الصفحة الحالية
  const renderPage = () => {
    switch (currentPage) {
      case 'backlog':
        return <BacklogPage />;
      case 'kanban':
        return <KanbanPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      case 'activity':
        return <ActivityPage />;
      case 'chat':
        return <ChatPage />;
      case 'archive':
        return <ArchivePage />;
      default:
        return <KanbanPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* القائمة الجانبية */}
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onLogout={handleLogout} />

        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>

        <footer className="py-4 px-6 border-t bg-card text-center text-sm text-muted-foreground">
          نظام إدارة المهام © {new Date().getFullYear()} - شركة الفهد للتجارة والصناعة والمقاولات
        </footer>
      </div>

      {/* نافذة إضافة/تعديل المهمة */}
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={(open) => {
          setIsTaskModalOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
      />

      <Toaster />
    </div>
  );
}
