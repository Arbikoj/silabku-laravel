import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { DropdownItem, type NavItem } from '@/types';
import { usePage, Link } from '@inertiajs/react';
import {
    Bolt,
    BookOpen,
    Database,
    Folder,
    LayoutGrid,
    GraduationCap,
    ClipboardList,
} from 'lucide-react';
import AppLogo from './app-logo';
import { NavDropdown } from './nav-dropdown';

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role: string } | null } }>().props;
    const role = auth?.user?.role ?? 'user';

    // ── Menu: semua user ───────────────────────────────────────
    const baseMenuItems: DropdownItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
            isActive: true,
        },
    ];

    // ── Menu: mahasiswa (role = user) ─────────────────────────
    const oprecItems: DropdownItem[] = [
        {
            title: 'Open Recruitment',
            url: '#',
            icon: GraduationCap,
            isActive: true,
            items: [
                { title: 'Profil Asisten', url: '/profil' },
                { title: 'Event Terbuka', url: '/oprec/events' },
                { title: 'Pendaftaran Saya', url: '/oprec/my-applications' },
            ],
        },
    ];

    // ── Menu: admin ───────────────────────────────────────────
    const adminItems: DropdownItem[] = [
        {
            title: 'Kelola Oprec',
            url: '#',
            icon: Bolt,
            isActive: true,
            items: [
                { title: 'Semester', url: '/admin/semesters' },
                { title: 'Mata Kuliah', url: '/admin/mata-kuliah' },
                { title: 'Daftar Kelas', url: '/admin/kelas-list' },
                { title: 'Event / Periode', url: '/admin/events' },
            ],
        },
    ];

    // ── Menu: admin + dosen ───────────────────────────────────
    const seleksiItems: DropdownItem[] = [
        {
            title: 'Seleksi Asisten',
            url: '/seleksi',
            icon: ClipboardList,
            isActive: true,
        },
    ];

    // ── Menu: database asisten ─────────────────────────────────
    const databaseItems: DropdownItem[] = [
        {
            title: 'Database Asisten',
            url: '#',
            icon: Database,
            isActive: true,
            items: [
                { title: 'Semua Asisten', url: '/database-asisten' },
                { title: 'Per Event', url: '/database-asisten/per-event' },
            ],
        },
    ];

    // ── Build full nav ─────────────────────────────────────────
    const dropdownNav: DropdownItem[] = [
        ...baseMenuItems,
        ...(role === 'user' ? oprecItems : []),
        ...(role === 'admin' ? adminItems : []),
        ...((role === 'admin' || role === 'dosen') ? seleksiItems : []),
        ...databaseItems,
    ];

    const footerNavItems: NavItem[] = [
        { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: Folder },
        { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavDropdown items={dropdownNav} mainTitle={role === 'admin' ? 'Admin' : role === 'dosen' ? 'Dosen' : 'Mahasiswa'} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
