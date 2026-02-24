/**
 * Redefine a senha de um usuário para um valor fixo usando o email.
 * Uso:
 *   node scripts/reset-password-by-email.mjs pccarvalho54@gmail.com admin123456
 * Se a senha não for informada, usa "admin123456" como padrão.
 */
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    console.error("Arquivo .env.local não encontrado.");
    process.exit(1);
  }
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (value.startsWith('"') && value.endsWith('"'))
          value = value.slice(1, -1).replace(/\\"/g, '"');
        if (value.startsWith("'") && value.endsWith("'"))
          value = value.slice(1, -1).replace(/\\'/g, "'");
        process.env[key] = value;
      }
    }
  }
}

loadEnvLocal();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não definida em .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3] || "123456";

  if (!email) {
    console.error(
      "Uso: node scripts/reset-password-by-email.mjs <email> [nova_senha]",
    );
    process.exit(1);
  }

  const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;
  if (!users.length) {
    console.error(`Usuário com email "${email}" não encontrado.`);
    process.exit(1);
  }

  const user = users[0];
  console.log(`Redefinindo senha do usuário ${user.email} (id=${user.id})...`);

  const passwordHash = await hash(newPassword, 10);
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE id = ${user.id}
  `;

  console.log("Senha atualizada com sucesso.");
  console.log(
    `Nova senha em texto puro (anote e guarde com segurança): ${newPassword}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
