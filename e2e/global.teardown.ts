import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

teardown("cleanup test data after tests", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  const userId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey || !email || !password || !userId) {
    throw new Error("Missing required environment variables for cleanup");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.auth.signInWithPassword({
    email,
    password,
  });

  await supabase.from("pages").delete().eq("user_id", userId);

  //eslint-disable-next-line no-console
  console.log("Test data cleaned up after tests");
});
