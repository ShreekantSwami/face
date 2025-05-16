'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Logo } from '@/components/shared/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  UsersRound,
  ClipboardList,
  Users,
  ScanFace,
  LogOut,
  Settings,
  School,
  UserCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { isChecking } = useAuthRedirect(); // Handles redirect if not authenticated
  const pathname = usePathname();

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const commonMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const adminMenuItems = [
    ...commonMenuItems,
    { href: '/admin/teachers', label: 'Manage Teachers', icon: UsersRound },
    { href: '/admin/reports', label: 'Attendance Reports', icon: ClipboardList },
  ];

  const teacherMenuItems = [
    ...commonMenuItems,
    { href: '/teacher/students', label: 'Manage Students', icon: Users },
    { href: '/teacher/attendance', label: 'Take Attendance', icon: ScanFace },
    { href: '/teacher/reports', label: 'My Reports', icon: ClipboardList },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : teacherMenuItems;

  if (isChecking || !user) {
    // You can show a global loading spinner here if isChecking is true
    // If !user after checking, useAuthRedirect will handle the redirect
    return (
      <div className="flex h-screen items-center justify-center">
        <LayoutDashboard className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="p-4">
          <Logo className="group-data-[collapsible=icon]:hidden" />
           <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center hidden">
             <School className="text-primary" />
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, className: "capitalize" }}
                    className="justify-start"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
           <Link href="/profile" passHref legacyBehavior className="w-full group-data-[collapsible=icon]:hidden">
            <Button variant="ghost" className="w-full justify-start gap-2">
                <UserCircle /> Profile
            </Button>
           </Link>
            <Link href="/profile" passHref legacyBehavior className="w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center hidden">
            <Button variant="ghost" size="icon">
                <UserCircle />
            </Button>
           </Link>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" /> {/* Only show trigger on mobile */}
            <h1 className="text-xl font-semibold">{APP_NAME}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                 <Link href="/profile"><Settings className="mr-2 h-4 w-4" /> Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
