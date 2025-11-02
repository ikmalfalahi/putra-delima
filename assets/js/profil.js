// === Ambil elemen ===
const fotoInput = document.getElementById("fotoInput");
const fotoPreview = document.getElementById("fotoPreview");
const uploadBtn = document.getElementById("uploadBtn");
const editBtn = document.getElementById("editBtn");
const simpanBtn = document.getElementById("simpanBtn");
const statusAnggota = document.getElementById("statusAnggota");
const userName = document.getElementById("userName");

const fields = {
  nama: document.getElementById("nama"),
  agama: document.getElementById("agama"),
  tanggal_lahir: document.getElementById("tanggal_lahir"),
  jenis_kelamin: document.getElementById("jenis_kelamin"),
  blok: document.getElementById("blok"),
  rt: document.getElementById("rt"),
  rw: document.getElementById("rw"),
  status_hubungan: document.getElementById("status_hubungan"),
};

let userId = null;
let userEmail = null;

// === Cek sesi login ===
async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
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

// === Muat data profil ===
async function loadProfile() {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    console.error(error);
    alert("Gagal memuat profil.");
    return;
  }

  fotoPreview.src = data.avatar_url || "https://ikmalfalahi.github.io/putra-delima/assets/img/default-avatar.png";
  fields.nama.value = data.nama || "";
  fields.agama.value = data.agama || "";
  fields.tanggal_lahir.value = data.tanggal_lahir || "";
  fields.jenis_kelamin.value = data.jenis_kelamin || "";
  fields.blok.value = data.blok || "";
  fields.rt.value = data.rt || "";
  fields.rw.value = data.rw || "";
  fields.status_hubungan.value = data.status_hubungan || "";
  statusAnggota.textContent = data.status || "Aktif";
}

// === Mode Edit ===
editBtn.addEventListener("click", () => {
  Object.values(fields).forEach((el) => (el.disabled = false));
});

// === Simpan Profil ===
simpanBtn.addEventListener("click", async () => {
  const updateData = {};
  for (const [key, el] of Object.entries(fields)) updateData[key] = el.value;

  const { error } = await supabase.from("profiles").update(updateData).eq("id", userId);
  if (error) {
    console.error(error);
    alert("Gagal menyimpan profil.");
    return;
  }

  Object.values(fields).forEach((el) => (el.disabled = true));
  alert("Profil berhasil diperbarui!");
});

// === Upload Foto ===
uploadBtn.addEventListener("click", () => fotoInput.click());

fotoInput.addEventListener("change", async () => {
  const file = fotoInput.files[0];
  if (!file) return;

  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
  if (uploadError) {
    console.error(uploadError);
    alert("Gagal upload foto. Pastikan bucket 'avatars' sudah dibuat dan public di Supabase.");
    return;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const imageUrl = data.publicUrl;

  fotoPreview.src = imageUrl;
  await supabase.from("profiles").update({ avatar_url: imageUrl }).eq("id", userId);
  alert("Foto profil berhasil diunggah!");
});

// === Logout ===
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "https://ikmalfalahi.github.io/putra-delima/login.html";
});

// === Jalankan ===
checkSession();

// === TOGGLE MODE ===
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const currentTheme = localStorage.getItem("theme") || "dark";

  // Set tema awal
  if (currentTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light");
    themeToggle.textContent = "🌙";
  }

  // Saat tombol diklik
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");

    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
  });
});
