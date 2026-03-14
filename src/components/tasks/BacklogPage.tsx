'use client';

import { useState, useMemo } from 'react';
import { useStore, statusLabels, priorityLabels, departmentLabels, priorityColors, statusColors, taskTypeLabels, taskTypeColors, dependencyLabels, dependencyColors, type Task } from '@/store/useStore';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, MoreVertical, Edit, Trash2, User, Search, Filter, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 15;

export default function BacklogPage() {
  const { tasks, setEditingTask, setIsTaskModalOpen, deleteTask, updateTask, user, users } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dependencyFilter, setDependencyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // تصفية المهام (استبعاد المؤرشفة)
  const activeTasks = tasks.filter(t => !t.isArchived);

  // تصفية المهام
  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesDepartment = departmentFilter === 'all' || task.department === departmentFilter;
      const matchesType = typeFilter === 'all' || task.type === typeFilter;
      const matchesDependency = dependencyFilter === 'all' || task.dependency === dependencyFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesType && matchesDependency;
    });
  }, [activeTasks, searchTerm, statusFilter, priorityFilter, departmentFilter, typeFilter, dependencyFilter]);

  // حساب الصفحات
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  const handleFilterChange = (filterSetter: (value: string) => void) => (value: string) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  // حذف المهمة
  const handleDelete = async (taskId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      deleteTask(taskId);
      toast.success('تم حذف المهمة بنجاح');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    }
  };

  // أرشفة المهمة
  const handleArchive = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isArchived: true,
          archivedAt: new Date().toISOString()
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      updateTask(data.task);
      toast.success('تم أرشفة المهمة');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    }
  };

  // تنسيق التاريخ
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // حساب الأيام المتبقية
  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / 86400000);

    if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, color: 'text-red-500' };
    if (days === 0) return { text: 'اليوم', color: 'text-orange-500' };
    if (days === 1) return { text: 'غداً', color: 'text-yellow-500' };
    return { text: `${days} يوم متبقي`, color: 'text-green-500' };
  };

  // أرقام الصفحات
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* شريط البحث والتصفية */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن مهمة..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={handleFilterChange(setPriorityFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={handleFilterChange(setDepartmentFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {Object.entries(departmentLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(taskTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dependencyFilter} onValueChange={handleFilterChange(setDependencyFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="التبعية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التبعيات</SelectItem>
                {Object.entries(dependencyLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المهام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>المهام ({filteredTasks.length})</span>
            {filteredTasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                عرض {startIndex + 1}-{Math.min(endIndex, filteredTasks.length)} من {filteredTasks.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مهام مطابقة للبحث</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {paginatedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          <Badge className={statusColors[task.status]}>
                            {statusLabels[task.status]}
                          </Badge>
                          <Badge className={priorityColors[task.priority]}>
                            {priorityLabels[task.priority]}
                          </Badge>
                          {task.type && (
                            <Badge className={taskTypeColors[task.type]}>
                              {taskTypeLabels[task.type]}
                            </Badge>
                          )}
                          {task.dependency && (
                            <Badge className={dependencyColors[task.dependency]}>
                              {dependencyLabels[task.dependency]}
                            </Badge>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">القسم:</span>
                            {departmentLabels[task.department]}
                          </span>

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
                              <span className={getDaysRemaining(task.dueDate).color}>
                                ({getDaysRemaining(task.dueDate).text})
                              </span>
                            </span>
                          )}

                          <span className="text-xs">
                            أنشأها: {task.creator.name}
                          </span>
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
                            <Edit className="h-4 w-4 ml-2" />
                            عرض/تعديل
                          </DropdownMenuItem>
                          {user?.role !== 'EMPLOYEE' && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(task.id)}
                            >
                              <Archive className="h-4 w-4 ml-2" />
                              أرشفة
                            </DropdownMenuItem>
                          )}
                          {user?.role === 'ADMIN' && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(task.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="h-4 w-4 ml-1" />
                    السابق
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <Button
                          key={index}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-9 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={index} className="px-2 text-muted-foreground">
                          {page}
                        </span>
                      )
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
