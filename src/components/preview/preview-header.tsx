import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PreviewHeaderProps {
  title: React.ReactNode;
  onBack?: () => void;
}

const PreviewHeader = ({ title, onBack }: PreviewHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 mb-3 mt-2">
      <Button
        variant="outline"
        onClick={handleBack}
        size="sm"
        className="h-8 w-8 p-0 hover:bg-muted"
      >
        <ChevronLeft className="h-12 w-8" />
      </Button>
      <h1 className="font-semibold text-xl flex-1">{title}</h1>
    </div>
  );
};

export default PreviewHeader;
