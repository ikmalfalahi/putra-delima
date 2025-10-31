document.addEventListener("DOMContentLoaded", () => {
  const daftarBtn = document.getElementById("daftar-btn");
  const msg = document.getElementById("msg");

  if (!daftarBtn) {
    console.error("Tombol daftar tidak ditemukan!");
    return;
  }

  daftarBtn.addEventListener("click", async () => {
    const nama = document.getElementById("nama").value.trim();
    const jenis_kelamin = document.getElementById("jenis_kelamin").value;
    const tanggal_lahir = document.getElementById("Tanggal_lahir").value;
    const agama = document.getElementById("agama").value.trim();
    const status_hubungan = document.getElementById("status_hubungan").value;
    const blok = document.getElementById("blok").value.trim();
    const rt = document.getElementById("rt").value.trim();
    const rw = document.getElementById("rw").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!nama || !email || !password) {
      msg.textContent = "Harap isi semua data wajib!";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Mendaftarkan akun...";
    msg.style.color = "gray";

    // === 1️⃣ Daftar akun ke Supabase Auth ===
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      msg.textContent = `Gagal daftar: ${error.message}`;
      msg.style.color = "red";
      return;
    }

    // === 2️⃣ Simpan data ke tabel 'profiles' ===
    const user = data.user;
    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        nama,
        jenis_kelamin,
        tanggal_lahir,
        agama,
        status: "Aktif",
        role: "anggota",
        blok,
        rt,
        rw,
        email,
      },
    ]);

    if (insertError) {
      msg.textContent = `Gagal simpan profil: ${insertError.message}`;
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Akun berhasil dibuat! Silakan login.";
    msg.style.color = "green";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  });
});
