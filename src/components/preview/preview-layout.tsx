// --- File: TryMeLayout.tsx ---
import { useState, useEffect, useCallback, useMemo } from "react";
import LeftPanel from "./preview-left-panel";
import PreviewHeader from "./preview-header";
interface TryMeLayoutProps {
  title: React.ReactNode;
  right: React.ReactNode;
  leftPanelWidth: number;
  onResize: (val: number) => void;
  models?: string[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  keys?: string[];
  selectedKey?: string;
  onKeyChange?: (key: string) => void;
  isLoading?: boolean;
  onExtract?: () => void;
  onReset?: () => void;
  isExtracting?: boolean;
  extractButtonText?: string;
  file?: File | null;
  previewUrl?: string | null;
  onFileChange?: (file: File | null, previewUrl: string | null) => void;
  isDropdownOpen?: boolean;
  onDropdownToggle?: (open: boolean) => void;
  isKeyDropdownOpen?: boolean;
  onKeyDropdownToggle?: (open: boolean) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showRequestModel?: boolean;
  leftPanel?: React.ReactNode;
  hasTextInput?: boolean;
  textInputValue?: string;
  customValidation?: () => boolean;
  supportedFilesText?: string;
  accept?: string;
  onBack?: () => void;
}

const PreviewLayout = ({
  title,
  right,
  leftPanelWidth,
  onResize,
  models = [],
  selectedModel = "",
  onModelChange,
  keys = [],
  selectedKey = "",
  onKeyChange,
  isLoading = false,
  onExtract,
  onReset,
  isExtracting = false,
  extractButtonText = "Extract",
  file,
  previewUrl,
  onFileChange,
  isDropdownOpen = false,
  onDropdownToggle,
  isKeyDropdownOpen = false,
  onKeyDropdownToggle,
  searchQuery = "",
  onSearchChange,
  showRequestModel = true,
  leftPanel,
  hasTextInput,
  textInputValue,
  customValidation,
  supportedFilesText,
  accept,
  onBack,
}: TryMeLayoutProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(leftPanelWidth);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(leftPanelWidth);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const container = document.getElementById("split-container");
      if (container) {
        const rect = container.getBoundingClientRect();
        const deltaX = e.clientX - startX;
        const containerWidth = rect.width;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newWidth = startWidth + deltaPercent;
        onResize(Math.max(20, Math.min(80, newWidth)));
      }
    },
    [isResizing, startX, startWidth, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Memoize the LeftPanel to prevent recreation during resizing
  const memoizedLeftPanel = useMemo(() => {
    if (leftPanel) return leftPanel;
    return (
      <LeftPanel
        file={file}
        previewUrl={previewUrl}
        onFileChange={onFileChange}
        widthPercent={leftPanelWidth}
        supportedFilesText={supportedFilesText}
        accept={accept}
      />
    );
  }, [
    leftPanel,
    file,
    previewUrl,
    onFileChange,
    leftPanelWidth,
    supportedFilesText,
    accept,
  ]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-sidebar rounded-lg "
      // style={{ background: "var(--background)" }}
    >
      {/* Header with back button */}
      <PreviewHeader title={title} onBack={onBack} />

      {/* Spacing between header and content */}

      {/* Mobile Layout */}
      <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4">
        {/* Left Panel - Mobile */}
        <div
          className="flex-1 min-h-0 border-b mb-4"
          style={{ borderColor: "var(--border)" }}
        >
          {memoizedLeftPanel}
        </div>
        {/* Right Panel - Mobile */}
        <div className="flex-1 min-h-0">
          <div className="h-full w-full">{right}</div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div
        id="split-container"
        className="hidden md:flex flex-1 relative min-h-0 overflow-hidden z-10 px-4 pb-4"
      >
        {/* Left Panel */}
        {memoizedLeftPanel}

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-2 cursor-col-resize transition-all duration-200 relative group mx-2`}
          style={{
            background: isResizing ? "var(--primary)" : "var(--border)",
          }}
        >
          <div className="absolute inset-y-0 -left-3 -right-3 flex items-center justify-center">
            <div
              className="w-1 h-16 rounded-full transition-all duration-200 shadow-lg"
              style={{
                backgroundColor: isResizing ? "var(--primary)" : "var(--muted)",
              }}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div
          className="h-full overflow-hidden rounded-lg border shadow-sm"
          style={{
            width: `calc(${100 - leftPanelWidth}% - 16px)`,
            background: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          <div className="h-full w-full">{right}</div>
        </div>
      </div>
    </div>
  );
};

export default PreviewLayout;
