// landing_admin.js
document.addEventListener("DOMContentLoaded", () => {
  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDesc");
  const heroImage = document.getElementById("heroImage");
  const heroPreview = document.getElementById("heroPreview");
  const saveHeroBtn = document.getElementById("saveHero");

  const aboutText = document.getElementById("aboutText");
  const saveAboutBtn = document.getElementById("saveAbout");

  const visiText = document.getElementById("visiText");
  const misiText = document.getElementById("misiText");
  const saveVisionBtn = document.getElementById("saveVision");

  const strukturImage = document.getElementById("strukturImage");
  const strukturPreview = document.getElementById("strukturPreview");
  const saveStrukturBtn = document.getElementById("saveStruktur");

  const galleryFiles = document.getElementById("galleryFiles");
  const galleryPreview = document.getElementById("galleryPreview");
  const uploadGalleryBtn = document.getElementById("uploadGallery");

  const agendaTitle = document.getElementById("agendaTitle");
  const agendaDate = document.getElementById("agendaDate");
  const addAgendaBtn = document.getElementById("addAgenda");
  const agendaList = document.getElementById("agendaList");

  const alamat = document.getElementById("alamat");
  const email = document.getElementById("email");
  const whatsapp = document.getElementById("whatsapp");
  const mapEmbed = document.getElementById("mapEmbed");
  const saveContactBtn = document.getElementById("saveContact");

  /* ---------------------- UTIL ---------------------- */
  function showToast(msg, type = "info") {
    alert(msg); // bisa diganti modal custom
  }

  async function uploadFile(file, folder = "landing") {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("landing_assets")
      .upload(fileName, file, { upsert: true });

    if (error) throw error;
    const { data: publicUrl } = supabase.storage
      .from("landing_assets")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  }

  /* ---------------------- HERO ---------------------- */
  heroImage?.addEventListener("change", () => {
    const f = heroImage.files[0];
    if (f) heroPreview.src = URL.createObjectURL(f);
  });

  saveHeroBtn?.addEventListener("click", async () => {
    try {
      let imageUrl = heroPreview.src;
      if (heroImage.files.length > 0)
        imageUrl = await uploadFile(heroImage.files[0], "hero");

      await supabase.from("landing_hero").upsert({
        id: "1",
        title: heroTitle.value,
        description: heroDesc.value,
        image_url: imageUrl,
        updated_at: new Date(),
      });

      showToast("Hero berhasil disimpan!");
    } catch (e) {
      console.error(e);
      showToast("Gagal menyimpan hero", "error");
    }
  });

  /* ---------------------- TENTANG ---------------------- */
  saveAboutBtn?.addEventListener("click", async () => {
    try {
      await supabase.from("landing_tentang").upsert({
        id: "1",
        content: aboutText.value,
        updated_at: new Date(),
      });
      showToast("Tentang berhasil disimpan!");
    } catch (e) {
      showToast("Gagal menyimpan tentang", "error");
    }
  });

  /* ---------------------- VISI MISI ---------------------- */
  saveVisionBtn?.addEventListener("click", async () => {
    try {
      await supabase.from("landing_visi_misi").upsert({
        id: "1",
        visi: visiText.value,
        misi: misiText.value,
        updated_at: new Date(),
      });
      showToast("Visi & Misi disimpan!");
    } catch (e) {
      showToast("Gagal menyimpan visi misi", "error");
    }
  });

  /* ---------------------- STRUKTUR ---------------------- */
  strukturImage?.addEventListener("change", () => {
    const f = strukturImage.files[0];
    if (f) strukturPreview.src = URL.createObjectURL(f);
  });

  saveStrukturBtn?.addEventListener("click", async () => {
    try {
      let img = strukturPreview.src;
      if (strukturImage.files.length > 0)
        img = await uploadFile(strukturImage.files[0], "struktur");

      await supabase.from("landing_struktur").upsert({
        id: "1",
        image_url: img,
        updated_at: new Date(),
      });

      showToast("Struktur berhasil disimpan!");
    } catch (e) {
      showToast("Gagal menyimpan struktur", "error");
    }
  });

  /* ---------------------- GALERI ---------------------- */
  galleryFiles?.addEventListener("change", () => {
    galleryPreview.innerHTML = "";
    Array.from(galleryFiles.files).forEach((file) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      galleryPreview.appendChild(img);
    });
  });

  uploadGalleryBtn?.addEventListener("click", async () => {
    try {
      const files = Array.from(galleryFiles.files);
      for (const file of files) {
        const url = await uploadFile(file, "galeri");
        await supabase.from("landing_galeri").insert({ image_url: url });
      }
      showToast("Galeri berhasil diupload!");
    } catch (e) {
      console.error(e);
      showToast("Upload galeri gagal", "error");
    }
  });

  /* ---------------------- AGENDA ---------------------- */
  addAgendaBtn?.addEventListener("click", async () => {
    try {
      await supabase.from("landing_agenda").insert({
        title: agendaTitle.value,
        tanggal: agendaDate.value,
      });
      agendaTitle.value = "";
      agendaDate.value = "";
      showToast("Agenda berhasil ditambahkan!");
      loadAgenda();
    } catch (e) {
      showToast("Gagal menambah agenda", "error");
    }
  });

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

  window.deleteAgenda = async (id) => {
    if (!confirm("Yakin hapus agenda ini?")) return;
    await supabase.from("landing_agenda").delete().eq("id", id);
    loadAgenda();
  };

  loadAgenda();

  /* ---------------------- KONTAK ---------------------- */
  saveContactBtn?.addEventListener("click", async () => {
    try {
      await supabase.from("landing_kontak").upsert({
        id: "1",
        alamat: alamat.value,
        email: email.value,
        whatsapp: whatsapp.value,
        map_embed: mapEmbed.value,
      });
      showToast("Kontak berhasil disimpan!");
    } catch (e) {
      showToast("Gagal menyimpan kontak", "error");
    }
  });
});
