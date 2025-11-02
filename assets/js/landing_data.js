// assets/js/landing_data.js
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof supabase === "undefined") {
    console.error("❌ Supabase belum terdefinisi — pastikan urutan script benar");
    return;
  }

  // === HERO ===
  const { data: hero } = await supabase.from("landing_hero").select("*").single();
  if (hero) {
    const heroTitle = document.querySelector("#home h1");
    const heroDesc = document.querySelector("#home p");
    const heroSection = document.getElementById("home");
    if (heroTitle) heroTitle.textContent = hero.title || "Putra Delima";
    if (heroDesc) heroDesc.textContent = hero.description || "";
    if (hero.image_url) heroSection.style.backgroundImage = `url(${hero.image_url})`;
  }

  // === TENTANG KAMI ===
  const { data: tentang } = await supabase.from("landing_tentang").select("*").single();
  if (tentang?.content) {
    const el = document.querySelector("#tentang p");
    if (el) el.textContent = tentang.content;
  }

  // === VISI & MISI ===
  const { data: visiMisi } = await supabase.from("landing_visi_misi").select("*").single();
  if (visiMisi) {
    const visiEl = document.querySelector("#visi .card:nth-child(1) p");
    const misiList = document.querySelector("#visi .card:nth-child(2) ul");
    if (visiEl) visiEl.textContent = visiMisi.visi || "-";
    if (misiList) {
      misiList.innerHTML = (visiMisi.misi || "")
        .split(/\n|,|;/)
        .filter(Boolean)
        .map((m) => `<li>${m.trim()}</li>`)
        .join("");
    }
  }

  // === STRUKTUR ===
  const { data: struktur } = await supabase.from("landing_struktur").select("*").single();
  if (struktur?.image_url) {
    const strukturImg = document.getElementById("strukturImage");
    if (strukturImg) strukturImg.src = struktur.image_url;
  }

  // === GALERI ===
  const { data: galeri } = await supabase.from("landing_galeri").select("*").order("uploaded_at", { ascending: false });
  const galleryContainer = document.getElementById("galleryContainer");
  if (galeri && galleryContainer) {
    galleryContainer.innerHTML = galeri
      .map(
        (g) => `
        <div class="galeri-item" data-aos="zoom-in">
          <img src="${g.image_url}" alt="${g.caption || ''}" />
          ${g.caption ? `<p class="caption">${g.caption}</p>` : ""}
        </div>`
      )
      .join("");
  }

  // === AGENDA ===
  const { data: agenda } = await supabase.from("landing_agenda").select("*").order("created_at", { ascending: false });
  const agendaSection = document.getElementById("agenda");
  if (agenda && agendaSection) {
    agendaSection.innerHTML = `
      <h2>Agenda Kegiatan</h2>
      ${agenda
        .map(
          (a) => `
          <article class="agenda-item" data-aos="fade-up">
            <h4>${a.title}</h4>
            <p>${a.tanggal} — ${a.lokasi || ""}</p>
          </article>`
        )
        .join("")}
    `;
  }

  // === KONTAK ===
  const { data: kontak } = await supabase.from("landing_kontak").select("*").single();
  if (kontak) {
    document.getElementById("alamatText").textContent = `📍 ${kontak.alamat || ""}`;
    document.getElementById("emailText").textContent = `✉️ ${kontak.email || ""}`;
    const wa = document.querySelector("#whatsappText a");
    if (wa) {
      wa.href = `https://wa.me/${kontak.whatsapp}`;
      wa.textContent = kontak.whatsapp;
    }
    if (kontak.map_embed) {
      const mapFrame = document.getElementById("mapFrame");
      if (mapFrame) mapFrame.src = kontak.map_embed;
    }
  }

  // === Tahun Otomatis ===
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
