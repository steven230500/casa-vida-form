// One-off migration: copies the existing Supabase-hosted data (profiles,
// forms, form_blocks, questions, responses, answers, reviewer_assignments)
// into the new self-hosted Postgres. Run once, then Supabase can be retired.
//
// Usage: DATABASE_URL=... node scripts/migrate-from-supabase.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from "fs";
import postgres from "postgres";
import { scryptSync, randomBytes } from "crypto";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // no .env.local, rely on already-exported env vars
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL.",
  );
  process.exit(1);
}

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${table}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function randomTempPassword() {
  return randomBytes(9).toString("base64url");
}

async function main() {
  console.log("Fetching data from Supabase...");
  const [profiles, forms, formBlocks, questions, responses, answers, reviewerAssignments] =
    await Promise.all([
      fetchTable("profiles"),
      fetchTable("forms"),
      fetchTable("form_blocks"),
      fetchTable("questions"),
      fetchTable("responses"),
      fetchTable("answers"),
      fetchTable("reviewer_assignments"),
    ]);

  console.log(
    `Fetched: ${profiles.length} profiles, ${forms.length} forms, ${formBlocks.length} blocks, ` +
      `${questions.length} questions, ${responses.length} responses, ${answers.length} answers, ` +
      `${reviewerAssignments.length} reviewer assignments.`,
  );

  const sql = postgres(DATABASE_URL);
  const tempPasswords = [];

  try {
    await sql.begin(async (tx) => {
      // 1. Profiles -> users. Supabase's auth.users password hash can't be
      // recovered (different, incompatible hashing scheme) - each migrated
      // user gets a fresh random temp password, printed at the end.
      for (const p of profiles) {
        const tempPassword = randomTempPassword();
        tempPasswords.push({ email: p.email, password: tempPassword });
        await tx`
          INSERT INTO users (id, email, password_hash, full_name, role, created_at)
          VALUES (${p.id}, ${p.email}, ${hashPassword(tempPassword)}, ${p.full_name}, ${p.role}, ${p.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }

      for (const f of forms) {
        await tx`
          INSERT INTO forms (id, title, description, is_active, start_at, end_at, created_by, created_at)
          VALUES (${f.id}, ${f.title}, ${f.description}, ${f.is_active}, ${f.start_at}, ${f.end_at}, ${f.created_by}, ${f.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }

      for (const b of formBlocks) {
        await tx`
          INSERT INTO form_blocks (id, form_id, key, title, "order")
          VALUES (${b.id}, ${b.form_id}, ${b.key}, ${b.title}, ${b.order})
          ON CONFLICT (id) DO NOTHING
        `;
      }

      for (const q of questions) {
        await tx`
          INSERT INTO questions (id, form_id, block_id, key, label, type, options, required, "order", condition, created_at)
          VALUES (${q.id}, ${q.form_id}, ${q.block_id}, ${q.key}, ${q.label}, ${q.type}, ${tx.json(q.options)}, ${q.required}, ${q.order}, ${tx.json(q.condition)}, ${q.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }

      for (const r of responses) {
        await tx`
          INSERT INTO responses (id, form_id, anonymous, respondent_user_id, respondent_name, respondent_email, need_1on1, preferred_date, preferred_time, status, assigned_to, reviewed_by, reviewed_at, created_at)
          VALUES (${r.id}, ${r.form_id}, ${r.anonymous}, ${r.respondent_user_id}, ${r.respondent_name}, ${r.respondent_email}, ${r.need_1on1}, ${r.preferred_date}, ${r.preferred_time}, ${r.status}, ${r.assigned_to}, ${r.reviewed_by}, ${r.reviewed_at}, ${r.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }

      for (const a of answers) {
        await tx`
          INSERT INTO answers (id, response_id, question_id, value, created_at)
          VALUES (${a.id}, ${a.response_id}, ${a.question_id}, ${tx.json(a.value)}, ${a.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }

      for (const ra of reviewerAssignments) {
        await tx`
          INSERT INTO reviewer_assignments (id, form_id, reviewer_id, active, created_at)
          VALUES (${ra.id}, ${ra.form_id}, ${ra.reviewer_id}, ${ra.active}, ${ra.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    });

    console.log("\nMigration complete.");
    if (tempPasswords.length > 0) {
      console.log("\nTemporary passwords (share securely, ask users to change on first login):");
      for (const { email, password } of tempPasswords) {
        console.log(`  ${email} : ${password}`);
      }
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
