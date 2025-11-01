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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama },
      },
    });

    if (error) {
      showMsg(`Gagal daftar: ${error.message}`, "red");
      return;
    }

    const user = data.user;
    if (!user) {
      showMsg("Gagal membuat akun. Coba lagi nanti.", "red");
      return;
    }

    // === 2️⃣ Simpan ke tabel profiles dengan status "Pending" ===
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
        status: "Pending", // 🔥 belum aktif, menunggu persetujuan admin
        role: "anggota",
        email,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      showMsg(`Gagal simpan profil: ${insertError.message}`, "red");
      return;
    }

    // === 3️⃣ Berhasil daftar ===
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
