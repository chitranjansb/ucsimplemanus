import { useAuth } from "@/_core/hooks/useAuth";
import { getAdminRouteState } from "@/lib/adminAccess";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

export type AdminNavigationItem = { icon: LucideIcon; label: string; path: string };

type DashboardLayoutProps = {
  children: React.ReactNode;
  title: string;
  items: AdminNavigationItem[];
};

export default function DashboardLayout({ children, title, items }: DashboardLayoutProps) {
  const { loading, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const access = getAdminRouteState(user, loading);

  if (access === "loading") return <DashboardLayoutSkeleton />;

  if (access === "unauthenticated") {
    return (
      <main className="min-h-screen bg-[#f4f0e8] px-6 py-10 text-[#24221d] grid place-items-center">
        <section className="max-w-md border border-[#24221d]/15 bg-white p-8 shadow-[8px_8px_0_#24221d]">
          <ShieldCheck className="mb-5 h-8 w-8 text-[#a85635]" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a85635]">Restricted workspace</p>
          <h1 className="mt-3 font-serif text-4xl leading-none">Admin access required.</h1>
          <p className="mt-4 text-sm leading-6 text-[#5d594f]">Sign in with an approved Umaid Craftorium administrator account to manage catalogue, media, and enquiries.</p>
          <Button className="mt-7 w-full bg-[#24221d] text-white hover:bg-[#3a3730]" onClick={() => startLogin("/admin")}>Sign in securely</Button>
          <button type="button" onClick={() => setLocation("/")} className="mt-4 flex items-center gap-2 text-sm underline underline-offset-4"> <ArrowLeft size={15} /> Return to website </button>
        </section>
      </main>
    );
  }

  if (access === "forbidden") {
    return (
      <main className="min-h-screen bg-[#f4f0e8] px-6 py-10 text-[#24221d] grid place-items-center">
        <section className="max-w-md border border-[#24221d]/15 bg-white p-8 shadow-[8px_8px_0_#24221d]">
          <ShieldCheck className="mb-5 h-8 w-8 text-[#a85635]" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a85635]">Access denied</p>
          <h1 className="mt-3 font-serif text-4xl leading-none">This account is not an administrator.</h1>
          <p className="mt-4 text-sm leading-6 text-[#5d594f]">Your account is signed in, but it has no permission to view or manage the CMS. Contact the site owner if access should be granted.</p>
          <Button variant="outline" className="mt-7 w-full" onClick={() => setLocation("/")}>Return to website</Button>
        </section>
      </main>
    );
  }

  return <DashboardLayoutContent title={title} items={items} user={user!} logout={logout}>{children}</DashboardLayoutContent>;
}

function DashboardLayoutContent({ children, title, items, user, logout }: DashboardLayoutProps & { user: NonNullable<ReturnType<typeof useAuth>["user"]>; logout: () => Promise<void> }) {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const active = items.find((item) => location === item.path || (item.path !== "/admin" && location.startsWith(`${item.path}/`)));

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-[#ede5d7] bg-[#24221d] text-[#f4f0e8]">
        <SidebarHeader className="border-b border-white/10 px-3 py-4">
          <button type="button" onClick={() => setLocation("/admin")} className="flex items-center gap-3 text-left group-data-[collapsible=icon]:justify-center">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f4f0e8] font-mono text-[10px] font-bold text-[#24221d]">UC</span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden"><strong className="block text-sm font-medium">Umaid Craftorium</strong><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d9cfbd]">Admin CMS</span></span>
          </button>
        </SidebarHeader>
        <SidebarContent className="pt-4">
          <SidebarMenu className="gap-1 px-2">
            {items.map((item) => {
              const selected = active?.path === item.path;
              return <SidebarMenuItem key={item.path}>
                <SidebarMenuButton isActive={selected} tooltip={item.label} onClick={() => setLocation(item.path)} className="h-10 text-[#ded5c4] hover:bg-white/10 hover:text-white data-[active=true]:bg-[#a85635] data-[active=true]:text-white">
                  <item.icon className="h-4 w-4" /><span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>;
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/10 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md px-1 py-1 text-left hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f0e8] group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 border border-white/20"><AvatarFallback className="bg-[#39352e] text-xs text-white">{user.name?.charAt(0).toUpperCase() || "A"}</AvatarFallback></Avatar>
                <span className="min-w-0 group-data-[collapsible=icon]:hidden"><strong className="block truncate text-xs">{user.name || "Administrator"}</strong><span className="block truncate text-[11px] text-[#d9cfbd]">{user.email || "Approved account"}</span></span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => void logout()} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-[#f7f4ed]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#24221d]/10 bg-[#f7f4ed]/95 px-4 backdrop-blur">
          {isMobile ? <SidebarTrigger aria-label="Open admin navigation" /> : null}
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a85635]">Secure workspace</p><h1 className="font-serif text-xl leading-none text-[#24221d]">{active?.label || title}</h1></div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
