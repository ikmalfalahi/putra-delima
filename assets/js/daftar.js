document.addEventListener("DOMContentLoaded", () => {
  const daftarBtn = document.getElementById("daftar-btn");
  const msg = document.getElementById("msg");
  const togglePass = document.getElementById("toggle-pass");
  const passwordInput = document.getElementById("password");

  // === Toggle password show/hide ===
  togglePass.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePass.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
  });

  // === Tombol daftar diklik ===
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
    const password = passwordInput.value.trim();

    if (!nama || !email || !password) {
      showMsg("Harap isi semua data wajib!", "red");
      return;
    }
    if (password.length < 6) {
      showMsg("Kata sandi minimal 6 karakter.", "red");
      return;
    }

    daftarBtn.disabled = true;
    daftarBtn.textContent = "Memproses...";
    showMsg("Mendaftarkan akun...", "gray");

    try {
      // === 1️⃣ Daftar akun ke Supabase Auth ===
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nama } },
      });

      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error("Gagal membuat akun. Coba lagi nanti.");

      // === 2️⃣ Masukkan profil ke tabel profiles via upsert ===
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert([{
          id: user.id,
          nama,
          jenis_kelamin,
          tanggal_lahir,
          agama,
          status_hubungan,
          blok,
          rt,
          rw,
          status: "Pending",
          role: "anggota",
          email
        }], { onConflict: "id" }); // Upsert berdasarkan id

      if (profileError) throw profileError;

      // === 3️⃣ Feedback sukses ===
      showMsg("Pendaftaran berhasil! Tunggu persetujuan admin.", "green");
      daftarBtn.textContent = "Selesai";

      setTimeout(() => (window.location.href = "login.html"), 2500);

    } catch (e) {
      console.error(e);
      showMsg(`Gagal daftar: ${e.message || e}`, "red");
      daftarBtn.disabled = false;
      daftarBtn.textContent = "Daftar";
    }
  });

  function showMsg(text, color) {
    msg.textContent = text;
    msg.style.color = color;
  }
});
