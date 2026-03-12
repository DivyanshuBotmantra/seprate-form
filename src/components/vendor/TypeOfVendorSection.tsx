import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BaseSectionProps } from './types';

const TypeOfVendorSection: React.FC<BaseSectionProps> = ({
    formData,
    errors,
    handleInputChange,
    isReadOnly = false
}) => {
    // Map stored values to RadioGroup values
    const mapStoredValueToRadioValue = (storedValue: string): string => {
        if (!storedValue) return '';

        const value = storedValue.trim();

        // Handle different possible stored values
        // Check for Employee first (most specific)
        if (value.includes('Employee')) {
            return 'Employee(FK01)';
        }
        // Check for Non Emp - Purchase Org
        if (value.includes('Non Emp - Purchase Org') || value.includes('XK01')) {
            return 'Non Emp - Purchase Org (XK01)';
        }
        // Check for Non Emp - Non Purchase Org
        if (value.includes('Non Emp - Non Purchase Org') || value === 'FK01') {
            return 'Non Emp - Non Purchase Org (FK01)';
        }

        // If the value already matches one of our RadioGroup values, return it
        if (value === 'Employee(FK01)' || value === 'Non Emp - Purchase Org (XK01)' || value === 'Non Emp - Non Purchase Org (FK01)') {
            return value;
        }

        return ''; // Return empty if no match found
    };

    // Get the mapped value for the RadioGroup
    const mappedValue = mapStoredValueToRadioValue(formData.typeOfVendor);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Type of Vendor</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full">
                    <RadioGroup
                        value={mappedValue}
                        onValueChange={(value) => !isReadOnly && handleInputChange('typeOfVendor', value)}
                        className="flex gap-8 w-full justify-start"
                        disabled={isReadOnly}
                    >
                        <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${isReadOnly ? 'bg-muted cursor-not-allowed opacity-60' : 'bg-muted'}`}>
                            <RadioGroupItem value="Employee(FK01)" id="main-fk01" />
                            <Label htmlFor="main-fk01" className={`text-sm font-medium ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                Employee
                            </Label>
                        </div>
                        <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${isReadOnly ? 'bg-muted cursor-not-allowed opacity-60' : 'bg-muted'}`}>
                            <RadioGroupItem value="Non Emp - Purchase Org (XK01)" id="main-xk01" disabled={isReadOnly} />
                            <Label htmlFor="main-xk01" className={`text-sm font-medium ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                Vendor Purchase Org
                            </Label>
                        </div>
                        <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${isReadOnly ? 'bg-muted cursor-not-allowed opacity-60' : 'bg-muted'}`}>
                            <RadioGroupItem value="Non Emp - Non Purchase Org (FK01)" id="main-fk01-2" disabled={isReadOnly} />
                            <Label htmlFor="main-fk01-2" className={`text-sm font-medium ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                Direct FI Vendor
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
                {errors.typeOfVendor && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200 mt-2">
                        <span className="text-red-500">⚠️</span>
                        <span>{errors.typeOfVendor}</span>
                    </div>
                )}

            </CardContent>
        </Card>
    );
};

export default TypeOfVendorSection;
