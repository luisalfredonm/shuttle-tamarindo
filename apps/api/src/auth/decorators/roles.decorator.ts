import { SetMetadata } from '@nestjs/common';
import { Role } from '@shuttle/database';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a ciertos roles.
 * Requiere que JwtAuthGuard corra antes para tener req.user.
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('ADMIN')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
