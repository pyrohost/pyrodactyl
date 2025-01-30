'use client'

import React, { useState, useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { Home, UserIcon, Sun, Moon, Menu, Settings, LogOut, ChevronDown, BarChart3, LucideMonitorUp, Coins, Crown, X, HammerIcon, LucideShoppingBag, LucideHandCoins, CogIcon, LucideKeySquare, ChevronRight, ChevronLeft, LucideCircle, LucideClock } from 'lucide-react'
import ApplicationLogo from '@/components/ApplicationLogo'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Footer from '@/components/Footer'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import NotificationDropdown from '../dashboard/notifications/Notification'

interface MenuItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive?: boolean;
}

const MenuItem: React.FC<MenuItemProps & { collapsed?: boolean }> = ({ 
    icon: Icon, 
    label, 
    href, 
    isActive = false,
    collapsed = false 
}) => {
    const content = (
        <Link
            href={href}
            onClick={() => window.location.href = href}
            className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors relative",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isActive ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white" : "text-zinc-600 dark:text-zinc-400",
                collapsed ? "justify-center" : "w-full"
            )}
        >
            <Icon className="h-4 w-4" />
            {!collapsed && <span className="ml-3">{label}</span>}
        </Link>
    )

    if (collapsed) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {content}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return content
}

interface MenuSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    collapsed?: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({ 
    title, 
    children, 
    defaultOpen = true,
    collapsed = false 
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    if (collapsed) {
        return <div className="py-2">{children}</div>
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <CollapsibleTrigger className="flex items-center w-full px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <ChevronDown className={cn(
                    "h-4 w-4 mr-1 transition-transform",
                    isOpen && "-rotate-180"
                )} />
                {title}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 px-1">
                {children}
            </CollapsibleContent>
        </Collapsible>
    )
}

interface AuthenticatedLayoutProps {
    header: React.ReactNode;
    children: React.ReactNode;
    sidebartab: string;
}

export default function AuthenticatedLayout({ header, children, sidebartab }: AuthenticatedLayoutProps) {
    const { auth, vmsConfig } = usePage().props as any
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        const darkModePreference = localStorage.getItem('dark-mode') === 'true'
        const sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true'
        setIsDarkMode(darkModePreference)
        setSidebarCollapsed(sidebarCollapsed)
        if (darkModePreference) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode
        setIsDarkMode(newDarkMode)
        localStorage.setItem('dark-mode', newDarkMode.toString())
        if (newDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const toggleSidebarCollapse = () => {
        const newState = !isSidebarCollapsed
        setSidebarCollapsed(newState)
        localStorage.setItem('sidebar-collapsed', newState.toString())
    }

    return (
        <div className="flex h-screen w-screen bg-black rounded-md dark:">
            <Card className={cn(
                "fixed inset-y-0 left-0 z-50 rounded-none   flex flex-col",
                "lg:relative lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                isSidebarCollapsed ? "w-20" : "w-64"
            )}>
                <CardHeader className="p-4 border-b flex justify-between items-center">
                    <Link href="/" className="flex items-center">
                    <ApplicationLogo 
    collapsed={isSidebarCollapsed}
    className={cn(
        "fill-current text-black dark:text-white ",
        isSidebarCollapsed ? "h-8 w-8" : "h-8 w-auto"
    )} 
/>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleSidebarCollapse}
                            className="hidden lg:flex"
                        >
                            <ChevronLeft className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isSidebarCollapsed && "rotate-180"
                            )} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleSidebar} 
                            className="lg:hidden"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-grow overflow-y-auto p-2 space-y-2">
                    <MenuItem
                        icon={Home}
                        label="Home"
                        href='/dashboard'
                        isActive={sidebartab === 'home'}
                        collapsed={isSidebarCollapsed}
                    />
                    <MenuItem
                            icon={LucideMonitorUp}
                            label="Servers"
                            href="/servers"
                            isActive={sidebartab === 'servers'}
                            collapsed={isSidebarCollapsed}
                        />
                        <MenuItem
                            icon={auth.user.rank === 'premium' ? Crown : UserIcon}
                            label="Profile"
                            href="/account"
                            isActive={sidebartab === 'profile'}
                            collapsed={isSidebarCollapsed}
                        />
                        <MenuItem
                            icon={LucideClock}
                            label="Watch"
                            href="/watch"
                            isActive={sidebartab === 'watch'}
                            collapsed={isSidebarCollapsed}
                        />
                        <MenuItem
                            icon={LucideShoppingBag}
                            label="Shop"
                            href="/plans"
                            isActive={sidebartab === 'products'}
                            collapsed={isSidebarCollapsed}
                        />
                        <MenuItem
                            icon={LucideHandCoins}
                            label="Coin Shop"
                            href="/shop"
                            isActive={sidebartab === 'shop'}
                            collapsed={isSidebarCollapsed}
                        />
                        <MenuItem
                            icon={BarChart3}
                            label="Earn Coins"
                            href="/earn"
                            isActive={sidebartab === 'earn'}
                            collapsed={isSidebarCollapsed}
                        />
                        
                        {auth.user.rank === 'admin' && (
                        <MenuItem
                        icon={CogIcon}
                        label="Admin Panel"
                        href="/admin"
                        isActive={sidebartab === 'settings'}
                        collapsed={isSidebarCollapsed}
                    />
                    )}
                        

                    

                    

                    
                </CardContent>

                <CardFooter className="p-2 border-t">
                    <div className="w-full space-y-2">
                        {!isSidebarCollapsed && (
                            <div className="flex items-center justify-between px-3 py-2 text-sm">
                                <div className="flex items-center">
                                    <Coins className="h-4 w-4 mr-2"/>
                                    <span>Coins: {auth.user.coins||0}</span>
                                </div>
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                        auth.user.rank === 'premium' && "bg-amber-100 hover:bg-amber-200 dark:bg-amber-600 dark:hover:bg-amber-800",
                                        isSidebarCollapsed && "justify-center"
                                    )}
                                >
                                    {auth.user.rank === 'premium' ? (
                                        <Crown className={cn("h-4 w-4 text-amber-500", !isSidebarCollapsed && "mr-3")}/>
                                    ) : auth.user.rank === 'admin' ? (
                                        <HammerIcon className={cn("h-4 w-4 text-red-500", !isSidebarCollapsed && "mr-3")}/>
                                    ) : (
                                        <UserIcon className={cn("h-4 w-4", !isSidebarCollapsed && "mr-3")}/>
                                    )}
                                    {!isSidebarCollapsed && auth.user.username}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 bg-zinc-200 dark:bg-black"
                                align="start"
                            >
                                <DropdownMenuItem className="hover:bg-zinc-900 bg-zinc-400 dark:bg-black  dark:hover:bg-zinc-800">
                                    <Link href='/profile/edit' className="flex items-center w-full">
                                        <Settings className="mr-2 h-4 w-4"/>
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-red-900 bg-zinc-400 dark:bg-black mt-1   dark:hover:bg-rose-950">
                                    <Link
                                        href='/logout'
                                        method="get"
                                        as="button"
                                        className="flex items-center w-full"
                                    >
                                        <LogOut className="mr-2 h-4 w-4"/>
                                        Log Out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardFooter>
            </Card>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Card className="rounded-none border-b bg-white dark:bg-black">
                    <CardContent className="p-0">
                        <div className="flex h-16 items-center justify-between px-4">
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4 lg:hidden">
                                    <Menu className="h-6 w-6"/>
                                </Button>
                                {header}
                            </div>
                            <div className="flex items-center space-x-4">
                                <Switch
                                    checked={isDarkMode}
                                    onCheckedChange={toggleTheme}
                                    className="data-[state=checked]:bg-zinc-600"
                                />
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    {isDarkMode ? (
                                        <Moon className="h-4 w-4"/>
                                    ) : (
                                        <Sun className="h-4 w-4"/>
                                    )}
                                </span>
                                <NotificationDropdown/>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                


                <div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <div className="h-full overflow-y-auto p-4">
                        <div className="mx-auto ">
                            {children}
                            <Footer/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
                    onClick={toggleSidebar}
                ></div>
            )}
        </div>
    )
}





