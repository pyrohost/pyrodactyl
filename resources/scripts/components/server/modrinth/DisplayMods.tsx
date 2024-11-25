//? https://api.modrinth.com/v2/search?facets=[[%22categories:forge%22],[%22versions:1.17.1%22,%20%22versions:1.21.3%22],[%22project_type:mod%22],[%22license:mit%22]]&index=relevance
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import ContentBox from '@/components/elements/ContentBox';
import { ScrollMenu } from '@/components/elements/ScrollMenu';

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
    icon_url: string;
}

interface Props {
    appVersion;
    baseUrl: string;
    nonApiUrl: string;
}

const ProjectSelector: React.FC<Props> = ({ appVersion, baseUrl, nonApiUrl }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const apiUrl = `${baseUrl}/search`;

    useEffect(() => {
        async function fetchProjects() {
            try {
                const response = await fetch(apiUrl, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': `pyrohost/pyrodactyl/${appVersion} (pyro.host)`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                for (const x of data.hits) {
                    if (x['icon_url'] == '') {
                        x['icon_url'] = 'N/A';
                    }
                }

                setProjects(data.hits || []); // Safely access hits
            } catch (error) {
                toast.error('Failed to fetch projects.');
                console.error(error);
            }
        }

        if (appVersion) {
            fetchProjects();
        }
    }, [appVersion]);

    const filteredProjects = projects.filter((project) => {
        return ['forge', 'fabric'].some((category) => project.categories.includes(category));
    });

    return (
        <div>
            {filteredProjects.length > 0 ? (
                <div>
                    {filteredProjects.map((project) => (
                        // <ContentBox className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl w-full mb-4'>
                        <ContentBox
                            key={project.project_id}
                            className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl w-full mb-4'
                        >
                            <div className='flex items-center'>
                                <ContentBox className='p-3  rounded-xl  mr-4'>
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
                                            <path fill='none' d='M0 0h103.4v103.4H0z'></path>{' '}
                                            <path
                                                fill='none'
                                                stroke='#9a9a9a'
                                                strokeWidth='5'
                                                d='M51.7 92.5V51.7L16.4 31.3l35.3 20.4L87 31.3 51.7 11 16.4 31.3v40.8l35.3 20.4L87 72V31.3L51.7 11'
                                            ></path>
                                        </svg>
                                    )}
                                </ContentBox>
                                <div className=''>
                                    <a href={`${nonApiUrl}/mod/${project.project_id}`} target='_blank' rel='noreferrer'>
                                        <h2 className='text-lg font-semibold text-white'>{project.title}</h2>
                                    </a>
                                    <p className='text-sm text-gray-300 mb-2'>
                                        Author: <span className='font-medium'>{project.author}</span>
                                    </p>
                                    <p className='text-sm text-gray-400'>{project.description}</p>
                                    <p className='text-sm text-gray-500 mt-2'>
                                        Downloads: {project.downloads} | Follows: {project.follows}
                                    </p>
                                </div>
                            </div>
                        </ContentBox>
                    ))}
                </div>
            ) : (
                <p className='text-white'>No projects available...</p>
            )}
        </div>
    );
};

export default ProjectSelector;
// <path data-v-78e239b4="" fill="none" stroke="#9a9a9a" stroke-width="5" d="M51.7 92.5V51.7L16.4 31.3l35.3 20.4L87 31.3 51.7 11 16.4 31.3v40.8l35.3 20.4L87 72V31.3L51.7 11"></path>
// <ScrollMenu
// items={filteredProjects.map((project) => ({
// id: project.project_id,
// name: project.title,
// description: project.description,
// icon: project.icon_url,
// }))}
// />
