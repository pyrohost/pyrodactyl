'use client';

import { ChevronRight } from '@carbon/icons-react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as React from 'react';

import { cn } from '../../lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => <AccordionPrimitive.Item ref={ref} className={cn('', className)} {...props} />);
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className='flex'>
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
                'group -mx-2 flex w-full cursor-pointer justify-between gap-2 rounded border border-transparent p-2 text-left opacity-50 transition hover:text-cream-300 focus:outline-none focus-visible:border-[#6355FF] [&[data-state=open]]:opacity-100 [&[data-state=open]>svg]:rotate-90',
                className,
            )}
            {...props}
        >
            <span className='leading-6 font-medium'>{children}</span>
            <ChevronRight className='text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200' />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className='data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down text-md'
        {...props}
    >
        {/* <div className={cn("mx-4 pt-0 pb-4", className)}>{children}</div> */}
        <div className='max-w-9/10 pb-4 opacity-80'>{children}</div>
    </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
