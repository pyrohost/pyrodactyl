import { hashToPath } from "@/helpers";
import { useVirtualizer } from "@tanstack/react-virtual";
import debounce from "debounce";
import { For } from "million/react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import Can from "@/components/elements/Can";
import { Checkbox } from "@/components/elements/CheckboxNew";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import { MainPageHeader } from "@/components/elements/MainPageHeader";
import { ServerError } from "@/components/elements/ScreenBlock";
import ServerContentBlock from "@/components/elements/ServerContentBlock";
import FileManagerBreadcrumbs from "@/components/server/files/FileManagerBreadcrumbs";
import FileManagerStatus from "@/components/server/files/FileManagerStatus";
import FileObjectRow from "@/components/server/files/FileObjectRow";
import MassActionsBar from "@/components/server/files/MassActionsBar";
import NewDirectoryButton from "@/components/server/files/NewDirectoryButton";
import UploadButton from "@/components/server/files/UploadButton";

import { httpErrorToHuman } from "@/api/http";
import { FileObject } from "@/api/server/files/loadDirectory";

import { useStoreActions } from "@/state/hooks";
import { ServerContext } from "@/state/server";

import useFileManagerSwr from "@/plugins/useFileManagerSwr";

import NewFileButton from "./NewFileButton";

const sortFiles = (files: FileObject[]): FileObject[] => {
  const sortedFiles: FileObject[] = files
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
  return sortedFiles.filter(
    (file, index) => index === 0 || file.name !== sortedFiles[index - 1]?.name,
  );
};

export default () => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const id = ServerContext.useStoreState((state) => state.server.data!.id);
  const { hash, pathname } = useLocation();
  const { data: files, error, mutate } = useFileManagerSwr();

  const directory = ServerContext.useStoreState(
    (state) => state.files.directory,
  );
  const clearFlashes = useStoreActions(
    (actions) => actions.flashes.clearFlashes,
  );
  const setDirectory = ServerContext.useStoreActions(
    (actions) => actions.files.setDirectory,
  );

  const setSelectedFiles = ServerContext.useStoreActions(
    (actions) => actions.files.setSelectedFiles,
  );
  const selectedFilesLength = ServerContext.useStoreState(
    (state) => state.files.selectedFiles.length,
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearFlashes("files");
    setSelectedFiles([]);
    setDirectory(hashToPath(hash));
  }, [hash]);

  useEffect(() => {
    mutate();
  }, [directory]);

  const onSelectAllClick = () => {
    console.log("files", files);
    setSelectedFiles(
      selectedFilesLength === (files?.length === 0 ? -1 : files?.length)
        ? []
        : files?.map((file) => file.name) || [],
    );
  };

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = debounce(setSearchTerm, 50);

  const filesArray = sortFiles(files ?? []).filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    setSearchTerm("");

    // Clean imput using a reference
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }, [hash, pathname, directory]);

  if (error) {
    return (
      <ServerError
        title={"Something went wrong."}
        message={httpErrorToHuman(error)}
      />
    );
  }

  const rowVirtualizer = useVirtualizer({
    // count: 10000,
    count: filesArray.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    // scrollMargin: 54,
  });

  return (
    <ServerContentBlock
      className="!p-0"
      title={"File Manager"}
      showFlashKey={"files"}
    >
      <div className="px-2 sm:px-14 pt-2 sm:pt-14">
        <ErrorBoundary>
          <MainPageHeader title={"Files"}>
            <Can action={"file.create"}>
              <div className="flex flex-row gap-1">
                <FileManagerStatus />
                <NewDirectoryButton />
                <NewFileButton id={id} />
                <UploadButton />
              </div>
            </Can>
          </MainPageHeader>
          <div className={"flex flex-wrap-reverse md:flex-nowrap mb-4"}>
            <FileManagerBreadcrumbs
              renderLeft={
                <Checkbox
                  className="ml-[1.22rem] mr-4"
                  checked={
                    selectedFilesLength ===
                    (files?.length === 0 ? -1 : files?.length)
                  }
                  onCheckedChange={() => onSelectAllClick()}
                />
              }
            />
          </div>
        </ErrorBoundary>
      </div>
      {!files ? null : (
        <>
          {!files.length ? (
            <p className={`text-sm text-zinc-400 text-center`}>
              This folder is empty.
            </p>
          ) : (
            <>
              <div
                ref={parentRef}
                style={{ height: `calc(100vh - 194px)`, overflowY: "scroll" }}
              >
                <div
                  data-pyro-file-manager-files
                  style={{
                    background:
                      "radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)",
                  }}
                  className="p-1 border-[1px] border-[#ffffff12] rounded-xl ml-14 mr-12"
                >
                  <div className="relative w-full h-full mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 absolute top-1/2 -translate-y-1/2 left-5 opacity-40"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                      />
                    </svg>

                    <input
                      ref={searchInputRef}
                      className="pl-14 py-4 w-full rounded-lg bg-[#ffffff11] text-sm font-bold"
                      type="text"
                      placeholder="Search..."
                      onChange={(event) =>
                        debouncedSearchTerm(event.target.value)
                      }
                    />
                  </div>
                  <For
                    each={rowVirtualizer.getVirtualItems()}
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      overflow: "hidden",
                      borderRadius: "0.5rem",
                      position: "relative",
                    }}
                    as="div"
                    memo
                  >
                    {(virtualItem) => {
                      if (filesArray[virtualItem.index] !== undefined) {
                        return (
                          <div
                            key={virtualItem.key}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              height: `${virtualItem.size}px`,
                              width: "100%",
                              paddingBottom: "1px",
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <FileObjectRow
                              // @ts-ignore
                              file={filesArray[virtualItem.index]}
                              key={filesArray[virtualItem.index]?.name}
                            />
                          </div>
                        );
                      }
                      return <></>;
                    }}
                  </For>
                </div>
              </div>
              <MassActionsBar />
            </>
          )}
        </>
      )}
    </ServerContentBlock>
  );
};
