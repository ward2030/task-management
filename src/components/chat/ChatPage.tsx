'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore, roleLabels } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatPage() {
  const { users, messages, setMessages, addMessage, user: currentUser, unreadMessages, setUnreadMessages } = useStore();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // تصفية المستخدمين (استبعاد المستخدم الحالي)
  const otherUsers = users.filter(u => u.id !== currentUser?.id && u.isActive !== false);

  // تصفية حسب البحث
  const filteredUsers = otherUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // جلب الرسائل
  useEffect(() => {
    fetchMessages();
  }, []);

  // تحديث الرسائل عند اختيار مستخدم
  useEffect(() => {
    if (selectedUser) {
      markAsRead(selectedUser);
    }
  }, [selectedUser]);

  // التمرير لآخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data.messages || []);
      setUnreadMessages(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markAsRead = async (senderId: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser,
          content: newMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.message) {
        addMessage(data.message);
        setNewMessage('');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال الرسالة');
    } finally {
      setIsLoading(false);
    }
  };

  // الحصول على رسائل المحادثة الحالية
  const currentConversation = selectedUser
    ? messages.filter(
        m => (m.sender.id === selectedUser && m.receiverId === currentUser?.id) ||
             (m.sender.id === currentUser?.id && m.receiverId === selectedUser)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // الحصول على آخر رسالة لكل مستخدم
  const getLastMessage = (userId: string) => {
    const userMessages = messages.filter(
      m => (m.sender.id === userId && m.receiverId === currentUser?.id) ||
           (m.sender.id === currentUser?.id && m.receiverId === userId)
    );
    return userMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  // عدد الرسائل غير المقروءة من مستخدم معين
  const getUnreadCount = (userId: string) => {
    return messages.filter(m => m.sender.id === userId && !m.isRead && m.receiverId === currentUser?.id).length;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(date);
    }
    return messageDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-180px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">المحادثات</h2>
          <p className="text-muted-foreground text-sm">
            {unreadMessages > 0 ? `${unreadMessages} رسالة جديدة` : 'تواصل مع أعضاء الفريق'}
          </p>
        </div>
      </div>

      <Card className="h-[calc(100%-60px)]">
        <CardContent className="p-0 h-full flex">
          {/* قائمة المستخدمين */}
          <div className="w-80 border-l flex flex-col">
            {/* البحث */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            {/* قائمة المستخدمين */}
            <ScrollArea className="flex-1">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">لا يوجد مستخدمين</div>
              ) : (
                filteredUsers.map((u) => {
                  const lastMsg = getLastMessage(u.id);
                  const unread = getUnreadCount(u.id);

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u.id)}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedUser === u.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {unread > 0 && (
                          <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{u.name}</span>
                          {lastMsg && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground truncate">
                            {lastMsg?.content.substring(0, 20)}...
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {roleLabels[u.role]}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </div>

          {/* منطقة المحادثة */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* رأس المحادثة */}
                <div className="p-3 border-b flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {users.find(u => u.id === selectedUser)?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{users.find(u => u.id === selectedUser)?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[users.find(u => u.id === selectedUser)?.role || 'EMPLOYEE']}
                    </p>
                  </div>
                </div>

                {/* الرسائل */}
                <ScrollArea className="flex-1 p-4">
                  {currentConversation.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      ابدأ المحادثة الآن
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentConversation.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender.id === currentUser?.id ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender.id === currentUser?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender.id === currentUser?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* إرسال رسالة */}
                <div className="p-3 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="اكتب رسالتك..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                اختر محادثة للبدء
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
