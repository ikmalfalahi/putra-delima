// === Supabase Config ===
const SUPABASE_URL = "https://sosjorfcrsktcitaawyi.supabase.co"; // ganti dengan URL Supabase kamu
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvc2pvcmZjcnNrdGNpdGFhd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjcyMjcsImV4cCI6MjA3NzU0MzIyN30.4u1fZs46awWRQve_lfQGHE0bxP4Kqbv8qwhDtBogBUQ"; // ganti dengan anon key kamu

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
