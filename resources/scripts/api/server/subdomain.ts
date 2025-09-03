import http from '@/api/http';

export interface SubdomainData {
    subdomain: string | null;
    domain: string | null;
    full_domain: string | null;
    game: string | null;
    game_preset: {
        name: string;
        display_name: string;
        description: string;
        dns_records: Array<{
            type: string;
            description: string;
            service?: string;
            protocol?: string;
        }>;
    } | null;
    dns_records: string[];
}

export interface SubdomainInfo {
    object: string;
    attributes: SubdomainData;
    supports_subdomains: boolean;
    available_games: Array<{
        name: string;
        display_name: string;
        description: string;
        default_port: number;
    }>;
    available_domains: Array<{
        id: number;
        name: string;
        description: string | null;
        provider: string;
    }>;
}

export interface SetSubdomainRequest {
    subdomain: string;
    domain_id: number;
    subdomain_type?: string; // Optional - will use server's default game type if not provided
}

export interface AvailabilityResponse {
    available: boolean;
    subdomain: string;
    domain: string;
    full_domain: string;
}

export const getSubdomainInfo = async (uuid: string): Promise<SubdomainInfo> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/subdomain`);
    return data;
};

export const setSubdomain = async (uuid: string, request: SetSubdomainRequest): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/subdomain`, request);
};

export const updateSubdomain = async (uuid: string, request: SetSubdomainRequest): Promise<void> => {
    await http.put(`/api/client/servers/${uuid}/subdomain`, request);
};

export const removeSubdomain = async (uuid: string): Promise<void> => {
    await http.delete(`/api/client/servers/${uuid}/subdomain`);
};

export const checkSubdomainAvailability = async (
    uuid: string,
    subdomain: string,
    domainId: number
): Promise<AvailabilityResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/subdomain/check-availability`, {
        params: { subdomain, domain_id: domainId },
    });
    return data;
};

export const syncSubdomainDns = async (uuid: string): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/subdomain/sync-dns`);
};