// ==========================
//  landing_admin.js (FINAL)
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
  // === CEK LOGIN ===
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Silakan login terlebih dahulu.");
    return (window.location.href = "../login.html");
  }

  const userId = session.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    alert("Akses ditolak! Hanya admin yang dapat mengelola landing page.");
    return (window.location.href = "../index.html");
  }

  console.log(`✅ Halo Admin ${profile.nama}`);

  function showToast(msg) {
    alert(msg);
  }

  async function uploadFile(file, folder) {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("landing_assets")
      .upload(filePath, file, { upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: pub } = supabase.storage
      .from("landing_assets")
      .getPublicUrl(filePath);
    return pub.publicUrl;
  }

  // ===============================
  // 🧱 Fungsi General untuk Replace
  // ===============================
  async function replaceData(table, newData) {
    try {
      await supabase.from(table).delete(); // hapus semua dulu
      const { error } = await supabase.from(table).insert(newData);
      if (error) throw error;
    } catch (err) {
      console.error(`❌ Gagal replace data ${table}:`, err);
      throw err;
    }
  }

  // ===============================
  // 🎯 HERO
  // ===============================
  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDesc");
  const heroImage = document.getElementById("heroImage");
  const heroPreview = document.getElementById("heroPreview");
  const saveHeroBtn = document.getElementById("saveHero");

  heroImage?.addEventListener("change", () => {
    const f = heroImage.files[0];
    if (f) heroPreview.src = URL.createObjectURL(f);
  });

  saveHeroBtn?.addEventListener("click", async () => {
    try {
      let img = heroPreview.src;
      if (heroImage.files.length > 0) img = await uploadFile(heroImage.files[0], "hero");

      await replaceData("landing_hero", [{
        title: heroTitle.value.trim(),
        description: heroDesc.value.trim(),
        image_url: img
      }]);

      showToast("✅ Hero berhasil diperbarui!");
    } catch (err) {
      showToast("❌ Gagal menyimpan hero");
    }
  });

  // ===============================
  // 🧍 TENTANG KAMI
  // ===============================
  const aboutText = document.getElementById("aboutText");
  const saveAboutBtn = document.getElementById("saveAbout");

  saveAboutBtn?.addEventListener("click", async () => {
    try {
      await replaceData("landing_tentang", [{ content: aboutText.value.trim() }]);
      showToast("✅ Tentang Kami diperbarui!");
    } catch {
      showToast("❌ Gagal simpan Tentang Kami");
    }
  });

  // ===============================
  // 🌟 VISI & MISI
  // ===============================
  const visiText = document.getElementById("visiText");
  const misiText = document.getElementById("misiText");
  const saveVisionBtn = document.getElementById("saveVision");

  saveVisionBtn?.addEventListener("click", async () => {
    try {
      await replaceData("landing_visi_misi", [{
        visi: visiText.value.trim(),
        misi: misiText.value.trim()
      }]);
      showToast("✅ Visi & Misi diperbarui!");
    } catch {
      showToast("❌ Gagal simpan Visi & Misi");
    }
  });

  // ===============================
  // 🧩 STRUKTUR
  // ===============================
  const strukturImage = document.getElementById("strukturImage");
  const strukturPreview = document.getElementById("strukturPreview");
  const saveStrukturBtn = document.getElementById("saveStruktur");

  strukturImage?.addEventListener("change", () => {
    const f = strukturImage.files[0];
    if (f) strukturPreview.src = URL.createObjectURL(f);
  });

  saveStrukturBtn?.addEventListener("click", async () => {
    try {
      let url = strukturPreview.src;
      if (strukturImage.files.length > 0)
        url = await uploadFile(strukturImage.files[0], "struktur");

      await replaceData("landing_struktur", [{ image_url: url }]);
      showToast("✅ Struktur berhasil diperbarui!");
    } catch {
      showToast("❌ Gagal simpan struktur");
    }
  });

  // ===============================
  // 🖼️ GALERI (Hanya tambah & hapus manual)
  // ===============================
  const galleryFiles = document.getElementById("galleryFiles");
  const galleryPreview = document.getElementById("galleryPreview");
  const uploadGalleryBtn = document.getElementById("uploadGallery");

  galleryFiles?.addEventListener("change", () => {
    galleryPreview.innerHTML = "";
    for (const file of galleryFiles.files) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.width = "80px";
      img.style.margin = "4px";
      galleryPreview.appendChild(img);
    }
  });

  uploadGalleryBtn?.addEventListener("click", async () => {
    try {
      for (const file of galleryFiles.files) {
        const url = await uploadFile(file, "galeri");
        await supabase.from("landing_galeri").insert([{ image_url: url }]);
      }
      showToast("✅ Foto galeri berhasil diunggah!");
    } catch {
      showToast("❌ Gagal upload galeri");
    }
  });

  // ===============================
  // 📅 AGENDA
  // ===============================
  const agendaTitle = document.getElementById("agendaTitle");
  const agendaDate = document.getElementById("agendaDate");
  const addAgendaBtn = document.getElementById("addAgenda");
  const agendaList = document.getElementById("agendaList");

  async function loadAgenda() {
    const { data } = await supabase
      .from("landing_agenda")
      .select("*")
      .order("created_at", { ascending: false });
    agendaList.innerHTML = data
      .map(
        (a) => `
      <div class="agenda-item">
        <strong>${a.title}</strong><br>
        <small>${a.tanggal}</small>
        <button onclick="deleteAgenda('${a.id}')">🗑</button>
      </div>`
      )
      .join("");
  }

  addAgendaBtn?.addEventListener("click", async () => {
    try {
      await supabase.from("landing_agenda").insert([{
        title: agendaTitle.value.trim(),
        tanggal: agendaDate.value.trim()
      }]);
      agendaTitle.value = "";
      agendaDate.value = "";
      loadAgenda();
      showToast("✅ Agenda ditambah!");
    } catch {
      showToast("❌ Gagal menambah agenda");
    }
  });

  window.deleteAgenda = async (id) => {
    await supabase.from("landing_agenda").delete().eq("id", id);
    loadAgenda();
  };

  loadAgenda();

  // ===============================
  // ☎️ KONTAK & MAPS
  // ===============================
  const alamat = document.getElementById("alamat");
  const email = document.getElementById("email");
  const whatsapp = document.getElementById("whatsapp");
  const mapEmbed = document.getElementById("mapEmbed");
  const saveContactBtn = document.getElementById("saveContact");

  saveContactBtn?.addEventListener("click", async () => {
    try {
      await replaceData("landing_kontak", [{
        alamat: alamat.value.trim(),
        email: email.value.trim(),
        whatsapp: whatsapp.value.trim(),
        map_embed: mapEmbed.value.trim()
      }]);
      showToast("✅ Kontak diperbarui!");
    } catch {
      showToast("❌ Gagal simpan kontak");
    }
  });
});
