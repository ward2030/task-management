'use client';

import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ListTodo,
  KanbanSquare,
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'backlog' as const, label: 'الباكلوج', icon: ListTodo, roles: ['ADMIN', 'COORDINATOR', 'EMPLOYEE'] },
  { id: 'kanban' as const, label: 'الكانبان', icon: KanbanSquare, roles: ['ADMIN', 'COORDINATOR', 'EMPLOYEE'] },
  { id: 'calendar' as const, label: 'التقويم', icon: CalendarIcon, roles: ['ADMIN', 'COORDINATOR', 'EMPLOYEE'] },
  { id: 'reports' as const, label: 'التقارير', icon: BarChart3, roles: ['ADMIN', 'COORDINATOR'] },
  { id: 'users' as const, label: 'المستخدمين', icon: Users, roles: ['ADMIN', 'COORDINATOR'] },
  { id: 'settings' as const, label: 'الإعدادات', icon: Settings, roles: ['ADMIN', 'COORDINATOR', 'EMPLOYEE'] },
];

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const { currentPage, setCurrentPage, user } = useStore();

  // تصفية العناصر حسب دور المستخدم
  const filteredMenuItems = menuItems.filter((item) => {
    return user?.role && item.roles.includes(user.role);
  });

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'bg-card border-l flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* الشعار */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">إدارة المهام</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapse(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* القائمة */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {filteredMenuItems.map((item) => {
              const isActive = currentPage === item.id;
              const Icon = item.icon;

              if (collapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setCurrentPage(item.id)}
                        className={cn(
                          'w-full h-10',
                          isActive && 'bg-primary/10 text-primary'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'w-full justify-start gap-3 h-10',
                    isActive && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* معلومات المستخدم */}
        {!collapsed && user && (
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'ADMIN' ? 'مدير' : user.role === 'COORDINATOR' ? 'منسق' : 'موظف'}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
