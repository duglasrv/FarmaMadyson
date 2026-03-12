import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  firstName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50),
  lastName: z.string().min(2, 'Apellido debe tener al menos 2 caracteres').max(50),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const verifyTwoFactorSchema = z.object({
  tempToken: z.string().min(1),
  code: z.string().length(6, 'El código debe ser de 6 dígitos'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export const cartItemSchema = z.object({
  variantId: z.string().uuid('ID de variante inválido'),
  quantity: z.number().int().min(1, 'La cantidad mínima es 1').max(99),
});

export const calculateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'El carrito no puede estar vacío'),
  couponCode: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  categorySlug: z.string().optional(),
  brandId: z.string().uuid().optional(),
  productType: z.enum(['MEDICINE', 'SUPPLEMENT', 'PERSONAL_CARE', 'BABY', 'DEVICE', 'OTHER']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  requiresPrescription: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price_asc', 'price_desc', 'newest', 'popular']).default('name'),
});
