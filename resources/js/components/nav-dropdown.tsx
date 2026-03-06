'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';

export function NavDropdown({
    mainTitle,
    items,
}: {
    mainTitle?: string;
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
}) {
    const page = usePage();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{mainTitle}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={
                            page.url === item.url || page.url.startsWith(item.url) || item.items?.some((subItem) => page.url.startsWith(subItem.url))
                        }
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                {item.items && item.items.length > 0 ? (
                                    <SidebarMenuButton tooltip={item.title} isActive={page.url.startsWith(item.url)}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                ) : (
                                    <Link href={item.url} prefetch>
                                        <SidebarMenuButton tooltip={item.title} isActive={page.url.startsWith(item.url)} className="cursor-pointer">
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </Link>
                                )}
                            </CollapsibleTrigger>
                            {item.items && item.items.length > 0 && (
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild isActive={page.url.startsWith(subItem.url)}>
                                                    <Link href={subItem.url} prefetch>
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            )}
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
