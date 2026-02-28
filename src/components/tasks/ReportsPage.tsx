'use client';

import { useState, useMemo } from 'react';
import { useStore, statusLabels, priorityLabels, departmentLabels, roleLabels } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { 
  TrendingUp, Users, CheckCircle, Clock, AlertCircle, BarChart3, 
  Download, Calendar, Filter, Star, Archive, FileText, Target,
  TrendingDown, Minus, Activity
} from 'lucide-react';

const COLORS = ['#6b7280', '#3b82f6', '#eab308', '#22c55e'];
const PRIORITY_COLORS = ['#9ca3af', '#3b82f6', '#f97316', '#ef4444'];
const DEPARTMENT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function ReportsPage() {
  const { tasks, users, activities } = useStore();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // تصفية المهام حسب الفلاتر
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const deptMatch = selectedDepartment === 'all' || task.department === selectedDepartment;
      const userMatch = selectedUser === 'all' || 
        task.assigneeId === selectedUser || 
        task.creator.id === selectedUser;
      return deptMatch && userMatch;
    });
  }, [tasks, selectedDepartment, selectedUser]);

  // إحصائيات المهام حسب الحالة
  const tasksByStatus = [
    { name: statusLabels.TODO, value: filteredTasks.filter((t) => t.status === 'TODO').length, fill: COLORS[0] },
    { name: statusLabels.IN_PROGRESS, value: filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length, fill: COLORS[1] },
    { name: statusLabels.IN_REVIEW, value: filteredTasks.filter((t) => t.status === 'IN_REVIEW').length, fill: COLORS[2] },
    { name: statusLabels.DONE, value: filteredTasks.filter((t) => t.status === 'DONE').length, fill: COLORS[3] },
  ];

  // إحصائيات المهام حسب القسم
  const tasksByDepartment = [
    { name: departmentLabels.ARCHITECTURAL, value: filteredTasks.filter((t) => t.department === 'ARCHITECTURAL').length, fill: DEPARTMENT_COLORS[0] },
    { name: departmentLabels.ELECTRICAL, value: filteredTasks.filter((t) => t.department === 'ELECTRICAL').length, fill: DEPARTMENT_COLORS[1] },
    { name: departmentLabels.CIVIL, value: filteredTasks.filter((t) => t.department === 'CIVIL').length, fill: DEPARTMENT_COLORS[2] },
    { name: departmentLabels.MECHANICAL, value: filteredTasks.filter((t) => t.department === 'MECHANICAL').length, fill: DEPARTMENT_COLORS[3] },
  ];

  // إحصائيات المهام حسب الأولوية
  const tasksByPriority = [
    { name: priorityLabels.LOW, value: filteredTasks.filter((t) => t.priority === 'LOW').length, fill: PRIORITY_COLORS[0] },
    { name: priorityLabels.MEDIUM, value: filteredTasks.filter((t) => t.priority === 'MEDIUM').length, fill: PRIORITY_COLORS[1] },
    { name: priorityLabels.HIGH, value: filteredTasks.filter((t) => t.priority === 'HIGH').length, fill: PRIORITY_COLORS[2] },
    { name: priorityLabels.URGENT, value: filteredTasks.filter((t) => t.priority === 'URGENT').length, fill: PRIORITY_COLORS[3] },
  ];

  // أداء الموظفين
  const employeePerformance = users
    .filter(u => selectedUser === 'all' || u.id === selectedUser)
    .map((user) => {
      const userTasks = tasks.filter((t) => t.assigneeId === user.id);
      const completedTasks = userTasks.filter((t) => t.status === 'DONE').length;
      const totalTasks = userTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // حساب متوسط التقييم
      const ratedTasks = userTasks.filter(t => t.ratings && t.ratings.length > 0);
      const avgRating = ratedTasks.length > 0 
        ? ratedTasks.reduce((sum, t) => {
            const taskAvg = t.ratings!.reduce((s, r) => s + r.rating, 0) / t.ratings!.length;
            return sum + taskAvg;
          }, 0) / ratedTasks.length
        : 0;

      return {
        ...user,
        totalTasks,
        completedTasks,
        inProgressTasks: userTasks.filter((t) => t.status === 'IN_PROGRESS').length,
        todoTasks: userTasks.filter((t) => t.status === 'TODO').length,
        completionRate,
        avgRating: avgRating.toFixed(1),
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate);

  // المهام المنجزة خلال الفترة المحددة
  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now;
  };

  const periodCompleted = filteredTasks.filter((t) => {
    if (!t.completedAt) return false;
    return new Date(t.completedAt) >= getDateRangeStart();
  }).length;

  const periodCreated = filteredTasks.filter((t) => {
    return new Date(t.createdAt) >= getDateRangeStart();
  }).length;

  // المهام المتأخرة
  const overdueTasks = filteredTasks.filter((t) => {
    if (!t.dueDate || t.status === 'DONE') return false;
    return new Date(t.dueDate) < new Date();
  });

  // حساب معدل الإنجاز
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // المهام المؤرشفة
  const archivedTasks = tasks.filter(t => t.isArchived).length;

  // بيانات الاتجاه الأسبوعي
  const getWeeklyTrend = () => {
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const created = tasks.filter(t => {
        const date = new Date(t.createdAt);
        return date >= weekStart && date < weekEnd;
      }).length;
      
      const completed = tasks.filter(t => {
        if (!t.completedAt) return false;
        const date = new Date(t.completedAt);
        return date >= weekStart && date < weekEnd;
      }).length;
      
      weeks.push({
        name: `أسبوع ${7 - i}`,
        created,
        completed,
      });
    }
    return weeks;
  };

  // توزيع المهام على مدار الأسبوع
  const getDailyDistribution = () => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days.map((day, index) => ({
      name: day,
      tasks: tasks.filter(t => new Date(t.createdAt).getDay() === index).length,
    }));
  };

  // تصدير التقرير
  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTasks,
        completedTasks,
        completionRate,
        overdueTasks: overdueTasks.length,
        archivedTasks,
      },
      byStatus: tasksByStatus,
      byDepartment: tasksByDepartment,
      byPriority: tasksByPriority,
      employeePerformance: employeePerformance.map(e => ({
        name: e.name,
        role: e.role,
        totalTasks: e.totalTasks,
        completedTasks: e.completedTasks,
        completionRate: e.completionRate,
      })),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة مع الفلاتر */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">التقارير المتقدمة</h2>
            <p className="text-muted-foreground text-sm">تحليل شامل لأداء المهام والفريق</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">أسبوع</SelectItem>
              <SelectItem value="month">شهر</SelectItem>
              <SelectItem value="quarter">ربع سنة</SelectItem>
              <SelectItem value="year">سنة</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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
          
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="المستخدم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستخدمين</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المهام</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{periodCreated} جديدة هذه الفترة
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المهام المكتملة</p>
                <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={completionRate} className="h-2 flex-1" />
                  <span className="text-xs font-medium">{completionRate}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                <p className="text-3xl font-bold text-blue-600">
                  {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredTasks.filter((t) => t.status === 'IN_REVIEW').length} قيد المراجعة
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مهام متأخرة</p>
                <p className="text-3xl font-bold text-red-600">{overdueTasks.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {archivedTasks} مؤرشفة
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          <TabsTrigger value="performance">أداء الفريق</TabsTrigger>
          <TabsTrigger value="departments">الأقسام</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* توزيع المهام حسب الحالة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  توزيع المهام حسب الحالة
                </CardTitle>
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* المهام حسب الأولوية */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  المهام حسب الأولوية
                </CardTitle>
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
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المهام المتأخرة */}
          {overdueTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  المهام المتأخرة ({overdueTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 10).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{task.assignee?.name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.assignee?.name || 'غير مسند'} • {departmentLabels[task.department]}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-red-600">
                            متأخرة {Math.ceil((new Date().getTime() - new Date(task.dueDate!).getTime()) / 86400000)} يوم
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* الاتجاهات */}
        <TabsContent value="trends" className="space-y-6">
          {/* اتجاه المهام الأسبوعي */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                اتجاه المهام (آخر 7 أسابيع)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getWeeklyTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="created" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" name="المهام المنشأة" />
                    <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} name="المهام المكتملة" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* توزيع المهام على أيام الأسبوع */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                توزيع المهام على أيام الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="المهام" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* أداء الفريق */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                أداء أعضاء الفريق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {employeePerformance.map((employee, index) => (
                    <div 
                      key={employee.id} 
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' : 'bg-muted/30'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={index === 0 ? 'bg-yellow-500 text-white' : ''}>
                            {employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">1</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{roleLabels[employee.role]}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-bold text-lg">{employee.totalTasks}</p>
                              <p className="text-xs text-muted-foreground">إجمالي</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-lg text-green-600">{employee.completedTasks}</p>
                              <p className="text-xs text-muted-foreground">مكتملة</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-lg text-blue-600">{employee.completionRate}%</p>
                              <p className="text-xs text-muted-foreground">الإنجاز</p>
                            </div>
                            {parseFloat(employee.avgRating) > 0 && (
                              <div className="text-center">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="font-bold">{employee.avgRating}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">التقييم</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Progress value={employee.completionRate} className="h-2" />
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            قيد الانتظار: {employee.todoTasks}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            قيد التنفيذ: {employee.inProgressTasks}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الأقسام */}
        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* المهام حسب القسم */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  المهام حسب القسم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksByDepartment} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {tasksByDepartment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* تفاصيل الأقسام */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تفاصيل الأقسام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(departmentLabels).map(([key, label]) => {
                    const deptTasks = tasks.filter(t => t.department === key);
                    const completed = deptTasks.filter(t => t.status === 'DONE').length;
                    const total = deptTasks.length;
                    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{label}</span>
                          <span className="text-sm text-muted-foreground">
                            {completed}/{total} مهمة ({rate}%)
                          </span>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
