import clsx from 'clsx';
import { Card, CardContent } from "@/components/ui/card";
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, className, children }: StatBlockProps) => {
    return (
        <CopyOnClick text={copyOnClick}>
            <Card className={clsx(
                'bg-black border-zinc-800 hover:bg-zinc-900/50 transition-all duration-300 ease-in-out',
                'hover:scale-[1.02] hover:shadow-xl',
                'flex-1 w-full min-h-[120px]',
                className
            )}>
                <CardContent className="p-6 w-full h-full flex items-center">
                    <div className="flex flex-col justify-center overflow-hidden w-full">
                        <p className="leading-tight text-xs md:text-sm text-zinc-400">{title}</p>
                        <div className="text-[32px] font-extrabold leading-[98%] tracking-[-0.07rem] w-full truncate text-white">
                            {children}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </CopyOnClick>
    );
};