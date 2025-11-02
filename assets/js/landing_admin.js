document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (window.location.href = "../login.html");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    alert("Akses ditolak. Hanya admin yang dapat mengelola landing page.");
    return (window.location.href = "../index.html");
  }

  console.log(`✅ Halo Admin ${profile.nama}`);

  const showToast = (msg) => alert(msg);

  // ===== Upload File ke Supabase Storage =====
  async function uploadFile(file, folder) {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("landing_assets")
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("landing_assets").getPublicUrl(filePath).data.publicUrl;
  }

  // ================= HERO =================
  document.getElementById("saveHero").addEventListener("click", async () => {
    try {
      let img = document.getElementById("heroPreview").src;
      const file = document.getElementById("heroImage").files[0];
      if (file) img = await uploadFile(file, "hero");

      await supabase.from("landing_hero").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("landing_hero").insert([{
        title: document.getElementById("heroTitle").value,
        description: document.getElementById("heroDesc").value,
        image_url: img
      }]);
      showToast("✅ Hero diperbarui!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal menyimpan Hero");
    }
  });

  // ================= TENTANG =================
  document.getElementById("saveAbout").addEventListener("click", async () => {
    await supabase.from("landing_tentang").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("landing_tentang").insert([{ content: document.getElementById("aboutText").value }]);
    showToast("✅ Tentang Kami diperbarui!");
  });

  // ================= VISI MISI =================
  document.getElementById("saveVision").addEventListener("click", async () => {
    await supabase.from("landing_visi_misi").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("landing_visi_misi").insert([{
      visi: document.getElementById("visiText").value,
      misi: document.getElementById("misiText").value
    }]);
    showToast("✅ Visi & Misi diperbarui!");
  });

  // ================= STRUKTUR =================
  document.getElementById("saveStruktur").addEventListener("click", async () => {
    try {
      let img = document.getElementById("strukturPreview").src;
      const file = document.getElementById("strukturImage").files[0];
      if (file) img = await uploadFile(file, "struktur");

      await supabase.from("landing_struktur").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("landing_struktur").insert([{ image_url: img }]);
      showToast("✅ Struktur diperbarui!");
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal simpan Struktur");
    }
  });

  // ================= GALERI FOTO (CRUD) =================
  const galleryFiles = document.getElementById("galleryFiles");
  const galleryPreview = document.getElementById("galleryPreview");
  const uploadGalleryBtn = document.getElementById("uploadGallery");

  async function loadGallery() {
    const { data } = await supabase.from("landing_galeri").select("*").order("uploaded_at", { ascending: false });
    galleryPreview.innerHTML = data.map(
      (g) => `
      <div class="gallery-item">
        <img src="${g.image_url}" alt="${g.caption || ''}" />
        <p>${g.caption || '-'}</p>
        <button class="delete-btn" data-id="${g.id}">🗑 Hapus</button>
      </div>`
    ).join("");

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        await supabase.from("landing_galeri").delete().eq("id", btn.dataset.id);
        showToast("🗑 Foto dihapus!");
        loadGallery();
      });
    });
  }

  uploadGalleryBtn.addEventListener("click", async () => {
    try {
      const caption = document.getElementById("galleryCaption")?.value || "";
      for (const file of galleryFiles.files) {
        const url = await uploadFile(file, "galeri");
        await supabase.from("landing_galeri").insert([{ image_url: url, caption }]);
      }
      showToast("✅ Galeri diupload!");
      loadGallery();
    } catch (e) {
      console.error(e);
      showToast("❌ Gagal upload galeri");
    }
  });
  loadGallery();

  // ================= AGENDA (CRUD) =================
  const agendaList = document.getElementById("agendaList");
  async function loadAgenda() {
    const { data } = await supabase.from("landing_agenda").select("*").order("created_at", { ascending: false });
    agendaList.innerHTML = data.map(a => `
      <div class="agenda-item">
        <input value="${a.title || ''}" data-id="${a.id}" class="edit-title"/>
        <input value="${a.tanggal || ''}" data-id="${a.id}" class="edit-date"/>
        <input value="${a.lokasi || ''}" data-id="${a.id}" class="edit-lokasi"/>
        <button class="save-btn" data-id="${a.id}">💾 Simpan</button>
        <button class="delete-btn" data-id="${a.id}">🗑 Hapus</button>
      </div>`).join("");

    document.querySelectorAll(".save-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const title = document.querySelector(`.edit-title[data-id="${id}"]`).value;
        const tanggal = document.querySelector(`.edit-date[data-id="${id}"]`).value;
        const lokasi = document.querySelector(`.edit-lokasi[data-id="${id}"]`).value;
        await supabase.from("landing_agenda").update({ title, tanggal, lokasi }).eq("id", id);
        showToast("✅ Agenda diperbarui!");
        loadAgenda();
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        await supabase.from("landing_agenda").delete().eq("id", btn.dataset.id);
        showToast("🗑 Agenda dihapus!");
        loadAgenda();
      });
    });
  }

  document.getElementById("addAgenda").addEventListener("click", async () => {
    await supabase.from("landing_agenda").insert([{
      title: document.getElementById("agendaTitle").value,
      tanggal: document.getElementById("agendaDate").value,
      lokasi: document.getElementById("agendaLocation")?.value || ""
    }]);
    showToast("✅ Agenda baru ditambahkan!");
    loadAgenda();
  });
  loadAgenda();

  // ================= KONTAK =================
  document.getElementById("saveContact").addEventListener("click", async () => {
    await supabase.from("landing_kontak").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("landing_kontak").insert([{
      alamat: document.getElementById("alamat").value,
      email: document.getElementById("email").value,
      whatsapp: document.getElementById("whatsapp").value,
      map_embed: document.getElementById("mapEmbed").value
    }]);
    showToast("✅ Kontak diperbarui!");
  });

  // ================= LOGOUT =================
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../login.html";
  });
});
