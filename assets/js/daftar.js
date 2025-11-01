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

    // === 1️⃣ Daftar akun ke Supabase Auth ===
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama } },
    });

    if (signUpError) {
      showMsg(`Gagal daftar: ${signUpError.message}`, "red");
      daftarBtn.disabled = false;
      daftarBtn.textContent = "Daftar";
      console.error(signUpError);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      showMsg("Gagal membuat akun. Coba lagi nanti.", "red");
      daftarBtn.disabled = false;
      daftarBtn.textContent = "Daftar";
      return;
    }

    // === 2️⃣ Jika Confirm Email aktif (belum verifikasi) ===
    if (!signUpData.session) {
      showMsg("Akun berhasil dibuat! Silakan cek email untuk konfirmasi sebelum login.", "green");
      daftarBtn.disabled = false;
      daftarBtn.textContent = "Daftar";
      return;
    }

    // === 3️⃣ Update profil (bukan insert) ===
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
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
        email,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);
      showMsg(`Gagal memperbarui profil: ${updateError.message}`, "red");
      daftarBtn.disabled = false;
      daftarBtn.textContent = "Daftar";
      return;
    }

    // === 4️⃣ Sukses daftar ===
    showMsg("Pendaftaran berhasil! Tunggu persetujuan admin.", "green");
    daftarBtn.textContent = "Selesai";

    setTimeout(() => (window.location.href = "login.html"), 2500);
  });

  function showMsg(text, color) {
    msg.textContent = text;
    msg.style.color = color;
  }
});
