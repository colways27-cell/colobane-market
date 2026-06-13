import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqtwmeverlzgundljujf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdHdtZXZlcmx6Z3VuZGxqdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MDcyMjMsImV4cCI6MjA5NjI4MzIyM30.DIsXyDP0NnYjw7POXxUOAq7j4BgUSXnX2kuK4qZ2VEU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    phone: '+221771234567',
    password: 'password123'
  });
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}

test();
