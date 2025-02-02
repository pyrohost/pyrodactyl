import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
  
{files.map((file, index) => (
  <motion.div key={file.key} variants={item}>
    <Card 
      className={`
          group p-4 cursor-pointer transition-all duration-200 
          hover:shadow-lg hover:translate-x-1
          ${index === selectedIndex ? 
              'bg-accent/80 ring-2 ring-primary shadow-lg' : 
              'hover:bg-accent/40 bg-background/60'
          }
      `}
      onClick={() => handleFileClick(file)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="p-2 rounded-md bg-accent/50"
          >
            {file.isFile ? getFileIcon(file) : (
              <FolderIcon className="h-5 w-5 text-blue-500" />
            )}
          </motion.div>
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {file.isFile ? formatFileSize(file.size) : 'Click to open this directory'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date(file.modifiedAt))}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setFileToRename(file.name);
                  setNewFileName(file.name);
                  setIsRenameDrawerOpen(true);
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.name);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  </motion.div>
))}import { fileBitsToString } from '@/helpers';
import { Form, Formik, FormikHelpers } from 'formik';

import Field from '@/components/elements/Field';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';

import chmodFiles from '@/api/server/files/chmodFiles';

import { ServerContext } from '@/state/server';

import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';

interface FormikValues {
    mode: string;
}

interface File {
    file: string;
    mode: string;
}

type OwnProps = RequiredModalProps & { files: File[] };

const ChmodFileModal = ({ files, ...props }: OwnProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    const submit = async ({ mode }: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        clearFlashes('files');

        await mutate(
            (data) =>
                data!.map((f) =>
                    f.name === files[0]?.file ? { ...f, mode: fileBitsToString(mode, !f.isFile), modeBits: mode } : f,
                ),
            false,
        );

        const data = files.map((f) => ({ file: f.file, mode: mode }));

        chmodFiles(uuid, directory, data)
            .then((): Promise<any> => (files.length > 0 ? mutate() : Promise.resolve()))
            .then(() => setSelectedFiles([]))
            .catch((error) => {
                mutate();
                setSubmitting(false);
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => props.onDismissed());
    };

    return (
        <Formik onSubmit={submit} initialValues={{ mode: files.length > 1 ? '' : (files[0]?.mode ?? '') }}>
            {({ isSubmitting }) => (
                <Modal
                    {...props}
                    title='Configure permissions'
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                >
                    <Form className={`w-full m-0`}>
                        <div className={`flex flex-col`}>
                            <div className={`w-full`}>
                                <Field
                                    type={'string'}
                                    id={'file_mode'}
                                    name={'mode'}
                                    label={'File Mode'}
                                    description={
                                        'This is intended for advanced users. You may irreperably damage your server by changing file permissions.'
                                    }
                                    autoFocus
                                />
                            </div>
                            <div className={`flex justify-end w-full my-6`}>
                                <Button>Update</Button>
                            </div>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default ChmodFileModal;
