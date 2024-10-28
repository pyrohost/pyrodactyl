//################
//status PAGE PLEASE EDIT THIS
import React from 'react';

const StatusPage: React.FC = () => {
    return (
        <div className='w-full h-screen'>
            <iframe
                src={import.meta.env.VITE_STATUS_PAGE}
                title={import.meta.env.VITE_STATUS_PAGE_TITLE_NATE} // WOW NATE I DID IT SUPER COOL, IM VERY GOOD CODER OFC OFC 😎😎😎😎😎😎😎😎😎
                className='w-full h-full border-none'
                loading='lazy'
            />
        </div>
    );
};

export default StatusPage;
