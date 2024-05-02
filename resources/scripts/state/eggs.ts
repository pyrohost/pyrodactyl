// eggs state
import { Action, action, thunk } from 'easy-peasy';
import { getEggs } from '@/api/eggs';

export interface Egg {
    id: number;
    uuid: string;
    name: string;
    description: string;
    dockerImage: string;
    config: string;
    startup: string;
    script: string;
    images: string[];
}

