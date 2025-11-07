import { z } from 'zod';
import { RESOURCES, OPERATIONS } from '@/config/rbac.js';

/**
 * Resource permission schema
 */
export const resourcePermissionSchema = z.object({
  resource: z.enum([...RESOURCES] as [string, ...string[]], {
    message: 'Invalid resource',
  }),
  operations: z
    .array(z.enum([...OPERATIONS] as [string, ...string[]]))
    .min(1, 'At least one operation must be provided')
    .refine(
      (ops) => ops.every((op) => OPERATIONS.includes(op as Operation)),
      'All operations must be valid'
    ),
});

type Operation = (typeof OPERATIONS)[number];

/**
 * Create/Update role permission schema
 */
export const createOrUpdateRolePermissionSchema = z.object({
  coldStorageId: z.string().min(1, 'Cold storage ID is required'),
  role: z.enum(['Manager', 'Assistant'], {
    message: 'Role must be either Manager or Assistant',
  }),
  permissions: z.array(resourcePermissionSchema).min(1, 'At least one permission must be provided'),
});

/**
 * Role param schema
 */
export const roleParamSchema = z.object({
  role: z.enum(['Manager', 'Assistant'], {
    message: 'Role must be either Manager or Assistant',
  }),
});

/**
 * Cold storage ID param schema
 */
export const coldStorageIdParamSchema = z.object({
  coldStorageId: z.string().min(1, 'Cold storage ID is required'),
});

/**
 * Type exports
 */
export type CreateOrUpdateRolePermissionInput = z.infer<typeof createOrUpdateRolePermissionSchema>;
export type RoleParam = z.infer<typeof roleParamSchema>;
export type ColdStorageIdParam = z.infer<typeof coldStorageIdParamSchema>;
