import { cn } from '@/lib/utils';

interface CodeProps {
    dark?: boolean | undefined;
    className?: string;
    children: React.ReactNode;
}

const Code = ({ dark, className, children }: CodeProps) => (
    <code
        className={cn('font-mono text-sm px-2 py-1 inline-block rounded-sm w-fit', className, {
            'bg-zinc-900': !dark,
            'bg-zinc-900 text-zinc-100': dark,
        })}
    >
        {children}
    </code>
);

export default Code;
