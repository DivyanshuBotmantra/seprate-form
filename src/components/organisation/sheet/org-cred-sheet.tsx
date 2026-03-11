import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LucideFileCheckCorner, Trash2 } from "lucide-react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
    getOrgCred,
    createOrgCred,
    updateOrgCred,
} from "@/services/org-cred";

import { useLovMaster } from "@/hooks/useLovMaster";

interface Org {
    org_name: string;
}

interface Props {
    data: Org;
    refresh?: () => void;
}

type Credential = {
    cred_type: string;
    cred_sub_type: string;
    cred_json: string;
    cred_type_status: "ACTIVE" | "INACTIVE";
};

type FormValues = {
    credentials: Credential[];
};

const OrgCredSheet = ({ data, refresh }: Props) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"create" | "update">("create");

    const [credTypeMap, setCredTypeMap] = useState<Record<string, string[]>>({});
    const [subTypeJsonMap, setSubTypeJsonMap] = useState<Record<string, any>>({});
    const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());

    const { lovData } = useLovMaster(open);


    const form = useForm<FormValues>({
        defaultValues: {
            credentials: [
                {
                    cred_type: "",
                    cred_sub_type: "",
                    cred_json: "{}",
                    cred_type_status: "ACTIVE",
                },
            ],
        },
    });

    const { control, register, reset, watch, handleSubmit, setValue } = form;

    const watchedCredentials = useWatch({
        control,
        name: "credentials",
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "credentials",
    });

    // LOAD EXISTING
    useEffect(() => {
        if (!open) return;

        const load = async () => {
            setLoading(true);
            try {
                const res = await getOrgCred({
                    org_name: data.org_name,
                    cred_type: "",
                    cred_sub_type: "",
                    cred_type_status: "" as any,
                });

                // ✅ Check if API returned an error
                if (res?.error) {
                    toast.error(res.error);
                    setMode("create");
                    setExistingKeys(new Set());
                    reset({
                        credentials: [
                            {
                                cred_type: "",
                                cred_sub_type: "",
                                cred_json: "{}",
                                cred_type_status: "ACTIVE",
                            },
                        ],
                    });
                    return;
                }

                const items = res?.data?.response_body?.org_credentials || [];

                if (!items.length) {
                    setMode("create");
                    setExistingKeys(new Set());
                    reset({
                        credentials: [
                            {
                                cred_type: "",
                                cred_sub_type: "",
                                cred_json: "{}",
                                cred_type_status: "ACTIVE",
                            },
                        ],
                    });
                    return;
                }

                setMode("update");

                const keys = new Set<string>(
                    items.map((x: any) => `${x.cred_type}__${x.cred_sub_type}`)
                );
                setExistingKeys(keys);

                const formattedCredentials = items.map((x: any) => {
                    let formattedJson = "{}";

                    try {
                        if (typeof x.cred_json === "string") {
                            const parsed = JSON.parse(x.cred_json);
                            formattedJson = JSON.stringify(parsed, null, 2);
                        } else if (typeof x.cred_json === "object" && x.cred_json !== null) {
                            formattedJson = JSON.stringify(x.cred_json, null, 2);
                        }
                    } catch {
                        formattedJson = typeof x.cred_json === "string" ? x.cred_json : "{}";
                    }

                    return {
                        cred_type: x.cred_type || "",
                        cred_sub_type: x.cred_sub_type || "",
                        cred_json: formattedJson,
                        cred_type_status: x.cred_type_status || "ACTIVE",
                    };
                });

                reset({ credentials: formattedCredentials });
            } catch {
                toast.error("Failed to load credentials");
                setMode("create");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [open, data.org_name, reset]);

    // BUILD MAPS
    useEffect(() => {
        if (!lovData.length) return;

        const typeMap: Record<string, string[]> = {};
        const jsonMap: Record<string, any> = {};

        lovData.forEach((item) => {
            jsonMap[item.lov_type] = item.lov_json;

            if (item.lov_type === "CRED-TYPE") {
                item.lov_json.forEach((entry: any) => {
                    typeMap[entry.cred_type] = Array.isArray(entry.cred_sub_type)
                        ? entry.cred_sub_type
                        : [entry.cred_sub_type];
                });
            }
        });

        setCredTypeMap(typeMap);
        setSubTypeJsonMap(jsonMap);
    }, [lovData]);

    // ✅ AUTO-SELECT SUB-TYPE IF ONLY ONE
    useEffect(() => {
        watchedCredentials?.forEach((cred, index) => {
            if (!cred?.cred_type) return;

            const subTypes = credTypeMap[cred.cred_type] ?? [];

            // auto-select only when exactly one option
            if (subTypes.length === 1 && cred.cred_sub_type !== subTypes[0]) {
                setValue(`credentials.${index}.cred_sub_type`, subTypes[0], {
                    shouldDirty: true,
                });
            }
        });
    }, [watchedCredentials, credTypeMap, setValue]);


    // AUTO-FILL JSON
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (!name?.includes("cred_sub_type")) return;

            const rowIndex = Number(name.split(".")[1]);
            const subType = value.credentials?.[rowIndex]?.cred_sub_type;
            if (!subType) return;

            const template = subTypeJsonMap[subType];
            if (template) {
                setValue(
                    `credentials.${rowIndex}.cred_json`,
                    JSON.stringify(template, null, 2),
                    { shouldDirty: true }
                );
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, subTypeJsonMap, setValue]);

    // CLOSE
    const closeSheet = () => {
        setOpen(false);
        reset();
        setMode("create");
        setExistingKeys(new Set());
    };

    // SUBMIT
    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            for (const cred of values.credentials) {
                const key = `${cred.cred_type}__${cred.cred_sub_type}`;
                const exists = existingKeys.has(key);

                let parsed = cred.cred_json;
                try {
                    parsed = JSON.parse(cred.cred_json);
                } catch { }

                if (!exists) {
                    // ✅ Check response for errors
                    const createRes = await createOrgCred({
                        org_name: data.org_name,
                        cred_type: cred.cred_type,
                        cred_sub_type: cred.cred_sub_type,
                        cred_json: parsed,
                    });

                    // ✅ If error exists, show error toast and stop
                    if (createRes?.error) {
                        toast.error(createRes.error);
                        return;
                    }
                } else {
                    // ✅ Check response for errors
                    const updateRes = await updateOrgCred({
                        search_fields: {
                            org_name: data.org_name,
                            cred_type: cred.cred_type,
                            cred_sub_type: cred.cred_sub_type,
                        },
                        update_fields: {
                            cred_json: parsed,
                            cred_type_status: cred.cred_type_status,
                        },
                    });

                    // ✅ If error exists, show error toast and stop
                    if (updateRes?.error) {
                        toast.error(updateRes.error);
                        return;
                    }
                }
            }

            // ✅ Only shows if all API calls succeeded!
            toast.success("Credentials saved successfully!");
            refresh?.();
            closeSheet();
        } catch (error) {
            // ✅ Catch unexpected errors
            toast.error("Failed to save credentials");
        } finally {
            setLoading(false);
        }
    };
    // UI
    return (
        <>
            <Button
                variant="ghost"
                className="px-0"
                onClick={() => setOpen(true)}
            >
                <LucideFileCheckCorner size={18} />
            </Button>

            <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : closeSheet())}>
                <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 gap-0">
                    {/* FIXED HEADER */}
                    <SheetHeader className="border-b border-border/50 bg-background px-6 py-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg font-semibold">
                                Organisation Credentials
                            </SheetTitle>
                        </div>
                        <SheetDescription className="text-sm">
                            Manage multiple credentials for <span className="font-semibold text-foreground">{data.org_name}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {/* SCROLLABLE CONTENT */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <form
                            id="cred-form"
                            onSubmit={handleSubmit(onSubmit)}
                            className="p-6 space-y-4"
                        >
                            {/* FIELDS */}
                            {fields.map((field, index) => {
                                const credType = watch(`credentials.${index}.cred_type`);

                                return (
                                    <Card key={field.id} className="p-4 space-y-3 border-border/50 shadow-sm">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-center pb-2 border-b border-border/30">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm font-semibold">
                                                    Credential {index + 1}
                                                </Label>
                                                {mode === "update" && (
                                                    <Badge variant="secondary" className="text-xs px-2 py-0">
                                                        Existing
                                                    </Badge>
                                                )}
                                            </div>

                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => remove(index)}
                                                    className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="size-3.5 mr-1" />
                                                    Remove
                                                </Button>
                                            )}
                                        </div>

                                        {/* Credential Type & Sub-Type - Grid Layout */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Credential Type */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`cred-type-${index}`} className="text-sm font-medium">
                                                    Type <span className="text-destructive">*</span>
                                                </Label>
                                                <Select
                                                    value={credType || ""}
                                                    onValueChange={(value) =>
                                                        setValue(`credentials.${index}.cred_type`, value)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={`cred-type-${index}`}
                                                        className="h-9 bg-muted/30 border-border hover:bg-muted/50 transition-colors"
                                                    >
                                                        <SelectValue placeholder="Select type..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.keys(credTypeMap).length === 0 ? (
                                                            <SelectItem value="loading" disabled>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <div className="size-1 rounded-full bg-muted-foreground animate-pulse" />
                                                                    Loading types...
                                                                </div>
                                                            </SelectItem>
                                                        ) : (
                                                            Object.keys(credTypeMap).map((t) => (
                                                                <SelectItem key={t} value={t}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="size-1.5 rounded-full bg-primary" />
                                                                        {t}
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Credential Sub-Type */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`cred-sub-type-${index}`} className="text-sm font-medium">
                                                    Sub-Type <span className="text-destructive">*</span>
                                                </Label>
                                                <Select
                                                    value={watch(`credentials.${index}.cred_sub_type`) || ""}
                                                    onValueChange={(value) =>
                                                        setValue(`credentials.${index}.cred_sub_type`, value)
                                                    }
                                                    disabled={!credType}
                                                >
                                                    <SelectTrigger
                                                        id={`cred-sub-type-${index}`}
                                                        className="h-9 bg-muted/30 border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
                                                    >
                                                        <SelectValue
                                                            placeholder={credType ? "Select sub-type..." : "Select type first"}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {!credType ? (
                                                            <SelectItem value="select-type" disabled>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    ← Please select a type first
                                                                </div>
                                                            </SelectItem>
                                                        ) : (credTypeMap[credType] ?? []).length === 0 ? (
                                                            <SelectItem value="none" disabled>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    No sub-types available
                                                                </div>
                                                            </SelectItem>
                                                        ) : (
                                                            (credTypeMap[credType] ?? []).map((s) => (
                                                                <SelectItem key={s} value={s}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="size-1.5 rounded-full bg-primary" />
                                                                        {s}
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Credential JSON */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`cred-json-${index}`} className="text-sm font-medium">
                                                Credential JSON <span className="text-destructive">*</span>
                                            </Label>
                                            <Textarea
                                                id={`cred-json-${index}`}
                                                {...register(`credentials.${index}.cred_json`)}
                                                rows={6}
                                                placeholder='{\n  "key": "value",\n  "username": "example"\n}'
                                                className="font-mono text-xs resize-none bg-muted/30 border-border"
                                            />
                                        </div>

                                        {/* Status (only in update mode) */}
                                        {mode === "update" && (
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`cred-status-${index}`} className="text-sm font-medium">
                                                    Status
                                                </Label>
                                                <Select
                                                    value={watch(`credentials.${index}.cred_type_status`)}
                                                    onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                                                        setValue(`credentials.${index}.cred_type_status`, value)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={`cred-status-${index}`}
                                                        className="h-9 bg-muted/30 border-border hover:bg-muted/50 transition-colors"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ACTIVE">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-2 rounded-full bg-success" />
                                                                <span className="font-medium">ACTIVE</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="INACTIVE">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-2 rounded-full bg-muted-foreground" />
                                                                <span className="font-medium">INACTIVE</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}

                            {/* Add Credential Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-9"
                                onClick={() =>
                                    append({
                                        cred_type: "",
                                        cred_sub_type: "",
                                        cred_json: "{}",
                                        cred_type_status: "ACTIVE",
                                    })
                                }
                            >
                                + Add Another Credential
                            </Button>
                        </form>
                    </div>

                    {/* FIXED FOOTER */}
                    <SheetFooter className="border-t border-border/50 bg-background p-4 shrink-0">
                        <div className="flex gap-3 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-9"
                                onClick={closeSheet}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="cred-form"
                                className="flex-1 h-9"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : mode === "create" ? "Create Credentials" : "Save Changes"}
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default OrgCredSheet;
