import React, { useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/common/search-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BaseSectionProps } from "./types";
import { getRegionsForCountry, extractRegionCode } from "./lov-utils";
import { isForeignVendorAccountGroup } from "./validation";

const AddressDetailsSection: React.FC<BaseSectionProps> = ({
  formData,
  errors,
  lovData,
  handleInputChange,
  isReadOnly = false,
  validateField,
}) => {
  // Field references for auto-focus
  const street1Ref = useRef<HTMLInputElement>(null);
  const street2Ref = useRef<HTMLInputElement>(null);
  const street3Ref = useRef<HTMLInputElement>(null);
  const street4Ref = useRef<HTMLInputElement>(null);
  const street5Ref = useRef<HTMLInputElement>(null);
  const districtRef = useRef<HTMLInputElement>(null);
  const cityPostalCodeRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const firstMobileNoRef = useRef<HTMLInputElement>(null);
  const firstTelephoneRef = useRef<HTMLInputElement>(null);
  const telephoneDailingRef = useRef<HTMLInputElement>(null);
  const primaryEmailRef = useRef<HTMLInputElement>(null);
  const secondaryEmailRef = useRef<HTMLInputElement>(null);

  // Get regions for the selected country
  const availableRegions = useMemo(() => {
    if (!formData.countryKey || !lovData?.countryRegionMapping) {
      return [];
    }

    const regions = getRegionsForCountry(
      formData.countryKey,
      lovData.countryRegionMapping
    );

    // If no regions found for the specific country, show all unique regions as fallback
    if (regions.length === 0 && lovData.countryRegionMapping.length > 0) {
      const allRegions = [
        ...new Set(lovData.countryRegionMapping.map((item) => item.region)),
      ]
        .filter((region) => region && region.trim())
        .map((region) => {
          const regionCode = extractRegionCode(region);
          return { value: regionCode, label: region };
        });
      return allRegions;
    }

    return regions;
  }, [formData.countryKey, lovData?.countryRegionMapping]);

  // Auto-select region when country is already selected and LOV data loads
  useEffect(() => {
    if (
      !isReadOnly &&
      formData.countryKey &&
      lovData?.countryRegionMapping &&
      !formData.region
    ) {
      const regionsForCountry = getRegionsForCountry(
        formData.countryKey,
        lovData.countryRegionMapping
      );

      if (regionsForCountry.length === 1) {
        const singleRegion = regionsForCountry[0];
        handleInputChange("region", singleRegion.value);
      }
    }
  }, [
    lovData?.countryRegionMapping,
    formData.countryKey,
    formData.region,
    isReadOnly,
    handleInputChange,
  ]);

  // Auto-set Country Key based on vendor account group
  useEffect(() => {
    if (formData.vendorAccountGroup && !isReadOnly) {
      const isForeign = isForeignVendorAccountGroup(
        formData.vendorAccountGroup
      );

      if (!isForeign) {
        // Non-foreign vendor: Auto-set Country Key to 'IN'
        if (formData.countryKey !== "IN") {
          handleInputChange("countryKey", "IN");
        }
      } else {
        // Foreign vendor: Clear Country Key if it was 'IN' to allow user selection
        if (formData.countryKey === "IN") {
          handleInputChange("countryKey", "");
        }
      }
    }
  }, [
    formData.vendorAccountGroup,
    formData.countryKey,
    isReadOnly,
    handleInputChange,
  ]);

  // Helper function to check if Country Key should be read-only
  const isCountryKeyReadOnly = () => {
    if (isReadOnly) return true;
    return (
      formData.vendorAccountGroup &&
      !isForeignVendorAccountGroup(formData.vendorAccountGroup)
    );
  };

  // Handle country change - clear region when country changes and auto-select if only one region
  const handleCountryChange = (value: string) => {
    if (!isReadOnly) {
      // Extract country code if value is in "CODE - Name" format
      const countryCode = value.includes(' - ')
        ? value.split(' - ')[0].trim()
        : value.trim();

      handleInputChange("countryKey", countryCode);

      // Clear current region when country changes
      if (formData.region) {
        handleInputChange("region", "");
      }

      // Auto-select region if country has only one region
      if (countryCode && lovData?.countryRegionMapping) {
        const regionsForCountry = getRegionsForCountry(
          countryCode,
          lovData.countryRegionMapping
        );

        if (regionsForCountry.length === 1) {
          const singleRegion = regionsForCountry[0];
          handleInputChange("region", singleRegion.value);
        }
      }
    }
  };

  // Helper function to focus on the next logical field (matches tab order)
  const focusNextField = (currentField: string) => {
    setTimeout(() => {
      switch (currentField) {
        case "street1":
          street2Ref.current?.focus();
          break;
        case "street2":
          street3Ref.current?.focus();
          break;
        case "street3":
          street4Ref.current?.focus();
          break;
        case "street4":
          street5Ref.current?.focus();
          break;
        case "street5":
          districtRef.current?.focus();
          break;
        case "district":
          cityPostalCodeRef.current?.focus();
          break;
        case "cityPostalCode":
          cityRef.current?.focus();
          break;
        case "city":
          // Next in tab order: Country Key (SearchableSelect - no ref available)
          // Skip to next focusable field: First Mobile No
          firstMobileNoRef.current?.focus();
          break;
        case "countryKey":
          // Next in tab order: First Mobile No
          firstMobileNoRef.current?.focus();
          break;
        case "firstMobileNo":
          // Next in tab order: Region (SearchableSelect - no ref available)
          // Skip to next focusable field: Telephone Dailing
          telephoneDailingRef.current?.focus();
          break;
        case "region":
          // Next in tab order: Telephone Dailing
          telephoneDailingRef.current?.focus();
          break;
        case "telephoneDailing":
          // Next in tab order: Primary Email
          primaryEmailRef.current?.focus();
          break;
        case "primaryEmail":
          // Next in tab order: First Telephone
          firstTelephoneRef.current?.focus();
          break;
        case "firstTelephone":
          // Next in tab order: Secondary Email
          secondaryEmailRef.current?.focus();
          break;
        case "secondaryEmail":
          // This is the last field, no need to focus elsewhere
          break;
      }
    }, 100); // Small delay to ensure the field is ready
  };

  // Handle Enter key press to move to next field
  const handleKeyDown = (e: React.KeyboardEvent, currentField: string) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      focusNextField(currentField);
    }
    // Let Tab key work naturally with tabIndex
  };

  // Helper function to capitalize first letter and lowercase the rest
  const capitalizeFirstLowerRest = (value: string): string => {
    if (!value) return value;
    const firstChar = value.charAt(0).toUpperCase();
    const rest = value.slice(1).toLowerCase();
    return firstChar + rest;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="street1">
                Street <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={street1Ref}
                id="street1"
                value={formData.street1}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("street1", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "street1")}
                placeholder="Enter Street Address"
                maxLength={35}
                tabIndex={101}
                className={`h-10 w-full ${errors.street1
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.street1 && (
                <p className="text-sm text-destructive">{errors.street1}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street3">Street 3</Label>
              <Input
                ref={street3Ref}
                id="street3"
                value={formData.street3}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("street3", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "street3")}
                placeholder="Enter Street 3 (Optional)"
                maxLength={35}
                tabIndex={103}
                className={`h-10 w-full ${errors.street3
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.street3 && (
                <p className="text-sm text-destructive">{errors.street3}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street5">Street 5</Label>
              <Input
                ref={street5Ref}
                id="street5"
                value={formData.street5}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("street5", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "street5")}
                placeholder="Enter Street 5 (Optional)"
                maxLength={35}
                tabIndex={105}
                className={`h-10 w-full ${errors.street5
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.street5 && (
                <p className="text-sm text-destructive">{errors.street5}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityPostalCode">
                City Postal Code <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={cityPostalCodeRef}
                id="cityPostalCode"
                value={formData.cityPostalCode}
                onChange={(e) => {
                  if (!isReadOnly) {
                    // Only allow digits for postal code
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    handleInputChange("cityPostalCode", value);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField("cityPostalCode", formData.cityPostalCode);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField("cityPostalCode", formData.cityPostalCode);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("cityPostalCode");
                  }
                }}
                placeholder={
                  formData.vendorAccountGroup &&
                    !formData.vendorAccountGroup.toLowerCase().includes("foreign")
                    ? "Enter 6-digit Postal Code"
                    : "Enter Postal Code"
                }
                maxLength={6}
                tabIndex={107}
                className={`h-10 w-full ${errors.cityPostalCode
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.cityPostalCode && (
                <p className="text-sm text-destructive">
                  {errors.cityPostalCode}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryKey">
                Country Key <span className="text-destructive">*</span>
              </Label>
              {isCountryKeyReadOnly() && formData.countryKey === "IN" ? (
                // Show as read-only input for non-foreign vendors
                <Input
                  value="IN - India"
                  readOnly
                  placeholder="IN - India"
                  tabIndex={109}
                  className="h-10 w-full field-readonly"
                />
              ) : (
                // Show as dropdown for foreign vendors or when no vendor group selected
                <SearchableSelect
                  options={(lovData?.countryOptions || []).filter(
                    (option) => option && option.value && option.label
                  )}
                  value={formData.countryKey}
                  onValueChange={handleCountryChange}
                  placeholder="Select Country"
                  searchPlaceholder="Search countries..."
                  emptyMessage="No countries found"
                  triggerClassName={`h-10 w-full ${isCountryKeyReadOnly() ? "field-readonly" : ""
                    }`}
                  disabled={isCountryKeyReadOnly() || false}
                  tabIndex={109}
                />
              )}
              {errors.countryKey && (
                <p className="text-sm text-destructive">{errors.countryKey}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstMobileNo">First Mobile No</Label>
              <Input
                ref={firstMobileNoRef}
                id="firstMobileNo"
                type="tel"
                value={formData.firstMobileNo}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    handleInputChange("firstMobileNo", value);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField("firstMobileNo", formData.firstMobileNo);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField("firstMobileNo", formData.firstMobileNo);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("firstMobileNo");
                  }
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                tabIndex={110}
                className={`h-10 w-full ${errors.firstMobileNo
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.firstMobileNo && (
                <p className="text-sm text-destructive">
                  {errors.firstMobileNo}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephoneDailing">Telephone Dailing</Label>
              <Input
                ref={telephoneDailingRef}
                id="telephoneDailing"
                type="tel"
                value={formData.telephoneDailing}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    handleInputChange("telephoneDailing", value);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField(
                      "telephoneDailing",
                      formData.telephoneDailing
                    );
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField(
                      "telephoneDailing",
                      formData.telephoneDailing
                    );
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("telephoneDailing");
                  }
                }}
                placeholder="Enter 10-digit telephone number"
                maxLength={10}
                tabIndex={112}
                className={`h-10 w-full ${errors.telephoneDailing
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.telephoneDailing && (
                <p className="text-sm text-destructive">
                  {errors.telephoneDailing}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryEmail">Primary Email</Label>
              <Input
                ref={primaryEmailRef}
                id="primaryEmail"
                type="email"
                value={formData.primaryEmail}
                onChange={(e) => {
                  if (!isReadOnly) {
                    handleInputChange("primaryEmail", e.target.value);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField("primaryEmail", formData.primaryEmail);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField("primaryEmail", formData.primaryEmail);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("primaryEmail");
                  }
                }}
                placeholder="Enter primary email address"
                maxLength={60}
                tabIndex={113}
                className={`h-10 w-full ${errors.primaryEmail
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.primaryEmail && (
                <p className="text-sm text-destructive">
                  {errors.primaryEmail}
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="street2">Street 2</Label>
              <Input
                ref={street2Ref}
                id="street2"
                value={formData.street2}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("street2", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "street2")}
                placeholder="Enter Street 2 (Optional)"
                maxLength={35}
                tabIndex={102}
                className={`h-10 w-full ${errors.street2
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.street2 && (
                <p className="text-sm text-destructive">{errors.street2}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street4">Street 4</Label>
              <Input
                ref={street4Ref}
                id="street4"
                value={formData.street4}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("street4", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "street4")}
                placeholder="Enter Street 4 (Optional)"
                maxLength={35}
                tabIndex={104}
                className={`h-10 w-full ${errors.street4
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.street4 && (
                <p className="text-sm text-destructive">{errors.street4}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                ref={districtRef}
                id="district"
                value={formData.district}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("district", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "district")}
                placeholder="Enter District (Optional)"
                maxLength={35}
                tabIndex={106}
                className={`h-10 w-full ${errors.district
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.district && (
                <p className="text-sm text-destructive">{errors.district}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={cityRef}
                id="city"
                value={formData.city}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const formattedValue = e.target.value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
                      first.toUpperCase() + rest.toLowerCase()
                    );
                    handleInputChange("city", formattedValue);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, "city")}
                placeholder="Enter City"
                maxLength={35}
                tabIndex={108}
                className={`h-10 w-full ${errors.city
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">
                Region <span className="text-destructive">*</span>
              </Label>
              {availableRegions.length === 1 && formData.countryKey ? (
                // Show as read-only input for single region
                <Input
                  value={availableRegions[0].label || formData.region}
                  readOnly
                  placeholder="Auto-selected region"
                  tabIndex={111}
                  className="h-10 w-full field-readonly"
                />
              ) : (
                // Show as dropdown for multiple regions or no country selected
                <SearchableSelect
                  options={availableRegions.filter(
                    (option) => option && option.value && option.label
                  )}
                  value={formData.region}
                  onValueChange={(value) => {
                    if (!isReadOnly) {
                      // Extract region code (e.g., "17" from "17 - Nagaland")
                      const regionCode = extractRegionCode(value);
                      handleInputChange("region", regionCode);
                    }
                  }}
                  placeholder={
                    formData.countryKey
                      ? "Select Region"
                      : "Select Country first"
                  }
                  searchPlaceholder="Search regions..."
                  emptyMessage={
                    formData.countryKey
                      ? "No regions found for selected country"
                      : "Select Country first"
                  }
                  triggerClassName={`h-10 w-full ${isReadOnly || !formData.countryKey ? "field-readonly" : ""
                    }`}
                  disabled={isReadOnly || !formData.countryKey}
                  tabIndex={111}
                />
              )}
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstTelephone">First Telephone</Label>
              <Input
                ref={firstTelephoneRef}
                id="firstTelephone"
                type="tel"
                value={formData.firstTelephone}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    handleInputChange("firstTelephone", value);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField("firstTelephone", formData.firstTelephone);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField("firstTelephone", formData.firstTelephone);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("firstTelephone");
                  }
                }}
                placeholder="Enter 10-digit telephone number"
                maxLength={10}
                tabIndex={114}
                className={`h-10 w-full ${errors.firstTelephone
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.firstTelephone && (
                <p className="text-sm text-destructive">
                  {errors.firstTelephone}
                </p>
              )}
            </div>

            <div className="h-16"></div>
            <div className="space-y-2">
              <Label htmlFor="secondaryEmail">Secondary Email</Label>
              <Input
                ref={secondaryEmailRef}
                id="secondaryEmail"
                type="email"
                value={formData.secondaryEmail}
                onChange={(e) => {
                  if (!isReadOnly) {
                    handleInputChange("secondaryEmail", e.target.value);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField("secondaryEmail", formData.secondaryEmail);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField("secondaryEmail", formData.secondaryEmail);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("secondaryEmail");
                  }
                }}
                placeholder="Enter secondary email address"
                maxLength={60}
                tabIndex={115}
                className={`h-10 w-full ${errors.secondaryEmail
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${isReadOnly ? "field-readonly" : ""}`}
                disabled={isReadOnly}
              />
              {errors.secondaryEmail && (
                <p className="text-sm text-destructive">
                  {errors.secondaryEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressDetailsSection;
