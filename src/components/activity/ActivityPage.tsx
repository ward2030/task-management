'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore, activityLabels, roleLabels, departmentLabels } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, User, FileText, MessageSquare, Archive, Star, 
  ArrowRightLeft, Trash2, Edit, PlusCircle, Search, Filter,
  Download, RefreshCw, Clock, Calendar
} from 'lucide-react';

export default function ActivityPage() {
  const { activities, setActivities, user, users } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/activity?limit=200');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <PlusCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'STATUS_CHANGE': return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      case 'COMMENT': return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'ASSIGN': return <User className="h-4 w-4 text-cyan-500" />;
      case 'ARCHIVE': return <Archive className="h-4 w-4 text-gray-500" />;
      case 'RATING': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'STATUS_CHANGE': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'COMMENT': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'ASSIGN': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'ARCHIVE': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'RATING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDate(date);
  };

  // تصفية الأنشطة
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // البحث
      const matchesSearch = 
        activity.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.task?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.details?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      // فلتر النوع
      const matchesAction = actionFilter === 'all' || activity.action === actionFilter;

      // فلتر المستخدم
      const matchesUser = userFilter === 'all' || activity.user.id === userFilter;

      // فلتر التاريخ
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const activityDate = new Date(activity.createdAt);
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            matchesDate = activityDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = activityDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = activityDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesAction && matchesUser && matchesDate;
    });
  }, [activities, searchTerm, actionFilter, userFilter, dateFilter]);

  // تقسيم الصفحات
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // تجميع الأنشطة بالتاريخ
  const groupedActivities = paginatedActivities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString('ar-EG');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, typeof activities>);

  // إحصائيات
  const stats = useMemo(() => ({
    total: activities.length,
    create: activities.filter(a => a.action === 'CREATE').length,
    update: activities.filter(a => a.action === 'UPDATE').length,
    statusChange: activities.filter(a => a.action === 'STATUS_CHANGE').length,
    comment: activities.filter(a => a.action === 'COMMENT').length,
    assign: activities.filter(a => a.action === 'ASSIGN').length,
    archive: activities.filter(a => a.action === 'ARCHIVE').length,
    rating: activities.filter(a => a.action === 'RATING').length,
    delete: activities.filter(a => a.action === 'DELETE').length,
    today: activities.filter(a => 
      new Date(a.createdAt).toDateString() === new Date().toDateString()
    ).length,
    thisWeek: activities.filter(a => {
      const activityDate = new Date(a.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return activityDate >= weekAgo;
    }).length,
  }), [activities]);

  // تصدير السجل
  const exportLog = () => {
    const data = filteredActivities.map(a => ({
      التاريخ: formatDate(a.createdAt),
      النوع: activityLabels[a.action] || a.action,
      المستخدم: a.user.name,
      المهمة: a.task?.title || '',
      التفاصيل: a.details || '',
    }));
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">سجل النشاط</h2>
            <p className="text-muted-foreground text-sm">تتبع جميع العمليات في النظام</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchActivities}>
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" onClick={exportLog}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <PlusCircle className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{stats.create}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">مهام أنشئت</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">{stats.statusChange}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">تغييرات حالة</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <p className="text-2xl font-bold text-orange-600">{stats.comment}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">تعليقات</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">اليوم</p>
          </CardContent>
        </Card>
        <Card className="bg-cyan-50 dark:bg-cyan-900/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-cyan-600" />
              <p className="text-2xl font-bold text-cyan-600">{stats.thisWeek}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">هذا الأسبوع</p>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث والتصفية */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في السجل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(activityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستخدمين</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الوقت</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الأنشطة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>آخر النشاطات</span>
            <Badge variant="outline" className="font-normal">
              {filteredActivities.length} من {activities.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>جاري التحميل...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد أنشطة مطابقة</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-480px)]">
              {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-muted-foreground border-b flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {date}
                    <Badge variant="outline" className="text-xs">
                      {dateActivities.length}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {dateActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                        <div className="mt-1">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={getActivityColor(activity.action)}>
                              {activityLabels[activity.action] || activity.action}
                            </Badge>
                            <span className="font-medium">{activity.user.name}</span>
                            {activity.task && (
                              <span className="text-muted-foreground text-sm">
                                ← {activity.task.title}
                              </span>
                            )}
                          </div>
                          {activity.details && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                          )}
                        </div>
                        <div className="text-left">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* ترقيم الصفحات */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            السابق
          </Button>
          <span className="flex items-center px-4 text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
