import clsx from 'clsx';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import styles from '@/components/server/console/style.module.css';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, legend, children }: ChartBlockProps) => (
    <Card className={clsx(
        "bg-black/80 border-zinc-800/50 shadow-lg p-8",
        "transition-all duration-300 ease-in-out",
        "hover:scale-[1.02] hover:shadow-xl hover:bg-black",
        "transform-gpu will-change-transform"
    )}>
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-extrabold text-zinc-100">{title}</CardTitle>
            {legend && (
                <div className="text-sm flex items-center text-zinc-400 transition-colors duration-200 hover:text-zinc-200">
                    {legend}
                </div>
            )}
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-hidden rounded-lg transition-transform duration-300">
                {children}
            </div>
        </CardContent>
    </Card>
);