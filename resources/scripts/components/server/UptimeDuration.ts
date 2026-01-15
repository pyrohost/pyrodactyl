export function formatUptime(uptime: number): string {
	if (uptime <= 0) {
		return "Offline";
	}

	const secondsTotal = Math.floor(uptime / 1000);
	const days = Math.floor(secondsTotal / 86400);
	const hours = Math.floor((secondsTotal % 86400) / 3600);
	const minutes = Math.floor((secondsTotal % 3600) / 60);
	const seconds = secondsTotal % 60;

	if (days > 0) {
		return `${days}d ${hours}h ${minutes}m`;
	}

	return `${hours}h ${minutes}m ${seconds}s`;
}

export default formatUptime;
