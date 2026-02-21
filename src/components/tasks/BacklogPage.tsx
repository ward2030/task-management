'use client';

import { useState } from 'react';
import { useStore, statusLabels, priorityLabels, departmentLabels, priorityColors, statusColors, type Task, type TaskStatus, type Priority } from '@/store/useStore';
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
import { Calendar, MoreVertical, Edit, Trash2, User, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function BacklogPage() {
  const { tasks, setEditingTask, setIsTaskModalOpen, deleteTask, user, users } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // تصفية المهام
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'all' || task.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
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

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
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

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[150px]">
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
          </div>
        </CardContent>
      </Card>

      {/* قائمة المهام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>المهام ({filteredTasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مهام مطابقة للبحث</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          <Badge className={statusColors[task.status]}>
                            {statusLabels[task.status]}
                          </Badge>
                          <Badge className={priorityColors[task.priority]}>
                            {priorityLabels[task.priority]}
                          </Badge>
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
                            تعديل
                          </DropdownMenuItem>
                          {user?.role !== 'EMPLOYEE' && (
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
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
