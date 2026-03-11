import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  EyeIcon,
  Calendar,
  Mail,
  User,
  Building,
  Users,
  UserCheck,
  EyeOff,
  Copy,
  Key,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Field config type
interface ViewFieldConfig {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "date"
    | "badge"
    | "array"
    | "key"
    | "password"
    | "custom"
    | "select"
    | "radio";
  icon?: React.ComponentType<{ className?: string }>;
  formatter?: (value: any) => string | React.ReactNode;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  hidden?: boolean;
}

interface CellViewProps<T = any> {
  data: T;
  title?: string;
  description?: string;
  fields: ViewFieldConfig[];
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

export function CellView<T extends Record<string, any>>({
  data,
  title = "View Details",
  description = "Detailed information about this item.",
  fields,
  getDisplayName,
  getDisplayId,
  triggerVariant = "ghost",
}: CellViewProps<T>) {
  const [open, setOpen] = useState(false);

  const displayName = getDisplayName?.(data) ?? data?.name ?? "Unknown";
  const displayId = getDisplayId?.(data) ?? data?.id ?? data?.user_id ?? "N/A";

  const formatValue = (field: ViewFieldConfig, value: any) => {
    // console.log(value, "value");
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground">Not provided</span>;
    }

    if (field.formatter) return field.formatter(value);

    // console.log(data, "cell view");
    // console.log(fields, "fiels");
    switch (field.type) {
      case "email":
        return (
          <a href={`mailto:${value}`} className="hover:underline">
            {value}
          </a>
        );

      case "select":
        return (
          <Select value={value} disabled>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={value}>{value}</SelectItem>
            </SelectContent>
          </Select>
        );

      case "date":
        return new Date(value).toLocaleDateString();
      case "badge":
        const variant =
          field.badgeVariant ||
          (value?.toLowerCase() === "active"
            ? "default"
            : value?.toLowerCase() === "inactive"
            ? "secondary"
            : "outline");
        return <Badge variant={variant}>{value}</Badge>;
      case "array":
        return Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1">
            {value.map((item, idx) => (
              <Badge key={idx} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          value.toString()
        );
      case "password":
        return (
          <div className="flex items-center gap-2">
            <input
              type="password"
              readOnly
              value={value}
              className="bg-transparent border-none text-sm focus:outline-none"
            />
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          </div>
        );
      case "key":
        const handleCopy = () => {
          navigator.clipboard.writeText(value);
          toast.success("Key copied to clipboard"); // Optional feedback
        };

        return (
          <div className="flex items-center gap-2">
            <input
              type="password"
              readOnly
              value={value}
              className="bg-transparent border-none text-sm focus:outline-none"
            />
            <Copy
              onClick={handleCopy}
              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary"
            />
          </div>
        );

      case "radio": {
        const radioOptions: { value: string; label: string }[] = [
          { value: "org", label: "IT DASHBOARD" },
        ];
        return (
          <div className="flex flex-wrap gap-2">
            {radioOptions.map((option) => (
              <span
                key={option.value}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  option.value === value
                    ? "border-btn-primary bg-btn-primary/10 text-btn-primary"
                    : "border-border bg-background/30 text-muted-foreground opacity-50"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full border ${
                    option.value === value ? "border-btn-primary bg-btn-primary" : "border-muted-foreground/40"
                  }`}
                />
                {option.label}
              </span>
            ))}
          </div>
        );
      }

      default:
        return (
          <>
            <Input type="text" value={value} />
          </>
        );
    }
  };

  const getFieldIcon = (field: ViewFieldConfig) => {
    if (field.icon) {
      const Icon = field.icon;
      return <Icon className="h-4 w-4 text-muted-foreground" />;
    }
    switch (field.key.toLowerCase()) {
      case "email":
      case "user_id":
        return <Mail className="h-4 w-4 text-muted-foreground" />;
      case "name":
        return <User className="h-4 w-4 text-muted-foreground" />;
      case "org_name":
      case "organization":
        return <Building className="h-4 w-4 text-muted-foreground" />;
      case "role":
        return <Users className="h-4 w-4 text-muted-foreground" />;
      case "user_status":
        return <UserCheck className="h-4 w-4 text-muted-foreground" />;
      case "created_at":
      case "updated_at":
      case "joined_at":
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
      case "key":
        return <Key className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          <EyeIcon className="w-4 h-4 mr-2" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full bg-card backdrop-blur-sm border-border">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="px-4 overflow-y-auto">
          {(getDisplayName || data?.name) && (
            <div className="flex items-center space-x-4 rounded-lg mt-2">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {(displayName || "Unknown")
                    .toString()
                    .split(" ")
                    .map((n: string) => n?.[0] ?? "")
                    .join("") || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <p className="text-sm text-muted-foreground">ID: {displayId}</p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {fields
              .filter((f) => !f.hidden)
              .map((field) => {
                const value = data?.[field.key];
                const icon = getFieldIcon(field);
                return (
                  <div
                    key={field.key}
                    className="flex items-start space-x-3 p-3 rounded-md border border-border/50"
                  >
                    <div className="shrink-0 mt-0.5">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {field.label}
                      </p>
                      <div className="text-sm">{formatValue(field, value)}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <SheetFooter className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {fields.filter((f) => !f.hidden).length} fields displayed
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="bg-background/50 hover:bg-muted/50 border-border/50 hover:border-border transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
