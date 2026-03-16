import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, File } from "lucide-react";
import { toast } from "sonner";

interface AttachmentData {
    file_name?: string | null;
    file_url?: string | null;
}

interface ViewModeAttachmentsProps {
    attachments: Record<string, AttachmentData | null | undefined>;
}

const ViewModeAttachments: React.FC<ViewModeAttachmentsProps> = ({ attachments }) => {
    
    const getFileName = (fileData: AttachmentData | null | undefined): string => {
        return fileData?.file_name || "document.pdf";
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split(".").pop()?.toLowerCase();
        switch (extension) {
            case "pdf": return <FileText className="h-6 w-6 text-red-500" />;
            case "jpg":
            case "jpeg":
            case "png": return <Image className="h-6 w-6 text-blue-500" />;
            default: return <File className="h-6 w-6 text-gray-500" />;
        }
    };

    const handleDownload = (fileData: AttachmentData | null | undefined) => {
        if (!fileData?.file_url) {
            toast.error("File URL not available");
            return;
        }
        const a = document.createElement("a");
        a.href = fileData.file_url;
        a.download = fileData.file_name || "download";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const attachmentConfig = [
        { key: "gstin_attachment", label: "GSTIN Document" },
        { key: "pan_attachment", label: "PAN Document" },
        { key: "msme_attachment", label: "MSME Document" },
        { key: "cin_attachment", label: "CIN Document" },
        { key: "bank_details_attachment", label: "Bank Details Document" },
        { key: "pan_aadhar_linkage_attachment", label: "PAN Aadhar Linkage Document" },
    ];

    const validAttachments = attachmentConfig.filter(config => 
        attachments[config.key]?.file_name && attachments[config.key]?.file_url
    );

    if (validAttachments.length === 0) return null;

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-card/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                <CardTitle className="text-[15px] font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    File Attachments ({validAttachments.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validAttachments.map((config) => {
                        const fileData = attachments[config.key];
                        const fileName = getFileName(fileData);
                        return (
                            <div 
                                key={config.key}
                                className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-all group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-lg bg-white dark:bg-muted flex items-center justify-center shadow-sm border border-border/40 group-hover:scale-105 transition-transform">
                                        {getFileIcon(fileName)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[13px] font-bold text-foreground leading-tight">{config.label}</span>
                                        <span className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">{fileName}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(fileData)}
                                    className="h-8 px-3 text-[11px] font-bold gap-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                                >
                                    <Download className="h-3 w-3" />
                                    Download
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default ViewModeAttachments;
