import React, { useState, useRef, useEffect } from 'react';
import { FieldProps, Field as FormikField } from 'formik';
import { forwardRef } from 'react';

interface Option {
    id: number;
    name: string;
}

interface OwnProps {
    name: string;
    label?: string;
    description?: string;
    validate?: (value: any) => undefined | string | Promise<any>;
    placeholder?: string;
    suffix?: string;
    options: Option[];
    selectedOptionId: number;
    onOptionChange: (optionId: number) => void;
    onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type Props = OwnProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'onChange'>;

const ConnectedDropdownField = forwardRef<HTMLInputElement, Props>(
    ({ 
        id, 
        name, 
        label, 
        description, 
        validate, 
        className, 
        placeholder,
        suffix,
        options,
        selectedOptionId,
        onOptionChange,
        onInputChange,
        ...props 
    }, ref) => {
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);
        const selectedOption = options.find(opt => opt.id === selectedOptionId);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsDropdownOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

        const handleOptionSelect = (optionId: number) => {
            onOptionChange(optionId);
            setIsDropdownOpen(false);
        };

        return (
            <FormikField innerRef={ref} name={name} validate={validate}>
                {({ field, form: { errors, touched } }: FieldProps) => (
                    <div className='flex flex-col gap-2'>
                        {label && (
                            <label className='text-sm text-[#ffffff77]' htmlFor={id}>
                                {label}
                            </label>
                        )}
                        <div className="relative" ref={dropdownRef}>
                            <div className="flex items-stretch">
                                <div className="flex-1">
                                    <input
                                        className={`px-4 py-2 rounded-l-lg outline-hidden bg-[#ffffff17] text-sm border border-[#ffffff17] focus:border-[#ffffff33] transition-colors border-r-0 focus:z-10 w-full ${className || ''}`}
                                        id={id}
                                        placeholder={placeholder}
                                        {...field}
                                        {...props}
                                        onChange={onInputChange || field.onChange}
                                    />
                                </div>
                                <div
                                    className="relative flex items-center px-3 py-2 bg-[#ffffff17] border border-[#ffffff17] rounded-r-lg text-sm text-zinc-400 min-w-0 cursor-pointer hover:bg-[#ffffff22] transition-colors border-l-0"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span className="select-none">
                                        .{selectedOption?.name || 'domain.com'}
                                    </span>
                                    <svg 
                                        className={`ml-2 w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#ffffff17] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {options.length === 0 ? (
                                        <div className="px-4 py-2 text-sm text-zinc-500">
                                            No domains available
                                        </div>
                                    ) : (
                                        options.map((option) => (
                                            <div
                                                key={option.id}
                                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#ffffff11] transition-colors ${
                                                    option.id === selectedOptionId ? 'bg-[#ffffff17] text-white' : 'text-zinc-300'
                                                }`}
                                                onClick={() => handleOptionSelect(option.id)}
                                            >
                                                {option.name}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {touched[field.name] && errors[field.name] ? (
                            <p className={'text-sm font-bold text-[#d36666]'}>
                                {(errors[field.name] as string).charAt(0).toUpperCase() +
                                    (errors[field.name] as string).slice(1)}
                            </p>
                        ) : description ? (
                            <p className={'text-sm font-bold'}>{description}</p>
                        ) : null}
                    </div>
                )}
            </FormikField>
        );
    }
);

ConnectedDropdownField.displayName = 'ConnectedDropdownField';

export default ConnectedDropdownField;