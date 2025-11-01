// === Gunakan instance global dari supabase.js ===
const supabaseClient = supabase;

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
  rt: document.getElementById("rt"),
  rw: document.getElementById("rw"),
  blok: document.getElementById("blok"),
  status_hubungan: document.getElementById("status_hubungan"),
};

let userId = null;
let userEmail = null;

// === Cek sesi login ===
async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session) {
    alert("Sesi login berakhir. Silakan login kembali.");
    window.location.href = "https://ikmalfalahi.github.io/putra-delima/login.html";
    return;
  }

  const session = data.session;
  userId = session.user.id;
  userEmail = session.user.email;
  userName.textContent = session.user.email.split("@")[0];

  await loadProfile();
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

  // Isi data ke form
  if (data.avatar_url) fotoPreview.src = data.avatar_url;
  fields.nama.value = data.nama || "";
  fields.agama.value = data.agama || "";
  fields.tanggal_lahir.value = data.tanggal_lahir || "";
  fields.jenis_kelamin.value = data.jenis_kelamin || "";
  fields.rt.value = data.rt || "";
  fields.rw.value = data.rw || "";
  fields.blok.value = data.blok || "";
  fields.status_hubungan.value = data.status_hubungan || "";
  statusAnggota.textContent = data.status || "Aktif";
}

// === Aktifkan mode edit ===
editBtn.addEventListener("click", () => {
  Object.values(fields).forEach((el) => (el.disabled = false));
});

// === Simpan perubahan profil ===
simpanBtn.addEventListener("click", async () => {
  const updateData = {
    nama: fields.nama.value,
    agama: fields.agama.value,
    tanggal_lahir: fields.tanggal_lahir.value,
    jenis_kelamin: fields.jenis_kelamin.value,
    rt: fields.rt.value,
    rw: fields.rw.value,
    blok: fields.blok.value,
    status_hubungan: fields.status_hubungan.value,
  };

  const { error } = await supabaseClient
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    console.error(error);
    alert("Gagal menyimpan profil.");
    return;
  }

  Object.values(fields).forEach((el) => (el.disabled = true));
  alert("Profil berhasil diperbarui!");
});

// === Upload Foto Profil ===
uploadBtn.addEventListener("click", () => fotoInput.click());

fotoInput.addEventListener("change", async () => {
  const file = fotoInput.files[0];
  if (!file) return;

  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}_${Date.now()}.${fileExt}`;

  // Upload ke bucket "avatars"
  const { error: uploadError } = await supabaseClient.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error(uploadError);
    alert("Gagal upload foto. Pastikan bucket 'avatars' sudah dibuat & public.");
    return;
  }

  // Dapatkan URL publik
  const { data: publicURL } = supabaseClient.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const imageUrl = publicURL.publicUrl;

  // Tampilkan dan simpan ke tabel
  fotoPreview.src = imageUrl;
  await supabaseClient
    .from("profiles")
    .update({ avatar_url: imageUrl })
    .eq("id", userId);

  alert("Foto profil berhasil diunggah!");
});

// === Logout ===
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "https://ikmalfalahi.github.io/putra-delima/login.html";
});

// === Jalankan ===
checkSession();
