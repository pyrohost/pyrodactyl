import React from 'react';
import { usePage } from '@inertiajs/react'; // Import usePage

const FlashMessageRender = () => {
    const { props: { flash } } = usePage(); // Access flash messages from Inertia props

    if (!flash || !flash.messages) {
        return null;
    }

    return (
        <div>
            {flash.messages.map((message, index) => (
                <div key={index} className={`flash-message ${message.type}`}>
                    {message.text}
                </div>
            ))}
        </div>
    );
};

export default FlashMessageRender;