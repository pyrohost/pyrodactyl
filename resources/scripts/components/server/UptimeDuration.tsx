const UptimeDuration = ({ uptime }: { uptime: number }) => {
    const uptimeDiv = uptime / 1000;
    const days = Math.floor(uptimeDiv / (24 * 60 * 60));
    const hours = Math.floor((Math.floor(uptimeDiv) / 60 / 60) % 24);
    const remainder = Math.floor(uptimeDiv - hours * 60 * 60);
    const minutes = Math.floor((remainder / 60) % 60);
    const seconds = remainder % 60;

    if (days > 0) {
        return (
            <>
                {days}d {hours}h {minutes}m
            </>
        );
    }

    return (
        <>
            {hours}h {minutes}m {seconds}s
        </>
    );
};

export default UptimeDuration;
