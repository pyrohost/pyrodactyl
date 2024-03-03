import * as React from 'react';
import { NavLink } from 'react-router-dom';

export default ({ id }: { id: string }) => {
    return (
        <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
            <div
                style={{
                    background:
                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                }}
                className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-none text-sm font-bold shadow-md'
            >
                New File
            </div>
        </NavLink>
    );
};
