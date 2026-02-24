'use client';

import { useState } from 'react';
import { useStore, roleLabels, departmentLabels, type Role, type Department } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormData {
  username: string;
  password: string;
  name: string;
  role: Role;
  department: Department | '';
}

export default function UsersPage() {
  const { users, setUsers, user: currentUser } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    role: 'EMPLOYEE',
    department: '',
  });

  // هل المستخدم الحالي مدير؟
  const isAdmin = currentUser?.role === 'ADMIN';
  // هل المستخدم الحالي مدير أو منسق أو مدير قسم؟
  const canManageUsers = currentUser?.role === 'ADMIN' || 
                         currentUser?.role === 'COORDINATOR' || 
                         currentUser?.role === 'DEPARTMENT_MANAGER';

  // فتح نافذة الإضافة
  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'EMPLOYEE',
      department: '',
    });
    setIsDialogOpen(true);
  };

  // فتح نافذة التعديل
  const handleEdit = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setEditingUser(userId);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      department: user.department || '',
    });
    setIsDialogOpen(true);
  };

  // حفظ المستخدم
  const handleSave = async () => {
    if (!formData.username || !formData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('كلمة المرور مطلوبة للمستخدم الجديد');
      return;
    }

    setIsLoading(true);

    try {
      if (editingUser) {
        // تحديث مستخدم
        const res = await fetch(`/api/users/${editingUser}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role,
            department: formData.department || null,
            password: formData.password || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setUsers(users.map((u) => (u.id === editingUser ? data.user : u)));
        toast.success('تم تحديث المستخدم بنجاح');
      } else {
        // إنشاء مستخدم جديد
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setUsers([data.user, ...users]);
        toast.success('تم إنشاء المستخدم بنجاح');
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  // حذف مستخدم
  const handleDelete = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUsers(users.filter((u) => u.id !== userId));
      toast.success('تم حذف المستخدم بنجاح');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    }
  };

  // تفعيل/تعطيل مستخدم
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUsers(users.map((u) => (u.id === userId ? { ...u, isActive } : u)));
      toast.success(isActive ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم');
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

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
            <p className="text-muted-foreground text-sm">إدارة حسابات الموظفين والصلاحيات</p>
          </div>
        </div>
        {/* زر إضافة مستخدم - للمدير فقط */}
        {isAdmin && (
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستخدم
          </Button>
        )}
      </div>

      {/* معلومات الصلاحيات */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>
              {isAdmin ? 'بصفتك مدير: يمكنك إضافة وتعديل وحذف المستخدمين' : 
               currentUser?.role === 'DEPARTMENT_MANAGER' ? 'بصفتك مدير قسم: يمكنك تعديل بيانات المستخدمين' :
               'بصفتك منسق: يمكنك تعديل بيانات المستخدمين'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* جدول المستخدمين */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>اسم الدخول</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {user.username}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.department ? departmentLabels[user.department] : '-'}
                    </TableCell>
                    <TableCell>
                      {user.isActive !== false ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="h-3 w-3 ml-1" />
                          معطل
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.createdAt ? formatDate(user.createdAt) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* تعديل - للمدير والمنسق ومدير القسم */}
                        {canManageUsers && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user.id)}
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* تفعيل/تعطيل - للمدير فقط */}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleUserStatus(user.id, user.isActive === false)}
                            title={user.isActive === false ? 'تفعيل' : 'تعطيل'}
                          >
                            {user.isActive === false ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        )}
                        
                        {/* حذف - للمدير فقط */}
                        {isAdmin && user.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="text-destructive hover:text-destructive"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* نافذة إضافة/تعديل مستخدم - للمدير فقط */}
      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم المستخدم"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">اسم الدخول *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="أدخل اسم الدخول"
                  disabled={!!editingUser}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  كلمة المرور {editingUser ? '(اتركها فارغة للإبقاء على القديمة)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="أدخل كلمة المرور"
                />
              </div>

              <div className="space-y-2">
                <Label>الدور</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>القسم</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as Department })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
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

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                  {isLoading ? 'جاري الحفظ...' : editingUser ? 'تحديث' : 'إنشاء'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
