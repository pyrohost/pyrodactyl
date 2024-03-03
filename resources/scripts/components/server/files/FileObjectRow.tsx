import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'pathe';
import { bytesToString } from '@/lib/formatters';
import styles from './style.module.css';

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const match = useRouteMatch();

    return (file.isFile && (!file.isEditable() || !canReadContents)) || (!file.isFile && !canRead) ? (
        <div className={styles.details}>{children}</div>
    ) : (
        <NavLink
            className={styles.details}
            to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
        >
            {children}
        </NavLink>
    );
}, isEqual);

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        className={styles.file_row}
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
        }}
    >
        <SelectFileCheckbox name={file.name} />
        <Clickable file={file}>
            <div css={tw`flex-none text-zinc-400 ml-6 mr-4 text-lg pl-3`}>
                {file.isFile ? (
                    // todo handle other types of files. ugh
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path
                            fillRule='evenodd'
                            clipRule='evenodd'
                            d='M16.5635 1.35276C15.5812 1.25 14.3484 1.25001 12.8073 1.25003H11.932C10.039 1.25001 8.52512 1.24999 7.33708 1.40088C6.11256 1.55639 5.08724 1.88708 4.26839 2.66059C3.4412 3.44199 3.07982 4.43383 2.91129 5.61793C2.74994 6.75159 2.74997 8.19141 2.75 9.97015V16.12C2.74999 16.9191 2.74999 17.5667 2.78473 18.0953C2.82052 18.6399 2.89613 19.1256 3.0794 19.5897C3.60821 20.929 4.71664 21.9633 6.09319 22.4483C6.952 22.7509 8.42408 22.7505 9.97909 22.75C12.8187 22.7503 14.5054 22.7505 15.8878 22.2635C18.1078 21.4813 19.8815 19.8185 20.7249 17.6825C21.006 16.9705 21.1306 16.2058 21.1908 15.289C21.25 14.3882 21.25 13.2756 21.25 11.8573V9.27383C21.25 7.82574 21.25 6.65309 21.1402 5.71576C21.026 4.74236 20.7828 3.90448 20.213 3.18541C19.9178 2.81293 19.5692 2.48415 19.1789 2.2081C18.4341 1.68144 17.5729 1.45835 16.5635 1.35276ZM5.60307 4.08392C5.99626 3.7125 6.55233 3.47071 7.58157 3.33999C8.63306 3.20645 10.0233 3.2046 12 3.2046H12.7524C14.361 3.2046 15.4922 3.20585 16.3616 3.2968C17.2155 3.38613 17.6994 3.55289 18.0573 3.80593C18.2987 3.97668 18.5111 4.17777 18.6889 4.40212C18.9445 4.72462 19.1139 5.15741 19.2061 5.9442C19.3011 6.75396 19.3026 7.81129 19.3026 9.33474L19.3027 12.2349C19.3027 12.5019 19.3026 13.1405 19.022 13.6127C18.849 13.9037 18.6276 14.1468 18.4002 14.2706C18.0336 14.4701 17.6135 14.5835 17.1668 14.5835L16.1264 14.547C15.7463 14.5391 15.3028 14.5511 14.8746 14.6658C14.0407 14.8893 13.3893 15.5407 13.1658 16.3747C13.0511 16.8028 13.0391 17.2463 13.047 17.6264L13.0835 18.6668C13.0835 19.1345 12.9591 19.5416 12.7417 19.92C12.615 20.1406 12.3943 20.3425 12.0895 20.5198C11.6274 20.7887 11.074 20.7912 10.7358 20.7927C10.3977 20.7943 10.0409 20.7954 9.74284 20.7954C7.90872 20.7954 7.24159 20.7815 6.73823 20.6041C5.8656 20.2967 5.1999 19.655 4.88981 18.8697C4.81217 18.673 4.75733 18.4146 4.72789 17.9667C4.69788 17.51 4.69739 16.927 4.69739 16.0868V10.0455C4.69739 8.17343 4.69971 6.87375 4.83911 5.89437C4.97359 4.94948 5.21822 4.44747 5.60307 4.08392Z'
                            fill='white'
                        />
                        <path
                            fillRule='evenodd'
                            clipRule='evenodd'
                            d='M7 7C7 6.44772 7.44772 6 8 6H15C15.5523 6 16 6.44772 16 7C16 7.55228 15.5523 8 15 8H8C7.44772 8 7 7.55228 7 7Z'
                            fill='white'
                        />
                        <path
                            fillRule='evenodd'
                            clipRule='evenodd'
                            d='M7 11C7 10.4477 7.44772 10 8 10H11C11.5523 10 12 10.4477 12 11C12 11.5523 11.5523 12 11 12H8C7.44772 12 7 11.5523 7 11Z'
                            fill='white'
                        />
                    </svg>
                ) : (
                    // Todo componentize this shit
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path
                            d='M7.785 3.30812C7.6039 3.22376 7.38178 3.20242 6.32595 3.20242C5.55108 3.20242 5.04842 3.20378 4.66633 3.24562C4.30655 3.28502 4.15503 3.35187 4.05577 3.42068C3.81547 3.58728 3.5906 3.8532 3.42965 4.21148C3.33971 4.41171 3.27289 4.69057 3.23698 5.19659C3.20057 5.70964 3.2 6.37092 3.2 7.32086V10.4695C3.2 12.9205 3.20135 14.6795 3.34616 16.0175C3.48985 17.3453 3.76288 18.1104 4.19883 18.652C4.61031 19.1632 5.15176 19.4588 6.1292 19.6221C7.15995 19.7942 8.5304 19.7974 10.5193 19.7974H11.5561C12.0946 19.7974 12.5311 20.2345 12.5311 20.7736C12.5311 21.3127 12.0946 21.7498 11.5561 21.7498H10.4332H10.4331C8.55149 21.7498 7.01783 21.7498 5.80834 21.5478C4.52712 21.3338 3.48373 20.8749 2.68053 19.8771C1.9018 18.9097 1.56749 17.706 1.40751 16.2278C1.24998 14.7723 1.24999 12.9075 1.25 10.53V7.28438V7.28436C1.24999 6.37947 1.24999 5.64868 1.29188 5.05824C1.33484 4.45285 1.42574 3.91267 1.65124 3.41067C1.94002 2.76782 2.3801 2.20767 2.94567 1.81557C3.41168 1.4925 3.91944 1.36341 4.45431 1.30484C4.955 1.25001 5.77487 1.24988 6.485 1.24991C7.29125 1.2487 7.98437 1.24765 8.60763 1.538C9.33078 1.87489 9.79993 2.4365 10.1323 2.99796C10.422 3.48716 10.6449 4.04448 10.8361 4.52255L10.8361 4.52256L11.1776 5.3717L15.4938 5.3717C16.3172 5.37166 17.0246 5.37162 17.6013 5.4445C18.2213 5.52285 18.7983 5.69601 19.3059 6.11735C19.6821 6.42958 19.9927 6.82026 20.2286 7.25887C20.6299 8.00505 20.7194 8.87723 20.7496 9.92617C20.7651 10.4651 20.3413 10.9145 19.8031 10.9301C19.2648 10.9456 18.8159 10.5213 18.8004 9.98243C18.7706 8.94657 18.6758 8.48963 18.5117 8.18454C18.3845 7.94809 18.2286 7.75917 18.0613 7.62033C17.9413 7.52071 17.7677 7.43338 17.3571 7.38149C16.9169 7.32586 16.3337 7.32405 15.435 7.32405H7.10403C6.56555 7.32405 6.12903 6.887 6.12903 6.34788C6.12903 5.80875 6.56555 5.3717 7.10403 5.3717H9.07528C8.87161 4.86433 8.6633 4.34545 8.45492 3.99351C8.23849 3.62796 8.02646 3.4206 7.785 3.30812Z'
                            fill='white'
                        />
                        <path
                            d='M17.3112 9.25592C18.4993 9.25589 19.4723 9.25587 20.2219 9.36309C21.0012 9.47456 21.6956 9.72121 22.178 10.3433C22.9349 11.3194 22.8068 12.5251 22.5484 13.4743C22.3712 14.1251 21.8122 15.4777 21.5792 16.0323C21.1387 17.2059 20.7894 18.1365 20.4353 18.8624C20.0717 19.6078 19.6753 20.198 19.109 20.66C18.262 21.3511 17.2532 21.6037 16.304 21.6971C15.6191 21.7644 14.8941 21.7519 14.2529 21.7409L9.87794 21.7333C8.15647 21.7333 6.78588 21.7333 5.73406 21.5893C4.65546 21.4415 3.7619 21.1249 3.12679 20.3687C2.0367 19.0708 2.13865 17.4388 2.49738 16.0483C2.74524 15.0876 3.16552 14.0813 3.51236 13.2508C3.71801 12.7029 4.28236 11.2746 4.4577 10.9114C4.64193 10.5297 4.85595 10.1949 5.17501 9.92133C5.67283 9.49456 6.25423 9.34181 6.76747 9.28454C7.14566 9.24234 7.55281 9.2483 7.88558 9.25316L17.3112 9.25592Z'
                            fill='white'
                        />
                    </svg>
                )}
            </div>
            <div css={tw`flex-1 truncate font-bold text-sm`}>{file.name}</div>
            {file.isFile && (
                <div css={tw`w-1/6 text-right mr-4 hidden sm:block text-xs`}>{bytesToString(file.size)}</div>
            )}
            <div css={tw`w-1/5 text-right mr-4 hidden md:block text-xs`} title={file.modifiedAt.toString()}>
                {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                    ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                    : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
            </div>
        </Clickable>
        <FileDropdownMenu file={file} />
    </div>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
