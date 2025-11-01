document.addEventListener("DOMContentLoaded", () => {
  const daftarBtn = document.getElementById("daftar-btn");
  const msg = document.getElementById("msg");
  const togglePass = document.getElementById("toggle-pass");
  const passwordInput = document.getElementById("password");

  togglePass.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePass.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
  });

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

    // ✅ jika confirm email aktif, beri pesan & hentikan
    if (signUpData.user && !signUpData.session) {
      showMsg("Akun berhasil dibuat! Silakan cek email untuk konfirmasi sebelum login.", "green");
      daftarBtn.disabled = false;
      daftarBtn.textContent = "Daftar";
      return;
    }

    // 🔎 Cek apakah profil sudah ada
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);
      showMsg("Gagal memeriksa data profil.", "red");
      daftarBtn.disabled = false;
      daftarBtn.textContent = "Daftar";
      return;
    }

    if (!existing) {
      const { error: insertError } = await supabase.from("profiles").insert([
        {
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
          email,
        },
      ]);

      if (insertError) {
        console.error(insertError);
        showMsg(`Gagal simpan profil: ${insertError.message}`, "red");
        daftarBtn.disabled = false;
        daftarBtn.textContent = "Daftar";
        return;
      }
    } else {
      console.warn("Profil sudah ada, tidak disimpan ulang.");
    }

    showMsg("Pendaftaran berhasil! Tunggu persetujuan admin.", "green");
    daftarBtn.textContent = "Selesai";

    setTimeout(() => (window.location.href = "login.html"), 2500);
  });

  function showMsg(text, color) {
    msg.textContent = text;
    msg.style.color = color;
  }
});
