/**
 * Crea (o promueve) el usuario ADMIN que usa el panel de administración.
 *
 * Idempotente: si el email ya existe, solo le asigna el rol ADMIN y
 * actualiza la contraseña. Pensado para correrse en cada despliegue nuevo.
 *
 *   npm run create:admin --workspace=apps/api -- <password>
 *
 * Toma ADMIN_EMAIL / ADMIN_NAME / ADMIN_PHONE de apps/api/.env.
 */
import 'dotenv/config';
import { PrismaClient } from '@shuttle/database';
import * as bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12; // mismo coste que AuthService.register

async function main() {
  const prisma = new PrismaClient();

  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME || 'Administrador';
  const phone = process.env.ADMIN_PHONE;
  const password = process.argv[2] || process.env.ADMIN_INITIAL_PASSWORD;

  if (!email) {
    throw new Error('Falta ADMIN_EMAIL en apps/api/.env');
  }

  if (!password || password.length < 8) {
    throw new Error(
      'Pasa una contraseña de al menos 8 caracteres:\n' +
        '  npm run create:admin --workspace=apps/api -- "TuPasswordSegura"',
    );
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', password: hashedPassword },
    create: { email, name, phone, password: hashedPassword, role: 'ADMIN' },
  });

  console.log(`OK  ${user.email} -> role=${user.role} (id: ${user.id})`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
