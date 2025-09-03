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
                        errors.push(`${variable.name} debe contener texto.`);
                    }
                    break;

                case 'integer':
                case 'numeric':
                    if (value && isNaN(Number(value))) {
                        errors.push(`${variable.name} debe ser numérico.`);
                    }
                    break;

                case 'boolean': {
                    const boolValues = ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'];
                    if (value && !boolValues.includes(value.toLowerCase())) {
                        errors.push(`${variable.name} debe ser 'true' o 'false'.`);
                    }
                    break;
                }

                case 'min': {
                    if (ruleValue && value) {
                        const minValue = parseInt(ruleValue);
                        if (value.length < minValue) {
                            errors.push(`${variable.name} debe contener al menos ${minValue} caracteres.`);
                        }
                    }
                    break;
                }

                case 'max': {
                    if (ruleValue && value) {
                        const maxValue = parseInt(ruleValue);
                        if (value.length > maxValue) {
                            errors.push(`${variable.name} no puede exceder los ${maxValue} caracteres.`);
                        }
                    }
                    break;
                }

                case 'between': {
                    if (ruleValue && value) {
                        const [min, max] = ruleValue.split(',').map((v) => parseInt(v.trim()));
                        if (value.length < min || value.length > max) {
                            errors.push(`${variable.name} debe contener entre ${min} y ${max} caracteres.`);
                        }
                    }
                    break;
                }

                case 'in': {
                    if (ruleValue && value) {
                        const allowedValues = ruleValue.split(',').map((v) => v.trim());
                        if (!allowedValues.includes(value)) {
                            errors.push(`${variable.name} debe ser uno de los siguientes: ${allowedValues.join(', ')}.`);
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
                                    errors.push(`${variable.name} no tiene un formato válido.`);
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
                        errors.push(`${variable.name} solo puede contener letras.`);
                    }
                    break;

                case 'alpha_num':
                    if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
                        errors.push(`${variable.name} solo puede contener letras y números.`);
                    }
                    break;

                case 'alpha_dash':
                    if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
                        errors.push(`${variable.name} solo puede contener letras, números, guiones y guiones bajos.`);
                    }
                    break;

                case 'url':
                    if (value) {
                        try {
                            new URL(value);
                        } catch {
                            errors.push(`${variable.name} debe ser un enlace válido.`);
                        }
                    }
                    break;

                case 'email':
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push(`${variable.name} debe ser una dirección de correo válida.`);
                    }
                    break;

                case 'ip': {
                    if (value) {
                        const ipRegex =
                            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                        if (!ipRegex.test(value)) {
                            errors.push(`${variable.name} debe ser una dirección IP válida.`);
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

    // Flow control functions
    const resetFlow = () => {
        setCurrentStep('overview');
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
        setCurrentStep('select-software');
    };

    const handleEggSelection = async (egg: Egg) => {
        if (!selectedNest || !uuid) return;

        setIsLoading(true);
        setSelectedEgg(egg);

        try {
            const preview = await previewEggChange(uuid, egg.attributes.id, selectedNest.attributes.id);
            setEggPreview(preview);

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
                throw new Error(`Validación fallida:\n${validationErrors.join('\n')}`);
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

            toast.success('La operación de cambio de software se ha iniciado');

            // Reset the configuration flow but keep the modal open
            resetFlow();
        } catch (error) {
            console.error('La operación de cambio de software ha fallado:', error);
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
            toast.success('La configuración del software se ha aplicado correctamente');

            // Refresh server data to reflect changes
            mutate();
        } else if (operation.has_failed) {
            toast.error(operation.message || 'La configuración del software ha fallado');
        }
    };

    const handleOperationError = (error: Error) => {
        toast.error(error.message || 'Ha ocurrido un error al monitorizar la acción');
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
                            Mostrar más
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
                                    Mostrar menos
                                </button>
                            </>
                        )}
                    </>
                )}
            </p>
        );
    };

    const renderOverview = () => (
        <TitledGreyBox title='Software actual'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-[#ffffff11] rounded-lg flex items-center justify-center flex-shrink-0'>
                        <HugeIconsEggs fill='currentColor' className='w-5 h-5 sm:w-6 sm:h-6 text-neutral-300' />
                    </div>
                    <div className='min-w-0 flex-1'>
                        {currentEggName ? (
                            currentEggName.includes(blank_egg_prefix) ? (
                                <p className='text-amber-400 font-medium text-sm sm:text-base'>No has seleccionado el software</p>
                            ) : (
                                <p className='text-neutral-200 font-medium text-sm sm:text-base truncate'>
                                    {currentEggName}
                                </p>
                            )
                        ) : (
                            <div className='flex items-center gap-2'>
                                <Spinner size='small' />
                                <span className='text-neutral-400 text-sm'>Cargando...</span>
                            </div>
                        )}
                        <p className='text-xs sm:text-sm text-neutral-400 leading-relaxed'>
                            Administra la configuración de software de tu servidor
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
                        Cambiar software
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderGameSelection = () => (
        <TitledGreyBox title='Selecciona la categoría'>
            <div className='space-y-4'>
                <p className='text-sm text-neutral-400'>Selecciona la categoría del software</p>

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
                        Volver
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderSoftwareSelection = () => (
        <TitledGreyBox title={`Selecciona el software - ${selectedNest?.attributes.name}`}>
            <div className='space-y-4'>
                <p className='text-sm text-neutral-400'>Escoge la versión de software específica</p>

                {isLoading ? (
                    <div className='flex items-center justify-center py-16'>
                        <div className='flex flex-col items-center text-center'>
                            <Spinner size='large' />
                            <p className='text-neutral-400 mt-4'>Cargando opciones...</p>
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
                        Volver
                    </ActionButton>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setCurrentStep('overview')}
                        className='w-full sm:w-auto'
                    >
                        Cancelar
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
                            <h3 className='text-lg font-semibold text-neutral-200'>Configuración del Software</h3>
                            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                                <div>
                                    <label className='text-sm font-medium text-neutral-300 block mb-2'>
                                        Comando de inicio
                                    </label>
                                    <textarea
                                        value={customStartup}
                                        onChange={(e) => setCustomStartup(e.target.value)}
                                        placeholder='Introduce un comando personalizado...'
                                        rows={3}
                                        className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-brand transition-colors font-mono resize-none'
                                    />
                                    <p className='text-xs text-neutral-400 mt-1'>
                                        Puedes usar variables como{' '}
                                        {eggPreview.variables
                                            .map((v) => `{{${v.env_variable}}}`)
                                            .slice(0, 3)
                                            .join(', ')}
                                        {eggPreview.variables.length > 3 && ', etc.'}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm font-medium text-neutral-300 block mb-2'>
                                        Imagen de Docker
                                    </label>
                                    {eggPreview.docker_images && Object.keys(eggPreview.docker_images).length > 1 ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-brand transition-colors text-left flex items-center justify-between hover:border-[#ffffff20]'>
                                                    <span className='truncate'>
                                                        {selectedDockerImage || 'Selecciona una imagen...'}
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
                                                'Por defecto'}
                                        </div>
                                    )}
                                    <p className='text-xs text-neutral-400 mt-1'>
                                        El entorno de contenedor de tu servidor
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Environment Variables */}
                        {eggPreview.variables.length > 0 && (
                            <div className='space-y-4'>
                                <h3 className='text-lg font-semibold text-neutral-200'>Variables de entorno</h3>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                    {eggPreview.variables.map((variable) => (
                                        <div key={variable.env_variable} className='space-y-3'>
                                            <div>
                                                <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                                    {variable.name}
                                                    {!variable.user_editable && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded'>
                                                            Solo lectura
                                                        </span>
                                                    )}
                                                    {variable.user_editable && variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded'>
                                                            Requerido
                                                        </span>
                                                    )}
                                                    {variable.user_editable && !variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-neutral-500/20 text-neutral-400 rounded'>
                                                            Opcional
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
                                                        placeholder={variable.default_value || 'Introduce un valor...'}
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
                                                        'Sin establecer'}
                                                </div>
                                            )}

                                            <div className='flex justify-between text-xs'>
                                                <span className='text-neutral-500 font-mono'>
                                                    {variable.env_variable}
                                                </span>
                                                {variable.rules && (
                                                    <span className='text-neutral-500'>Reglas: {variable.rules}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-neutral-200'>Opciones de seguridad</h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label className='text-sm font-medium text-neutral-200 block mb-1'>
                                            Crear copia
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            {backupLimit > 0 && (backups?.backupCount || 0) < backupLimit
                                                ? 'Crear una copia de seguridad antes de aplicar los cambios'
                                                : 'Se ha alcanzado el límite de copias'}
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
                                            Borrar archivos
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            Borra todos los archivos antes de reinstalar el servidor
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
                        Volver
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        onClick={proceedToReview}
                        disabled={!eggPreview || isLoading}
                        className='w-full sm:w-auto'
                    >
                        {isLoading && <Spinner size='small' />}
                        Revisar cambios
                    </ActionButton>
                </div>
            </TitledGreyBox>
        </div>
    );

    const renderReview = () => (
        <div className='space-y-6'>
            <TitledGreyBox title='Revisa los cambios'>
                {selectedEgg && eggPreview && (
                    <div className='space-y-6'>
                        {/* Summary */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Resumen de los cambios</h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                                <div>
                                    <span className='text-neutral-400'>De:</span>
                                    <div className='text-neutral-200 font-medium'>
                                        {currentEggName || 'Sin software'}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>A:</span>
                                    <div className='text-brand font-medium'>{selectedEgg.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>Categoría:</span>
                                    <div className='text-neutral-200 font-medium'>{selectedNest?.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>Imagen de Docker:</span>
                                    <div className='text-neutral-200 font-medium text-xs'>
                                        {selectedDockerImage || 'Por defecto'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Startup Command Review */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Configuración de inicio</h3>
                            <div className='space-y-3'>
                                <div>
                                    <span className='text-neutral-400 text-sm'>Comando de inicio:</span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg font-mono text-sm text-neutral-200 whitespace-pre-wrap'>
                                        {customStartup || eggPreview.egg.startup}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400 text-sm'>Imagen de Docker:</span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200'>
                                        {selectedDockerImage || 'Por defecto'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Review */}
                        {eggPreview.variables.length > 0 && (
                            <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                                <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Configuración de variables</h3>
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
                                                    'Sin establecer'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options Review */}
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>Opciones de seguridad</h3>
                            <div className='space-y-2'>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>Crear copia</span>
                                    <span className={shouldBackup ? 'text-green-400' : 'text-neutral-400'}>
                                        {shouldBackup ? 'Sí' : 'No'}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>Borrar archivos</span>
                                    <span className={shouldWipe ? 'text-amber-400' : 'text-neutral-400'}>
                                        {shouldWipe ? 'Sí' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className='p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg'>
                            <div className='flex items-start gap-3'>
                                <HugeIconsAlert
                                    fill='currentColor'
                                    className='w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5'
                                />
                                <div>
                                    <h4 className='text-amber-400 font-semibold mb-2'>Aviso importante</h4>
                                    <ul className='text-sm text-neutral-300 space-y-1'>
                                        <li>• Tu servidor se detendrá y reinstalará</li>
                                        <li>• El proceso puede tardar varios minutos en completarse</li>
                                        <li>• Los archivos podrían ser modificados o eliminados durante el proceso</li>
                                        <li>• Asegúrate de tener una copia de seguridad</li>
                                    </ul>
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
                        Volver
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        onClick={applyChanges}
                        disabled={isLoading}
                        className='w-full sm:w-auto'
                    >
                        {isLoading && <Spinner size='small' />}
                        Aplicar
                    </ActionButton>
                </div>
            </TitledGreyBox>
        </div>
    );

    // Show loading state if server data is not available
    if (!serverData) {
        return (
            <ServerContentBlock title='Gestión del software'>
                <div className='flex items-center justify-center h-64'>
                    <div className='flex flex-col items-center text-center'>
                        <Spinner size='large' />
                        <p className='text-neutral-400 mt-4'>Cargando información...</p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title='Gestión del software'>
            <div className='space-y-6'>
                <MainPageHeader direction='column' title='Gestión del software'>
                    <p className='text-neutral-400 leading-relaxed'>
                        Cambia el software de tu servidor de manera simple
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
                                Paso{' '}
                                {['overview', 'select-game', 'select-software', 'configure', 'review'].indexOf(
                                    currentStep,
                                )}{' '}
                                de 4
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
                title='¿Eliminar todos los archivos sin hacer una copia?'
                buttonText={wipeCountdown > 0 ? `Sí, borra los archivos (${wipeCountdown}s)` : 'Sí, borra los archivos'}
                visible={showWipeConfirmation}
                onConfirmed={handleWipeConfirm}
                onModalDismissed={() => setShowWipeConfirmation(false)}
                disabled={wipeCountdown > 0}
                loading={wipeLoading}
            >
                <div className='space-y-4'>
                    <div className='flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                        <HugeIconsAlert fill='currentColor' className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' />
                        <div>
                            <h4 className='text-red-400 font-semibold mb-2'>AVISO: No has seleccionado una copia</h4>
                            <p className='text-sm text-neutral-300'>
                                Has escogido eliminar todos los archivos <strong>sin crear una copia</strong>. Esta
                                acción eliminará <strong>permanentemente</strong> TODOS los archivos de tu servidor.
                                No podrás volver atrás.
                            </p>
                        </div>
                    </div>
                    <div className='text-sm text-neutral-300 space-y-2'>
                        <p>
                            <strong>Lo que ocurrirá:</strong>
                        </p>
                        <ul className='list-disc list-inside space-y-1 ml-4'>
                            <li>Todos los archivos del servidor se eliminarán permanentemente</li>
                            <li>El servidor se detendrá y reinstalará</li>
                            <li>Cualquier configuración o información se perderá en el proceso</li>
                            <li>Esta acción es completamente irreversible</li>
                        </ul>
                    </div>
                    <p className='text-sm text-neutral-300'>
                        ¿Estás completamente seguro de continuar sin hacer una copia antes?
                    </p>
                </div>
            </ConfirmationModal>

            {/* Operation Progress Modal */}
            <OperationProgressModal
                visible={showOperationModal}
                operationId={currentOperationId}
                operationType='Cambio de software'
                onClose={closeOperationModal}
                onComplete={handleOperationComplete}
                onError={handleOperationError}
            />
        </ServerContentBlock>
    );
};

export default SoftwareContainer;