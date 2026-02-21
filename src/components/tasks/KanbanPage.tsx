'use client';

import { useState } from 'react';
import { useStore, statusLabels, priorityLabels, departmentLabels, priorityColors, type Task, type TaskStatus } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { GripVertical, MessageSquare } from 'lucide-react';
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
  const { tasks, updateTask, setEditingTask, setIsTaskModalOpen } = useStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // تجميع المهام حسب الحالة
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // بدء السحب
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
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
        body: JSON.stringify({ ...task, status: newStatus }),
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
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
  );
}
