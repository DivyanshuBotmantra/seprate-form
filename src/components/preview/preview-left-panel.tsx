// --- File: LeftPanel.tsx ---
import React, { useCallback, memo } from "react";
import { Upload, FileText } from "lucide-react";

interface LeftPanelProps {
  file?: File | null;
  previewUrl?: string | null;
  onFileChange?: (file: File | null, previewUrl: string | null) => void;
  widthPercent: number;
  supportedFilesText?: string;
  accept?: string;
}

const LeftPanel = memo(
  ({
    file,
    previewUrl,
    onFileChange,
    widthPercent,
    supportedFilesText = "Supports images, PDF, JSON, and text files",
    accept = "image/*,.pdf,.json,.txt",
  }: LeftPanelProps) => {
    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile) {
          const url = URL.createObjectURL(selectedFile);
          onFileChange?.(selectedFile, url);
        } else {
          onFileChange?.(null, null);
        }
      },
      [onFileChange]
    );

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const selectedFile = files[0];
          const url = URL.createObjectURL(selectedFile);
          onFileChange?.(selectedFile, url);
        }
      },
      [onFileChange]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    // const renderPreview = useCallback(() => {
    //   if (!file || !previewUrl) return null;

    //   // Image files
    //   if (file.type.startsWith("image/")) {
    //     return (
    //       <div className="w-full h-full">
    //         <ImagePreview src={previewUrl} widthPercent={widthPercent} />
    //       </div>
    //     );
    //   }

    //   // PDF files
    //   if (file.type === "application/pdf") {
    //     return (
    //       <div className="w-full h-full">
    //         <PdfViewer
    //           key="original-pdf-viewer"
    //           source={{ type: "blobUrl", data: previewUrl }}
    //           height="100%"
    //           title={file.name || "PDF Preview"}
    //         />
    //       </div>
    //     );
    //   }
    //   // JSON files
    //   if (file.type.includes("json") || file.name.endsWith(".json")) {
    //     return (
    //       <div className="w-full h-full">
    //         <JsonPreview data={previewUrl} />
    //       </div>
    //     );
    //   }

    //   // Text files
    //   if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
    //     return (
    //       <div className="w-full h-full">
    //         <TextPreview text={previewUrl} />
    //       </div>
    //     );
    //   }

    //   // Unsupported files
    //   return (
    //     <div className="w-full h-full flex items-center justify-center p-4">
    //       <div className="text-center text-muted-foreground">
    //         <FileText className="w-16 h-16 sm:w-20 sm:h-20 mb-4 mx-auto" />
    //         <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">
    //           Unsupported Document
    //         </p>
    //         <p className="text-sm text-muted-foreground">{file.name}</p>
    //       </div>
    //     </div>
    //   );
    // }, [file, previewUrl, widthPercent]);

    return (
      <div
        className="h-full overflow-hidden rounded-lg border shadow-sm"
        style={{
          width: `${widthPercent}%`,
          background: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div
            className="flex-shrink-0 p-3 sm:p-2 border-b rounded-t-lg"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--primary)",
            }}
          >
            <div className="flex items-center justify-left gap-2 sm:gap-3">
              <h3 className="text-white sm:text-lg font-bold">Original File</h3>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0">
            {previewUrl ? (
              <div
                className="w-full h-full overflow-hidden"
                style={{ backgroundColor: "var(--card)" }}
              >
                {/* {renderPreview()} */}
              </div>
            ) : (
              <label
                htmlFor="file"
                className="w-full h-full flex items-center justify-center border-2 cursor-pointer transition-all duration-300 group"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  id="file"
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  className="text-center transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Upload className="w-16 h-16 sm:w-20 sm:h-20 mb-4 group-hover:scale-110 transition-transform mx-auto" />
                  <p
                    className="text-base sm:text-lg font-semibold mb-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    Drop files here or click to upload
                  </p>
                  <p
                    className="text-xs sm:text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {supportedFilesText}
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default LeftPanel;
