export interface MclogsInsight {
    id: string;
    name: string;
    type: string;
    version: string;
    title: string;
    analysis: {
        problems: Array<{
            message: string;
            counter: number;
            entry: {
                level: number;
                time: string | null;
                prefix: string;
                lines: Array<{
                    number: number;
                    content: string;
                }>;
            };
            solutions: Array<{
                message: string;
            }>;
        }>;
        information: Array<{
            message: string;
            counter: number;
            label: string;
            value: string;
            entry: {
                level: number;
                time: string | null;
                prefix: string;
                lines: Array<{
                    number: number;
                    content: string;
                }>;
            };
        }>;
    };
}

export interface MclogsAnalyzeRequest {
    content: string;
}

export interface MclogsErrorResponse {
    success: false;
    error: string;
}

/**
 * Analyzes log content using the mclo.gs API without saving it
 */
export const analyzeLogs = async (logContent: string): Promise<MclogsInsight> => {
    const response = await fetch('https://api.mclo.gs/1/analyse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            content: logContent,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if ('success' in data && data.success === false) {
        throw new Error(data.error || 'Failed to analyze logs');
    }

    return data as MclogsInsight;
};

/**
 * Gets insights from an existing mclo.gs paste
 */
export const getInsights = async (logId: string): Promise<MclogsInsight> => {
    const response = await fetch(`https://api.mclo.gs/1/insights/${logId}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if ('success' in data && data.success === false) {
        throw new Error(data.error || 'Log not found');
    }

    return data as MclogsInsight;
};
