import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import FormInputWrapper from '../FormInputWrapper';

interface FormFileFieldProps {
    name: string;
    label: string;
    description?: string;
    required?: boolean;
    accept?: string;
    disabled?: boolean;
}

export const FormFileField = ({ name, label, description, required, accept = ".pdf,.jpg,.jpeg,.png", disabled = false }: FormFileFieldProps) => {
    const { control, setValue, watch } = useFormContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileData = watch(name);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Mock upload logic
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockUrl = URL.createObjectURL(file);
            
            setValue(name, {
                file_name: file.name,
                file_type: file.type,
                file_url: mockUrl,
            }, { shouldValidate: true });
            
            toast.success(`${label} attached!`);
        } catch (error) {
            toast.error("Failed to attach file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeFile = () => {
        setValue(name, null, { shouldValidate: true });
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                    helperText={description}
                    fileName={fileData?.file_name}
                    fileUrl={fileData?.file_url}
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
                            
                            {!fileData?.file_name ? (
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
                                        <Upload className={`h-4 w-4 ${disabled ? "text-muted-foreground/50" : "text-primary/70"}`} />
                                    )}
                                    <span className="text-[13px] font-semibold text-foreground/70">
                                        {isUploading ? "Uploading..." : "Click to upload"}
                                    </span>
                                </Button>
                            ) : (
                                <div className="flex items-center justify-between h-10 px-3 border rounded-lg bg-primary/5 border-primary/20">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-[12px] font-bold truncate max-w-[120px] md:max-w-[180px]">
                                            {fileData.file_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                        {!disabled && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                onClick={removeFile}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
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
