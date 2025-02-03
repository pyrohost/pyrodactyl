import useSWR from 'swr';
import { MinecraftStatus } from '@/types/minecraft';

const fetcher = async (url: string): Promise<MinecraftStatus> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch Minecraft status');
  }
  return response.json();
};

export const useMinecraftStatus = (ipAlias: string, port: number, enabled: boolean) => {
  const { data, error, isLoading } = useSWR<MinecraftStatus>(
    enabled ? `https://api.mcsrvstat.us/2/${ipAlias}:${port}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    mcStatus: data,
    isLoading,
    error
  };
};