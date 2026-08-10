import { createClient } from '@supabase/supabase-js';  
import dotenv from 'dotenv';  
dotenv.config();  
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);  
// Actually, I cannot drop a policy using the anon key! I need the service_role key or I have to run it in the SQL editor of Supabase.
// Let me check if there's a service role key in .env... no there is not.
