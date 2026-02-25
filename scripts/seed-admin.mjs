import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAdmin() {
  const email = "test@test.com";
  const password = "123456789";

  console.log(`Creando usuario administrador: ${email}...`);

  // 1. Create user in auth.users
  const { data: userAuth, error: authError } =
    await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

  if (authError) {
    if (authError.message.includes("User already registered")) {
      console.log(
        "El usuario ya existe en auth.users. Asegurando perfil administrador...",
      );
      // We need to fetch the user ID if it already exists to ensure the profile is admin
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find((u) => u.email === email);
      if (existingUser) {
        await ensureAdminProfile(existingUser.id);
      }
      return;
    }
    console.error("Error al crear usuario auth:", authError);
    return;
  }

  const userId = userAuth.user.id;
  console.log(`Usuario creado exitosamente (ID: ${userId}).`);

  await ensureAdminProfile(userId);
}

async function ensureAdminProfile(userId) {
  // 2. Insert or update the profile to make them an admin
  console.log(
    `Asignando rol 'admin' en la tabla public.profiles al usuario ID: ${userId}...`,
  );
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, role: "admin" }, { onConflict: "id" });

  if (profileError) {
    console.error("Error al asignar rol en public.profiles:", profileError);
  } else {
    console.log("¡Rol administrador asignado correctamente!");
    console.log(
      "Ahora puedes iniciar sesión en /login con test@test.com / 123456789",
    );
  }
}

seedAdmin();
