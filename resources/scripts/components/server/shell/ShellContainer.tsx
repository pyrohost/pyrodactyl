import { useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Switch } from '@/components/elements/SwitchV2';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsEggs from '@/components/elements/hugeicons/Egg';
import OperationProgressModal from '@/components/server/operations/OperationProgressModal';

import { httpErrorToHuman } from '@/api/http';
import getNests from '@/api/nests/getNests';
import applyEggChange from '@/api/server/applyEggChange';
import previewEggChange, { EggPreview } from '@/api/server/previewEggChange';
import { ServerOperation } from '@/api/server/serverOperations';
import getServerBackups from '@/api/swr/getServerBackups';
import getServerStartup from '@/api/swr/getServerStartup';

import { ServerContext } from '@/state/server';

import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

interface Egg {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        name: string;
        description: string;
    };
}

interface Nest {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        author: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        relationships: {
            eggs: {
                object: string;
                data: Egg[];
            };
        };
    };
}

const MAX_DESCRIPTION_LENGTH = 150;
const hidden_nest_prefix = '!';
const blank_egg_prefix = '@';
// const [ t ] = useTranslation();

type FlowStep = 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5';

// Laravel-style validation function
const validateEnvironmentVariables = (variables: any[], pendingVariables: Record<string, string>): string[] => {
    const errors: string[] = [];

    variables.forEach((variable) => {
        if (!variable.user_editable) return; // Skip non-editable variables

        const value = pendingVariables[variable.env_variable] || '';
        const rules = variable.rules || '';
        const ruleArray = rules
            .split('|')
            .map((rule) => rule.trim())
            .filter((rule) => rule.length > 0);

        // Check if variable is required (backend automatically adds nullable if not present)
        const isRequired = ruleArray.includes('required');
        const isNullable = ruleArray.includes('nullable') || !isRequired;

        // If required and empty/null
        if (isRequired && (!value || value.trim() === '')) {
            errors.push(`${variable.name} is required.`);
            return;
        }

        // If nullable and empty, skip other validations
        if (isNullable && (!value || value.trim() === '')) {
            return;
        }

        // Validate each rule
        ruleArray.forEach((rule) => {
            const [ruleName, ruleValue] = rule.split(':');

            switch (ruleName) {
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(`${variable.name} must be a string.`);
                    }
                    break;

                case 'integer':
                case 'numeric':
                    if (value && isNaN(Number(value))) {
                        errors.push(`${variable.name} must be a number.`);
                    }
                    break;

                case 'boolean': {
                    const boolValues = ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'];
                    if (value && !boolValues.includes(value.toLowerCase())) {
                        errors.push(`${variable.name} must be true or false.`);
                    }
                    break;
                }

                case 'min': {
                    if (ruleValue && value) {
                        const minValue = parseInt(ruleValue);
                        if (value.length < minValue) {
                            errors.push(`${variable.name} must be at least ${minValue} characters.`);
                        }
                    }
                    break;
                }

                case 'max': {
                    if (ruleValue && value) {
                        const maxValue = parseInt(ruleValue);
                        if (value.length > maxValue) {
                            errors.push(`${variable.name} may not be greater than ${maxValue} characters.`);
                        }
                    }
                    break;
                }

                case 'between': {
                    if (ruleValue && value) {
                        const [min, max] = ruleValue.split(',').map((v) => parseInt(v.trim()));
                        if (value.length < min || value.length > max) {
                            errors.push(`${variable.name} must be between ${min} and ${max} characters.`);
                        }
                    }
                    break;
                }

                case 'in': {
                    if (ruleValue && value) {
                        const allowedValues = ruleValue.split(',').map((v) => v.trim());
                        if (!allowedValues.includes(value)) {
                            errors.push(`${variable.name} must be one of: ${allowedValues.join(', ')}.`);
                        }
                    }
                    break;
                }

                case 'regex': {
                    if (ruleValue && value) {
                        try {
                            // Handle Laravel regex format: regex:/pattern/flags
                            const regexMatch = ruleValue.match(/^\/(.+)\/([gimuy]*)$/);
                            if (regexMatch) {
                                const regex = new RegExp(regexMatch[1], regexMatch[2]);
                                if (!regex.test(value)) {
                                    errors.push(`${variable.name} format is invalid.`);
                                }
                            }
                        } catch (e) {
                            // Invalid regex - skip validation
                        }
                    }
                    break;
                }

                case 'alpha':
                    if (value && !/^[a-zA-Z]+$/.test(value)) {
                        errors.push(`${variable.name} may only contain letters.`);
                    }
                    break;

                case 'alpha_num':
                    if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
                        errors.push(`${variable.name} may only contain letters and numbers.`);
                    }
                    break;

                case 'alpha_dash':
                    if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
                        errors.push(`${variable.name} may only contain letters, numbers, dashes and underscores.`);
                    }
                    break;

                case 'url':
                    if (value) {
                        try {
                            new URL(value);
                        } catch {
                            errors.push(`${variable.name} must be a valid URL.`);
                        }
                    }
                    break;

                case 'email':
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push(`${variable.name} must be a valid email address.`);
                    }
                    break;

                case 'ip': {
                    if (value) {
                        const ipRegex =
                            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                        if (!ipRegex.test(value)) {
                            errors.push(`${variable.name} must be a valid IP address.`);
                        }
                    }
                    break;
                }

                // Skip validation rules that don't apply to frontend
                case 'required':
                case 'nullable':
                case 'sometimes':
                    break;

                default:
                    // Unknown rule - log for debugging but don't error
                    if (
                        process.env.NODE_ENV === 'development' &&
                        !['string', 'array', 'file', 'image'].includes(ruleName)
                    ) {
                        console.warn(`Unknown validation rule: ${ruleName} for variable ${variable.name}`);
                    }
                    break;
            }
        });
    });

    return errors;
};

const SoftwareContainer = () => {
    const [t] = useTranslation();
    const serverData = ServerContext.useStoreState((state) => state.server.data);
    const uuid = serverData?.uuid;
    const [nests, setNests] = useState<Nest[]>();
    //const eggs = nests?.reduce(
    //    (eggArray, nest) => [...eggArray, ...nest.attributes.relationships.eggs.data],
    //    [] as Egg[],
    //);
    const currentEgg = serverData?.egg;
    //const originalEgg = currentEgg;
    const currentEggName = useMemo(() => {
        // Don't attempt calculation until both nests data and currentEgg are available
        if (!nests || !currentEgg) {
            return undefined;
        }

        const foundNest = nests.find((nest) =>
            nest?.attributes?.relationships?.eggs?.data?.find((egg) => egg?.attributes?.uuid === currentEgg),
        );

        return foundNest?.attributes?.relationships?.eggs?.data?.find((egg) => egg?.attributes?.uuid === currentEgg)
            ?.attributes?.name;
    }, [nests, currentEgg]);
    const backupLimit = serverData?.featureLimits.backups ?? 0;
    const { data: backups } = getServerBackups();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    // Flow state
    const [currentStep, setCurrentStep] = useState<FlowStep>('step-1');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [eggPreview, setEggPreview] = useState<EggPreview | null>(null);
    const [pendingVariables, setPendingVariables] = useState<Record<string, string>>({});
    const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});
    const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);
    const [showOperationModal, setShowOperationModal] = useState(false);
    const [showWipeConfirmation, setShowWipeConfirmation] = useState(false);
    const [wipeCountdown, setWipeCountdown] = useState(5);
    const [wipeLoading, setWipeLoading] = useState(false);
    const [shiftPressed, setShiftPressed] = useState(false);

    // Configuration options
    const [shouldBackup, setShouldBackup] = useState(false);
    const [shouldWipe, setShouldWipe] = useState(false);
    const [showFullDescriptions, setShowFullDescriptions] = useState<Record<string, boolean>>({});

    // Startup and Docker configuration
    const [customStartup, setCustomStartup] = useState('');
    const [selectedDockerImage, setSelectedDockerImage] = useState('');

    // Data loading
    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };
        fetchData();
    }, []);

    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data?.variables || [],
            invocation: server.data?.invocation || '',
            dockerImage: server.data?.dockerImage || '',
        }),
        isEqual,
    );

    const { data, mutate } = getServerStartup(uuid || '', {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
        rawStartupCommand: variables.invocation,
    });

    useDeepCompareEffect(() => {
        if (!data) return;
        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    // Initialize backup setting based on limits
    useEffect(() => {
        if (backups) {
            setShouldBackup(backupLimit > 0 && backups.backupCount < backupLimit);
        }
    }, [backups, backupLimit]);

    // Countdown effect for wipe confirmation modal
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showWipeConfirmation && wipeCountdown > 0) {
            interval = setInterval(() => {
                setWipeCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showWipeConfirmation, wipeCountdown]);

    // Reset countdown when wipe confirmation modal opens
    useEffect(() => {
        if (showWipeConfirmation) {
            setWipeCountdown(5);
        }
    }, [showWipeConfirmation]);

    const handleKeyDown = (event) => {
        if (event.shiftKey) setShiftPressed(true);
    };

    const handleKeyUp = (event) => {
        if (!event.shiftKey) setShiftPressed(false);
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    });

    // Flow control functions
    const resetFlow = () => {
        setCurrentStep('step-1');
        setSelectedNest(null);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setShouldBackup(backupLimit > 0 && (backups?.backupCount || 0) < backupLimit);
        setShouldWipe(false);
        setCustomStartup('');
        setSelectedDockerImage('');
    };

    const handleNestSelection = (nest: Nest) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setCustomStartup('');
        setSelectedDockerImage('');
        setCurrentStep('step-3');
    };

    const handleEggSelection = async (egg: Egg) => {
        if (!selectedNest || !uuid) return;

        setIsLoading(true);
        setSelectedEgg(egg);

        try {
            const preview = await previewEggChange(uuid, egg.attributes.id, selectedNest.attributes.id);
            setEggPreview(preview);

            // Check for subdomain compatibility warnings
            if (preview.warnings && preview.warnings.length > 0) {
                const subdomainWarning = preview.warnings.find((w) => w.type === 'subdomain_incompatible');
                if (subdomainWarning) {
                    toast.error(subdomainWarning.message, {
                        duration: 8000,
                        dismissible: true,
                    });
                }
            }

            // Initialize variables with current values or defaults
            const initialVariables: Record<string, string> = {};
            preview.variables.forEach((variable) => {
                const existingVar = data?.variables.find((v) => v.envVariable === variable.env_variable);
                initialVariables[variable.env_variable] = existingVar?.serverValue || variable.default_value || '';
            });
            setPendingVariables(initialVariables);

            // Set default startup command and docker image
            setCustomStartup(preview.egg.startup);

            // Automatically select the default docker image if available
            // Backend returns: {"Display Name": "actual/image:tag"}
            const availableDisplayNames = Object.keys(preview.docker_images || {});
            if (preview.default_docker_image && availableDisplayNames.includes(preview.default_docker_image)) {
                setSelectedDockerImage(preview.default_docker_image);
            } else if (availableDisplayNames.length > 0 && availableDisplayNames[0]) {
                setSelectedDockerImage(availableDisplayNames[0]);
            }

            setCurrentStep('step-4');
        } catch (error) {
            console.error(error);
            toast.error(httpErrorToHuman(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVariableChange = (envVariable: string, value: string) => {
        setPendingVariables((prev) => ({ ...prev, [envVariable]: value }));

        // Validate this specific variable in real-time and update errors
        if (eggPreview) {
            const variable = eggPreview.variables.find((v) => v.env_variable === envVariable);
            if (variable) {
                const errors = validateEnvironmentVariables([variable], { [envVariable]: value });
                setVariableErrors((prev) => {
                    const newErrors = { ...prev };
                    if (errors.length > 0 && errors[0]) {
                        newErrors[envVariable] = errors[0];
                    } else {
                        delete newErrors[envVariable];
                    }
                    return newErrors;
                });
            }
        }
    };

    const proceedToReview = () => {
        setCurrentStep('step-5');
    };

    const applyChanges = async () => {
        if (!selectedEgg || !selectedNest || !eggPreview) return;

        // Show final confirmation if wipe files is selected without backup
        if (shouldWipe && !shouldBackup) {
            setShowWipeConfirmation(true);
            return;
        }

        // Proceed with the operation
        executeApplyChanges();
    };

    const executeApplyChanges = async () => {
        if (!selectedEgg || !selectedNest || !eggPreview || !uuid) return;

        setIsLoading(true);

        try {
            // Validate all variables using Laravel-style validation rules
            const validationErrors = validateEnvironmentVariables(eggPreview.variables, pendingVariables);

            if (validationErrors.length > 0) {
                throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
            }

            // Convert display name back to actual image for backend
            const actualDockerImage =
                selectedDockerImage && eggPreview.docker_images
                    ? eggPreview.docker_images[selectedDockerImage]
                    : eggPreview.default_docker_image && eggPreview.docker_images
                      ? eggPreview.docker_images[eggPreview.default_docker_image]
                      : '';

            // Filter out empty environment variables to prevent validation issues
            const filteredEnvironment: Record<string, string> = {};
            Object.entries(pendingVariables).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    filteredEnvironment[key] = value;
                }
            });

            // Start the async operation
            const response = await applyEggChange(uuid, {
                egg_id: selectedEgg.attributes.id,
                nest_id: selectedNest.attributes.id,
                docker_image: actualDockerImage,
                startup_command: customStartup,
                environment: filteredEnvironment,
                should_backup: shouldBackup,
                should_wipe: shouldWipe,
            });

            // Operation started successfully - show progress modal
            setCurrentOperationId(response.operation_id);
            setShowOperationModal(true);

            toast.success('Software change operation started successfully');

            // Reset the configuration flow but keep the modal open
            resetFlow();
        } catch (error) {
            console.error('Failed to start egg change operation:', error);
            toast.error(httpErrorToHuman(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleWipeConfirm = () => {
        setShowWipeConfirmation(false);
        setWipeLoading(true);
        executeApplyChanges().finally(() => setWipeLoading(false));
    };

    const handleOperationComplete = (operation: ServerOperation) => {
        if (operation.is_completed) {
            toast.success('Your software configuration has been applied successfully');

            // Refresh server data to reflect changes
            mutate();
        } else if (operation.has_failed) {
            toast.error(operation.message || 'The software configuration change failed');
        }
    };

    const handleOperationError = (error: Error) => {
        toast.error(error.message || 'An error occurred while monitoring the operation');
    };

    const closeOperationModal = () => {
        setShowOperationModal(false);
        setCurrentOperationId(null);
    };

    const toggleDescription = (id: string) => {
        setShowFullDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderDescription = (description: string, id: string) => {
        const isLong = description.length > MAX_DESCRIPTION_LENGTH;
        const showFull = showFullDescriptions[id];

        return (
            <p className='text-sm text-neutral-400 leading-relaxed'>
                {isLong && !showFull ? (
                    <>
                        {description.slice(0, MAX_DESCRIPTION_LENGTH)}...{' '}
                        <button
                            onClick={() => toggleDescription(id)}
                            className='text-brand hover:underline font-medium'
                        >
                            Show more
                        </button>
                    </>
                ) : (
                    <>
                        {description}
                        {isLong && (
                            <>
                                {' '}
                                <button
                                    onClick={() => toggleDescription(id)}
                                    className='text-brand hover:underline font-medium'
                                >
                                    Show less
                                </button>
                            </>
                        )}
                    </>
                )}
            </p>
        );
    };

    const renderOverview = () => (
        <TitledGreyBox title={t('server.shell.current_software')}>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-[#ffffff11] rounded-lg flex items-center justify-center flex-shrink-0'>
                        <HugeIconsEggs fill='currentColor' className='w-5 h-5 sm:w-6 sm:h-6 text-neutral-300' />
                    </div>
                    <div className='min-w-0 flex-1'>
                        {currentEggName ? (
                            currentEggName.includes(blank_egg_prefix) ? (
                                <p className='text-amber-400 font-medium text-sm sm:text-base'>
                                    {t('sever.shell.no_software_selected')}
                                </p>
                            ) : (
                                <p className='text-neutral-200 font-medium text-sm sm:text-base truncate'>
                                    {currentEggName}
                                </p>
                            )
                        ) : (
                            <div className='flex items-center gap-2'>
                                <Spinner size='small' />
                                <span className='text-neutral-400 text-sm'>{t('loading')}</span>
                            </div>
                        )}
                        <p className='text-xs sm:text-sm text-neutral-400 leading-relaxed'>
                            {t('server.shell.manage_server_software')}
                        </p>
                    </div>
                </div>
                <div className='flex-shrink-0 w-full sm:w-auto'>
                    <ActionButton
                        variant='primary'
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                setCurrentStep('step-2');
                            } catch (error) {
                                console.error(t('server.shell.error_in_software_click'), error);
                            }
                        }}
                        className='w-full sm:w-auto'
                        disabled={isLoading}
                    >
                        {isLoading && <Spinner size='small' />}
                        {t('server.shell.change_software')}
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderGameSelection = () => (
        <TitledGreyBox title={t('server.shell.select_category')}>
            <div className='space-y-4'>
                <p className='text-sm text-neutral-400'>{t('server.shell.type_of_software')}</p>

                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4'>
                    {nests?.map((nest) =>
                        nest?.attributes?.name?.includes(hidden_nest_prefix) ? null : (
                            <button
                                key={nest?.attributes?.uuid}
                                onClick={() => handleNestSelection(nest)}
                                className='p-4 sm:p-5 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-all text-left active:bg-[#ffffff12] touch-manipulation'
                            >
                                <h3 className='font-semibold text-neutral-200 mb-2 text-base sm:text-lg'>
                                    {nest?.attributes?.name}
                                </h3>
                                {renderDescription(
                                    nest?.attributes?.description || '',
                                    `nest-${nest?.attributes?.uuid}`,
                                )}
                            </button>
                        ),
                    )}
                </div>

                <div className='flex justify-center pt-4'>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('step-1')}
                        className='w-full sm:w-auto'
                    >
                        {t('server.shell.back_to_overview')}
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderSoftwareSelection = () => (
        <TitledGreyBox title={`Select Software - ${selectedNest?.attributes.name}`}>
            <div className='space-y-4'>
                <p className='text-sm text-neutral-400'>{t('server.shell.software_version')}</p>

                {isLoading ? (
                    <div className='flex items-center justify-center py-16'>
                        <div className='flex flex-col items-center text-center'>
                            <Spinner size='large' />
                            <p className='text-neutral-400 mt-4'>{t('server.shell.load_software')}</p>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                        {selectedNest?.attributes?.relationships?.eggs?.data?.map((egg) => (
                            <button
                                key={egg.attributes.uuid}
                                onClick={() => handleEggSelection(egg)}
                                disabled={isLoading}
                                className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-all text-left touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <div className='flex items-center gap-2 mb-2'>
                                    {isLoading && selectedEgg?.attributes?.uuid === egg?.attributes?.uuid && (
                                        <Spinner size='small' />
                                    )}
                                    <h3 className='font-semibold text-neutral-200 text-sm sm:text-base'>
                                        {egg?.attributes?.name}
                                    </h3>
                                </div>
                                {renderDescription(egg?.attributes?.description || '', `egg-${egg?.attributes?.uuid}`)}
                            </button>
                        ))}
                    </div>
                )}

                <div className='flex flex-col sm:flex-row justify-center gap-3 pt-4'>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('step-2')}
                        className='w-full sm:w-auto'
                    >
                        {t('server.shell.back_to_games')}
                    </ActionButton>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('step-1')}
                        className='w-full sm:w-auto'
                    >
                        {t('cancel')}
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderConfiguration = () => (
        <div className='space-y-6'>
            <TitledGreyBox title={`Configure ${selectedEgg?.attributes.name}`}>
                {eggPreview && (
                    <div className='space-y-6'>
                        {/* Software Configuration */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-neutral-200'>
                                {t('server.shell.software_config')}
                            </h3>
                            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                                <div>
                                    <label className='text-sm font-medium text-neutral-300 block mb-2'>
                                        Startup Command
                                    </label>
                                    <textarea
                                        value={customStartup}
                                        onChange={(e) => setCustomStartup(e.target.value)}
                                        placeholder={t('server.shell.custom_startup')}
                                        rows={3}
                                        className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-brand transition-colors font-mono resize-none'
                                    />
                                    <p className='text-xs text-neutral-400 mt-1'>
                                        {t('server.shell.use_var_like')}{' '}
                                        {eggPreview.variables
                                            .map((v) => `{{${v.env_variable}}}`)
                                            .slice(0, 3)
                                            .join(', ')}
                                        {eggPreview.variables.length > 3 && ', etc.'}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm font-medium text-neutral-300 block mb-2'>
                                        {t('server.shell.docker_image')}
                                    </label>
                                    {eggPreview.docker_images && Object.keys(eggPreview.docker_images).length > 1 ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-brand transition-colors text-left flex items-center justify-between hover:border-[#ffffff20]'>
                                                    <span className='truncate'>
                                                        {selectedDockerImage || 'Select image...'}
                                                    </span>
                                                    <svg
                                                        className='w-4 h-4 text-neutral-400 flex-shrink-0'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M19 9l-7 7-7-7'
                                                        />
                                                    </svg>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className='w-full min-w-[300px]'>
                                                <DropdownMenuRadioGroup
                                                    value={selectedDockerImage}
                                                    onValueChange={setSelectedDockerImage}
                                                >
                                                    {Object.entries(eggPreview.docker_images).map(
                                                        ([displayName, _]) => (
                                                            <DropdownMenuRadioItem
                                                                key={displayName}
                                                                value={displayName}
                                                                className='text-sm font-mono'
                                                            >
                                                                <span>{displayName}</span>
                                                            </DropdownMenuRadioItem>
                                                        ),
                                                    )}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <div className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200'>
                                            {(eggPreview.docker_images && Object.keys(eggPreview.docker_images)[0]) ||
                                                'Default Image'}
                                        </div>
                                    )}
                                    <p className='text-xs text-neutral-400 mt-1'>{t('server.shell.runtime_env')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Environment Variables */}
                        {eggPreview.variables.length > 0 && (
                            <div className='space-y-4'>
                                <h3 className='text-lg font-semibold text-neutral-200'>
                                    {t('server.shell.env_variables')}
                                </h3>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                    {eggPreview.variables.map((variable) => (
                                        <div key={variable.env_variable} className='space-y-3'>
                                            <div>
                                                <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                                    {variable.name}
                                                    {!variable.user_editable && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded'>
                                                            {t('read_only')}
                                                        </span>
                                                    )}
                                                    {variable.user_editable && variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded'>
                                                            {t('required')}
                                                        </span>
                                                    )}
                                                    {variable.user_editable && !variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-neutral-500/20 text-neutral-400 rounded'>
                                                            {t('optional')}
                                                        </span>
                                                    )}
                                                </label>
                                                {variable.description && (
                                                    <p className='text-xs text-neutral-400 mb-2'>
                                                        {variable.description}
                                                    </p>
                                                )}
                                            </div>

                                            {variable.user_editable ? (
                                                <div>
                                                    <input
                                                        type='text'
                                                        value={pendingVariables[variable.env_variable] || ''}
                                                        onChange={(e) =>
                                                            handleVariableChange(variable.env_variable, e.target.value)
                                                        }
                                                        placeholder={variable.default_value || t('common.enter_value')}
                                                        className={`w-full px-3 py-2 bg-[#ffffff08] border rounded-lg text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none transition-colors ${
                                                            variableErrors[variable.env_variable]
                                                                ? 'border-red-500 focus:border-red-500'
                                                                : 'border-[#ffffff12] focus:border-brand'
                                                        }`}
                                                    />
                                                    {variableErrors[variable.env_variable] && (
                                                        <p className='text-xs text-red-400 mt-1'>
                                                            {variableErrors[variable.env_variable]}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='w-full px-3 py-2 bg-[#ffffff04] border border-[#ffffff08] rounded-lg text-sm text-neutral-300 font-mono'>
                                                    {pendingVariables[variable.env_variable] ||
                                                        variable.default_value ||
                                                        t('common.not_set')}
                                                </div>
                                            )}

                                            <div className='flex justify-between text-xs'>
                                                <span className='text-neutral-500 font-mono'>
                                                    {variable.env_variable}
                                                </span>
                                                {variable.rules && (
                                                    <span className='text-neutral-500'>
                                                        {t('common.rules')}: {variable.rules}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-neutral-200'>
                                {t('server.shell.safety_options')}
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                            {t('server.shell.create_backup')}
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            {backupLimit > 0 && (backups?.backupCount || 0) < backupLimit
                                                ? 'Automatically create a backup before applying changes'
                                                : 'Backup limit reached or not available'}
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch
                                            checked={shouldBackup}
                                            onCheckedChange={setShouldBackup}
                                            disabled={backupLimit <= 0 || (backups?.backupCount || 0) >= backupLimit}
                                        />
                                    </div>
                                </div>

                                <div className='flex items-center justify-between p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                            {t('server.shell.wipe_files')}
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            {t('server.shell.wipe_description')}
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch checked={shouldWipe} onCheckedChange={setShouldWipe} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='flex flex-col sm:flex-row justify-center gap-3 pt-4'>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('step-3')}
                        className='w-full sm:w-auto'
                    >
                        {t('server.shell.back_to_software')}
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        onClick={proceedToReview}
                        disabled={!eggPreview || isLoading}
                        className='w-full sm:w-auto'
                    >
                        {isLoading && <Spinner size='small' />}
                        {t('server.shell.review_changes')}
                    </ActionButton>
                </div>
            </TitledGreyBox>
        </div>
    );

    const renderReview = () => (
        <div className='space-y-6'>
            <TitledGreyBox title='Review Changes'>
                {selectedEgg && eggPreview && (
                    <div className='space-y-6'>
                        {/* Summary */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Change Summary</h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                                <div>
                                    <span className='text-neutral-400'>From:</span>
                                    <div className='text-neutral-200 font-medium'>
                                        {currentEggName || t('server.shell.no_software')}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>{t('to')}:</span>
                                    <div className='text-brand font-medium'>{selectedEgg.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>{t('category')}:</span>
                                    <div className='text-neutral-200 font-medium'>{selectedNest?.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>{t('server.shell.docker_image')}:</span>
                                    <div className='text-neutral-200 font-medium text-xs'>
                                        {selectedDockerImage || 'Default'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Startup Command Review */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>
                                {t('server.shell.startup_config')}
                            </h3>
                            <div className='space-y-3'>
                                <div>
                                    <span className='text-neutral-400 text-sm'>
                                        {t('server.shell.startup_command')}:
                                    </span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg font-mono text-sm text-neutral-200 whitespace-pre-wrap'>
                                        {customStartup || eggPreview.egg.startup}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400 text-sm'>{t('server.shell.docker_image')}:</span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200'>
                                        {selectedDockerImage || 'Default Image'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Review */}
                        {eggPreview.variables.length > 0 && (
                            <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                                <h3 className='text-lg font-semibold text-neutral-200 mb-4'>
                                    {t('server.shell.variable_config')}
                                </h3>
                                <div className='space-y-2'>
                                    {eggPreview.variables.map((variable) => (
                                        <div
                                            key={variable.env_variable}
                                            className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'
                                        >
                                            <div>
                                                <span className='text-neutral-200 font-medium'>{variable.name}</span>
                                                <span className='text-neutral-500 text-sm ml-2 font-mono'>
                                                    ({variable.env_variable})
                                                </span>
                                            </div>
                                            <div className='text-brand font-mono text-sm'>
                                                {pendingVariables[variable.env_variable] ||
                                                    variable.default_value ||
                                                    t('common.not_set')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options Review */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>
                                {t('server.shell.safety_options')}
                            </h3>
                            <div className='space-y-2'>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>{t('server.shell.create_backup')}</span>
                                    <span className={shouldBackup ? 'text-green-400' : 'text-neutral-400'}>
                                        {shouldBackup ? t('yes') : t('no')}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>{t('server.shell.wipe_files')}</span>
                                    <span className={shouldWipe ? 'text-amber-400' : 'text-neutral-400'}>
                                        {shouldWipe ? t('yes') : t('no')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Subdomain Warnings */}
                        {eggPreview.warnings && eggPreview.warnings.length > 0 && (
                            <div className='space-y-3'>
                                {eggPreview.warnings.map((warning, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg ${
                                            warning.severity === 'error'
                                                ? 'bg-red-500/10 border-red-500/20'
                                                : 'bg-amber-500/10 border-amber-500/20'
                                        }`}
                                    >
                                        <div className='flex items-start gap-3'>
                                            <HugeIconsAlert
                                                fill='currentColor'
                                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                                    warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                }`}
                                            />
                                            <div>
                                                <h4
                                                    className={`font-semibold mb-2 ${
                                                        warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                    }`}
                                                >
                                                    {warning.type === 'subdomain_incompatible'
                                                        ? t('server.shell.subdomain_incompatible')
                                                        : t('warning')}
                                                </h4>
                                                <p className='text-sm text-neutral-300'>{warning.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* General Warning */}
                        <div className='p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg'>
                            <div className='flex items-start gap-3'>
                                <HugeIconsAlert
                                    fill='currentColor'
                                    className='w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5'
                                />
                                <div>
                                    <h4 className='text-amber-400 font-semibold mb-2'>
                                        {t('server.shell.important_warning')}
                                    </h4>
                                    <ul className='text-sm text-neutral-300 space-y-1'>
                                        <li>• {t('server.shell.warning_1')}</li>
                                        <li>• {t('server.shell.warning_2')}</li>
                                        <li>• {t('server.shell.warning_3')}</li>
                                        <li>• {t('server.shell.warning_4')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='flex flex-col sm:flex-row justify-center gap-3 pt-4'>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('step-4')}
                        className='w-full sm:w-auto'
                    >
                        {t('server.shell.back_to_configure')}
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        onClick={applyChanges}
                        disabled={isLoading}
                        className='w-full sm:w-auto'
                    >
                        {isLoading && <Spinner size='small' />}
                        {t('server.shell.apply_changes')}
                    </ActionButton>
                </div>
            </TitledGreyBox>
        </div>
    );

    // Show loading state if server data is not available
    if (!serverData) {
        return (
            <ServerContentBlock title={t('server.shell.software_management')}>
                <div className='flex items-center justify-center h-64'>
                    <div className='flex flex-col items-center text-center'>
                        <Spinner size='large' />
                        <p className='text-neutral-400 mt-4'>{t('server.shell.loading_server_info')}</p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={t('server.shell.software_management')}>
            <div className='space-y-6'>
                <MainPageHeader direction='column' title={t('server.shell.software_management')}>
                    <p className='text-neutral-400 leading-relaxed'>{t('server.shell.change_server_software_memo')}</p>
                </MainPageHeader>

                {/* Progress indicator */}
                {currentStep !== t('server.shell.step_1') && (
                    <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm font-medium text-neutral-200 capitalize'>
                                {t(`server.shell.${currentStep.replace('-', '_')}`)}
                            </span>
                            <span className='text-sm text-neutral-400'>
                                Step {['step-1', 'step-2', 'step-3', 'step-4', 'step-5'].indexOf(currentStep)}{' '}
                                {t('server.shell.of_four')}
                            </span>
                        </div>
                        <div className='w-full bg-[#ffffff12] rounded-full h-2'>
                            <div
                                className='bg-brand h-2 rounded-full transition-all duration-300'
                                style={{
                                    width: `${(['step-1', 'step-2', 'step-3', 'step-4', 'step-5'].indexOf(currentStep) / 4) * 100}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                {currentStep === 'step-1' && renderOverview()}
                {currentStep === 'step-2' && renderGameSelection()}
                {currentStep === 'step-3' && renderSoftwareSelection()}
                {currentStep === 'step-4' && renderConfiguration()}
                {currentStep === 'step-5' && renderReview()}
            </div>

            {/* Wipe Files Confirmation Modal */}
            <ConfirmationModal
                title='Wipe All Files Without Backup?'
                buttonText={wipeCountdown > 0 ? `Yes, Wipe Files (${wipeCountdown}s)` : 'Yes, Wipe Files'}
                visible={showWipeConfirmation}
                onConfirmed={handleWipeConfirm}
                onModalDismissed={() => setShowWipeConfirmation(false)}
                disabled={wipeCountdown > 0 && !shiftPressed}
                loading={wipeLoading}
            >
                <div className='space-y-4'>
                    <div className='flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                        <HugeIconsAlert fill='currentColor' className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' />
                        <div>
                            <h4 className='text-red-400 font-semibold mb-2'>{t('server.shell.no_backup_selected')}</h4>
                            <p className='text-sm text-neutral-300'>{t('server.shell.wipe_no_backup')}</p>
                        </div>
                    </div>
                    <div className='text-sm text-neutral-300 space-y-2'>
                        <p>
                            <strong>What will happen:</strong>
                        </p>
                        <ul className='list-disc list-inside space-y-1 ml-4'>
                            <li>{t('server.shell.last_warn_1')}</li>
                            <li>{t('server.shell.last_warn_2')}</li>
                            <li>{t('server.shell.last_warn_3')}</li>
                            <li>{t('server.shell.last_warn_4')}</li>
                        </ul>
                    </div>
                    <p className='text-sm text-neutral-300'>{t('server.shell.last_chance')}</p>
                </div>
            </ConfirmationModal>

            {/* Operation Progress Modal */}
            <OperationProgressModal
                visible={showOperationModal}
                operationId={currentOperationId}
                operationType='Software Change'
                onClose={closeOperationModal}
                onComplete={handleOperationComplete}
                onError={handleOperationError}
            />
        </ServerContentBlock>
    );
};

export default SoftwareContainer;
