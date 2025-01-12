import clsx from 'clsx';
import copy from 'copy-to-clipboard';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { toast } from 'sonner';

interface CopyOnClickProps {
    text?: string | number | null;
    showInNotification?: boolean;
    children: React.ReactNode;
}

const CopyOnClick = ({ text, children, showInNotification = true }: CopyOnClickProps) => {
    const [copied, setCopied] = useState(false);

    const truncatedText = React.useMemo(() => {
        if (!showInNotification || !text) return '';
        const length = 80;
        const stringText = String(text);
        return stringText.length > length 
            ? `"${stringText.substring(0, length - 3)}..."` 
            : `"${stringText}"`;
    }, [text, showInNotification]);

    useEffect(() => {
        if (!copied) return;

        if (showInNotification) {
            toast.success(`Copied ${truncatedText} to clipboard`);
        }

        const timeout = setTimeout(() => {
            setCopied(false);
        }, 2500);

        return () => clearTimeout(timeout);
    }, [copied, truncatedText, showInNotification]);

    if (!React.isValidElement(children)) {
        throw new Error('Component passed to <CopyOnClick/> must be a valid React element.');
    }

    const handleCopy = (e: React.MouseEvent<HTMLElement>) => {
        if (text) {
            copy(String(text));
            setCopied(true);
        }
        
        if (React.isValidElement(children) && typeof children.props.onClick === 'function') {
            children.props.onClick(e);
        }
    };

    const child = !text
        ? React.Children.only(children)
        : React.cloneElement(React.Children.only(children), {
              className: clsx(children.props.className, 'cursor-pointer'),
              onClick: handleCopy,
          });

    return <>{child}</>;
};

export default CopyOnClick;