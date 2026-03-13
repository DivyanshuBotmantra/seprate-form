import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";

interface TypeOfVendorProps {
    isReadOnly?: boolean;
}

const TypeOfVendor = ({ isReadOnly }: TypeOfVendorProps) => {
    const { control } = useFormContext<VendorFormValues>();

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Type of Vendor</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={control}
                    name="type_of_vendor"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex flex-wrap gap-4 w-full justify-start"
                                    disabled={isReadOnly}
                                >
                                    <div 
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-200 ${isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${field.value === "Employee" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-muted/50 border-border"}`}
                                    >
                                        <RadioGroupItem value="Employee" id="type-employee" disabled={isReadOnly} />
                                        <Label htmlFor="type-employee" className={`text-sm font-medium ${isReadOnly ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-primary"}`}>
                                            Employee
                                        </Label>
                                    </div>

                                    <div 
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-200 ${isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${field.value === "XK01" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-muted/50 border-border"}`}
                                    >
                                        <RadioGroupItem value="XK01" id="type-xk01" disabled={isReadOnly} />
                                        <Label htmlFor="type-xk01" className={`text-sm font-medium ${isReadOnly ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-primary"}`}>
                                            Vendor Purchase Org
                                        </Label>
                                    </div>

                                    <div 
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-200 ${isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${field.value === "FK01" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-muted/50 border-border"}`}
                                    >
                                        <RadioGroupItem value="FK01" id="type-fk01" disabled={isReadOnly} />
                                        <Label htmlFor="type-fk01" className={`text-sm font-medium ${isReadOnly ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-primary"}`}>
                                            Direct FI Vendor
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </>
    );
};

export default TypeOfVendor;
