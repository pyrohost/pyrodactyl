import React, { ImgHTMLAttributes } from 'react';
import { usePage } from '@inertiajs/react';
import { cn } from "@/lib/utils";

interface ApplicationLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    collapsed?: boolean;
}

interface PageProps {
    AppConfig: {
        appLogo: string;
        appName: string;
    };
}

export default function ApplicationLogo({ collapsed = false, className, ...props }: ApplicationLogoProps) {
    const {
        props: {
            AppConfig: { appLogo, appName },
        },
    } = usePage<{ props: PageProps }>();

    return (
        <div className="flex items-center">
            <img
                {...props}
                src={appLogo}
                alt={appName}
                className={cn(
                    "transition-all",
                    collapsed ? "h-8 w-8 rounded-full bg-white" : "h-9 w-auto",
                    className
                )}
            />
            {!collapsed && (
                <span className="ml-2 text-gray-800 dark:text-gray-200">{appName}</span>
            )}
        </div>
    );
}