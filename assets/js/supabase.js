// === Supabase Config ===
const SUPABASE_URL = "https://fubxhouemqkixovtqcxp.supabase.co"; // ganti dengan URL Supabase kamu
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Ynhob3VlbXFraXhvdnRxY3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5Mjk3OTYsImV4cCI6MjA3NzUwNTc5Nn0.1DpX6SroRAZtU92R6-BsguC700gNUpUrjBeI7OR4uqY"; // ganti dengan anon key kamu

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
