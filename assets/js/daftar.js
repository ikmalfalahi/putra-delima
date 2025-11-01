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
    const blok = document.getElementById("blok").value.trim();
    const rt = document.getElementById("rt").value.trim();
    const rw = document.getElementById("rw").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value.trim();

    // === Validasi dasar ===
    if (!nama || !email || !password) {
      showMsg("Harap isi semua data wajib!", "red");
      return;
    }

    if (password.length < 6) {
      showMsg("Kata sandi minimal 6 karakter.", "red");
      return;
    }

    showMsg("Mendaftarkan akun...", "gray");

    // === 1️⃣ Daftar akun Auth ===
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama },
      },
    });

    if (signUpError) {
      showMsg(`Gagal daftar: ${signUpError.message}`, "red");
      console.error(signUpError);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      showMsg("Gagal membuat akun. Coba lagi nanti.", "red");
      return;
    }

    // === 2️⃣ Tunggu session aktif (hindari insert tanpa auth) ===
    let session = null;
    for (let i = 0; i < 5; i++) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        session = sessionData.session;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!session) {
      console.warn("Session belum aktif, lanjut insert dengan anon role...");
    }

    // === 3️⃣ Simpan profil ke tabel "profiles" ===
    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        nama,
        jenis_kelamin,
        tanggal_lahir,
        agama,
        blok,
        rt,
        rw,
        status: "Pending", // 🔥 menunggu persetujuan admin
        role: "anggota",
        email,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      showMsg(`Gagal simpan profil: ${insertError.message}`, "red");
      return;
    }

    // === 4️⃣ Sukses daftar ===
    showMsg("Pendaftaran berhasil! Tunggu persetujuan admin.", "green");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  });

  // === Fungsi tampilkan pesan ===
  function showMsg(text, color) {
    msg.textContent = text;
    msg.style.color = color;
  }
});
