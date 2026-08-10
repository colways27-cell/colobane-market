import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('Création du compte administrateur caché...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@colobanemarket.com',
    password: 'Bayeniass1975',
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('Le compte administrateur existe déjà !');
    } else {
        console.error('Erreur lors de la création:', error.message);
    }
  } else {
    console.log('Succès ! Le compte admin@colobanemarket.com a été créé.');
  }
}

createAdmin();
