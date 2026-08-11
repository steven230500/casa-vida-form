import postgres from "postgres";
import { scryptSync, randomBytes } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL || "test@test.com";
const password = process.env.ADMIN_PASSWORD || "123456789";

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL environment variable.");
  process.exit(1);
}

function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seedAdmin() {
  const sql = postgres(DATABASE_URL);

  try {
    const passwordHash = hashPassword(password);

    await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email}, ${passwordHash}, 'admin')
      ON CONFLICT (email)
      DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
    `;

    console.log(`Usuario administrador listo: ${email} / ${password}`);
  } finally {
    await sql.end();
  }
}

seedAdmin();
