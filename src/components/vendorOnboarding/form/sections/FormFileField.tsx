import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import FormInputWrapper from '../FormInputWrapper';

import { useFileLifecycle } from '../../hooks/useFileLifecycle';

interface FormFileFieldProps {
    name: string;
    label: string;
    description?: string;
    required?: boolean;
    accept?: string;
    disabled?: boolean;
    isReadOnly?: boolean;
}

export const FormFileField = ({ name, label, description, required, accept = ".pdf,.jpg,.jpeg,.png", disabled = false, isReadOnly = false }: FormFileFieldProps) => {
    const { control, watch } = useFormContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileData = watch(name);
    const { uploadSingleFile, markForDeletion } = useFileLifecycle();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const attachmentKey = name.split('.').pop() || "";
            await uploadSingleFile(file, attachmentKey);
            toast.success(`${label} attached!`);
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeFile = () => {
        const attachmentKey = name.split('.').pop() || "";
        markForDeletion(attachmentKey);
    };

    return (
        <FormField
            control={control}
            name={name}
            render={({ fieldState }) => (
                <FormInputWrapper 
                    label={label}
                    required={required}
                    error={fieldState.error}
                    helperText={isReadOnly ? undefined : description}
                    fileName={fileData?.file_name}
                    fileUrl={fileData?.file_url}
                    isReadOnly={isReadOnly}
                    onRemoveFile={removeFile}
                >
                    <FormControl>
                        <div className="relative w-full">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept={accept}
                                onChange={handleFileChange}
                            />
                            
                            {!fileData?.file_name && !isReadOnly && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={`w-full h-10 border-dashed flex items-center justify-center gap-2 transition-all duration-300 ${disabled ? "bg-muted cursor-not-allowed opacity-60" : "hover:border-primary/50 hover:bg-primary/5"}`}
                                    onClick={() => !disabled && fileInputRef.current?.click()}
                                    disabled={disabled || isUploading}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                        <Upload className={`h-4 w-4 ${disabled ? "text-muted-foreground/50" : "text-[#C53929]"}`} />
                                    )}
                                    <span className="text-[13px] font-semibold text-foreground/70">
                                        {isUploading ? "Uploading..." : "Click to upload"}
                                    </span>
                                </Button>
                            )}
                            
                            {fileData?.file_name && (
                                <div className="flex items-center justify-between h-10 px-3 border rounded-lg bg-muted/20 border-border/50">
                                    <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                                        <FileText className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                        <span className="text-[12px] font-medium text-muted-foreground truncate italic">
                                            {fileData.file_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 opacity-50" />
                                        {/* Delete button handled by FormInputWrapper */}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormControl>
                </FormInputWrapper>
            )}
        />
    );
};
