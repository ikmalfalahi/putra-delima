// landing_data.js — menampilkan konten dinamis dari Supabase
document.addEventListener("DOMContentLoaded", async () => {
  // Pastikan supabase.js sudah di-load dulu di <script> sebelumnya
  if (typeof supabase === "undefined") {
    console.error("❌ Supabase belum terdefinisi, pastikan supabase.js dimuat lebih dulu.");
    return;
  }

  // === HERO ===
  try {
    const { data: hero } = await supabase
      .from("landing_hero")
      .select("*")
      .single();

    if (hero) {
      const heroTitle = document.querySelector("#home h1");
      const heroDesc = document.querySelector("#home p");
      const heroSection = document.querySelector("#home");

      if (heroTitle) heroTitle.textContent = hero.title || "Putra Delima";
      if (heroDesc) heroDesc.textContent = hero.description || "";
      if (hero.image_url)
        heroSection.style.backgroundImage = `url(${hero.image_url})`;
    }
  } catch (err) {
    console.warn("Hero gagal dimuat:", err);
  }

  // === TENTANG KAMI ===
  try {
    const { data: tentang } = await supabase
      .from("landing_tentang")
      .select("*")
      .single();

    if (tentang) {
      const tentangEl = document.querySelector("#tentang p");
      if (tentangEl) tentangEl.innerHTML = tentang.content || "";
    }
  } catch (err) {
    console.warn("Tentang gagal dimuat:", err);
  }

  // === VISI & MISI ===
  try {
    const { data: vm } = await supabase
      .from("landing_visi_misi")
      .select("*")
      .single();

    if (vm) {
      document.querySelector("#visi .card:nth-child(1) p").textContent =
        vm.visi || "";
      const misiList = document.querySelector("#visi .card:nth-child(2) ul");
      if (misiList) {
        misiList.innerHTML = "";
        (vm.misi || "")
          .split("\n")
          .filter(x => x.trim() !== "")
          .forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            misiList.appendChild(li);
          });
      }
    }
  } catch (err) {
    console.warn("Visi & Misi gagal dimuat:", err);
  }

  // === STRUKTUR ORGANISASI ===
  try {
    const { data: struktur } = await supabase
      .from("landing_struktur")
      .select("*")
      .single();

    if (struktur?.image_url) {
      document.querySelector("#struktur img").src = struktur.image_url;
    }
  } catch (err) {
    console.warn("Struktur gagal dimuat:", err);
  }

  // === GALERI ===
  try {
    const { data: galeri } = await supabase
      .from("landing_galeri")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (galeri && galeri.length > 0) {
      const galeriContainer = document.querySelector("#galeri .gallery");
      galeriContainer.innerHTML = galeri
        .map(
          g => `
        <img src="${g.image_url}" alt="${g.caption || ''}" data-aos="zoom-in">
      `
        )
        .join("");
    }
  } catch (err) {
    console.warn("Galeri gagal dimuat:", err);
  }

  // === AGENDA ===
  try {
    const { data: agenda } = await supabase
      .from("landing_agenda")
      .select("*")
      .order("created_at", { ascending: false });

    if (agenda && agenda.length > 0) {
      const container = document.querySelector("#agenda");
      container.innerHTML =
        `<h2>Agenda Kegiatan</h2>` +
        agenda
          .map(
            a => `
          <article class="agenda-item" data-aos="fade-up">
            <h4>${a.title}</h4>
            <p>${a.tanggal} — ${a.lokasi || ""}</p>
          </article>
        `
          )
          .join("");
    }
  } catch (err) {
    console.warn("Agenda gagal dimuat:", err);
  }

  // === KONTAK ===
  try {
    const { data: kontak } = await supabase
      .from("landing_kontak")
      .select("*")
      .single();

    if (kontak) {
      const kontakSection = document.querySelector("#kontak");
      kontakSection.innerHTML = `
        <h2>Kontak Kami</h2>
        <p>📍 ${kontak.alamat || ""}</p>
        <p>✉️ ${kontak.email || ""}</p>
        <p>📞 <a href="https://wa.me/${kontak.whatsapp?.replace(/\D/g, '')}" target="_blank">${kontak.whatsapp || ""}</a></p>
        <div class="map-container" data-aos="zoom-in">
          ${kontak.map_embed || ""}
        </div>
      `;
    }
  } catch (err) {
    console.warn("Kontak gagal dimuat:", err);
  }
});
