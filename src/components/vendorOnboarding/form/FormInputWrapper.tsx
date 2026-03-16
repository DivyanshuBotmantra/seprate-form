import React from "react";
import { FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { X, Check } from "lucide-react";

interface FormInputWrapperProps {
    label: string;
    required?: boolean;
    error?: string | any;
    helperText?: string;
    fileUrl?: string;
    fileName?: string;
    onRemoveFile?: () => void;
    children: React.ReactNode;
    className?: string;
    isReadOnly?: boolean;
}

/**
 * FormInputWrapper: A stable, fixed-height form field wrapper based on the 3-layer design.
 * 1. Label Section (Orange)
 * 2. Input Section (Green Border)
 * 3. Fixed Message Section (Light Green) - Prevents layout jumping when errors appear.
 */
const FormInputWrapper = ({ 
    label, 
    required = false, 
    error, 
    helperText, 
    fileUrl, 
    fileName, 
    onRemoveFile,
    children, 
    className,
    isReadOnly = false
}: FormInputWrapperProps) => {
    return (
        <FormItem className={cn("w-full flex flex-col justify-start gap-1 p-0", className)}>
            {/* 1. Label Section (Orange Box Area) */}
            <FormLabel className="text-[13px] font-bold text-foreground h-5 flex items-center">
                {label} {required && !isReadOnly && <span className="text-red-500 ml-0.5">*</span>}
            </FormLabel>

            {/* 2. Control Section (Green Border Area) */}
            <FormControl>
                <div className="w-full">
                    {children}
                </div>
            </FormControl>

            {/* 3. Fixed Message Area (Light Green Area) */}
            {/* Min height of 18px ensures the layout doesn't move when an error comes/goes */}
            <div className="min-h-[18px] flex flex-col justify-start mt-0.5">
                {error ? (
                    // Logic to prioritize error over helper text
                    <div className="text-[10px] text-red-500 font-medium leading-tight animate-in fade-in slide-in-from-top-1 duration-200">
                        {typeof error === "string" ? error : error.message}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {fileUrl && fileName ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1 duration-300">
                                <div className="flex items-center gap-1 overflow-hidden">
                                    <Check className="h-3 w-3 text-[#79AC78] shrink-0" strokeWidth={3} />
                                    <a 
                                        href={fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-[#79AC78] font-bold truncate hover:underline"
                                    >
                                        {fileName}
                                    </a>
                                </div>
                                {!isReadOnly && onRemoveFile && (
                                    <X 
                                        className="h-3 w-3 text-red-500 cursor-pointer hover:text-red-700 transition-colors shrink-0" 
                                        strokeWidth={3}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onRemoveFile();
                                        }}
                                    />
                                )}
                            </div>
                        ) : helperText && (
                            <p className="text-[10px] text-muted-foreground/80 italic font-medium leading-tight">
                                {helperText}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </FormItem>
    );
};

export default FormInputWrapper;
