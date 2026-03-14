import { useFormContext } from "react-hook-form";
import { FormField, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import FormInputWrapper from "../FormInputWrapper";

interface TypeOfVendorProps {
    isReadOnly?: boolean;
}

const TypeOfVendor = ({ isReadOnly }: TypeOfVendorProps) => {
    const { control } = useFormContext<VendorFormValues>();

    const options = [
        { id: "type-employee", label: "Employee", val: "Employee" },
        { id: "type-xk01", label: "Vendor Purchase Org", val: "XK01" },
        { id: "type-fk01", label: "Direct FI Vendor", val: "FK01" }
    ];

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Type of Vendor</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={control}
                    name="type_of_vendor"
                    render={({ field, fieldState }) => (
                        <FormInputWrapper 
                            label="Select Vendor Category"
                            required
                            error={fieldState.error}
                        >
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 w-full justify-start"
                                    disabled={isReadOnly}
                                >
                                    {options.map(opt => (
                                        <div key={opt.id} className="flex">
                                            <label
                                                htmlFor={opt.id}
                                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-300 w-full min-w-[200px] ${isReadOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${field.value === opt.val ? "bg-primary/5 border-primary ring-[0.5px] ring-primary shadow-sm scale-[1.02]" : "bg-card border-border hover:border-primary/20"}`}
                                            >
                                                <RadioGroupItem 
                                                    value={opt.val} 
                                                    id={opt.id} 
                                                    disabled={isReadOnly}
                                                    className="h-4 w-4 border-2 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
                                                />
                                                <span className={`text-[13px] font-bold ${field.value === opt.val ? "text-primary" : "text-foreground opacity-90"}`}>
                                                    {opt.label}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </FormInputWrapper>
                    )}
                />
            </CardContent>
        </>
    );
};

export default TypeOfVendor;
