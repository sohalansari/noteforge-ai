import { z } from 'zod';

const password = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200);

export const RegisterSchema = z.object({
    name: z.string().min(1).max(80),
    email: z.string().email().max(200),
    password,
});

export const LoginSchema = z.object({
    email: z.string().email().max(200),
    password: z.string().min(1).max(200),
});

export const ForgotSchema = z.object({
    email: z.string().email().max(200),
});

export const ResetSchema = z.object({
    token: z.string().min(10),
    password,
});

export const VerifyEmailSchema = z.object({
    token: z.string().min(10),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: password,
});