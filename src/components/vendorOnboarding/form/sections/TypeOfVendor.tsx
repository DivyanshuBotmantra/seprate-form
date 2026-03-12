import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { VendorFormValues } from "../schema";
import { Card, CardContent } from "@/components/ui/card";

const TypeOfVendor = () => {
    const { control } = useFormContext<VendorFormValues>();

    return (
        <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2 text-primary">Transaction Type</h3>
            
            <FormField
                control={control}
                name="type_of_vendor"
                render={({ field }) => (
                    <FormItem className="space-y-4">
                        <FormLabel>Select the type of vendor registration</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <FormItem>
                                    <FormControl>
                                        <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer transition-all ${field.value === "XK01" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                            <RadioGroupItem value="XK01" id="xk01" />
                                            <Label htmlFor="xk01" className="flex-1 cursor-pointer">
                                                <div className="font-bold">Vendor Purchase Org (XK01)</div>
                                                <div className="text-xs text-muted-foreground">Standard vendor with full purchasing organization data</div>
                                            </Label>
                                        </div>
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormControl>
                                        <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer transition-all ${field.value === "FK01" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                            <RadioGroupItem value="FK01" id="fk01" />
                                            <Label htmlFor="fk01" className="flex-1 cursor-pointer">
                                                <div className="font-bold">Direct FI Vendor (FK01)</div>
                                                <div className="text-xs text-muted-foreground">Finance-only vendor, skips purchasing details</div>
                                            </Label>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                    <p>Selection of vendor type affects mandatory fields in <strong>Banking</strong> and <strong>Internal Details</strong> sections.</p>
                </CardContent>
            </Card>
        </div>
    );
};

// Internal label helper since it's not imported from UI
const Label = ({ children, ...props }: any) => <label {...props}>{children}</label>;

export default TypeOfVendor;
