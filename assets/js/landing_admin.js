// assets/js/landing_admin.js
document.addEventListener("DOMContentLoaded", async () => {
  // === CEK LOGIN & ROLE ADMIN ===
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

  console.log(`Halo Admin ${profile.nama}`);

  function showToast(msg) {
    alert(msg);
  }

  // === UPLOAD HELPER ===
  async function uploadFile(file, folder) {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("landing_assets")
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage
      .from("landing_assets")
      .getPublicUrl(filePath);

    return pub.publicUrl;
  }

  // === Fungsi replaceData ===
  async function replaceData(table, newData) {
    // hapus semua dulu
    const { error: delError } = await supabase.from(table).delete().neq("id", 0);
    if (delError) console.warn(`⚠️ Gagal hapus lama di ${table}:`, delError);

    // masukkan baru
    const { error: insError } = await supabase.from(table).insert(newData);
    if (insError) throw insError;
  }

  // === HERO ===
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
      if (heroImage.files.length > 0) {
        img = await uploadFile(heroImage.files[0], "hero");
      }
      await replaceData("landing_hero", [{
        title: heroTitle.value,
        description: heroDesc.value,
        image_url: img,
      }]);
      showToast("✅ Hero diperbarui!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal memperbarui Hero");
    }
  });

  // === TENTANG ===
  const aboutText = document.getElementById("aboutText");
  const saveAboutBtn = document.getElementById("saveAbout");
  saveAboutBtn?.addEventListener("click", async () => {
    try {
      await replaceData("landing_tentang", [{ content: aboutText.value }]);
      showToast("✅ Tentang Kami diperbarui!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal simpan Tentang Kami");
    }
  });

  // === VISI MISI ===
  const visiText = document.getElementById("visiText");
  const misiText = document.getElementById("misiText");
  const saveVisionBtn = document.getElementById("saveVision");

  saveVisionBtn?.addEventListener("click", async () => {
    try {
      await replaceData("landing_visi_misi", [{
        visi: visiText.value,
        misi: misiText.value,
      }]);
      showToast("✅ Visi & Misi diperbarui!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal simpan Visi Misi");
    }
  });

  // === STRUKTUR ===
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
      showToast("✅ Struktur diperbarui!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal simpan Struktur");
    }
  });

  // === GALERI === (tidak replace, hanya tambah)
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
      showToast("✅ Foto galeri berhasil ditambahkan!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal upload galeri");
    }
  });

  // === AGENDA ===
  const agendaTitle = document.getElementById("agendaTitle");
  const agendaDate = document.getElementById("agendaDate");
  const agendaList = document.getElementById("agendaList");
  const addAgendaBtn = document.getElementById("addAgenda");

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
          <button onclick="editAgenda('${a.id}', '${a.title}', '${a.tanggal}')">✏️</button>
          <button onclick="deleteAgenda('${a.id}')">🗑</button>
        </div>`
      )
      .join("");
  }

  addAgendaBtn?.addEventListener("click", async () => {
    try {
      await supabase.from("landing_agenda").insert([
        { title: agendaTitle.value, tanggal: agendaDate.value },
      ]);
      showToast("✅ Agenda ditambahkan!");
      agendaTitle.value = "";
      agendaDate.value = "";
      loadAgenda();
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal menambah agenda");
    }
  });

  window.editAgenda = async (id, title, date) => {
    agendaTitle.value = title;
    agendaDate.value = date;
    addAgendaBtn.textContent = "Simpan Perubahan";
    addAgendaBtn.onclick = async () => {
      await supabase
        .from("landing_agenda")
        .update({ title: agendaTitle.value, tanggal: agendaDate.value })
        .eq("id", id);
      showToast("✅ Agenda diperbarui!");
      agendaTitle.value = "";
      agendaDate.value = "";
      addAgendaBtn.textContent = "Tambah Agenda";
      loadAgenda();
    };
  };

  window.deleteAgenda = async (id) => {
    await supabase.from("landing_agenda").delete().eq("id", id);
    loadAgenda();
  };

  loadAgenda();

  // === KONTAK ===
  const alamat = document.getElementById("alamat");
  const email = document.getElementById("email");
  const whatsapp = document.getElementById("whatsapp");
  const mapEmbed = document.getElementById("mapEmbed");
  const saveContactBtn = document.getElementById("saveContact");

  saveContactBtn?.addEventListener("click", async () => {
    try {
      await replaceData("landing_kontak", [{
        alamat: alamat.value,
        email: email.value,
        whatsapp: whatsapp.value,
        map_embed: mapEmbed.value,
      }]);
      showToast("✅ Kontak diperbarui!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal simpan kontak");
    }
  });
});
