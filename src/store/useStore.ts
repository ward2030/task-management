import { create } from 'zustand';

// أنواع البيانات
export type Role = 'ADMIN' | 'COORDINATOR' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE';
export type Department = 'ARCHITECTURAL' | 'ELECTRICAL' | 'CIVIL' | 'MECHANICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  department?: Department | null;
  avatar?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  department: Department;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  creator: User;
  assignee?: User | null;
  comments?: Comment[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  // المستخدم الحالي
  user: User | null;
  setUser: (user: User | null) => void;

  // المهام
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;

  // المستخدمين
  users: User[];
  setUsers: (users: User[]) => void;

  // الإشعارات
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // الصفحة الحالية
  currentPage: 'backlog' | 'kanban' | 'calendar' | 'reports' | 'users' | 'settings';
  setCurrentPage: (page: 'backlog' | 'kanban' | 'calendar' | 'reports' | 'users' | 'settings') => void;

  // نافذة المهمة
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // المستخدم
  user: null,
  setUser: (user) => set({ user }),

  // المهام
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id),
  })),

  // المستخدمين
  users: [],
  setUsers: (users) => set({ users }),

  // الإشعارات
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // الصفحة الحالية
  currentPage: 'kanban',
  setCurrentPage: (page) => set({ currentPage: page }),

  // نافذة المهمة
  isTaskModalOpen: false,
  setIsTaskModalOpen: (open) => set({ isTaskModalOpen: open }),
  editingTask: null,
  setEditingTask: (task) => set({ editingTask: task }),
}));

// ترجمات الأدوار
export const roleLabels: Record<Role, string> = {
  ADMIN: 'مدير',
  COORDINATOR: 'منسق',
  DEPARTMENT_MANAGER: 'مدير قسم',
  EMPLOYEE: 'موظف',
};

// ترجمات الأقسام
export const departmentLabels: Record<Department, string> = {
  ARCHITECTURAL: 'معماري',
  ELECTRICAL: 'كهرباء',
  CIVIL: 'مدني',
  MECHANICAL: 'ميكانيكا',
};

// ترجمات حالات المهام
export const statusLabels: Record<TaskStatus, string> = {
  TODO: 'قيد الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  IN_REVIEW: 'قيد المراجعة',
  DONE: 'مكتملة',
};

// ترجمات الأولويات
export const priorityLabels: Record<Priority, string> = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة',
  HIGH: 'عالية',
  URGENT: 'عاجلة',
};

// ألوان الأولويات
export const priorityColors: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

// ألوان الحالات
export const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};
