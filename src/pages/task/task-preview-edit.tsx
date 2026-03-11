import PreviewLayout from "@/components/preview/preview-layout";
import { useOrgStore } from "@/lib/store/org-store";
import taskConfig from "@/services/task-config";
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { TestPage } from "../test";
import { downloadFile } from "@/services/download";
import PdfViewer from "@/components/common/pdf-viewer";
import TaskPreviewDialog from "@/components/common/dialog-boxes/task-preview-dailog";

const TaskPreviewEdit = () => {
  const { state } = useLocation();
  const [leftPanelWidth, setLeftPanelWidth] = useState(40);
  const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);
  const [extractedPdf, setExtractedPdf] = useState<string>("");
  const [taskMaster, setTaskMaster] = useState<any[]>([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoadingTaskMaster, setIsLoadingTaskMaster] = useState<boolean>(true);
  const [taskMasterError, setTaskMasterError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"reject" | "validate">(
    "validate"
  );
  const [searchParams] = useSearchParams();
  const task_name = searchParams.get("task_name");

  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const fetchTaskMaster = async () => {
    setIsLoadingTaskMaster(true);
    setTaskMasterError(null);
    const payload = {
      org_name: selectedOrg,
      task_code: state?.data?.task_code,
    };
    try {
      const res = await taskConfig.getTaskmaster(payload);
      const data = res?.data?.response_body || [];
      setTaskMaster(data);

      if (!data || data.length === 0 || !data[0]?.task_form_json) {
        setTaskMasterError("No task form data available");
      }
    } catch (err) {
      console.error("Task master fetch error:", err);
      setTaskMaster([]);
      setTaskMasterError("Failed to load task form data");
    } finally {
      setIsLoadingTaskMaster(false);
    }
  };
  const downloadFileApiCall = async () => {
    setIsLoadingPdf(true);
    setPdfError(null);
    try {
      // Get the first key from files object (e.g., "INP-TALLY-TB-CY")
      const fileKeys = Object.keys(state?.data?.files || {});
      const firstFileKey = fileKeys[0];

      if (!firstFileKey) {
        setPdfError("No file found in task data");
        setIsLoadingPdf(false);
        return;
      }

      // Extract file details from the first uploaded file
      const fileData = state?.data?.files?.[firstFileKey];
      const file_name = fileData?.uploaded_files?.[0]?.file_name;
      const file_path = fileData?.uploaded_files?.[0]?.file_path;

      if (!file_name || !file_path) {
        setPdfError("File information is missing");
        setIsLoadingPdf(false);
        return;
      }

      const payload = {
        org_name: selectedOrg,
        file_name: file_name, //required
        file_url: file_path, //required
        task_code: state?.data?.task_code,
      };
      const res = await downloadFile(payload);
      const base64Data = res?.data?.response_body?.file_base64;

      if (base64Data) {
        setExtractedPdf(base64Data);
      } else {
        setPdfError("PDF data not available");
      }
    } catch (err) {
      console.error("Download file error:", err);
      setPdfError("Failed to load PDF file");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Check if the task is in read-only mode (rejected or submitted)
  const isReadOnly =
    state?.data?.trans_status?.toUpperCase() === "REJECTED" ||
    state?.data?.trans_status?.toUpperCase() === "SUBMITTED";

  useEffect(() => {
    fetchTaskMaster();
    downloadFileApiCall();
  }, []);

  const handleOpenDialog = (
    type: "reject" | "validate",
    action: () => Promise<void>
  ) => {
    setDialogType(type);
    setPendingAction(() => action);
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (pendingAction) {
      await pendingAction();
    }
  };

  return (
    <>
      <TaskPreviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        onConfirm={handleConfirmAction}
      />
      <PreviewLayout
        leftPanelWidth={leftPanelWidth}
        onResize={setLeftPanelWidth}
        title={task_name}
        leftPanel={
          <div
            className="h-full overflow-hidden rounded-lg border shadow-sm"
            style={{
              width: `${leftPanelWidth}%`,
              background: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            {isLoadingPdf ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading PDF...
                  </p>
                </div>
              </div>
            ) : pdfError || !extractedPdf ? (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="font-medium mb-2 text-muted-foreground">
                    {pdfError || "No PDF available"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The PDF file could not be loaded or is not available for
                    this task.
                  </p>
                </div>
              </div>
            ) : (
              <PdfViewer
                key={`pdf-${extractedPdf?.substring(0, 50)}`}
                source={{ type: "base64", data: extractedPdf }}
                height="100%"
                title="Processing Result"
              />
            )}
          </div>
        }
        right={
          isLoadingTaskMaster ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Loading task form...
                </p>
              </div>
            </div>
          ) : taskMasterError || !taskMaster?.[0]?.task_form_json ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center">
                <p className="font-medium mb-2 text-muted-foreground">
                  {taskMasterError || "No task form data available"}
                </p>
                <p className="text-sm text-muted-foreground">
                  The task form could not be loaded or is not available for this
                  task.
                </p>
              </div>
            </div>
          ) : (
            <TestPage
              data={taskMaster[0].task_form_json}
              defValues={state?.data?.updated_data || state?.data?.input_data}
              selectedOrg={selectedOrg}
              payloadData={state?.data}
              onOpenDialog={handleOpenDialog}
              isReadOnly={isReadOnly}
              transStatus={state?.data?.trans_status}
            />
          )
        }
      />
    </>
  );
};

export default TaskPreviewEdit;
