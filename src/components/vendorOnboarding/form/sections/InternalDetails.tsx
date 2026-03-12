import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";

const InternalDetails = () => {
    const { control } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Internal Finance Details</h3>
            
            <FormField 
                control={control} 
                name="internal_details.purchase_order_currency" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Purchase Order Currency *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {(lovData?.purchaseOrderCurrency || []).map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} 
            />

            <FormField 
                control={control} 
                name="internal_details.reconciliation_account_in_general_ledger" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>GL Recon Account *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {(lovData?.reconciliationAccountInGeneralLedger || []).map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} 
            />

             <FormField 
                control={control} 
                name="internal_details.purchasing_organization" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Purchasing Organization</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select org" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {(lovData?.purchasingOrganization || []).map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} 
            />

            <FormField 
                control={control} 
                name="internal_details.planning_group" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Planning Group (Auto)</FormLabel>
                        <FormControl>
                            <Input {...field} readOnly className="bg-muted font-medium text-muted-foreground" placeholder="Derived from Account Group" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} 
            />

            <div className="col-span-full border-t pt-4 mt-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Withholding Tax Config</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-lg border">
                    <FormField 
                        control={control} 
                        name="internal_details.indicator_for_with_holding_tax_type1" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WT Indicator 1</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.indicatorForWithHoldingTaxType1 || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                    <FormField 
                        control={control} 
                        name="internal_details.receipt_type1" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Receipt Type 1</FormLabel>
                                <FormControl>
                                    <Input {...field} readOnly className="bg-background/50" placeholder="Auto-selected" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                    
                    <FormField 
                        control={control} 
                        name="internal_details.indicator_for_with_holding_tax_type2" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WT Indicator 2</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.indicatorForWithHoldingTaxType2 || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                    <FormField 
                        control={control} 
                        name="internal_details.receipt_type2" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Receipt Type 2</FormLabel>
                                <FormControl>
                                    <Input {...field} readOnly className="bg-background/50" placeholder="Auto-selected" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                </div>
            </div>
        </div>
    );
};
export default InternalDetails;
