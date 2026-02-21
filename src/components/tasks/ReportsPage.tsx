'use client';

import { useStore, statusLabels, priorityLabels, departmentLabels, roleLabels } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle, BarChart3 } from 'lucide-react';

const COLORS = ['#6b7280', '#3b82f6', '#eab308', '#22c55e'];
const PRIORITY_COLORS = ['#9ca3af', '#3b82f6', '#f97316', '#ef4444'];
const DEPARTMENT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function ReportsPage() {
  const { tasks, users } = useStore();

  // إحصائيات المهام حسب الحالة
  const tasksByStatus = [
    { name: statusLabels.TODO, value: tasks.filter((t) => t.status === 'TODO').length, fill: COLORS[0] },
    { name: statusLabels.IN_PROGRESS, value: tasks.filter((t) => t.status === 'IN_PROGRESS').length, fill: COLORS[1] },
    { name: statusLabels.IN_REVIEW, value: tasks.filter((t) => t.status === 'IN_REVIEW').length, fill: COLORS[2] },
    { name: statusLabels.DONE, value: tasks.filter((t) => t.status === 'DONE').length, fill: COLORS[3] },
  ];

  // إحصائيات المهام حسب القسم
  const tasksByDepartment = [
    { name: departmentLabels.ARCHITECTURAL, value: tasks.filter((t) => t.department === 'ARCHITECTURAL').length },
    { name: departmentLabels.ELECTRICAL, value: tasks.filter((t) => t.department === 'ELECTRICAL').length },
    { name: departmentLabels.CIVIL, value: tasks.filter((t) => t.department === 'CIVIL').value },
    { name: departmentLabels.MECHANICAL, value: tasks.filter((t) => t.department === 'MECHANICAL').length },
  ];

  // إحصائيات المهام حسب الأولوية
  const tasksByPriority = [
    { name: priorityLabels.LOW, value: tasks.filter((t) => t.priority === 'LOW').length },
    { name: priorityLabels.MEDIUM, value: tasks.filter((t) => t.priority === 'MEDIUM').length },
    { name: priorityLabels.HIGH, value: tasks.filter((t) => t.priority === 'HIGH').length },
    { name: priorityLabels.URGENT, value: tasks.filter((t) => t.priority === 'URGENT').length },
  ];

  // أداء الموظفين
  const employeePerformance = users.map((user) => {
    const userTasks = tasks.filter((t) => t.assigneeId === user.id);
    const completedTasks = userTasks.filter((t) => t.status === 'DONE').length;
    const totalTasks = userTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...user,
      totalTasks,
      completedTasks,
      inProgressTasks: userTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completionRate,
    };
  });

  // المهام المنجزة خلال الأسبوع الماضي
  const lastWeekCompleted = tasks.filter((t) => {
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return completedDate >= weekAgo;
  }).length;

  // المهام المتأخرة
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'DONE') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  // حساب معدل الإنجاز
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المهام</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المهام المكتملة</p>
                <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={completionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                <p className="text-3xl font-bold text-blue-600">
                  {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مهام متأخرة</p>
                <p className="text-3xl font-bold text-red-600">{overdueTasks}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* توزيع المهام حسب الحالة */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع المهام حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* المهام حسب القسم */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المهام حسب القسم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByDepartment} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* المهام حسب الأولوية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المهام حسب الأولوية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* أداء الموظفين */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أداء الموظفين</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {employeePerformance.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <Avatar>
                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{employee.name}</p>
                        <span className="text-sm text-muted-foreground">
                          {employee.completedTasks}/{employee.totalTasks} مهمة
                        </span>
                      </div>
                      <Progress value={employee.completionRate} className="h-2" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{roleLabels[employee.role]}</span>
                        <span>{employee.completionRate}% مكتمل</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
