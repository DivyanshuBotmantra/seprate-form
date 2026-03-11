import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  loading?: boolean;
  onSubmit: (data: {
    org_name: string;
    org_status: "ACTIVE";
  }) => void;
}

export const OrganisationCreateSheet = ({
  open,
  onClose,
  title = "Create Organisation",
  loading = false,
  onSubmit,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      org_name: "",
    },
    mode: "onChange",
  });

  /* ---------------- Reset on open ---------------- */
  useEffect(() => {
    if (open) {
      reset({ org_name: "" });
    }
  }, [open, reset]);

  const submitHandler = (values: { org_name: string }) => {
    onSubmit({
      org_name: values.org_name.trim(),
      org_status: "ACTIVE",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex flex-col w-[420px] p-0"
      >
        {/* ---------- HEADER (fixed) ---------- */}
        <SheetHeader className="shrink-0 border-b p-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Create a new organisation. Only the organisation name is required.
          </SheetDescription>
        </SheetHeader>

        {/* ---------- BODY (scrollable) ---------- */}
        <form
          id="organisation-create-form"
          onSubmit={handleSubmit(submitHandler)}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="org_name">Organisation Name *</Label>
            <Input
              id="org_name"
              placeholder="e.g. CLA-AUDIT"
              {...register("org_name", {
                required: "Organisation name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
            />
            {errors.org_name && (
              <p className="text-sm text-destructive">
                {errors.org_name.message}
              </p>
            )}
          </div>
        </form>

        {/* ---------- FOOTER (fixed) ---------- */}
        <div className="shrink-0 border-t p-4 flex gap-3 bg-background">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="organisation-create-form"
            className="flex-1"
            disabled={loading || !isValid}
          >
            {loading ? "Creating..." : "Create Organisation"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
