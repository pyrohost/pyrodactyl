import FadeTransition from '@/components/elements/transitions/FadeTransition';
import { Transition as TransitionComponent } from '@headlessui/react';

const Transition = Object.assign(TransitionComponent, {
    Fade: FadeTransition,
});

export { Transition };
