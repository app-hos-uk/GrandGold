import { z } from 'zod';
import { COUNTRY_CONFIGS } from '@grandgold/types';
// Email validation
export const emailSchema = z.string().email('Invalid email address');
// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
// Phone validation by country
export const phoneSchemaByCountry = {
    IN: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    AE: z.string().regex(/^5[0-9]{8}$/, 'Invalid UAE phone number'),
    UK: z.string().regex(/^7[0-9]{9}$/, 'Invalid UK phone number'),
};
// Generic phone validation
export const phoneSchema = z.string().min(9).max(15);
// Country validation
export const countrySchema = z.enum(['IN', 'AE', 'UK']);
// Name validation
export const nameSchema = z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');
// Registration schema
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema,
    country: countrySchema,
    acceptedTerms: z.literal(true, {
        errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
    marketingConsent: z.boolean().optional(),
});
// Login schema
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    country: countrySchema.optional(),
    deviceId: z.string().optional(),
});
// MFA verification schema
export const mfaVerifySchema = z.object({
    mfaToken: z.string().min(1, 'MFA token is required'),
    code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});
// Address schema
export const addressSchema = z.object({
    line1: z.string().min(1, 'Address line 1 is required').max(100),
    line2: z.string().max(100).optional(),
    city: z.string().min(1, 'City is required').max(50),
    state: z.string().max(50).optional(),
    postalCode: z.string().min(1, 'Postal code is required').max(10),
    country: countrySchema,
    label: z.enum(['home', 'work', 'other']).optional(),
});
// Product filter schema
export const productFilterSchema = z.object({
    category: z.array(z.string()).optional(),
    priceRange: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
    }).optional(),
    metalType: z.array(z.enum(['gold', 'silver', 'platinum', 'palladium'])).optional(),
    purity: z.array(z.enum(['24K', '22K', '21K', '18K', '14K', '10K'])).optional(),
    collections: z.array(z.string()).optional(),
    arEnabled: z.boolean().optional(),
    inStock: z.boolean().optional(),
});
// Order schema
export const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1),
    })).min(1, 'At least one item is required'),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    useSameAddress: z.boolean(),
    customerNotes: z.string().max(500).optional(),
    isGift: z.boolean().optional(),
    giftMessage: z.string().max(200).optional(),
    giftWrapping: z.boolean().optional(),
    insuranceIncluded: z.boolean().optional(),
});
// Seller onboarding schema
export const sellerOnboardingSchema = z.object({
    businessName: z.string().min(1).max(100),
    businessType: z.enum(['individual', 'company', 'partnership']),
    registrationNumber: z.string().optional(),
    taxId: z.string().optional(),
    businessAddress: addressSchema,
    acceptTerms: z.literal(true),
    acceptCommissionStructure: z.literal(true),
    onboardingType: z.enum(['automated', 'manual']),
    country: countrySchema,
});
// Validation helper functions
export function validateEmail(email) {
    return emailSchema.safeParse(email).success;
}
export function validatePassword(password) {
    const result = passwordSchema.safeParse(password);
    if (result.success) {
        return { valid: true, errors: [] };
    }
    return {
        valid: false,
        errors: result.error.errors.map((e) => e.message),
    };
}
export function validatePhone(phone, country) {
    const schema = phoneSchemaByCountry[country];
    return schema.safeParse(phone).success;
}
export function validatePostalCode(postalCode, country) {
    const config = COUNTRY_CONFIGS[country];
    return config.addressFormat.postalCodePattern.test(postalCode);
}
// Tax ID validation by country
export function validateTaxId(taxId, country) {
    const patterns = {
        IN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, // GST
        AE: /^[0-9]{15}$/, // TRN
        UK: /^GB[0-9]{9}$/, // VAT
    };
    return patterns[country]?.test(taxId) ?? false;
}
//# sourceMappingURL=validation.js.map