import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const TaskPreviewBtn = ({ data }: { data: any }) => {
  console.log("data", data);
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const task_name = searchParams.get("task_name");

  return (
    <Button
      variant="ghost"
      className="px-0"
      onClick={() =>
        router(`/task-category-preview-edit-form?task_name=${task_name}`, {
          state: { data },
        })
      }
    >
      <EyeIcon size={18} />
    </Button>
  );
};

export default TaskPreviewBtn;
