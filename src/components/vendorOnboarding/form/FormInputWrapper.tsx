import React from "react";
import { FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface FormInputWrapperProps {
    label: string;
    required?: boolean;
    error?: string | any;
    helperText?: string;
    // For file display (Phase 2 if needed)
    fileUrl?: string;
    fileName?: string;
    children: React.ReactNode;
    className?: string;
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
    children, 
    className 
}: FormInputWrapperProps) => {
    return (
        <FormItem className={cn("w-full flex flex-col justify-start gap-1 p-0", className)}>
            {/* 1. Label Section (Orange Box Area) */}
            <FormLabel className="text-[13px] font-bold text-foreground h-5 flex items-center">
                {label} {required && <span className="text-red-500 ml-0.5">*</span>}
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
                    <div className="flex items-center gap-2">
                        {helperText && (
                            <p className="text-[10px] text-muted-foreground/80 italic font-medium leading-tight">
                                {helperText}
                            </p>
                        )}
                        {/* Phase 2: Show uploaded file link here if exists */}
                        {fileUrl && fileName && (
                            <span className="text-[10px] text-primary truncate max-w-[200px] flex items-center gap-1">
                                <span className="opacity-50 font-bold ml-1">✓</span> {fileName}
                            </span>
                        )}
                    </div>
                )}
            </div>
            {/* We don't use the standard FormMessage here because we've custom mapped it to the fixed div */}
        </FormItem>
    );
};

export default FormInputWrapper;
