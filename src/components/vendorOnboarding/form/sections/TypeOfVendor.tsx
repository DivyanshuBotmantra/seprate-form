import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";

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
                        <FormLabel className="text-base">Select the type of vendor registration</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div 
                                    className={`flex items-start space-x-3 rounded-xl border p-5 cursor-pointer transition-all duration-200 ${field.value === "XK01" ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm" : "hover:bg-muted/50 border-border"}`}
                                    onClick={() => field.onChange("XK01")}
                                >
                                    <RadioGroupItem value="XK01" id="xk01" className="mt-1" />
                                    <Label htmlFor="xk01" className="flex-1 cursor-pointer space-y-1">
                                        <div className="font-bold text-base">Full Vendor (XK01)</div>
                                        <div className="text-sm text-muted-foreground leading-relaxed">
                                            Includes Purchasing Org data. Use this for vendors providing goods/services with POs.
                                        </div>
                                    </Label>
                                </div>

                                <div 
                                    className={`flex items-start space-x-3 rounded-xl border p-5 cursor-pointer transition-all duration-200 ${field.value === "FK01" ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm" : "hover:bg-muted/50 border-border"}`}
                                    onClick={() => field.onChange("FK01")}
                                >
                                    <RadioGroupItem value="FK01" id="fk01" className="mt-1" />
                                    <Label htmlFor="fk01" className="flex-1 cursor-pointer space-y-1">
                                        <div className="font-bold text-base">Direct FI Vendor (FK01)</div>
                                        <div className="text-sm text-muted-foreground leading-relaxed">
                                            Finance-only. Skips purchasing organization details. Ideal for internal or one-time FI payments.
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <Card className="bg-muted/30 border-dashed border-2">
                <CardContent className="pt-6 text-sm text-muted-foreground flex gap-3 italic">
                    <span className="text-primary font-bold">Note:</span>
                    <p>Changing the vendor type dynamically updates the <strong>Internal Details</strong> and <strong>Banking</strong> requirements to match SAP standards.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default TypeOfVendor;
