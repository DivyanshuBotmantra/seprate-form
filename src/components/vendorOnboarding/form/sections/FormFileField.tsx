import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, CheckCircle2 } from "lucide-react";
import { toast } from 'sonner';

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Mock upload logic for now - in real app, call upload service
        try {
            // Simulate upload delay
            const mockUrl = URL.createObjectURL(file);
            
            setValue(name, {
                file_name: file.name,
                file_type: file.type,
                file_url: mockUrl,
            }, { shouldValidate: true });
            
            toast.success(`${label} uploaded!`);
        } catch (error) {
            toast.error("Failed to upload file");
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
            render={() => (
                <FormItem className="space-y-3">
                    <FormLabel>{label} {required && "*"}</FormLabel>
                    <FormControl>
                        <div className="relative">
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
                                    className={`w-full border-dashed h-20 flex flex-col gap-2 transition-colors ${disabled ? "bg-muted cursor-not-allowed opacity-60" : "hover:bg-muted/50"}`}
                                    onClick={() => !disabled && fileInputRef.current?.click()}
                                    disabled={disabled}
                                >
                                    <Upload className={`h-5 w-5 ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
                                    <span className="text-sm font-normal">Click to upload document</span>
                                </Button>
                            ) : (
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-primary/10 rounded">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate">{fileData.file_name}</span>
                                            <span className="text-xs text-muted-foreground uppercase">{fileData.file_type?.split('/')?.[1] || 'FILE'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        {!disabled && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={removeFile}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
