// assets/js/landing_data.js
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof supabase === "undefined") {
    console.error("❌ Supabase belum terdefinisi — pastikan urutan script benar");
    return;
  }

  // === HERO ===
  const { data: hero } = await supabase
    .from("landing_hero")
    .select("*")
    .limit(1)
    .single();

  if (hero) {
    const heroTitle = document.querySelector("#home h1");
    const heroDesc = document.querySelector("#home p");
    const heroSection = document.getElementById("home");
    if (heroTitle) heroTitle.textContent = hero.title || "Putra Delima";
    if (heroDesc) heroDesc.textContent = hero.description || "";
    if (hero.image_url) heroSection.style.backgroundImage = `url(${hero.image_url})`;
  }

  // === TENTANG KAMI ===
  const { data: tentang } = await supabase
    .from("landing_tentang")
    .select("*")
    .limit(1)
    .single();

  if (tentang && tentang.content) {
    const tentangEl = document.querySelector("#tentang p");
    if (tentangEl) tentangEl.textContent = tentang.content;
  }

  // === VISI & MISI ===
  const { data: visiMisi } = await supabase
    .from("landing_visi_misi")
    .select("*")
    .limit(1)
    .single();

  if (visiMisi) {
    const visiEl = document.querySelector("#visi .card:nth-child(1) p");
    const misiList = document.querySelector("#visi .card:nth-child(2) ul");
    if (visiEl) visiEl.textContent = visiMisi.visi || "-";
    if (misiList && visiMisi.misi) {
      misiList.innerHTML = visiMisi.misi
        .split("\n")
        .map(m => `<li>${m}</li>`)
        .join("");
    }
  }

  // === GALERI FOTO ===
  const galleryContainer = document.querySelector("#galeri .gallery");
  if (galleryContainer) {
    const { data: galeri, error } = await supabase
      .from("landing_galeri")
      .select("image_url, caption")
      .order("uploaded_at", { ascending: false });

    if (error) console.error("Gagal memuat galeri:", error);

    if (galeri && galeri.length > 0) {
      galleryContainer.innerHTML = galeri
        .map(
          (g) => `
            <div class="galeri-item" data-aos="zoom-in">
              <img src="${g.image_url}" alt="${g.caption || ''}">
              ${g.caption ? `<p class="caption">${g.caption}</p>` : ""}
            </div>`
        )
        .join("");
    } else {
      galleryContainer.innerHTML = `<p style="color:#aaa">Belum ada foto galeri.</p>`;
    }
  }

  // === AGENDA ===
  const agendaSection = document.querySelector("#agenda");
  if (agendaSection) {
    const { data: agenda } = await supabase
      .from("landing_agenda")
      .select("*")
      .order("created_at", { ascending: false });

    if (agenda && agenda.length > 0) {
      agendaSection.innerHTML =
        "<h2>Agenda Kegiatan</h2>" +
        agenda
          .map(
            (a) => `
            <article class="agenda-item" data-aos="fade-up">
              <h4>${a.title}</h4>
              <p>${a.tanggal} — ${a.lokasi || ""}</p>
            </article>`
          )
          .join("");
    }
  }

  // === KONTAK ===
  const { data: kontak } = await supabase
    .from("landing_kontak")
    .select("*")
    .limit(1)
    .single();

  if (kontak) {
    document.querySelector("#kontak p:nth-of-type(1)").textContent =
      kontak.alamat || "";
    document.querySelector("#kontak p:nth-of-type(2)").textContent =
      kontak.email || "";
    const wa = document.querySelector("#kontak a");
    if (wa) wa.href = `https://wa.me/${kontak.whatsapp}`;
    const iframe = document.querySelector("#kontak iframe");
    if (iframe && kontak.map_embed)
      iframe.src = kontak.map_embed;
  }
});
