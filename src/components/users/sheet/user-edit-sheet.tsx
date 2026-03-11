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
import { Edit, Save } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import OrbitLoader from "@/components/loader";
import { OrgMultiSelect } from "./org-multi-select";
import { UserOrgSelect } from "../single-ors-select";
import { getUserDetails } from "@/lib/auth";

// Define field configuration interface
interface FieldConfig {
  key: string;
  label: string;
  type:
  | "text"
  | "email"
  | "select"
  | "date"
  | "password"
  | "readonly"
  | "role"
  | "org"
  | "number"
  | "json-textarea"
  | "radio";
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
  onSave?: (updatedData: Partial<T>) => Promise<any> | void;
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

export function UserCellAction<T extends Record<string, any>>({
  data,
  title = "Edit Item",
  description = "Make changes here. Click save when you're done.",
  fields,
  excludeFields,
  onSave,
  onCancel,
  getDisplayName,
  getDisplayId,
}: CellActionProps<T>) {
  // console.log(data)
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(data);
  const [loading, setLoading] = useState(false);
  const storedUser = sessionStorage.getItem("userDetail");
  const currentUserRole = storedUser ? JSON.parse(storedUser)?.role : null;
  const currentUser = getUserDetails();

  const handleInputChange = (key: string, value: any) => {
    // console.log(formData, "new foorm");
    setFormData((prev) => {
      const updated = { ...prev, [key]: value } as any;

      // Handle role changes and ensure org_name has the correct type
      if (key === "role") {
        if (value === "SUPER ADMIN") {
          // Super Admin has no orgs
          updated["org_name"] = [];
        } else if (value === "ADMIN") {
          // Admin needs an array of orgs
          // If org_name is a string, convert it to an array
          const currentOrgName = prev["org_name"];
          if (typeof currentOrgName === "string") {
            updated["org_name"] = currentOrgName ? [currentOrgName] : [];
          } else if (!Array.isArray(currentOrgName)) {
            updated["org_name"] = [];
          }
        } else if (value === "USER") {
          // User needs a single org (string)
          // If org_name is an array, take the first element
          const currentOrgName = prev["org_name"];
          if (Array.isArray(currentOrgName)) {
            updated["org_name"] = currentOrgName[0] || "";
          }
        }
      }

      return updated;
    });
  };

  const handleSave = async (formData: any) => {
    setLoading(true);
    console.log(formData);
    try {
      const payloadData = { ...formData };
      const fieldsToExclude = excludeFields || ["password"];
      fieldsToExclude.forEach((field) => {
        delete payloadData[field];
      });
      const result = await onSave?.(payloadData);
      console.log(result, "result");
      // If onSave completes without throwing, check the result
      if (result && typeof result === "object") {
        // If result has data with status_code 200, or has data without error, close the sheet
        if (
          result.data?.status_code === 200 ||
          (result.data && !result.error)
        ) {
          setOpen(false);
        }
      } else if (result === undefined || result === null) {
        // If onSave doesn't return anything but completes successfully, close the sheet
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
            value={String(value)}
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

      case "role":
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleInputChange(field.key, val)}
            disabled={currentUserRole !== "SUPER ADMIN"}
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

      case "org":
        if (formData.role === "SUPER ADMIN") {
          return null;
        }

        if (formData.role === "ADMIN") {
          return (
            <OrgMultiSelect
              selectedOrgs={formData.org_name || []}
              options={field.options || []}
              onChange={(updated) => handleInputChange("org_name", updated)}
              disabled={currentUserRole === "ADMIN"}
            />
          );
        }

        if (formData.role === "USER") {
          // Filter org options for USER role - only show orgs assigned to current user
          const allowedOrgOptions = currentUserRole === "SUPER ADMIN"
            ? (field.options || [])
            : (field.options || []).filter(option =>
              currentUser?.org_name?.includes(option.value)
            );

          return (
            <UserOrgSelect
              value={String(value)}
              options={allowedOrgOptions}
              onChange={(val) => handleInputChange(field.key, val)}
              disabled={field.disabled}
            />
          );
        }

        return null;

      case "readonly":
        return (
          <Input
            value={String(value)}
            readOnly
            className="bg-muted/50 cursor-not-allowed"
            disabled={field.disabled}
          />
        );

      case "password":
        return (
          <Input
            type="password"
            value={String(value)}
            disabled={field.disabled}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            className="bg-background/50"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            disabled={field.disabled}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            className="bg-background/50"
            readOnly={field.readonly}
          />
        );
      case "json-textarea": {
        const raw =
          typeof value === "string" ? value : JSON.stringify(value, null, 2);

        return (
          <Textarea
            value={raw}
            onChange={(e) => {
              const input = e.target.value;
              handleInputChange(field.key, input);
              // try {
              //   const parsed = JSON.parse(input);
              //   console.log(parsed);
              //   handleInputChange(field.key, parsed);
              // } catch {
              //   // fallback: store raw string temporarily if JSON is invalid
              //   handleInputChange(field.key, input);
              // }
            }}
            placeholder={
              field.placeholder || `Enter JSON for ${field.label.toLowerCase()}`
            }
            className="bg-background/50 font-mono resize-y"
            rows={6}
            disabled={field.disabled}
          />
        );
      }

      case "radio":
        return (
          <div className="flex flex-wrap gap-3">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium select-none ${
                  String(value) === option.value
                    ? "border-btn-primary bg-btn-primary/10 text-btn-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:border-btn-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={field.key}
                  value={option.value}
                  checked={String(value) === option.value}
                  onChange={() => handleInputChange(field.key, option.value)}
                  className="sr-only"
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    String(value) === option.value
                      ? "border-btn-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {String(value) === option.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-btn-primary" />
                  )}
                </span>
                {option.label}
              </label>
            ))}
          </div>
        );

      default:
        return (
          <Input
            type={field.type}
            disabled={field.disabled}
            value={String(value)}
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
        <SheetHeader className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 ">
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
                    .map((n: any) => n[0])
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
            {fields.map((field) => {
              if (field.type === "org" && formData.role === "SUPER ADMIN") {
                return null;
              }

              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}{" "}
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  {renderField(field)}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <SheetFooter className="border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-10 p-6">
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => handleSave(formData)}
              className="flex-1"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? <OrbitLoader /> : "Save Changes"}
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
