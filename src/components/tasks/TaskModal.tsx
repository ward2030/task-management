'use client';

import { useState, useEffect } from 'react';
import { useStore, departmentLabels, priorityLabels, statusLabels, type Task, type Priority, type TaskStatus, type Department, type Comment } from '@/store/useStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

export default function TaskModal({ open, onOpenChange, task }: TaskModalProps) {
  const { user, users, addTask, updateTask } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as Priority,
    department: 'ARCHITECTURAL' as Department,
    dueDate: '',
    assigneeId: '',
  });

  // تحديث النموذج عند تغيير المهمة
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        department: task.department,
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        assigneeId: task.assigneeId || '',
      });
      setComments(task.comments || []);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        department: 'ARCHITECTURAL',
        dueDate: '',
        assigneeId: '',
      });
      setComments([]);
      setShowComments(false);
    }
  }, [task]);

  // جلب التعليقات عند فتح قسم التعليقات
  useEffect(() => {
    if (showComments && task) {
      fetchComments();
    }
  }, [showComments, task]);

  // جلب التعليقات من الخادم
  const fetchComments = async () => {
    if (!task) return;
    
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      const data = await res.json();
      if (res.ok && data.task.comments) {
        setComments(data.task.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (task) {
        // تحديث مهمة
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            assigneeId: formData.assigneeId || null,
            dueDate: formData.dueDate || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        updateTask(data.task);
        toast.success('تم تحديث المهمة بنجاح');
      } else {
        // إنشاء مهمة جديدة
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            assigneeId: formData.assigneeId || null,
            dueDate: formData.dueDate || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        addTask(data.task);
        toast.success('تم إنشاء المهمة بنجاح');
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة تعليق
  const handleAddComment = async () => {
    if (!newComment.trim() || !task || isSavingComment) return;

    setIsSavingComment(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          content: newComment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // إضافة التعليق للقائمة
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      toast.success('تم إضافة التعليق');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ التعليق');
    } finally {
      setIsSavingComment(false);
    }
  };

  // تنسيق التاريخ للعرض
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] p-0 overflow-hidden ${showComments ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{task ? 'تفاصيل المهمة' : 'مهمة جديدة'}</DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(90vh-100px)]" dir="rtl">
          {/* قسم التعليقات - يظهر على اليسار في RTL */}
          {task && showComments && (
            <div className="w-[400px] border-l flex flex-col bg-muted/30 flex-shrink-0">
              <div className="p-4 border-b bg-background flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  التعليقات ({comments.length})
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComments(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">لا توجد تعليقات</p>
                    <p className="text-sm mt-1">كن أول من يعلق!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-background p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {comment.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-right">
                            <p className="text-sm font-semibold">{comment.user.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-right">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t bg-background">
                <div className="space-y-3">
                  <Textarea
                    placeholder="اكتب تعليقك هنا..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSavingComment}
                    className="min-h-[100px] resize-none text-right"
                    rows={4}
                  />
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || isSavingComment}
                    className="w-full"
                  >
                    {isSavingComment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-2" />
                        إرسال التعليق
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* نموذج المهمة - على اليمين في RTL */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-auto min-w-0">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان المهمة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="أدخل عنوان المهمة"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أدخل وصف المهمة"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>القسم *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as Department })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(departmentLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>المسند إليه</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر موظف" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {u.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {task && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p><strong>أنشأها:</strong> {task.creator.name}</p>
                <p><strong>تاريخ الإنشاء:</strong> {formatDate(task.createdAt)}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : task ? 'تحديث' : 'إنشاء'}
              </Button>
              {task && (
                <Button
                  type="button"
                  variant={showComments ? 'default' : 'outline'}
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="h-4 w-4 ml-2" />
                  التعليقات ({comments.length})
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
