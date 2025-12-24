import { z } from 'zod';

export const LoginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format').max(255),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const RegisterSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format').max(255),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(255)
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/\d/, 'Password must contain at least one number')
            .regex(
                /[!@#$%^&*(),.?":{}|<>]/,
                'Password must contain at least one special character'
            ),
        name: z.string().min(1, 'Name is required').max(100).optional(),
    }),
});
