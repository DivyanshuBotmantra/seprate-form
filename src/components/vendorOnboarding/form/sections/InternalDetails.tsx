import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";

const InternalDetails = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    const { control } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Internal Finance Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 items-start">
                    <FormField 
                        control={control} 
                        name="internal_details.purchase_order_currency" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Purchase Order Currency *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.purchaseOrderCurrency || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="internal_details.reconciliation_account_in_general_ledger" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">GL Recon Account *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.reconciliationAccountInGeneralLedger || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="internal_details.purchasing_organization" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Purchasing Organization</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select org" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.purchasingOrganization || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="internal_details.planning_group" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Planning Group (Auto)</FormLabel>
                                <FormControl>
                                    <Input {...field} readOnly className="h-10 bg-muted font-semibold text-[13px] text-muted-foreground cursor-not-allowed pointer-events-none" placeholder="Derived from Account Group" />
                                </FormControl>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />

                    <div className="col-span-full border-t pt-4 mt-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Withholding Tax Config</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <FormField 
                                control={control} 
                                name="internal_details.indicator_for_with_holding_tax_type1" 
                                render={({ field }) => (
                                    <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                        <FormLabel className="text-sm font-medium text-foreground">WT Indicator 1</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                            <FormControl>
                                                <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(lovData?.indicatorForWithHoldingTaxType1 || []).map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                                    </FormItem>
                                )} 
                            />
                            <FormField 
                                control={control} 
                                name="internal_details.receipt_type1" 
                                render={({ field }) => (
                                    <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                        <FormLabel className="text-sm font-medium text-foreground">Receipt Type 1</FormLabel>
                                        <FormControl>
                                            <Input {...field} readOnly className="h-10 bg-muted/50 font-semibold text-[13px] text-muted-foreground cursor-not-allowed pointer-events-none" placeholder="Auto-selected" />
                                        </FormControl>
                                        <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                                    </FormItem>
                                )} 
                            />
                            
                            <FormField 
                                control={control} 
                                name="internal_details.indicator_for_with_holding_tax_type2" 
                                render={({ field }) => (
                                    <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                        <FormLabel className="text-sm font-medium text-foreground">WT Indicator 2</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                            <FormControl>
                                                <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(lovData?.indicatorForWithHoldingTaxType2 || []).map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                                    </FormItem>
                                )} 
                            />
                            <FormField 
                                control={control} 
                                name="internal_details.receipt_type2" 
                                render={({ field }) => (
                                    <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                        <FormLabel className="text-sm font-medium text-foreground">Receipt Type 2</FormLabel>
                                        <FormControl>
                                            <Input {...field} readOnly className="h-10 bg-muted/50 font-semibold text-[13px] text-muted-foreground cursor-not-allowed pointer-events-none" placeholder="Auto-selected" />
                                        </FormControl>
                                        <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                                    </FormItem>
                                )} 
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </>
    );
};
export default InternalDetails;
