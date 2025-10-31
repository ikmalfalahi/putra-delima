document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("daftar-form");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    msg.textContent = "Mendaftarkan akun...";
    msg.style.color = "gray";

    // === Buat akun di Supabase Auth ===
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      msg.textContent = `Gagal daftar: ${error.message}`;
      msg.style.color = "red";
      return;
    }

    // === Simpan profil ke tabel "profiles" ===
    const user = data.user;
    const { error: insertError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          nama,
          email,
          role: "anggota",
          status: "Aktif",
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
