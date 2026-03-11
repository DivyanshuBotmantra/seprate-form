import { Button } from "@/components/ui/button";
import { Upload, Trash2, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
    file_name: string;
    file_path: string;
    file_url: string;
    file_type: string;
}

interface FileUploadSectionProps {
    uploadedFiles: UploadedFile[];
    isUploading: boolean;
    isSubmitting: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveFile: (index: number) => void;
    handleRemoveAllFiles: () => void;
}

export function FileUploadSection({
    uploadedFiles,
    isUploading,
    isSubmitting,
    fileInputRef,
    handleFileChange,
    handleRemoveFile,
    handleRemoveAllFiles,
}: FileUploadSectionProps) {
    return (
        <div className="space-y-6">
            {/* File Upload Area - Large & Centered */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-2xl p-16 transition-all duration-500 flex flex-col items-center justify-center gap-4 text-center overflow-hidden",
                    uploadedFiles.length > 0
                        ? "border-btn-primary/50 bg-btn-primary/5 shadow-inner"
                        : "border-border/60 hover:border-btn-primary/50 hover:bg-muted/40 hover:shadow-xl hover:shadow-btn-primary/5"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xlsx,.xls"
                    multiple
                    disabled={isUploading || isSubmitting}
                />

                {/* Animated Background Glow */}
                <div className="absolute -inset-1 bg-linear-to-r from-btn-primary/0 via-btn-primary/5 to-btn-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-2xl pointer-events-none" />

                <div className="relative p-5 bg-background/80 rounded-2xl border border-border/50 shadow-sm group-hover:border-btn-primary/30 group-hover:scale-110 transition-all duration-500">
                    {isUploading ? (
                        <div className="size-10 flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-btn-primary" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    ) : (
                        <Upload className="size-10 text-muted-foreground group-hover:text-btn-primary transition-colors duration-300" />
                    )}
                </div>
                <div className="relative">
                    <p className="font-bold text-lg text-foreground tracking-tight">
                        {isUploading ? "Uploading files..." : "Click or drop Excel files"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Support files: .xlsx, .xls (Max 10MB)
                    </p>
                </div>
            </div>

            {/* Selected Files List */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">
                            Uploaded Files ({uploadedFiles.length})
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAllFiles}
                            disabled={isSubmitting}
                            className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg font-bold transition-all"
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Remove All
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uploadedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="group/file bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex items-center gap-4 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-500 hover:border-btn-primary/30 hover:shadow-lg transition-all"
                            >
                                <div className="p-2.5 bg-btn-primary/10 rounded-xl border border-btn-primary/20 group-hover/file:bg-btn-primary/20 transition-colors">
                                    <FileSpreadsheet className="h-6 w-6 text-btn-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate">
                                        {file.file_name}
                                    </p>
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                        Successfully uploaded
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors"
                                    onClick={() => handleRemoveFile(index)}
                                    disabled={isSubmitting}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
