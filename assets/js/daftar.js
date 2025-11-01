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
    const status_hubungan = document.getElementById("status_hubungan").value; // 🔥 tambahkan ini
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

    daftarBtn.disabled = true;
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
      daftarBtn.disabled = false;
      return;
    }

    const user = signUpData.user;
    if (!user) {
      showMsg("Gagal membuat akun. Coba lagi nanti.", "red");
      daftarBtn.disabled = false;
      return;
    }

    // === 2️⃣ Tunggu session aktif ===
    let session = null;
    for (let i = 0; i < 5; i++) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        session = sessionData.session;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // === 3️⃣ Cek apakah profil sudah ada ===
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);
      showMsg("Gagal memeriksa data profil.", "red");
      daftarBtn.disabled = false;
      return;
    }

    if (!existing) {
      // === 4️⃣ Insert profil baru ===
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          nama,
          jenis_kelamin,
          tanggal_lahir,
          agama,
          status_hubungan, // 🔥 tambahkan ke insert
          blok,
          rt,
          rw,
          status: "Pending", // menunggu persetujuan admin
          role: "anggota",
          email,
        },
      ]);

      if (insertError) {
        console.error(insertError);
        showMsg(`Gagal simpan profil: ${insertError.message}`, "red");
        daftarBtn.disabled = false;
        return;
      }
    } else {
      console.warn("Profil sudah ada, tidak disimpan ulang.");
    }

    // === 5️⃣ Sukses daftar ===
    showMsg("Pendaftaran berhasil! Tunggu persetujuan admin.", "green");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2500);

    daftarBtn.disabled = false;
  });

  // === Fungsi tampilkan pesan ===
  function showMsg(text, color) {
    msg.textContent = text;
    msg.style.color = color;
  }
});
