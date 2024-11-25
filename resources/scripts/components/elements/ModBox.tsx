import * as React from 'react';

import { cn } from '@/lib/utils';

const ModBox = React.forwardRef<React.ElementRef<'div'>, React.ComponentPropsWithoutRef<'div'>>(({ ...props }, ref) => {
    return <div ref={ref} className='mb-4 w-full text-nowrap select-none' {...props}></div>;
});

ModBox.displayName = 'ModBox';

export { ModBox };
