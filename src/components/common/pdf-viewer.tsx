import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react";

interface PdfViewerProps {
  source: { type: "base64" | "blobUrl"; data: string };
  height?: number | string;
  title?: string;
}

const PdfViewer = memo(
  ({ source, height = "100%", title = "PDF Preview" }: PdfViewerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const createdBlobUrlRef = useRef<string | null>(null);

    // Convert base64 to Blob URL for better handling of large files
    useEffect(() => {
      // Cleanup previous blob URL if we created it
      if (createdBlobUrlRef.current) {
        URL.revokeObjectURL(createdBlobUrlRef.current);
        createdBlobUrlRef.current = null;
      }

      if (source.type === "base64" && source.data) {
        try {
          // Extract base64 string from data URL if present
          let base64String = source.data;
          if (source.data.startsWith("data:")) {
            base64String = source.data.split(",")[1] || source.data;
          }

          // Convert base64 to binary
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create Blob from binary data
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          createdBlobUrlRef.current = url;
          setBlobUrl(url);
        } catch (err) {
          console.error("Error converting base64 to blob:", err);
          setError("Failed to process PDF data");
          setIsLoading(false);
          setBlobUrl(null);
        }
      } else if (source.type === "blobUrl") {
        // For blob URLs, use directly (don't track in ref since we didn't create it)
        setBlobUrl(source.data);
      } else {
        setBlobUrl(null);
      }

      // Cleanup function to revoke the blob URL when component unmounts or data changes
      return () => {
        // Only revoke blob URLs we created (from base64 conversion)
        if (createdBlobUrlRef.current) {
          URL.revokeObjectURL(createdBlobUrlRef.current);
          createdBlobUrlRef.current = null;
        }
        // Don't revoke blob URLs that were passed in (they're managed elsewhere)
      };
    }, [source.type, source.data]);

    // Reset loading state when data changes
    useEffect(() => {
      if (source?.data) {
        setIsLoading(true);
        setError(null);
      }
    }, [source.data]);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setError(null);
    }, []);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setError("Failed to load PDF");
    }, []);

    // Generate PDF URL for iframe
    const pdfUrl = useMemo(() => {
      if (!blobUrl) return "";
      return `${blobUrl}#view=Fit`;
    }, [blobUrl]);

    // Use iframe for both base64 (converted to blob) and blobUrl sources
    const pdfElement = useMemo(() => {
      if (!blobUrl) {
        return null;
      }

      return (
        <iframe
          src={pdfUrl}
          title={title}
          className="w-full h-full overflow-hidden custom-scrollbar"
          style={{
            border: "none",
            display: "block",
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      );
    }, [pdfUrl, title, handleLoad, handleError]);

    if (error) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center text-destructive">
            <p className="font-medium mb-2">Error Loading PDF</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="w-full h-full flex flex-col  shadow-sm overflow-hidden"
        style={{
          height: typeof height === "number" ? height : "100%",
          backgroundColor: "var(--json-bg)",
          borderColor: "var(--json-border)",
        }}
      >
        <div className="flex-1 relative">
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ backgroundColor: "var(--json-bg)" }}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          {pdfElement}
        </div>
      </div>
    );
  }
);

export default PdfViewer;
