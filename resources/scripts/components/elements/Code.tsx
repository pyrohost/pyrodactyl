import clsx from 'clsx';

interface CodeProps {
    className?: string;
    children: React.ReactNode;
}

const Code = ({ className, children }: CodeProps) => (
    <code
        className={clsx(
            'font-mono text-sm px-2 py-1 inline-block rounded-md w-fit',
            'bg-[var(--color-mocha-600)] text-[var(--color-cream-400)]',
            'border border-[var(--color-mocha-400)]/50',
            className,
        )}
    >
        {children}
    </code>
);

export default Code;
