'use client';

import { useStore, Task, statusLabels, statusColors, priorityColors, departmentLabels } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Eye,
  Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { tasks, setCurrentPage, setIsTaskModalOpen, setEditingTask } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // حساب نطاق التواريخ المعروضة
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // إضافة أيام من الشهر السابق واللاحق لملء الشبكة
      const startPadding = firstDay.getDay(); // يوم الأحد = 0
      const endPadding = 6 - lastDay.getDay();
      
      const start = new Date(firstDay);
      start.setDate(start.getDate() - startPadding);
      
      const end = new Date(lastDay);
      end.setDate(end.getDate() + endPadding);
      
      return { start, end };
    } else {
      // عرض أسبوعي
      const dayOfWeek = currentDate.getDay();
      const start = new Date(currentDate);
      start.setDate(start.getDate() - dayOfWeek);
      
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      return { start, end };
    }
  }, [currentDate, viewMode]);

  // توليد مصفوفة الأيام
  const days = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return result;
  }, [dateRange]);

  // تصفية المهام
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterDepartment !== 'all' && task.department !== filterDepartment) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterAssignee !== 'all') {
        if (filterAssignee === 'unassigned' && task.assignee) return false;
        if (filterAssignee !== 'unassigned' && task.assignee?.id !== filterAssignee) return false;
      }
      return true;
    });
  }, [tasks, filterDepartment, filterStatus, filterAssignee]);

  // المهام المعروضة في النطاق الزمني
  const visibleTasks = useMemo(() => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskStart = new Date(task.createdAt);
      const taskEnd = new Date(task.dueDate);
      return taskEnd >= dateRange.start && taskStart <= dateRange.end;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [filteredTasks, dateRange]);

  // حساب موقع وعرض المهمة في الخط الزمني
  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.createdAt);
    const taskEnd = new Date(task.dueDate!);
    const totalDays = days.length;
    
    const startIndex = days.findIndex(d => 
      d.toDateString() === taskStart.toDateString()
    );
    const endIndex = days.findIndex(d => 
      d.toDateString() === taskEnd.toDateString()
    );
    
    const start = Math.max(0, startIndex);
    const end = endIndex === -1 ? totalDays - 1 : endIndex;
    
    return {
      start,
      width: end - start + 1,
      duration: Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    };
  };

  // التنقل بين الأشهر/الأسابيع
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  // الانتقال لليوم الحالي
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // تنسيق الشهر والسنة
  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };

  // التحقق من اليوم الحالي
  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  // حساب الأيام المتبقية
  const getRemainingDays = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // لون شريط المهمة حسب الحالة
  const getTaskBarColor = (task: Task) => {
    switch (task.status) {
      case 'TODO':
        return 'bg-slate-400 dark:bg-slate-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500 dark:bg-blue-400';
      case 'IN_REVIEW':
        return 'bg-amber-500 dark:bg-amber-400';
      case 'DONE':
        return 'bg-green-500 dark:bg-green-400';
      default:
        return 'bg-gray-400';
    }
  };

  // فتح تفاصيل المهمة
  const openTaskDetails = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // الحصول على المستخدمين الفريدين للمهام
  const uniqueAssignees = useMemo(() => {
    const assignees = new Map();
    tasks.forEach(task => {
      if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(assignees.values());
  }, [tasks]);

  // أيام الأسبوع
  const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      {/* العنوان والتحكم */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التقويم الزمني</h1>
            <p className="text-sm text-muted-foreground">
              عرض المهام على الخط الزمني
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={goToToday}>
            اليوم
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center font-medium">
              {formatMonthYear()}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">شهر</SelectItem>
              <SelectItem value="week">أسبوع</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                <SelectItem value="ARCHITECTURAL">معماري</SelectItem>
                <SelectItem value="ELECTRICAL">كهرباء</SelectItem>
                <SelectItem value="CIVIL">مدني</SelectItem>
                <SelectItem value="MECHANICAL">ميكانيكا</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="TODO">قيد الانتظار</SelectItem>
                <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
                <SelectItem value="IN_REVIEW">قيد المراجعة</SelectItem>
                <SelectItem value="DONE">مكتملة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="المسؤول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="unassigned">غير مسندة</SelectItem>
                {uniqueAssignees.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterDepartment !== 'all' || filterStatus !== 'all' || filterAssignee !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setFilterDepartment('all');
                  setFilterStatus('all');
                  setFilterAssignee('all');
                }}
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الخط الزمني */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full flex flex-col">
            {/* رأس التقويم - أيام الأسبوع */}
            <div className="grid grid-cols-7 bg-muted/50 border-b">
              {weekDays.map((day, i) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* التواريخ والمهام */}
            <ScrollArea className="flex-1">
              {viewMode === 'month' ? (
                /* عرض شهري - شبكة التقويم */
                <div className="grid grid-cols-7">
                  {days.map((day, index) => {
                    const dayTasks = visibleTasks.filter(task => {
                      const taskStart = new Date(task.createdAt);
                      const taskEnd = new Date(task.dueDate!);
                      return day >= taskStart && day <= taskEnd;
                    });

                    return (
                      <div
                        key={index}
                        className={cn(
                          'min-h-[100px] border-l border-b p-1',
                          isToday(day) && 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'text-sm p-1 rounded w-fit',
                          isToday(day) && 'bg-primary text-primary-foreground font-medium'
                        )}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayTasks.slice(0, 3).map(task => (
                            <div
                              key={task.id}
                              onClick={() => openTaskDetails(task)}
                              className={cn(
                                'text-xs p-1 rounded cursor-pointer truncate',
                                getTaskBarColor(task),
                                'text-white hover:opacity-80 transition-opacity'
                              )}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayTasks.length - 3} أخرى
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* عرض أسبوعي - خط زمني مفصل */
                <div className="p-4">
                  {/* رأس الأسبوع */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {days.map((day, index) => (
                      <div
                        key={index}
                        className={cn(
                          'text-center p-2 rounded',
                          isToday(day) && 'bg-primary text-primary-foreground'
                        )}
                      >
                        <div className="text-xs text-muted-foreground">
                          {weekDays[day.getDay()]}
                        </div>
                        <div className="text-lg font-medium">
                          {day.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* قائمة المهام */}
                  <div className="space-y-2">
                    {visibleTasks.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد مهام في هذه الفترة</p>
                      </div>
                    ) : (
                      visibleTasks.map(task => {
                        const position = getTaskPosition(task);
                        const remainingDays = getRemainingDays(task.dueDate!);
                        
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            {/* معلومات المهمة */}
                            <div className="w-[250px] flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full', getTaskBarColor(task))} />
                                <span className="font-medium text-sm truncate">{task.title}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {departmentLabels[task.department]}
                                </Badge>
                                {task.assignee && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {task.assignee.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* شريط المهمة */}
                            <div className="flex-1 grid grid-cols-7 gap-1">
                              {days.map((day, dayIndex) => {
                                const taskStart = new Date(task.createdAt);
                                const taskEnd = new Date(task.dueDate!);
                                const isInRange = day >= taskStart && day <= taskEnd;
                                const isStart = day.toDateString() === taskStart.toDateString();
                                const isEnd = day.toDateString() === taskEnd.toDateString();
                                
                                return (
                                  <div
                                    key={dayIndex}
                                    className={cn(
                                      'h-8 rounded transition-all',
                                      isToday(day) && 'ring-2 ring-primary/30',
                                    )}
                                  >
                                    {isInRange && (
                                      <div
                                        onClick={() => openTaskDetails(task)}
                                        className={cn(
                                          'h-full cursor-pointer flex items-center justify-center',
                                          getTaskBarColor(task),
                                          isStart && 'rounded-r-md',
                                          isEnd && 'rounded-l-md',
                                          !isStart && !isEnd && 'rounded-none',
                                          'hover:opacity-80 transition-opacity'
                                        )}
                                      >
                                        {isStart && (
                                          <span className="text-[10px] text-white px-1 truncate">
                                            {task.title}
                                          </span>
                                        )}
                                                      </div>
                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>

                            {/* المدة والأيام المتبقية */}
                            <div className="w-[80px] flex-shrink-0 text-left">
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                <span>{position.duration} يوم</span>
                              </div>
                              <div className={cn(
                                'text-xs',
                                remainingDays < 0 ? 'text-red-500' :
                                remainingDays === 0 ? 'text-amber-500' :
                                remainingDays <= 3 ? 'text-orange-500' :
                                'text-muted-foreground'
                              )}>
                                {remainingDays < 0 ? `متأخر ${Math.abs(remainingDays)} يوم` :
                                 remainingDays === 0 ? 'اليوم' :
                                 `متبقي ${remainingDays} يوم`}
                              </div>
                            </div>

                            {/* زر فتح المهمة */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => openTaskDetails(task)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* ملخص المهام */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredTasks.filter(t => t.status === 'TODO').length}
              </p>
              <p className="text-xs text-muted-foreground">قيد الانتظار</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredTasks.filter(t => t.status === 'IN_PROGRESS').length}
              </p>
              <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredTasks.filter(t => t.status === 'IN_REVIEW').length}
              </p>
              <p className="text-xs text-muted-foreground">قيد المراجعة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredTasks.filter(t => t.status === 'DONE').length}
              </p>
              <p className="text-xs text-muted-foreground">مكتملة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
