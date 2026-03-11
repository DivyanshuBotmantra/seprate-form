export interface Form {
    form_name: string;
    form_description: string;
    form_status: string;
}

export type FormStatus = "Active" | "Draft" | "Inactive";
