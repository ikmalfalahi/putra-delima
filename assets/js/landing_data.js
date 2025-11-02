document.addEventListener("DOMContentLoaded", async () => {
  if (!window.supabase) return console.error("Supabase belum dimuat");

  // HERO
  const { data: hero } = await supabase.from("landing_hero").select("*").limit(1);
  if (hero?.length) {
    const h = hero[0];
    document.getElementById("heroTitle").textContent = h.title || "";
    document.getElementById("heroDesc").textContent = h.description || "";
    if (h.image_url) {
      const heroImg = document.getElementById("heroImage");
      heroImg.src = h.image_url;
      heroImg.style.display = "block";
    }
  }

  // TENTANG
  const { data: tentang } = await supabase.from("landing_tentang").select("*").limit(1);
  if (tentang?.length) document.getElementById("aboutText").textContent = tentang[0].content;

  // VISI MISI
  const { data: visi } = await supabase.from("landing_visi_misi").select("*").limit(1);
  if (visi?.length) {
    const v = visi[0];
    document.getElementById("visiText").textContent = v.visi;
    document.getElementById("misiText").innerHTML = v.misi
      .split(/\n|·|;|-/)
      .filter(Boolean)
      .map(m => `<li>${m.trim()}</li>`)
      .join("");
  }

  // STRUKTUR
  const { data: struktur } = await supabase.from("landing_struktur").select("*").limit(1);
  if (struktur?.length) document.getElementById("strukturImage").src = struktur[0].image_url;

  // GALERI
  const { data: galeri } = await supabase.from("landing_galeri").select("*").order("uploaded_at", { ascending: false });
  if (galeri?.length) {
    document.getElementById("galleryContainer").innerHTML = galeri.map(g => `
      <div class="galeri-item" data-aos="zoom-in">
        <img src="${g.image_url}" alt="${g.caption || ''}" />
        ${g.caption ? `<p class="caption">${g.caption}</p>` : ""}
      </div>`).join("");
  }

  // AGENDA
  const { data: agenda } = await supabase.from("landing_agenda").select("*").order("created_at", { ascending: false });
  if (agenda?.length) {
    document.getElementById("agendaList").innerHTML = agenda.map(a => `
      <article class="agenda-item">
        <h4>${a.title}</h4>
        <p>${a.tanggal} — ${a.lokasi || ''}</p>
      </article>`).join("");
  }

  // KONTAK
  const { data: kontak } = await supabase.from("landing_kontak").select("*").limit(1);
  if (kontak?.length) {
    const k = kontak[0];
    document.getElementById("alamatText").textContent = `📍 ${k.alamat}`;
    if (k.map_embed) document.getElementById("mapFrame").src = k.map_embed;
  }

  document.getElementById("year").textContent = new Date().getFullYear();
});
