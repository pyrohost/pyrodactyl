//################
// STATUS PAGE PLEASE EDIT THIS
import React from 'react';

const StatusPage: React.FC = () => {
    const statusPageUrl = import.meta.env.VITE_STATUS_PAGE || "https://http.cat/204"; // If not found it will show http cat
    const statusPageTitle = import.meta.env.VITE_STATUS_PAGE_TITLE_NATE || "Status Page"; // If not found it will send this instead
    return (
        <div className='w-full h-screen'>
            <iframe
                src={statusPageUrl}
                title={statusPageTitle}
                className='w-full h-full border-none'
                loading='lazy'
            />
        </div>
    );
};

export default StatusPage;



