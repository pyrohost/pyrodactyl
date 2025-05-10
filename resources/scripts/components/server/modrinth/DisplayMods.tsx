import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import ContentBox from '@/components/elements/ContentBox';
import HugeIconsDownload from '@/components/elements/hugeicons/Download';

import { ServerContext } from '@/state/server';

import DownloadModModel from './DownloadModel';
import { apiEndpoints, offset, perpage, settings } from './config';

interface Project {
    project_id: string;
    project_type: string;
    slug: string;
    author: string;
    title: string;
    description: string;
    categories: string[];
    versions: string[];
    downloads: number;
    follows: number;
    icon_url: string | null;
    latest_version: string;
}

interface Props {
    appVersion: string;
    baseUrl: string;
    nonApiUrl: string;
}

const ProjectSelector: React.FC<Props> = ({ appVersion, baseUrl, nonApiUrl }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalProject, setModalProject] = useState<string | null>(null);

    const uuid = ServerContext.useStoreState((state) => state.server.data!);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const facets = [
                settings.loaders.length > 0 ? settings.loaders.map((loader) => `categories:${loader}`) : null,
                settings.versions.length > 0 ? settings.versions.map((version) => `versions:${version}`) : null,
                settings.environments.length > 0
                    ? settings.environments.map((env) => `project_type:${env}`)
                    : ['project_type:mod'],
            ].filter(Boolean);

            const searchParams = new URLSearchParams({
                facets: JSON.stringify(facets),
                index: 'relevance',
                offset: `${offset}`,
                limit: `${perpage}`,
            });

            const query = settings.searchTerms.replace(/ /g, '-');
            const apiUrl = `${baseUrl}${apiEndpoints.projects}?${searchParams.toString()}&query=${query}`;

            const response = await axios.get(apiUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `pyrohost/pyrodactyl/${appVersion} (pyro.host)`,
                },
            });

            setProjects(
                response.data.hits.map((project: Project) => ({
                    ...project,
                    icon_url: project.icon_url || 'N/A',
                })),
            );
        } catch (error) {
            toast.error('Failed to fetch projects.');
            console.error('Error fetching projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const formatNumber = (num: number): string => {
        if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div>
            <button
                onClick={fetchProjects}
                id='fetchNewProjects'
                className='btn btn-primary mb-4 flex hidden cursor-pointer'
                disabled={isLoading}
            >
                {isLoading ? 'Loading...' : 'Fetch Projects'}
            </button>

            {isLoading ? (
                <p className='text-white'>Loading projects...</p>
            ) : projects.length > 0 ? (
                projects.map((project) => (
                    <ContentBox
                        key={project.project_id}
                        className='p-4 bg-[#ffffff09] border border-gray-600 shadow-xs rounded-xl w-full mb-4'
                    >
                        <div className='flex items-center'>
                            <ContentBox className='pt-1 rounded-xl mr-4'>
                                <a href={`${nonApiUrl}/mod/${project.project_id}`} target='_blank' rel='noreferrer'>
                                    {project.icon_url !== 'N/A' ? (
                                        <img src={project.icon_url} className='w-24 h-20 object-contain rounded-sm' />
                                    ) : (
                                        <svg
                                            fillRule='evenodd'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeMiterlimit='1.5'
                                            clipRule='evenodd'
                                            height='70'
                                            width='70'
                                            viewBox='0 0 104 104'
                                            aria-hidden='true'
                                        >
                                            <path fill='none' d='M0 0h103.4v103.4H0z'></path>
                                            <path
                                                fill='none'
                                                stroke='#9a9a9a'
                                                strokeWidth='5'
                                                d='M51.7 92.5V51.7L16.4 31.3l35.3 20.4L87 31.3 51.7 11 16.4 31.3v40.8l35.3 20.4L87 72V31.3L51.7 11'
                                            ></path>
                                        </svg>
                                    )}
                                </a>
                            </ContentBox>
                            <div className='w-full'>
                                <a href={`${nonApiUrl}/mod/${project.project_id}`} target='_blank' rel='noreferrer'>
                                    <h2 className='text-lg font-semibold text-white'>{project.title}</h2>
                                </a>
                                <p className='text-sm text-gray-300 mb-2'>
                                    Author: <span className='font-medium'>{project.author}</span>
                                </p>
                                <p className='text-sm text-gray-400'>{project.description}</p>
                            </div>
                            <div className='flex flex-col py-2 px-6 mx-6'>
                                <p className='text-sm'>
                                    {formatNumber(project.downloads)} <span className='text-gray-600'>Downloads</span>
                                </p>
                                <p className='text-sm pt-2'>
                                    {project.versions.at(-1)} <span className='text-gray-600'>Latest</span>
                                </p>
                            </div>
                            <div className='flex flex-col py-2 px-6 mx-6'>
                                <button
                                    className='flex items-center border-2 border-solid rounded-sm py-1 px-6 border-brand hover:border-white hover:bg-red-600 hover:scale-110 justify-center cursor-pointer'
                                    onClick={() => setModalProject(project.project_id)}
                                >
                                    <HugeIconsDownload className='px-2 mx-2' fill='currentColor' /> Install
                                </button>
                                {modalProject === project.project_id && (
                                    <DownloadModModel
                                        modid={project.project_id}
                                        modName={project.title}
                                        visible
                                        onModalDismissed={() => setModalProject(null)}
                                    />
                                )}
                            </div>
                        </div>
                    </ContentBox>
                ))
            ) : (
                <p className='text-white'>No projects available...</p>
            )}
        </div>
    );
};

export default ProjectSelector;
