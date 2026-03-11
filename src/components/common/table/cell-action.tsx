"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Save, X } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { toast } from "sonner";

// Define field configuration interface
interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "email" | "select" | "date" | "password" | "readonly";
  placeholder?: string;
  options?: { value: string; label: string }[]; // For select fields
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
}

interface CellActionProps<T = any> {
  data: T;
  title?: string;
  description?: string;
  fields: FieldConfig[];
  excludeFields?: string[];
  onSave?: (updatedData: Partial<T>) => Promise<void> | void;
  onCancel?: () => void;
  getDisplayName?: (data: T) => string;
  getDisplayId?: (data: T) => string;
  triggerText?: string;
  triggerVariant?:
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
}

export function CellAction<T extends Record<string, any>>({
  data,
  title = "Edit Item",
  description = "Make changes here. Click save when you're done.",
  fields,
  excludeFields,
  onSave,
  onCancel,
  getDisplayName,
  getDisplayId,
  triggerText = "Edit",
  triggerVariant = "outline",
}: CellActionProps<T>) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(data);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

  };

  const handleSave = async (formData: any) => {
    setLoading(true);
    try {
      const payloadData = { ...formData };
      const fieldsToExclude = excludeFields || ["password"];
      fieldsToExclude.forEach((field) => {
        delete payloadData[field];
      });
      const result = await onSave(payloadData);
      if (result) {
        // toast.success(`${title} updated successfully`);
        setOpen(false);
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(data);
    setOpen(false);
    onCancel?.();
  };

  const displayName = getDisplayName
    ? getDisplayName(data)
    : data.name || "Unknown";
  const displayId = getDisplayId
    ? getDisplayId(data)
    : data.id || data.user_id || "N/A";

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key] || "";

    switch (field.type) {
      case "select":
        return (
          <Select
            value={value.toString()}
            onValueChange={(val) => handleInputChange(field.key, val)}
            disabled={field.disabled}
          >
            <SelectTrigger className="bg-background/50 w-full">
              <SelectValue
                placeholder={
                  field.placeholder || `Select ${field.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "readonly":
        return (
          <Input
            value={value.toString()}
            readOnly
            className="bg-muted/50 cursor-not-allowed"
            disabled={field.disabled}
          />
        );

      case "password":
        return (
          <Input
            type="password"
            value={value.toString()}
            disabled={field.disabled}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            className="bg-background/50"
          />
        );

      default:
        return (
          <Input
            type={field.type}
            disabled={field.disabled}
            value={value.toString()}
            onChange={(e) => {
              if (e.target.value.length <= 50) {
                handleInputChange(field.key, e.target.value);
              }
            }}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            className="bg-background/50"
            readOnly={field.readonly}
          />
        );
    }
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={"ghost"} size="sm">
          <Edit className="w-4 h-4 mr-2" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:max-w-md flex flex-col ">
        <SheetHeader className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          </div>
          <SheetDescription className="p-0"> {description}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="overflow-auto px-4">
          {(getDisplayName || data.name) && (
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{displayName}</h3>
                <p className="text-sm text-muted-foreground">ID: {displayId}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 mt-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 p-6">
          <div className="flex gap-2 w-full">
            <Button onClick={handleSave} className="flex-1" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
