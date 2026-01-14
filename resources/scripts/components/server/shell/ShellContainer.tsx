import { Box, TriangleExclamation } from '@gravity-ui/icons';
import { useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
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
import OperationProgressModal from '@/components/server/operations/OperationProgressModal';
import WingsOperationProgressModal from '@/components/server/operations/WingsOperationProgressModal';

import { httpErrorToHuman } from '@/api/http';
import getNests from '@/api/nests/getNests';
import applyEggChange from '@/api/server/applyEggChange';
import applyEggChangeSync from '@/api/server/applyEggChangeSync';
import { getGlobalDaemonType } from '@/api/server/getServer';
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

type FlowStep = 'overview' | 'select-game' | 'select-software' | 'configure' | 'review';

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
    const serverData = ServerContext.useStoreState((state) => state.server.data);
    const daemonType = getGlobalDaemonType();
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
    const backupLimit = serverData?.featureLimits.backups;

    const { data: backups } = getServerBackups();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    // Flow state
    const [currentStep, setCurrentStep] = useState<FlowStep>('overview');
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
            // null = unlimited, 0 = disabled, positive number = cap
            setShouldBackup(backupLimit !== 0 && (backupLimit === null || backups.backupCount < backupLimit));
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
        setCurrentStep('overview');
        setSelectedNest(null);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setShouldBackup(backupLimit !== 0 && (backupLimit === null || (backups?.backupCount || 0) < backupLimit));
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
        setCurrentStep('select-software');
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

            setCurrentStep('configure');
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
        setCurrentStep('review');
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

            if (daemonType?.toLowerCase() == 'elytra') {
                const response = await applyEggChange(uuid, {
                    egg_id: selectedEgg.attributes.id,
                    nest_id: selectedNest.attributes.id,
                    docker_image: actualDockerImage,
                    startup_command: customStartup,
                    environment: filteredEnvironment,
                    should_backup: shouldBackup,
                    should_wipe: shouldWipe,
                });

                setCurrentOperationId(response.operation_id);

                setShowOperationModal(true);
            } else if (daemonType?.toLowerCase() == 'wings') {
                await applyEggChangeSync(uuid, {
                    egg_id: selectedEgg.attributes.id,
                    nest_id: selectedNest.attributes.id,
                    docker_image: actualDockerImage,
                    startup_command: customStartup,
                    environment: filteredEnvironment,
                    should_backup: shouldBackup,
                    should_wipe: shouldWipe,
                });
            }

            toast.success('Software change operation started successfully');

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
        <TitledGreyBox title='Current Software'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-[#ffffff11] rounded-lg flex items-center justify-center flex-shrink-0'>
                        <Box
                            width={22}
                            height={22}
                            fill='currentColor'
                            className='w-5 h-5 sm:w-6 sm:h-6 text-neutral-300'
                        />
                    </div>
                    <div className='min-w-0 flex-1'>
                        {currentEggName ? (
                            currentEggName.includes(blank_egg_prefix) ? (
                                <p className='text-amber-400 font-medium text-sm sm:text-base'>No software selected</p>
                            ) : (
                                <p className='text-neutral-200 font-medium text-sm sm:text-base truncate'>
                                    {currentEggName}
                                </p>
                            )
                        ) : (
                            <div className='flex items-center gap-2'>
                                <Spinner size='small' />
                                <span className='text-neutral-400 text-sm'>Loading...</span>
                            </div>
                        )}
                        <p className='text-xs sm:text-sm text-neutral-400 leading-relaxed'>
                            Manage your server&apos;s game or software configuration
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
                                setCurrentStep('select-game');
                            } catch (error) {
                                console.error('Error in change software click:', error);
                            }
                        }}
                        className='w-full sm:w-auto'
                        disabled={isLoading}
                    >
                        {isLoading && <Spinner size='small' />}
                        Change Software
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderGameSelection = () => (
        <TitledGreyBox title='Select Category'>
            <div className='space-y-4'>
                <p className='text-sm text-neutral-400'>Choose the type of game or software you want to run</p>

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
                        onClick={() => setCurrentStep('overview')}
                        className='w-full sm:w-auto'
                    >
                        Back to Overview
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderSoftwareSelection = () => (
        <TitledGreyBox title={`Select Software - ${selectedNest?.attributes.name}`}>
            <div className='space-y-4'>
                <p className='text-sm text-neutral-400'>Choose the specific software version for your server</p>

                {isLoading ? (
                    <div className='flex items-center justify-center py-16'>
                        <div className='flex flex-col items-center text-center'>
                            <Spinner size='large' />
                            <p className='text-neutral-400 mt-4'>Loading software options...</p>
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
                        onClick={() => setCurrentStep('select-game')}
                        className='w-full sm:w-auto'
                    >
                        Back to Games
                    </ActionButton>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('overview')}
                        className='w-full sm:w-auto'
                    >
                        Cancel
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
                            <h3 className='text-lg font-semibold text-neutral-200'>Software Configuration</h3>
                            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                                <div>
                                    <label className='text-sm font-medium text-neutral-300 block mb-2'>
                                        Startup Command
                                    </label>
                                    <textarea
                                        value={customStartup}
                                        onChange={(e) => setCustomStartup(e.target.value)}
                                        placeholder='Enter custom startup command...'
                                        rows={3}
                                        className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-brand transition-colors font-mono resize-none'
                                    />
                                    <p className='text-xs text-neutral-400 mt-1'>
                                        Use variables like{' '}
                                        {eggPreview.variables
                                            .map((v) => `{{${v.env_variable}}}`)
                                            .slice(0, 3)
                                            .join(', ')}
                                        {eggPreview.variables.length > 3 && ', etc.'}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm font-medium text-neutral-300 block mb-2'>
                                        Docker Image
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
                                    <p className='text-xs text-neutral-400 mt-1'>
                                        Container runtime environment for your server
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Environment Variables */}
                        {eggPreview.variables.length > 0 && (
                            <div className='space-y-4'>
                                <h3 className='text-lg font-semibold text-neutral-200'>Environment Variables</h3>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                    {eggPreview.variables.map((variable) => (
                                        <div key={variable.env_variable} className='space-y-3'>
                                            <div>
                                                <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                                    {variable.name}
                                                    {!variable.user_editable && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded'>
                                                            Read-only
                                                        </span>
                                                    )}
                                                    {variable.user_editable && variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded'>
                                                            Required
                                                        </span>
                                                    )}
                                                    {variable.user_editable && !variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-neutral-500/20 text-neutral-400 rounded'>
                                                            Optional
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
                                                        placeholder={variable.default_value || 'Enter value...'}
                                                        className={`w-full px-3 py-2 bg-[#ffffff08] border rounded-lg text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none transition-colors ${variableErrors[variable.env_variable]
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
                                                        'Not set'}
                                                </div>
                                            )}

                                            <div className='flex justify-between text-xs'>
                                                <span className='text-neutral-500 font-mono'>
                                                    {variable.env_variable}
                                                </span>
                                                {variable.rules && (
                                                    <span className='text-neutral-500'>Rules: {variable.rules}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-neutral-200'>Safety Options</h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                            Create Backup
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            {backupLimit !== 0 &&
                                                (backupLimit === null || (backups?.backupCount || 0) < backupLimit)
                                                ? 'Automatically create a backup before applying changes'
                                                : backupLimit === 0
                                                    ? 'Backups are disabled for this server'
                                                    : 'Backup limit reached'}
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch
                                            checked={shouldBackup}
                                            onCheckedChange={setShouldBackup}
                                            disabled={
                                                backupLimit === 0 ||
                                                (backupLimit !== null && (backups?.backupCount || 0) >= backupLimit)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className='flex items-center justify-between p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                            Wipe Files
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            Delete all files before installing new software
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
                        onClick={() => setCurrentStep('select-software')}
                        className='w-full sm:w-auto'
                    >
                        Back to Software
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        onClick={proceedToReview}
                        disabled={!eggPreview || isLoading}
                        className='w-full sm:w-auto'
                    >
                        {isLoading && <Spinner size='small' />}
                        Review Changes
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
                                        {currentEggName || 'No software'}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>To:</span>
                                    <div className='text-brand font-medium'>{selectedEgg.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>Category:</span>
                                    <div className='text-neutral-200 font-medium'>{selectedNest?.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>Docker Image:</span>
                                    <div className='text-neutral-200 font-medium'>
                                        {selectedDockerImage || 'Default'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Startup Command Review */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Startup Configuration</h3>
                            <div className='space-y-3'>
                                <div>
                                    <span className='text-neutral-400 text-sm'>Startup Command:</span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg font-mono text-sm text-neutral-200 whitespace-pre-wrap'>
                                        {customStartup || eggPreview.egg.startup}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400 text-sm'>Docker Image:</span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200'>
                                        {selectedDockerImage || 'Default Image'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Review */}
                        {eggPreview.variables.length > 0 && (
                            <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                                <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Variable Configuration</h3>
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
                                                    'Not set'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options Review */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Safety Options</h3>
                            <div className='space-y-2'>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>Create Backup</span>
                                    <span className={shouldBackup ? 'text-green-400' : 'text-neutral-400'}>
                                        {shouldBackup ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>Wipe Files</span>
                                    <span className={shouldWipe ? 'text-amber-400' : 'text-neutral-400'}>
                                        {shouldWipe ? 'Yes' : 'No'}
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
                                        className={`p-4 border rounded-lg ${warning.severity === 'error'
                                            ? 'bg-red-500/10 border-red-500/20'
                                            : 'bg-amber-500/10 border-amber-500/20'
                                            }`}
                                    >
                                        <div className='flex items-start gap-3'>
                                            <TriangleExclamation
                                                width={22}
                                                height={22}
                                                fill='currentColor'
                                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                    }`}
                                            />
                                            <div>
                                                <h4
                                                    className={`font-semibold mb-2 ${warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                        }`}
                                                >
                                                    {warning.type === 'subdomain_incompatible'
                                                        ? 'Subdomain Will Be Deleted'
                                                        : 'Warning'}
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
                                <TriangleExclamation
                                    width={22}
                                    height={22}
                                    fill='currentColor'
                                    className='w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5'
                                />
                                <div>
                                    <h4 className='text-amber-400 font-semibold mb-2'>This will:</h4>
                                    <ul className='text-sm text-neutral-300'>
                                        <li>• Stop and reinstall your server</li>
                                        <li>• Take several minutes to complete</li>
                                        <li>• Modify and remove some files</li>
                                    </ul>
                                    <span className='text-sm font-bold mt-4'>
                                        Please ensure you have backups of important data before proceeding.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='flex flex-col sm:flex-row justify-center gap-3 pt-4'>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('configure')}
                        className='w-full sm:w-auto'
                    >
                        Back to Configure
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        onClick={applyChanges}
                        disabled={isLoading}
                        className='w-full sm:w-auto'
                    >
                        {isLoading && <Spinner size='small' />}
                        Apply Changes
                    </ActionButton>
                </div>
            </TitledGreyBox>
        </div>
    );

    // Show loading state if server data is not available
    if (!serverData) {
        return (
            <ServerContentBlock title='Software Management'>
                <div className='flex items-center justify-center h-64'>
                    <div className='flex flex-col items-center text-center'>
                        <Spinner size='large' />
                        <p className='text-neutral-400 mt-4'>Loading server information...</p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }
    function RenderOperationModal() {
        if (daemonType == 'elytra') {
            return (
                <OperationProgressModal
                    visible={showOperationModal}
                    operationId={currentOperationId}
                    operationType='Software Change'
                    onClose={closeOperationModal}
                    onComplete={handleOperationComplete}
                    onError={handleOperationError}
                />
            );
        }
        if (daemonType == 'wings') {
            return (
                <WingsOperationProgressModal
                    visible={showOperationModal}
                    operationId={currentOperationId}
                    operationType='Software Change'
                    onClose={closeOperationModal}
                    onComplete={handleOperationComplete}
                    onError={handleOperationError}
                />
            );
        }
        return <div>Could not find Operation Modal for this daemon: Using ${daemonType}</div>;
    }
    return (
        <ServerContentBlock title='Software Management'>
            <div className='space-y-6'>
                <MainPageHeader direction='column' title='Software Management'>
                    <p className='text-neutral-400 leading-relaxed'>
                        Change your server&apos;s game or software with our guided configuration wizard
                    </p>
                </MainPageHeader>

                {/* Progress indicator */}
                {currentStep !== 'overview' && (
                    <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm font-medium text-neutral-200 capitalize'>
                                {currentStep.replace('-', ' ')}
                            </span>
                            <span className='text-sm text-neutral-400'>
                                Step{' '}
                                {['overview', 'select-game', 'select-software', 'configure', 'review'].indexOf(
                                    currentStep,
                                )}{' '}
                                of 4
                            </span>
                        </div>
                        <div className='w-full bg-[#ffffff12] rounded-full h-2'>
                            <div
                                className='bg-brand h-2 rounded-full transition-all duration-300'
                                style={{
                                    width: `${(['overview', 'select-game', 'select-software', 'configure', 'review'].indexOf(currentStep) / 4) * 100}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                {currentStep === 'overview' && renderOverview()}
                {currentStep === 'select-game' && renderGameSelection()}
                {currentStep === 'select-software' && renderSoftwareSelection()}
                {currentStep === 'configure' && renderConfiguration()}
                {currentStep === 'review' && renderReview()}
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
                        <TriangleExclamation
                            width={22}
                            height={22}
                            fill='currentColor'
                            className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5'
                        />
                        <div>
                            <h4 className='text-red-400 font-semibold mb-2'>DANGER: No Backup Selected</h4>
                            <p className='text-sm text-neutral-300'>
                                You have chosen to wipe all files <strong>without creating a backup</strong>. This
                                action will <strong>permanently delete ALL files</strong> on your server and cannot be
                                undone.
                            </p>
                        </div>
                    </div>
                    <div className='text-sm text-neutral-300 space-y-2'>
                        <p>
                            <strong>What will happen:</strong>
                        </p>
                        <ul className='list-disc list-inside space-y-1 ml-4'>
                            <li>All server files will be permanently deleted</li>
                            <li>Your server will be stopped and reinstalled</li>
                            <li>Any custom configurations or data will be lost</li>
                            <li>This action cannot be reversed</li>
                        </ul>
                    </div>
                    <p className='text-sm text-neutral-300'>
                        Are you absolutely sure you want to proceed without a backup?
                    </p>
                </div>
            </ConfirmationModal>

            {/* Operation Progress Modal */}
            {RenderOperationModal()}
        </ServerContentBlock>
    );
};

export default SoftwareContainer;
