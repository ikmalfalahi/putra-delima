document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    msg.textContent = "Memproses login...";
    msg.style.color = "gray";

    // === Login Supabase ===
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      msg.textContent = `Login gagal: ${error.message}`;
      msg.style.color = "red";
      return;
    }

    // === Cek role user ===
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      msg.textContent = "Gagal memuat profil.";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Login berhasil!";
    msg.style.color = "green";

    // === Redirect sesuai role ===
    setTimeout(() => {
      if (profileData.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "anggota.html";
      }
    }, 1000);
  });
});
