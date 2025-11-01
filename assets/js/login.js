document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const msg = document.getElementById("login-msg");
  const togglePass = document.getElementById("toggle-pass");
  const passwordInput = document.getElementById("password");
  const emailInput = document.getElementById("email");

  if (!loginBtn || !emailInput || !passwordInput) {
    console.error("Elemen form login tidak ditemukan di halaman!");
    return;
  }

  // === Toggle tampilkan/sembunyikan password ===
  if (togglePass) {
    togglePass.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      togglePass.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
    });
  }

  // === Klik tombol login ===
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showMsg("Email dan kata sandi wajib diisi!", "red");
      return;
    }

    showMsg("Memproses login...", "gray");

    try {
      // === 1️⃣ Login ke Supabase Auth ===
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // === Tangani error login ===
        if (error.message.includes("Invalid login credentials")) {
          showMsg("Email atau kata sandi salah!", "red");
        } else if (error.message.includes("Email not confirmed")) {
          showMsg("Email belum dikonfirmasi. Periksa kotak masuk Anda!", "orange");
        } else {
          showMsg(`Gagal login: ${error.message}`, "red");
        }
        console.warn("Login error:", error);
        return;
      }

      const user = data?.user;
      if (!user) {
        showMsg("Gagal masuk. Silakan coba lagi nanti.", "red");
        return;
      }

      // === 2️⃣ Ambil data profil user ===
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        showMsg("Gagal memuat data profil pengguna.", "red");
        return;
      }

      // === 3️⃣ Cek status akun ===
      const status = profileData?.status?.toLowerCase() || "";
      if (status !== "aktif" && status !== "active") {
        showMsg("Akun Anda belum diaktifkan oleh admin.", "orange");
        await supabase.auth.signOut();
        return;
      }

      // === 4️⃣ Redirect sesuai role ===
      const role = profileData.role?.toLowerCase() || "anggota";
      showMsg("Login berhasil! Mengalihkan halaman...", "green");

      setTimeout(() => {
        if (role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "anggota.html";
        }
      }, 1200);
    } catch (err) {
      console.error("Unexpected login error:", err);
      showMsg("Terjadi kesalahan jaringan. Coba lagi nanti.", "red");
    }
  });

  // === Fungsi tampilkan pesan ===
  function showMsg(text, color) {
    if (!msg) return console.warn("Elemen #login-msg tidak ditemukan!");
    msg.textContent = text;
    msg.style.color = color;
  }
});
