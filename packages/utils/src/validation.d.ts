import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const phoneSchemaByCountry: {
    IN: z.ZodString;
    AE: z.ZodString;
    UK: z.ZodString;
};
export declare const phoneSchema: z.ZodString;
export declare const countrySchema: z.ZodEnum<["IN", "AE", "UK"]>;
export declare const nameSchema: z.ZodString;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodString;
    country: z.ZodEnum<["IN", "AE", "UK"]>;
    acceptedTerms: z.ZodLiteral<true>;
    marketingConsent: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: "IN" | "AE" | "UK";
    password: string;
    acceptedTerms: true;
    marketingConsent?: boolean | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: "IN" | "AE" | "UK";
    password: string;
    acceptedTerms: true;
    marketingConsent?: boolean | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    country: z.ZodOptional<z.ZodEnum<["IN", "AE", "UK"]>>;
    deviceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    country?: "IN" | "AE" | "UK" | undefined;
    deviceId?: string | undefined;
}, {
    email: string;
    password: string;
    country?: "IN" | "AE" | "UK" | undefined;
    deviceId?: string | undefined;
}>;
export declare const mfaVerifySchema: z.ZodObject<{
    mfaToken: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    mfaToken: string;
}, {
    code: string;
    mfaToken: string;
}>;
export declare const addressSchema: z.ZodObject<{
    line1: z.ZodString;
    line2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodString;
    country: z.ZodEnum<["IN", "AE", "UK"]>;
    label: z.ZodOptional<z.ZodEnum<["home", "work", "other"]>>;
}, "strip", z.ZodTypeAny, {
    country: "IN" | "AE" | "UK";
    line1: string;
    city: string;
    postalCode: string;
    line2?: string | undefined;
    state?: string | undefined;
    label?: "home" | "work" | "other" | undefined;
}, {
    country: "IN" | "AE" | "UK";
    line1: string;
    city: string;
    postalCode: string;
    line2?: string | undefined;
    state?: string | undefined;
    label?: "home" | "work" | "other" | undefined;
}>;
export declare const productFilterSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priceRange: z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
    }, {
        min: number;
        max: number;
    }>>;
    metalType: z.ZodOptional<z.ZodArray<z.ZodEnum<["gold", "silver", "platinum", "palladium"]>, "many">>;
    purity: z.ZodOptional<z.ZodArray<z.ZodEnum<["24K", "22K", "21K", "18K", "14K", "10K"]>, "many">>;
    collections: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    arEnabled: z.ZodOptional<z.ZodBoolean>;
    inStock: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    category?: string[] | undefined;
    priceRange?: {
        min: number;
        max: number;
    } | undefined;
    metalType?: ("gold" | "silver" | "platinum" | "palladium")[] | undefined;
    purity?: ("24K" | "22K" | "21K" | "18K" | "14K" | "10K")[] | undefined;
    collections?: string[] | undefined;
    arEnabled?: boolean | undefined;
    inStock?: boolean | undefined;
}, {
    category?: string[] | undefined;
    priceRange?: {
        min: number;
        max: number;
    } | undefined;
    metalType?: ("gold" | "silver" | "platinum" | "palladium")[] | undefined;
    purity?: ("24K" | "22K" | "21K" | "18K" | "14K" | "10K")[] | undefined;
    collections?: string[] | undefined;
    arEnabled?: boolean | undefined;
    inStock?: boolean | undefined;
}>;
export declare const createOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }, {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }>, "many">;
    shippingAddress: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodEnum<["IN", "AE", "UK"]>;
        label: z.ZodOptional<z.ZodEnum<["home", "work", "other"]>>;
    }, "strip", z.ZodTypeAny, {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    }, {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    }>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodEnum<["IN", "AE", "UK"]>;
        label: z.ZodOptional<z.ZodEnum<["home", "work", "other"]>>;
    }, "strip", z.ZodTypeAny, {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    }, {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    }>>;
    useSameAddress: z.ZodBoolean;
    customerNotes: z.ZodOptional<z.ZodString>;
    isGift: z.ZodOptional<z.ZodBoolean>;
    giftMessage: z.ZodOptional<z.ZodString>;
    giftWrapping: z.ZodOptional<z.ZodBoolean>;
    insuranceIncluded: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }[];
    shippingAddress: {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    };
    useSameAddress: boolean;
    billingAddress?: {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    } | undefined;
    customerNotes?: string | undefined;
    isGift?: boolean | undefined;
    giftMessage?: string | undefined;
    giftWrapping?: boolean | undefined;
    insuranceIncluded?: boolean | undefined;
}, {
    items: {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }[];
    shippingAddress: {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    };
    useSameAddress: boolean;
    billingAddress?: {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    } | undefined;
    customerNotes?: string | undefined;
    isGift?: boolean | undefined;
    giftMessage?: string | undefined;
    giftWrapping?: boolean | undefined;
    insuranceIncluded?: boolean | undefined;
}>;
export declare const sellerOnboardingSchema: z.ZodObject<{
    businessName: z.ZodString;
    businessType: z.ZodEnum<["individual", "company", "partnership"]>;
    registrationNumber: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    businessAddress: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodEnum<["IN", "AE", "UK"]>;
        label: z.ZodOptional<z.ZodEnum<["home", "work", "other"]>>;
    }, "strip", z.ZodTypeAny, {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    }, {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    }>;
    acceptTerms: z.ZodLiteral<true>;
    acceptCommissionStructure: z.ZodLiteral<true>;
    onboardingType: z.ZodEnum<["automated", "manual"]>;
    country: z.ZodEnum<["IN", "AE", "UK"]>;
}, "strip", z.ZodTypeAny, {
    country: "IN" | "AE" | "UK";
    businessName: string;
    businessType: "individual" | "company" | "partnership";
    businessAddress: {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    };
    acceptTerms: true;
    acceptCommissionStructure: true;
    onboardingType: "automated" | "manual";
    registrationNumber?: string | undefined;
    taxId?: string | undefined;
}, {
    country: "IN" | "AE" | "UK";
    businessName: string;
    businessType: "individual" | "company" | "partnership";
    businessAddress: {
        country: "IN" | "AE" | "UK";
        line1: string;
        city: string;
        postalCode: string;
        line2?: string | undefined;
        state?: string | undefined;
        label?: "home" | "work" | "other" | undefined;
    };
    acceptTerms: true;
    acceptCommissionStructure: true;
    onboardingType: "automated" | "manual";
    registrationNumber?: string | undefined;
    taxId?: string | undefined;
}>;
export declare function validateEmail(email: string): boolean;
export declare function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
};
export declare function validatePhone(phone: string, country: 'IN' | 'AE' | 'UK'): boolean;
export declare function validatePostalCode(postalCode: string, country: 'IN' | 'AE' | 'UK'): boolean;
export declare function validateTaxId(taxId: string, country: 'IN' | 'AE' | 'UK'): boolean;
//# sourceMappingURL=validation.d.ts.map