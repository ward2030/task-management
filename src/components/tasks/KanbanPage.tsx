'use client';

import { useState, useMemo } from 'react';
import { useStore, statusLabels, priorityLabels, departmentLabels, priorityColors, taskTypeLabels, taskTypeColors, dependencyLabels, dependencyColors, type Task, type TaskStatus, type Department, type TaskType, type Dependency, type Priority } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MessageSquare, Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'قيد الانتظار', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', title: 'قيد التنفيذ', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'قيد المراجعة', color: 'bg-yellow-500' },
  { id: 'DONE', title: 'مكتملة', color: 'bg-green-500' },
];

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // حساب الأيام المتبقية
  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / 86400000);

    if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    if (days === 0) return { text: 'اليوم', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    if (days <= 3) return { text: `${days} يوم`, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { text: `${days} يوم`, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
    >
      <CardContent className="p-3 space-y-2">
        {/* العنوان والأولوية */}
        <div className="flex items-start justify-between gap-2">
          <h4 
            className="font-medium text-sm line-clamp-2 flex-1 cursor-pointer hover:text-primary"
            onClick={onClick}
          >
            {task.title}
          </h4>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* الأوصاف */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* الشارات */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {departmentLabels[task.department]}
          </Badge>
          <Badge className={`text-xs ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </Badge>
          {task.type && (
            <Badge className={`text-xs ${taskTypeColors[task.type]}`}>
              {taskTypeLabels[task.type]}
            </Badge>
          )}
          {task.dependency && (
            <Badge className={`text-xs ${dependencyColors[task.dependency]}`}>
              {dependencyLabels[task.dependency]}
            </Badge>
          )}
        </div>

        {/* معلومات إضافية */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {task.assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[60px]">{task.assignee.name}</span>
              </div>
            )}
            {task.comments && task.comments.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </span>
            )}
          </div>

          {task.dueDate && (
            <span className={`px-2 py-0.5 rounded text-[10px] ${getDaysRemaining(task.dueDate).bg} ${getDaysRemaining(task.dueDate).color}`}>
              {getDaysRemaining(task.dueDate).text}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// عمود قابل للإسقاط
interface DroppableColumnProps {
  column: { id: TaskStatus; title: string; color: string };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function DroppableColumn({ column, tasks, onTaskClick }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <Card 
      className={`flex flex-col transition-colors ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
    >
      <CardHeader className="py-3 px-4 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <CardTitle className="text-sm font-medium">
              {column.title}
            </CardTitle>
            <Badge variant="secondary" className="h-5 min-w-[20px] flex items-center justify-center px-1.5">
              {tasks.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 pt-0">
        <ScrollArea className="h-full">
          <div 
            ref={setNodeRef}
            className="space-y-2 p-2 min-h-[300px]"
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                لا توجد مهام
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function KanbanPage() {
  const { tasks, updateTask, setEditingTask, setIsTaskModalOpen, users, user: currentUser } = useStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // حالات الفلترة
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDependency, setFilterDependency] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // تصفية المستخدمين النشطين
  const activeUsers = users.filter(u => u.isActive !== false);

  // تطبيق الفلاتر
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // استبعاد المهام المؤرشفة
      if (task.isArchived) return false;

      // البحث
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(query) ||
          (task.description?.toLowerCase().includes(query)) ||
          (task.assignee?.name.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // فلترة القسم
      if (filterDepartment !== 'all' && task.department !== filterDepartment) return false;

      // فلترة النوع
      if (filterType !== 'all' && task.type !== filterType) return false;

      // فلترة التبعية
      if (filterDependency !== 'all' && task.dependency !== filterDependency) return false;

      // فلترة الأولوية
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

      // فلترة المسند إليه
      if (filterAssignee === 'unassigned' && task.assigneeId) return false;
      if (filterAssignee !== 'all' && filterAssignee !== 'unassigned' && task.assigneeId !== filterAssignee) return false;

      return true;
    });
  }, [tasks, searchQuery, filterDepartment, filterType, filterDependency, filterPriority, filterAssignee]);

  // تجميع المهام حسب الحالة
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // عدد الفلاتر النشطة
  const activeFiltersCount = [
    filterDepartment !== 'all',
    filterType !== 'all',
    filterDependency !== 'all',
    filterPriority !== 'all',
    filterAssignee !== 'all',
  ].filter(Boolean).length;

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setSearchQuery('');
    setFilterDepartment('all');
    setFilterType('all');
    setFilterDependency('all');
    setFilterPriority('all');
    setFilterAssignee('all');
  };

  // بدء السحب
  const handleDragStart = (event: DragStartEvent) => {
    const task = filteredTasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  // انتهاء السحب
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // التحقق مما إذا كان الهدف عمودًا
    const isColumn = columns.some((col) => col.id === over.id);

    if (!isColumn) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // تحديث المهمة محلياً أولاً
    updateTask({ ...task, status: newStatus });

    // تحديث المهمة في الخادم
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        // استرجاع الحالة السابقة في حالة الخطأ
        updateTask(task);
        throw new Error(data.error);
      }

      updateTask(data.task);
      toast.success('تم تحديث المهمة');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* شريط البحث والفلاتر */}
      <div className="flex flex-col gap-3">
        {/* البحث وزر الفلاتر */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المهام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="h-4 w-4 ml-1" />
            الفلاتر
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              <X className="h-4 w-4 ml-1" />
              مسح
            </Button>
          )}
        </div>

        {/* لوحة الفلاتر */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {/* فلتر القسم */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">القسم:</span>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(departmentLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فلتر النوع */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">النوع:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(taskTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فلتر التبعية */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">التبعية:</span>
              <Select value={filterDependency} onValueChange={setFilterDependency}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(dependencyLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فلتر الأولوية */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">الأولوية:</span>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فلتر المسند إليه */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">المسند إليه:</span>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="unassigned">غير مسند</SelectItem>
                  {activeUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* لوحة الكانبان */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id] || []}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        {/* عنصر السحب */}
        <DragOverlay>
          {activeTask ? (
            <Card className="w-[280px] shadow-xl rotate-3">
              <CardContent className="p-3">
                <h4 className="font-medium text-sm">{activeTask.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {departmentLabels[activeTask.department]}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
