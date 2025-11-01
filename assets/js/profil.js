// === Konfigurasi Supabase ===
const SUPABASE_URL = "https://sosjorfcrsktcitaawyi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvc2pvcmZjcnNrdGNpdGFhd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjcyMjcsImV4cCI6MjA3NzU0MzIyN30.4u1fZs46awWRQve_lfQGHE0bxP4Kqbv8qwhDtBogBUQ";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Ambil Elemen HTML ===
const fotoInput = document.getElementById("fotoInput");
const fotoPreview = document.getElementById("fotoPreview");
const uploadBtn = document.getElementById("uploadBtn");
const editBtn = document.getElementById("editBtn");
const simpanBtn = document.getElementById("simpanBtn");
const statusAnggota = document.getElementById("statusAnggota");
const userName = document.getElementById("userName");

// === Field Profil ===
const fields = {
  nama: document.getElementById("nama"),
  agama: document.getElementById("agama"),
  tanggal_lahir: document.getElementById("tanggal_lahir"),
  jenis_kelamin: document.getElementById("jenis_kelamin"),
  alamat: document.getElementById("alamat"),
  rt: document.getElementById("rt"),
  rw: document.getElementById("rw"),
};

let userId = null;
let userEmail = null;

// === Cek sesi login ===
async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session) {
    alert("Sesi login berakhir. Silakan login kembali.");
    window.location.href = "../login.html";
    return;
  }

  const session = data.session;
  userId = session.user.id;
  userEmail = session.user.email;
  userName.textContent = session.user.email.split("@")[0];
  loadProfile();
}

// === Muat data profil dari Supabase ===
async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(error);
    alert("Gagal memuat profil.");
    return;
  }

  if (data.avatar_url) fotoPreview.src = data.avatar_url;
  fields.nama.value = data.nama || "";
  fields.agama.value = data.agama || "";
  fields.tanggal_lahir.value = data.tanggal_lahir || "";
  fields.jenis_kelamin.value = data.jenis_kelamin || "";
  fields.alamat.value = data.alamat || "";
  fields.rt.value = data.rt || "";
  fields.rw.value = data.rw || "";
  statusAnggota.textContent = data.status || "Aktif";
}

// === Aktifkan mode edit ===
editBtn.addEventListener("click", () => {
  Object.values(fields).forEach(el => (el.disabled = false));
});

// === Simpan perubahan profil ===
simpanBtn.addEventListener("click", async () => {
  const updateData = {
    nama: fields.nama.value,
    agama: fields.agama.value,
    tanggal_lahir: fields.tanggal_lahir.value,
    jenis_kelamin: fields.jenis_kelamin.value,
    alamat: fields.alamat.value,
    rt: fields.rt.value,
    rw: fields.rw.value,
  };

  const { error } = await supabaseClient.from("profiles").update(updateData).eq("id", userId);
  if (error) {
    console.error(error);
    alert("Gagal menyimpan profil.");
    return;
  }

  Object.values(fields).forEach(el => (el.disabled = true));
  alert("Profil berhasil diperbarui!");
});

// === Upload Foto Profil ===
uploadBtn.addEventListener("click", () => fotoInput.click());

fotoInput.addEventListener("change", async () => {
  const file = fotoInput.files[0];
  if (!file) return;

  const fileName = `${userId}_${Date.now()}.jpg`;

  const { error: uploadError } = await supabaseClient.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error(uploadError);
    alert("Gagal upload foto.");
    return;
  }

  const { data: publicURL } = supabaseClient.storage.from("avatars").getPublicUrl(fileName);
  const imageUrl = publicURL.publicUrl;

  fotoPreview.src = imageUrl;

  await supabaseClient.from("profiles").update({ avatar_url: imageUrl }).eq("id", userId);
  alert("Foto profil berhasil diunggah!");
});

// === Logout ===
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "../login.html";
});

// === Jalankan ===
checkSession();

