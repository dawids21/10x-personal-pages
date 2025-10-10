import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

supabaseClient.auth
  .signInWithPassword({
    email: "test@test.com",
    password: "test",
  })
  .then(({ data }) => {
    if (data.session) {
      console.log(data.session.access_token);
    }
  })
  .catch(console.error);
