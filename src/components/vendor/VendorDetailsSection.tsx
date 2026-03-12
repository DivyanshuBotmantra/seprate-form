import React, { useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/common/search-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { BaseSectionProps } from "./types";
import { getPlanningGroupFromVendorAccountGroup } from "./lov-utils";
import { isCINMandatory } from "./validation";

const VendorDetailsSection: React.FC<BaseSectionProps> = ({
  formData,
  errors,
  lovData,
  handleInputChange,
  isReadOnly = false,
  hasStep1Data = false,
}) => {
  // State for dropdown open/close
  const [titleTextOpen, setTitleTextOpen] = useState(false);

  // Field references for navigation (only for input fields)
  const searchTerm1Ref = useRef<HTMLInputElement>(null);
  const employeeNumberRef = useRef<HTMLInputElement>(null);
  const name1Ref = useRef<HTMLInputElement>(null);
  const name2Ref = useRef<HTMLInputElement>(null);

  const isEmployeeTypeForCin =
    formData.typeOfVendor === "Employee" ||
    formData.typeOfVendor === "Employee(FK01)";
  // Use combined logic: old name-based + new PAN-based
  const cinMandatoryForNames = !isEmployeeTypeForCin
    ? isCINMandatory(
      formData.panNumber || "",
      formData.name1 || "",
      formData.name2 || ""
    )
    : false;

  // Navigation helper function
  const focusNextField = (currentField: string) => {
    setTimeout(() => {
      switch (currentField) {
        case "vendorAccountGroup":
          // Focus on Terms of Payment Key (dropdown - will be handled by selection)
          break;
        case "termsOfPaymentKey":
          // Focus on Company Code (dropdown - will be handled by selection)
          break;
        case "companyCode":
          searchTerm1Ref.current?.focus();
          break;
        case "searchTerm1":
          // Focus on Title Text (dropdown - will be handled by selection)
          break;
        case "titleText":
          employeeNumberRef.current?.focus();
          break;
        case "employeeNumber":
          name1Ref.current?.focus();
          break;
        case "name1":
          name2Ref.current?.focus();
          break;
        case "name2":
          // Last field, no navigation
          break;
      }
    }, 100);
  };

  // Handle Enter key press for navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentField: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      focusNextField(currentField);
    }
  };

  // Helper function to capitalize first letter and lowercase the rest
  const capitalizeFirstLowerRest = (value: string): string => {
    if (!value) return value;
    const firstChar = value.charAt(0).toUpperCase();
    const rest = value.slice(1).toLowerCase();
    return firstChar + rest;
  };

  // Custom handler for vendor account group changes
  const handleVendorAccountGroupChange = useCallback(
    (value: string) => {
      handleInputChange("vendorAccountGroup", value);

      // Auto-populate planning group based on vendor account group
      if (lovData?.vendorAccPlanningGroup) {
        const planningGroup = getPlanningGroupFromVendorAccountGroup(
          value,
          lovData.vendorAccPlanningGroup
        );
        if (planningGroup) {
          handleInputChange("planningGroup", planningGroup);
        } else {
          // Try to find a match with just the code part
          const code = value.split(" - ")[0];
          const planningGroupByCode = getPlanningGroupFromVendorAccountGroup(
            code,
            lovData.vendorAccPlanningGroup
          );
          if (planningGroupByCode) {
            handleInputChange("planningGroup", planningGroupByCode);
          }
        }
      }

      // Navigate to next field after selection
      focusNextField("vendorAccountGroup");
    },
    [handleInputChange, lovData]
  );

  // Effect to auto-populate planning group when component loads with existing vendor account group
  useEffect(() => {
    if (
      formData.vendorAccountGroup &&
      lovData?.vendorAccPlanningGroup &&
      !formData.planningGroup
    ) {
      handleVendorAccountGroupChange(formData.vendorAccountGroup);
    }
  }, [
    formData.vendorAccountGroup,
    lovData?.vendorAccPlanningGroup,
    formData.planningGroup,
    handleVendorAccountGroupChange,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-1">
              <Label htmlFor="vendorAccountGroup">
                Vendor Account Group <span className="text-destructive">*</span>
                {hasStep1Data && (
                  <span className="text-xs text-primary ml-2"></span>
                )}
              </Label>
              <SearchableSelect
                options={lovData?.vendorAccountGroup || []}
                value={formData.vendorAccountGroup}
                onValueChange={(value) => {
                  if (!isReadOnly && !hasStep1Data) {
                    handleVendorAccountGroupChange(value);
                  }
                }}
                placeholder="Choose vendor account group"
                searchPlaceholder="Search vendor account groups..."
                emptyMessage="No vendor account groups found"
                triggerClassName={`h-10 w-full ${isReadOnly || hasStep1Data
                  ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                  : ""
                  }`}
                disabled={isReadOnly || hasStep1Data}
              />
              {errors.vendorAccountGroup && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive">⚠️</span>
                  <span className="text-destructive font-bold">
                    {errors.vendorAccountGroup}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="companyCode">
                Company Code <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={lovData?.companyCode || []}
                value={formData.companyCode}
                onValueChange={(value) => {
                  if (!isReadOnly) {
                    handleInputChange("companyCode", value);
                    // Navigate to next field after selection
                    focusNextField("companyCode");
                  }
                }}
                placeholder="Choose company code"
                searchPlaceholder="Search company codes..."
                emptyMessage="No company codes found"
                triggerClassName={`h-10 w-full ${isReadOnly
                  ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                  : ""
                  }`}
                disabled={isReadOnly}
              />
              {errors.companyCode && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive ">
                    {errors.companyCode}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name1">
                Name 1
                {hasStep1Data && (
                  <span className="text-xs text-primary ml-2"></span>
                )}
              </Label>
              <Input
                ref={name1Ref}
                id="name1"
                value={formData.name1 || ""}
                onChange={(e) => {
                  if (!isReadOnly && !hasStep1Data) {
                    const formattedValue = capitalizeFirstLowerRest(
                      e.target.value
                    );
                    handleInputChange("name1", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "name1")}
                placeholder="Enter vendor name"
                maxLength={35}
                className={`h-10 w-full ${errors.name1
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly || hasStep1Data
                    ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                    : ""
                  }`}
                disabled={isReadOnly || hasStep1Data}
              />
              {cinMandatoryForNames && (
                <p className="text-xs text-muted-foreground">
                  {/* CIN will be required unless the vendor name continues with Co-op, Housing, CHS, or Society. */}
                </p>
              )}
              {errors.name1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive ">{errors.name1}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="searchTerm1">
                Search Term 1 <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={searchTerm1Ref}
                id="searchTerm1"
                value={formData.searchTerm1}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("searchTerm1", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "searchTerm1")}
                placeholder="Enter search term"
                maxLength={18}
                className={`h-10 w-full ${errors.searchTerm1
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly
                    ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                    : ""
                  }`}
                disabled={isReadOnly}
              />
              {errors.searchTerm1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive text-sm">
                    {errors.searchTerm1}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-1">
              <Label htmlFor="employeeNumber">
                Employee Number
                {(() => {
                  const vendorGroupCode = formData.vendorAccountGroup
                    ? formData.vendorAccountGroup.split(" - ")[0]
                    : "";
                  return vendorGroupCode === "V010" ? (
                    <span className="text-destructive">*</span>
                  ) : null;
                })()}
                {hasStep1Data && (
                  <span className="text-xs bg-muted text-primary ml-2"></span>
                )}
              </Label>
              <div>
                <Input
                  ref={employeeNumberRef}
                  id="employeeNumber"
                  type="number"
                  value={formData.employeeNumber}
                  onChange={(e) => {
                    if (!isReadOnly && !hasStep1Data) {
                      const value = e.target.value;
                      // Only allow up to 4 digits
                      if (value.length <= 4) {
                        handleInputChange("employeeNumber", value);
                      }
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "employeeNumber")}
                  placeholder="Enter 4-digit employee number"
                  maxLength={4}
                  disabled={(() => {
                    const vendorGroupCode = formData.vendorAccountGroup
                      ? formData.vendorAccountGroup.split(" - ")[0]
                      : "";
                    return (
                      vendorGroupCode !== "V010" || isReadOnly || hasStep1Data
                    );
                  })()}
                  className={`h-10 w-full ${errors.employeeNumber
                    ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                    : ""
                    } ${(() => {
                      const vendorGroupCode = formData.vendorAccountGroup
                        ? formData.vendorAccountGroup.split(" - ")[0]
                        : "";
                      return vendorGroupCode !== "V010" ||
                        isReadOnly ||
                        hasStep1Data
                        ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                        : "cursor-text";
                    })()}`}
                />
              </div>
              {errors.employeeNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive text-sm">
                    {errors.employeeNumber}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="titleText">
                Title Text <span className="text-destructive">*</span>
              </Label>
              <Popover open={titleTextOpen} onOpenChange={setTitleTextOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={titleTextOpen}
                    className={`h-10 w-full justify-between ${errors.titleText
                      ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                      : ""
                      } ${isReadOnly
                        ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                        : ""
                      }`}
                    disabled={isReadOnly}
                  >
                    {formData.titleText
                      ? (lovData?.titleText || []).find(
                        (option) => option.value === formData.titleText
                      )?.label
                      : "Choose title"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0"
                  align="start"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandList>
                      <CommandEmpty>No title options found.</CommandEmpty>
                      <CommandGroup>
                        {(lovData?.titleText || []).map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            className="hover:bg-muted/50 focus:bg-muted/50 data-[selected=true]:bg-muted/50 cursor-pointer"
                            onSelect={(currentValue) => {
                              if (!isReadOnly) {
                                handleInputChange("titleText", currentValue);
                                setTitleTextOpen(false);
                                // Navigate to next field after selection
                                focusNextField("titleText");
                              }
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${formData.titleText === option.value
                                ? "opacity-100"
                                : "opacity-0"
                                }`}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.titleText && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive text-sm">
                    {errors.titleText}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="name2">Name 2</Label>
              <Input
                ref={name2Ref}
                id="name2"
                value={formData.name2 || ""}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("name2", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "name2")}
                placeholder="Enter additional name (Optional)"
                maxLength={35}
                className={`h-10 w-full ${errors.name2
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly
                    ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                    : ""
                  }`}
                disabled={isReadOnly}
              />
              {errors.name2 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive ">{errors.name2}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="termsOfPaymentKey">
                Terms of Payment Key <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={lovData?.termsOfPaymentKey || []}
                value={formData.termsOfPaymentKey}
                onValueChange={(value) => {
                  if (!isReadOnly) {
                    handleInputChange("termsOfPaymentKey", value);
                    // Navigate to next field after selection
                    focusNextField("termsOfPaymentKey");
                  }
                }}
                placeholder="Choose payment terms"
                searchPlaceholder="Search payment terms..."
                emptyMessage="No payment terms found"
                triggerClassName={`h-10 w-full ${isReadOnly
                  ? "bg-muted cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                  : ""
                  }`}
                disabled={isReadOnly}
              />
              {errors.termsOfPaymentKey && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive text-sm">
                    {errors.termsOfPaymentKey}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorDetailsSection;
