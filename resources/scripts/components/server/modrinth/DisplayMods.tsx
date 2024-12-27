import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import ContentBox from '@/components/elements/ContentBox';
import HugeIconsDownload from '@/components/elements/hugeicons/Download';

// import { useProjects } from './FetchProjects';
import { apiEndpoints, offset, settings } from './config';

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
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchProjects = async () => {
        setIsLoading(true); // Start loading
        try {
            const facets = [
                settings.loaders.length > 0
                    ? settings.loaders.map((loader) => `categories:${loader}`)
                    : ['categories:paper', 'categories:fabric'],
                settings.versions.length > 0 ? settings.versions.map((version) => `versions:${version}`) : null,
                settings.environments.length > 0
                    ? settings.environments.map((environment) => `project_type:${environment}`)
                    : ['project_type:mod'],
            ].filter(Boolean);

            // console.log('Constructed facets:', facets);

            const searchParams = new URLSearchParams({
                facets: JSON.stringify(facets),
                index: 'relevance',
                offset: `${offset}`,
            });

            const apiUrl = `${baseUrl}${apiEndpoints.projects}?${searchParams.toString()}&query=${settings.searchTerms}`;
            // console.log('Constructed API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `pyrohost/pyrodactyl/${appVersion} (pyro.host)`,
                },
            });

            // console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            // console.log('Fetched projects data:', data);

            const updatedProjects = data.hits.map((project: Project) => ({
                ...project,
                icon_url: project.icon_url || 'N/A',
            }));

            setProjects(updatedProjects);
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
        if (num >= 1_000_000_000) {
            return (num / 1_000_000_000).toFixed(1) + 'B';
        } else if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(1) + 'M';
        } else if (num >= 1_000) {
            return (num / 1_000).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    };

    const getData = (): null => {
        console.log(settings);
        return null;
    };

    return (
        <div>
            <button
                onClick={fetchProjects}
                id='fetchNewProjects'
                className='btn btn-primary mb-4 flex hidden'
                disabled={isLoading}
            >
                {isLoading ? 'Loading...' : 'Fetch Projects'}
            </button>
            <p></p>
            {isLoading ? (
                <p className='text-white'>Loading projects...</p>
            ) : projects.length > 0 ? (
                projects.map((project) => (
                    <ContentBox
                        key={project.project_id}
                        className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl w-full mb-4 relative'
                    >
                        <div className='flex items-center'>
                            <ContentBox className='p-3 rounded-xl mr-4'>
                                <a href={`${nonApiUrl}/mod/${project.project_id}`} target='_blank' rel='noreferrer'>
                                    {project.icon_url && project.icon_url !== 'N/A' ? (
                                        <img src={project.icon_url} className='mt-4 w-16 h-16 object-cover rounded' />
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
                            <div className='text-right flex flex-col py-2 whitespace-nowrap'>
                                <p className='text-sm inline-block '>
                                    <p className='text-gray-600 inline'>Downloads: </p>
                                    {formatNumber(project.downloads)}
                                </p>
                                <p className='text-sm inline inline-block pt-2 whitespace-nowrap'>
                                    <p className='text-gray-600 inline'>Latest: </p>
                                    {project.versions[project.versions.length - 1]}
                                </p>
                                <a href='#' className='pt-4'>
                                    <button className='flex text-right border-2 border-solid rounded py-1 px-6 border-brand hover:border-white transition ease-in-out delay-300 hover:bg-red-600 hover:scale-110'>
                                        <HugeIconsDownload className='px-2 mx-2' fill='currentColor' />
                                        Install
                                    </button>
                                </a>
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
