import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, X, Check } from "lucide-react";
import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateTask } from "@/services/task/update-task";
import { toast } from "sonner";
import { DatePickerField } from "@/components/common/date-picker-field";

// Convert JSON Schema to Zod schema
const jsonSchemaToZod = (
  jsonSchema: any,
  isRequired: boolean = true
): z.ZodTypeAny => {
  if (jsonSchema.type === "object") {
    const shape: Record<string, z.ZodTypeAny> = {};
    const required = jsonSchema.required || [];

    // Recursively process nested objects and their properties
    // This ensures validations (including maximum for numbers) are applied at all nesting levels
    for (const [key, prop] of Object.entries(jsonSchema.properties || {})) {
      const propSchema = prop as any;
      const fieldIsRequired = required.includes(key);
      let zodField = jsonSchemaToZod(propSchema, fieldIsRequired);

      // If not required, make optional
      if (!fieldIsRequired) {
        zodField = zodField.optional();
      }

      shape[key] = zodField;
    }

    return z.object(shape);
  }

  if (jsonSchema.type === "array") {
    // Recursively process array items - this ensures validations (including maximum for numbers)
    // are applied to fields within array items (e.g., table rows)
    const itemSchema = jsonSchemaToZod(jsonSchema.items, true);
    let arraySchema = z.array(itemSchema);

    if (jsonSchema.minItems !== undefined) {
      arraySchema = arraySchema.min(
        jsonSchema.minItems,
        `At least ${jsonSchema.minItems} item(s) required`
      );
    }

    return arraySchema;
  }

  if (jsonSchema.type === "string") {
    // For optional fields, allow empty strings
    if (!isRequired) {
      let optionalSchema: z.ZodTypeAny = z.literal("");

      // Build the non-empty string schema
      let nonEmptySchema = z.string();

      if (jsonSchema.minLength !== undefined) {
        nonEmptySchema = nonEmptySchema.min(jsonSchema.minLength);
      }

      // Handle maximum/minimum for string fields (treat as numeric strings)
      if (
        jsonSchema.maximum !== undefined ||
        jsonSchema.minimum !== undefined
      ) {
        nonEmptySchema = nonEmptySchema.refine(
          (val) => {
            const num = Number(val);
            if (isNaN(num)) return false;
            if (jsonSchema.minimum !== undefined && num < jsonSchema.minimum)
              return false;
            if (jsonSchema.maximum !== undefined && num > jsonSchema.maximum)
              return false;
            return true;
          },
          {
            message:
              jsonSchema.minimum !== undefined &&
              jsonSchema.maximum !== undefined
                ? `Must be between ${jsonSchema.minimum} and ${jsonSchema.maximum}`
                : jsonSchema.minimum !== undefined
                ? `Must be >= ${jsonSchema.minimum}`
                : `Must be <= ${jsonSchema.maximum}`,
          }
        );
      }

      if (jsonSchema.pattern) {
        const regex = new RegExp(jsonSchema.pattern);
        nonEmptySchema = nonEmptySchema.regex(
          regex,
          jsonSchema.description || "Invalid format"
        );
      }

      // Union: empty string OR valid non-empty string
      return z.union([optionalSchema, nonEmptySchema]);
    }

    // For required fields, enforce all validations
    let stringSchema = z.string();

    if (jsonSchema.minLength !== undefined) {
      stringSchema = stringSchema.min(
        jsonSchema.minLength,
        jsonSchema.minLength > 0 ? "Required" : undefined
      );
    }

    // Handle maximum/minimum for string fields (treat as numeric strings)
    if (jsonSchema.maximum !== undefined || jsonSchema.minimum !== undefined) {
      stringSchema = stringSchema.refine(
        (val) => {
          const num = Number(val);
          if (isNaN(num)) return false;
          if (jsonSchema.minimum !== undefined && num < jsonSchema.minimum)
            return false;
          if (jsonSchema.maximum !== undefined && num > jsonSchema.maximum)
            return false;
          return true;
        },
        {
          message:
            jsonSchema.minimum !== undefined && jsonSchema.maximum !== undefined
              ? `Must be between ${jsonSchema.minimum} and ${jsonSchema.maximum}`
              : jsonSchema.minimum !== undefined
              ? `Must be >= ${jsonSchema.minimum}`
              : `Must be <= ${jsonSchema.maximum}`,
        }
      );
    }

    if (jsonSchema.pattern) {
      const regex = new RegExp(jsonSchema.pattern);
      stringSchema = stringSchema.regex(
        regex,
        jsonSchema.description || "Invalid format"
      );
    }

    return stringSchema;
  }

  if (jsonSchema.type === "number") {
    let numberSchema = z.coerce.number();

    if (jsonSchema.minimum !== undefined) {
      numberSchema = numberSchema.min(
        jsonSchema.minimum,
        `Must be >= ${jsonSchema.minimum}`
      );
    }

    if (jsonSchema.maximum !== undefined) {
      numberSchema = numberSchema.max(
        jsonSchema.maximum,
        `Must be <= ${jsonSchema.maximum}`
      );
    }

    return numberSchema;
  }

  if (jsonSchema.type === "date") {
    // Treat date as string with pattern validation
    let dateSchema: z.ZodString = z.string();

    if (jsonSchema.pattern) {
      const regex = new RegExp(jsonSchema.pattern);
      dateSchema = dateSchema.regex(
        regex,
        jsonSchema.description || "Invalid date format"
      );
    }

    if (!isRequired) {
      return z.union([z.literal(""), dateSchema]).optional();
    }

    return dateSchema;
  }

  return z.any();
};

export const TestPage = ({
  data,
  defValues,
  selectedOrg,
  payloadData,
  onOpenDialog,
  isReadOnly = false,
  transStatus,
}: {
  data?: any;
  defValues?: any;
  selectedOrg?: string;
  payloadData?: any;
  onOpenDialog?: (
    type: "reject" | "validate",
    action: () => Promise<void>
  ) => void;
  isReadOnly?: boolean;
  transStatus?: string;
}) => {
  const navigate = useNavigate();
  console.log(defValues, "defValues from test page");
  console.log(data, "data from test page");
  // Generate Zod schema from JSON Schema (with fallback for loading state)
  const schema = useMemo(
    () => (data ? jsonSchemaToZod(data) : z.object({})) as z.ZodObject<any>,
    [data]
  );

  const rejectFormApiCall = async () => {
    const payload = {
      org_name: selectedOrg,
      search_fields: {
        task_code: payloadData.task_code,
        task_id: payloadData.task_id,
      },
      update_fields: { trans_status: "REJECTED" },
    };
    const result = await updateTask(payload);
    if (result.error) {
      toast.error(`Error: ${result.error}`);
    } else {
      toast.success("Task updated successfully!");

      console.log("Task update response:", result.data);
      navigate(-1);
    }
  };

  type FormData = z.infer<typeof schema>;

  // Create default values dynamically based on schema
  const defaultValues = useMemo(() => {
    return defValues?.extracted_data || {};
  }, [defValues]);

  const form = useForm<any>({
    resolver: zodResolver(schema as any),
    defaultValues,
    mode: "onChange",
  });
  // Find the first array field for useFieldArray
  const arrayFieldName = useMemo(() => {
    if (!data || !data.properties) return "items";
    const arrayField = Object.entries(data.properties).find(
      ([_, prop]: [string, any]) =>
        prop.type === "array" && prop["ui:widget"] === "table"
    );
    return arrayField ? arrayField[0] : "items";
  }, [data]);

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: arrayFieldName,
  });

  // Reset form when defValues or data changes
  useEffect(() => {
    if (defValues && Object.keys(defValues).length > 0 && data) {
      form.reset(defValues);
      // Explicitly set array field if it exists in defValues
      if (
        defValues[arrayFieldName] &&
        Array.isArray(defValues[arrayFieldName])
      ) {
        replace(defValues[arrayFieldName]);
      }
    }
  }, [defValues, data, arrayFieldName, replace]);

  const onSubmit = async (formData: FormData) => {
    console.log("✅ VALIDATED:", formData);
    const payload = {
      org_name: selectedOrg,
      search_fields: {
        task_code: payloadData.task_code,
        task_id: payloadData.task_id,
      },
      update_fields: { updated_data: formData, trans_status: "SUBMITTED" },
    };
    const result = await updateTask(payload);
    if (result.error) {
      toast.error(`Error: ${result.error}`);
    } else {
      toast.success("Task updated successfully!");

      console.log("Task update response:", result.data);
      navigate(-1);
    }
  };

  // Handle loading state when data is not yet available
  if (!data || !data.properties) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Loading Form...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please wait while the form is being loaded...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Separate properties into simple fields, nested objects, and array fields
  const simpleFields = Object.entries(data.properties).filter(
    ([_, prop]: [string, any]) =>
      prop.type !== "array" && prop.type !== "object"
  );
  const nestedObjectFields = Object.entries(data.properties).filter(
    ([_, prop]: [string, any]) => prop.type === "object"
  );
  const arrayFields = Object.entries(data.properties).filter(
    ([_, prop]: [string, any]) =>
      prop.type === "array" && prop["ui:widget"] === "table"
  );

  // Get top-level required fields
  const topLevelRequired = data.required || [];

  console.log(form.getValues(), "form.getValues()");
  return (
    <Card className="h-full flex flex-col overflow-hidden relative">
      <CardContent className="flex-1 overflow-y-auto custom-scrollbar">
        {isReadOnly && transStatus && (
          <div className="sticky top-0 z-20 mb-4 mt-4">
            <div
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border ${
                transStatus?.toUpperCase() === "REJECTED"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
              style={{ opacity: 0.7 }}
            >
              {transStatus?.toUpperCase() === "REJECTED" ? (
                <>
                  <X className="w-5 h-5" />
                  <span className="font-semibold">Rejected</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Submitted</span>
                </>
              )}
            </div>
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Simple Fields Section */}
          {simpleFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Form Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {simpleFields.map(([fieldName, fieldSchema]: [string, any]) => {
                  const isTopLevelRequired =
                    topLevelRequired.includes(fieldName);
                  const isDateField = fieldSchema.type === "date";

                  return (
                    <div key={fieldName} className="space-y-1">
                      <Label>
                        {fieldSchema.title || fieldName}
                        {isTopLevelRequired && <span className=" ml-1">*</span>}
                      </Label>
                      {isDateField ? (
                        <DatePickerField
                          value={form.watch(fieldName) || ""}
                          onChange={(value) => form.setValue(fieldName, value)}
                          pattern={fieldSchema.pattern}
                          description={fieldSchema.description}
                          readOnly={fieldSchema.readOnly === true || isReadOnly}
                          disabled={isReadOnly}
                          errors={form.formState.errors[fieldName]}
                        />
                      ) : (
                        <>
                          <Input
                            type={
                              fieldSchema.type === "number" ? "number" : "text"
                            }
                            readOnly={
                              fieldSchema.readOnly === true || isReadOnly
                            }
                            disabled={isReadOnly}
                            {...form.register(fieldName)}
                          />
                          {form.formState.errors[fieldName] && (
                            <p className="text-sm text-red-500">
                              {
                                (form.formState.errors[fieldName] as any)
                                  ?.message
                              }
                            </p>
                          )}
                          {fieldSchema.description && (
                            <p className="text-xs text-gray-500">
                              {fieldSchema.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nested Object Fields Section */}
          {nestedObjectFields.map(([fieldName, fieldSchema]: [string, any]) => {
            const nestedProperties = fieldSchema.properties || {};
            const requiredFields = fieldSchema.required || [];
            const isTopLevelRequired = topLevelRequired.includes(fieldName);

            return (
              <div key={fieldName} className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {fieldSchema.title || fieldName}
                  {isTopLevelRequired && <span className=" ml-1">*</span>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(nestedProperties).map(
                    ([propName, propSchema]: [string, any]) => {
                      const fullFieldName = `${fieldName}.${propName}`;
                      const fieldError = (form.formState.errors as any)[
                        fieldName
                      ]?.[propName];
                      const isRequired = requiredFields.includes(propName);
                      const isDateField = propSchema.type === "date";

                      return (
                        <div key={propName} className="space-y-1">
                          <Label>
                            {propSchema.title || propName}
                            {isRequired && <span className=" ml-1">*</span>}
                          </Label>
                          {isDateField ? (
                            <DatePickerField
                              value={form.watch(fullFieldName) || ""}
                              onChange={(value) =>
                                form.setValue(fullFieldName, value)
                              }
                              pattern={propSchema.pattern}
                              description={propSchema.description}
                              readOnly={
                                propSchema.readOnly === true || isReadOnly
                              }
                              disabled={isReadOnly}
                              errors={fieldError}
                            />
                          ) : (
                            <>
                              <Input
                                type={
                                  propSchema.type === "number"
                                    ? "number"
                                    : "text"
                                }
                                readOnly={
                                  propSchema.readOnly === true || isReadOnly
                                }
                                disabled={isReadOnly}
                                {...form.register(fullFieldName)}
                              />
                              {fieldError && (
                                <p className="text-sm text-red-500">
                                  {fieldError?.message}
                                </p>
                              )}
                              {propSchema.description && (
                                <p className="text-xs text-gray-500">
                                  {propSchema.description}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}

          {/* Array/Table Fields Section */}
          {arrayFields.map(([fieldName, fieldSchema]: [string, any]) => {
            const itemProperties = fieldSchema.items?.properties || {};
            const requiredFields = fieldSchema.items?.required || [];
            const isTopLevelRequired = topLevelRequired.includes(fieldName);

            return (
              <div key={fieldName} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {fieldSchema.title || fieldName}
                    {isTopLevelRequired && <span className=" ml-1">*</span>}
                  </h3>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      onClick={() => {
                        const defaultItem: Record<string, any> = {};
                        Object.keys(itemProperties).forEach((key) => {
                          if (itemProperties[key].type === "number") {
                            defaultItem[key] = 0;
                          } else if (itemProperties[key].type === "date") {
                            defaultItem[key] = "";
                          } else {
                            defaultItem[key] = "";
                          }
                        });
                        append(defaultItem);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </Button>
                  )}
                </div>
                <div className="w-full max-w-full border rounded-md overflow-x-auto overflow-y-auto max-h-[300px]">
                  <Table className="min-w-full">
                    <TableHeader className="sticky top-0 bg-table-header z-10 ">
                      <TableRow className="border-b">
                        {Object.entries(itemProperties).map(
                          ([propName, propSchema]: [string, any]) => {
                            const isRequired =
                              requiredFields.includes(propName);
                            return (
                              <TableHead
                                key={propName}
                                className="whitespace-nowrap text-muted"
                              >
                                {propSchema.title || propName}
                                {isRequired && <span className=" ml-1">*</span>}
                              </TableHead>
                            );
                          }
                        )}
                        {!isReadOnly && (
                          <TableHead className="whitespace-nowrap text-muted">
                            Actions
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={
                              Object.keys(itemProperties).length +
                              (isReadOnly ? 0 : 1)
                            }
                            className="text-center text-muted-foreground"
                          >
                            No items. Click "Add Row" to add items.
                          </TableCell>
                        </TableRow>
                      )}
                      {fields.map((field, index) => (
                        <TableRow key={field.id} className="border-b">
                          {Object.entries(itemProperties).map(
                            ([propName, propSchema]: [string, any]) => {
                              const fullFieldName = `${fieldName}.${index}.${propName}`;
                              const fieldError = (form.formState.errors as any)[
                                fieldName
                              ]?.[index]?.[propName];
                              const isDateField = propSchema.type === "date";

                              return (
                                <TableCell
                                  key={propName}
                                  className="whitespace-nowrap"
                                >
                                  {isDateField ? (
                                    <DatePickerField
                                      value={form.watch(fullFieldName) || ""}
                                      onChange={(value) =>
                                        form.setValue(fullFieldName, value)
                                      }
                                      pattern={propSchema.pattern}
                                      description={propSchema.description}
                                      readOnly={
                                        propSchema.readOnly === true ||
                                        isReadOnly
                                      }
                                      disabled={isReadOnly}
                                      errors={fieldError}
                                    />
                                  ) : (
                                    <div className="space-y-1">
                                      <Input
                                        type={
                                          propSchema.type === "number"
                                            ? "number"
                                            : "text"
                                        }
                                        readOnly={
                                          propSchema.readOnly === true ||
                                          isReadOnly
                                        }
                                        disabled={isReadOnly}
                                        {...form.register(fullFieldName)}
                                      />
                                      {fieldError && (
                                        <p className="text-xs text-red-500">
                                          {fieldError?.message}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              );
                            }
                          )}
                          {!isReadOnly && (
                            <TableCell className="whitespace-nowrap">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}

          {/* <Button type="submit" className="mt-4">
            Validate & Submit
          </Button> */}
        </form>
      </CardContent>

      {!isReadOnly && (
        <CardFooter className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 w-full "
            onClick={() => {
              if (onOpenDialog) {
                onOpenDialog("reject", rejectFormApiCall);
              } else {
                rejectFormApiCall();
              }
            }}
          >
            <X className="w-4 h-4" /> Reject Task
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              if (onOpenDialog) {
                form.handleSubmit((formData) => {
                  onOpenDialog("validate", () => onSubmit(formData));
                })();
              } else {
                form.handleSubmit(onSubmit)();
              }
            }}
          >
            <Check className="w-4 h-4" /> Validate & Submit
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
