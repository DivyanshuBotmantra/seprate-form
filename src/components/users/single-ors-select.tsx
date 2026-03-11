import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface UserOrgSelectProps {
  value: string | undefined;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const UserOrgSelect = ({
  value,
  options,
  onChange,
  disabled = false,
}: UserOrgSelectProps) => {
  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="bg-background/50 w-full">
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
