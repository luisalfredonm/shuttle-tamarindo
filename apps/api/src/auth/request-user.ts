import { ForbiddenException } from '@nestjs/common';
import { Role } from '@shuttle/database';

/** Identidad que resuelve JwtStrategy y llega al controller como req.user */
export interface RequestUser {
  id: string;
  role: Role;
}

/**
 * Un cliente solo alcanza sus propios recursos; ADMIN alcanza todos.
 * Se usa donde el permiso depende del dueño del dato y no solo del rol,
 * así que no puede resolverse con RolesGuard.
 */
export function assertOwnerOrAdmin(
  ownerId: string,
  user: RequestUser,
  message = 'No tienes acceso a este recurso',
) {
  if (user.role === 'ADMIN') return;
  if (ownerId !== user.id) {
    throw new ForbiddenException(message);
  }
}
