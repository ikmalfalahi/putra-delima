document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const msg = document.getElementById("msg");
  const togglePass = document.getElementById("toggle-pass");
  const passwordInput = document.getElementById("password");

  if (!loginBtn) {
    console.warn("Tombol login tidak ditemukan!");
    return;
  }

  // === Toggle tampilkan/sembunyikan password ===
  togglePass.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePass.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
  });

  // === Klik tombol login ===
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showMsg("Email dan kata sandi wajib diisi!", "red");
      return;
    }

    showMsg("Memproses login...", "gray");

    // === 1️⃣ Coba login ke Supabase Auth ===
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showMsg(`Login gagal: ${error.message}`, "red");
      return;
    }

    const user = data.user;

    // === 2️⃣ Ambil profil user dari tabel profiles ===
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError) {
      showMsg("Gagal memuat data profil.", "red");
      console.error(profileError);
      return;
    }

    // === 3️⃣ Cek status akun ===
    if (profileData.status !== "Aktif") {
      showMsg("Akun Anda belum aktif. Hubungi admin.", "orange");
      await supabase.auth.signOut();
      return;
    }

    showMsg("Login berhasil! Mengalihkan halaman...", "green");

    // === 4️⃣ Redirect sesuai role ===
    setTimeout(() => {
      if (profileData.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "anggota.html";
      }
    }, 1000);
  });

  // === Fungsi tampilkan pesan ===
  function showMsg(text, color) {
    msg.textContent = text;
    msg.style.color = color;
  }
});
