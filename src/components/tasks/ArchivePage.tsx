'use client';

import { useState, useEffect } from 'react';
import { useStore, statusLabels, priorityLabels, departmentLabels, priorityColors, statusColors, type Task } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Archive, RotateCcw, Trash2, User, Search, Filter, Calendar, 
  MoreVertical, Eye, Clock, CheckCircle, AlertCircle, FileText,
  Download, Package
} from 'lucide-react';
import { toast } from 'sonner';

export default function ArchivePage() {
  const { tasks, setEditingTask, setIsTaskModalOpen, deleteTask, updateTask, user, users, setTasks } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // جلب المهام المؤرشفة
  useEffect(() => {
    fetchArchivedTasks();
  }, []);

  const fetchArchivedTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks?archived=true');
      const data = await res.json();
      if (res.ok) {
        // دمج المهام المؤرشفة مع المهام الحالية
        const archivedTasks = data.tasks.filter((t: Task) => t.isArchived);
        setTasks([...tasks.filter(t => !t.isArchived), ...archivedTasks]);
      }
    } catch (error) {
      console.error('Error fetching archived tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // المهام المؤرشفة فقط
  const archivedTasks = tasks.filter(t => t.isArchived);

  // تصفية المهام
  const filteredTasks = archivedTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'all' || task.department === departmentFilter;
    
    // تصفية التاريخ
    let matchesDate = true;
    if (dateFilter !== 'all' && task.archivedAt) {
      const archiveDate = new Date(task.archivedAt);
      const now = new Date();
      switch (dateFilter) {
        case 'week':
          matchesDate = now.getTime() - archiveDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          matchesDate = now.getTime() - archiveDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
          break;
        case 'quarter':
          matchesDate = now.getTime() - archiveDate.getTime() <= 90 * 24 * 60 * 60 * 1000;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesDate;
  });

  // استعادة مهمة
  const handleRestore = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isArchived: false,
          archivedAt: null
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      updateTask(data.task);
      toast.success('تم استعادة المهمة بنجاح');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    }
  };

  // حذف مهمة
  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      deleteTask(taskId);
      toast.success('تم حذف المهمة نهائياً');
      setShowDeleteDialog(false);
      setTaskToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    }
  };

  // استعادة متعددة
  const handleBulkRestore = async () => {
    if (selectedTasks.length === 0) return;
    
    try {
      await Promise.all(
        selectedTasks.map(taskId =>
          fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isArchived: false, archivedAt: null }),
          })
        )
      );
      
      toast.success(`تم استعادة ${selectedTasks.length} مهمة`);
      setSelectedTasks([]);
      fetchArchivedTasks();
    } catch (error) {
      toast.error('حدث خطأ أثناء الاستعادة');
    }
  };

  // حذف متعدد
  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    try {
      await Promise.all(
        selectedTasks.map(taskId =>
          fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
        )
      );
      
      toast.success(`تم حذف ${selectedTasks.length} مهمة نهائياً`);
      setSelectedTasks([]);
      fetchArchivedTasks();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // تصدير الأرشيف
  const exportArchive = () => {
    const data = filteredTasks.map(t => ({
      العنوان: t.title,
      الوصف: t.description,
      الحالة: statusLabels[t.status],
      الأولوية: priorityLabels[t.priority],
      القسم: departmentLabels[t.department],
      'تاريخ الاستحقاق': t.dueDate ? new Date(t.dueDate).toLocaleDateString('ar-EG') : '',
      'تاريخ الأرشفة': t.archivedAt ? new Date(t.archivedAt).toLocaleDateString('ar-EG') : '',
      'المسند إليه': t.assignee?.name || '',
      'المنشئ': t.creator.name,
    }));
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archive-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // تنسيق التاريخ
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // حساب الأيام منذ الأرشفة
  const getDaysSinceArchive = (archivedAt: string) => {
    const diff = new Date().getTime() - new Date(archivedAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'اليوم';
    if (days === 1) return 'أمس';
    return `منذ ${days} يوم`;
  };

  // تبديل اختيار مهمة
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // اختيار الكل
  const toggleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <Archive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">أرشيف المهام</h2>
            <p className="text-muted-foreground text-sm">
              {archivedTasks.length} مهمة مؤرشفة
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {selectedTasks.length > 0 && (
            <>
              <Button variant="outline" onClick={handleBulkRestore}>
                <RotateCcw className="h-4 w-4 ml-2" />
                استعادة ({selectedTasks.length})
              </Button>
              {user?.role === 'ADMIN' && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف ({selectedTasks.length})
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={exportArchive} disabled={filteredTasks.length === 0}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* إحصائيات الأرشيف */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{archivedTasks.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي المؤرشف</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {archivedTasks.filter(t => t.status === 'DONE').length}
                </p>
                <p className="text-xs text-muted-foreground">مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {archivedTasks.filter(t => t.archivedAt && 
                    new Date().getTime() - new Date(t.archivedAt).getTime() <= 7 * 86400000
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(departmentLabels).filter(dept => 
                    archivedTasks.some(t => t.department === dept)
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">أقسام</p>
              </div>
            </div>
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
                  placeholder="ابحث في الأرشيف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {Object.entries(departmentLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="تاريخ الأرشفة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الوقت</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المهام المؤرشفة */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              المهام المؤرشفة ({filteredTasks.length})
            </CardTitle>
            {filteredTasks.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {selectedTasks.length === filteredTasks.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>جاري تحميل الأرشيف...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Archive className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">لا توجد مهام مؤرشفة</p>
              <p className="text-sm mt-1">المهام المؤرشفة ستظهر هنا</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-450px)]">
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                      selectedTasks.includes(task.id) ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          <Badge className={statusColors[task.status]}>
                            {statusLabels[task.status]}
                          </Badge>
                          <Badge className={priorityColors[task.priority]}>
                            {priorityLabels[task.priority]}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                            {departmentLabels[task.department]}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {task.assignee && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignee.name}
                            </span>
                          )}

                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}

                          {task.archivedAt && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Archive className="h-3 w-3" />
                              أُرشفت {getDaysSinceArchive(task.archivedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingTask(task);
                              setIsTaskModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRestore(task.id)}
                            className="text-green-600"
                          >
                            <RotateCcw className="h-4 w-4 ml-2" />
                            استعادة
                          </DropdownMenuItem>
                          {user?.role === 'ADMIN' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTaskToDelete(task.id);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف نهائياً
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTasks.length > 0 
                ? `هل أنت متأكد من حذف ${selectedTasks.length} مهمة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
                : 'هل أنت متأكد من حذف هذه المهمة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTasks.length > 0) {
                  handleBulkDelete();
                } else if (taskToDelete) {
                  handleDelete(taskToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
