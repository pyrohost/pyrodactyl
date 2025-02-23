import React, { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/elements/Pagination';
import getPlugins from '@/api/server/plugins/getPlugins';
import { debounce } from 'lodash';
import LogoLoader from '@/components/elements/ServerLoad';
import { Badge } from "@/components/ui/badge";
import { Star, Download, ThumbsUp, Loader2, LucideMessageCircleWarning, LucideCircleCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import installPlugin from '@/api/server/plugins/installPlugin';
import { toast } from '@/hooks/use-toast';
import { Command, CommandInput } from '@/components/ui/command';


interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    downloadUrl: string;
    discussion?: string;
}

interface PaginatedPlugins {
    items: Plugin[];
    pagination: {
        total: number;
        count: number;
        perPage: number;
        currentPage: number;
        totalPages: number;
    };
}

const ViewPlugins: React.FC<{ serverUuid: string }> = ({ serverUuid }) => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('Plugins');
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);
    const [pluginData, setPluginData] = useState<PaginatedResult<Plugin>>({
        items: [],
        pagination: {
            total: 0,
            count: 0,
            perPage: 15,
            currentPage: 1,
            totalPages: 1
        }
    });
    const ITEMS_PER_PAGE = 9;

    


    const handleInstall = async (plugin: Plugin) => {
        setInstalling(plugin.id);
        try {
            console.log("Installing plugin", plugin)
            await installPlugin(serverUuid, {
                id: plugin.id,
                name: plugin.name
            });
            toast({
                title: (
                    <div className="flex items-center">
                        <LucideCircleCheck className="w-4 h-4 mr-2 text-green-500" />
                        Plugin has been installed successfully | {plugin.name}
                    </div>
                ),
                description: `Click on the restart button to restart your server so the plugin activates. You can find the plugin at the plugins directory! `,
            });
        } catch (error) {
            console.error('Failed to install plugin:', error);
            toast({
                title: (
                    <div className="flex items-center">
                        <LucideMessageCircleWarning className="w-4 h-4 mr-2 text-red-500" />
                        Failed to install plugin ${plugin.name} 
                    </div>
                ),
                description: `Uh oh! ${error} Please check your internet connection and try again.`,
            });
        } finally {
            setInstalling(null);
        }
    };

    const fetchPlugins = async (query: string, page: number) => {
        setLoading(true);
        try {
            const data = await getPlugins(serverUuid, query);
            console.log(data)
            const formattedPlugins = data.map((plugin: any) => ({
                id: String(plugin.id || ''),
                name: String(plugin.name || ''),
                version: String(plugin.version || 'Unknown'),
                description: String(plugin.description
                    || ''),
                downloadUrl: String(plugin.downloadUrl
                    || '#'),
                premium: Boolean(plugin.premium || false),
                rating: {
                    count: Number(plugin.rating?.count || 0),
                    average: Number(plugin.rating?.average || 0)
                },
                downloads: Number(plugin.downloads || 0),
                discussion: String(plugin.links?.discussion),
                likes: Number(plugin.likes || 0),
                icon: plugin.icon ? {
                    url: String(plugin.icon.url || ''),
                    data: String(plugin.icon.data || '')
                } : null
            }));

            console.log(formattedPlugins)

            // Calculate pagination
            const total = formattedPlugins.length;
            const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            
            // Slice items for current page
            const paginatedItems = formattedPlugins.slice(startIndex, endIndex);

            setPluginData({
                items: paginatedItems,
                pagination: {
                    total: total,
                    count: paginatedItems.length,
                    perPage: ITEMS_PER_PAGE,
                    currentPage: page,
                    totalPages: totalPages
                }
            });
        } catch (error) {
            console.error('Failed to load plugins:', error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce((query: string) => fetchPlugins(query, page), 500),
        [page]
    );

    useEffect(() => {
        fetchPlugins(search, page);
        return () => debouncedSearch.cancel();
    }, [serverUuid, page]);

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center space-x-4">
            <Command className="rounded-lg border shadow-md">
                <CommandInput
                    placeholder="Search plugins..."
                    value={search}
                    onValueChange={(value) => {
                        setSearch(value);
                        debouncedSearch(value);
                    }}
                />
            </Command>
            </div>

            {loading ? (
                <div className="w-full flex items-center justify-center p-6">
                    <LogoLoader size="80px"/>
                    <span className="text-sm text-zinc-400">Loading plugins...</span>
                </div>
            ) : (
                <Pagination data={pluginData} onPageSelect={setPage}>
                    {({ items }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.length > 0 ? items.map((plugin) => (
                                <Card
                                key={plugin.id}
                                className="overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-black border-zinc-200/50 dark:border-zinc-800/50 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                              >
                                <CardHeader className="flex flex-row items-center gap-4">
                                  <Avatar className="h-12 w-12 rounded-xl">
                                    {plugin.icon ? (
                                      <AvatarImage
                                        src={plugin.icon.data ? `data:image/png;base64,${plugin.icon.data}` : plugin.icon.url}
                                        alt={plugin.name}
                                      />
                                    ) : (
                                      <AvatarFallback className="rounded-xl bg-zinc-100 dark:bg-zinc-800">
                                        {plugin.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <CardTitle className="text-lg">{plugin.name}</CardTitle>
                                    <CardDescription className="line-clamp-1">{plugin.description}</CardDescription>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4" />
                                      <span>
                                        {plugin.rating && typeof plugin.rating.average !== "undefined"
                                          ? `${plugin.rating.average.toFixed(1)} (${plugin.rating.count || 0})`
                                          : "No ratings"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Download className="h-4 w-4" />
                                      <span>{plugin.downloads || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <ThumbsUp className="h-4 w-4" />
                                      <span>{plugin.likes || 0}</span>
                                    </div>
                                    <Badge variant="secondary" className="ml-auto">
                                      v{plugin.version || "Unknown"}
                                    </Badge>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                  <Button
                                    onClick={() => window.open(`https://www.spigotmc.org/${plugin.discussion}`, "_blank")}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    onClick={() => handleInstall(plugin)}
                                    disabled={installing === plugin.id}
                                    className="flex-1"
                                  >
                                    {installing === plugin.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Installing...
                                      </>
                                    ) : (
                                      "Install"
                                    )}
                                  </Button>
                                </CardFooter>
                              </Card>
                            )) : (
                                <Card className="col-span-full">
                                    <CardHeader>
                                        <CardTitle>No plugins found</CardTitle>
                                        <CardDescription>Try adjusting your search</CardDescription>
                                    </CardHeader>
                                </Card>
                            )}
                        </div>
                    )}
                </Pagination>
            )}
        </div>
    );
};

export default ViewPlugins;