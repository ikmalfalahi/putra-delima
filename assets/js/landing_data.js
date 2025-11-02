// assets/js/landing_data.js
document.addEventListener("DOMContentLoaded", async () => {
  // --- CEK SUPABASE TERDEFINISI ---
  if (typeof supabase === "undefined") {
    console.error("❌ Supabase belum terdefinisi — pastikan urutan script benar (supabase.js sebelum landing_data.js)");
    return;
  }

  // ================= HERO =================
  try {
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
  } catch (err) {
    console.error("Gagal memuat hero:", err);
  }

  // ================= TENTANG KAMI =================
  try {
    const { data: tentang } = await supabase
      .from("landing_tentang")
      .select("*")
      .limit(1)
      .single();

    if (tentang?.content) {
      const tentangEl = document.querySelector("#tentang p");
      if (tentangEl) tentangEl.textContent = tentang.content;
    }
  } catch (err) {
    console.error("Gagal memuat tentang:", err);
  }

  // ================= VISI & MISI =================
  try {
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
        // pisah baris per \n atau titik
        const misiArray = visiMisi.misi.split(/\n|·|-|;/).filter(Boolean);
        misiList.innerHTML = misiArray.map((m) => `<li>${m.trim()}</li>`).join("");
      }
    }
  } catch (err) {
    console.error("Gagal memuat visi misi:", err);
  }

  // ================= STRUKTUR =================
  try {
    const { data: struktur } = await supabase
      .from("landing_struktur")
      .select("*")
      .limit(1)
      .single();

    const strukturImg = document.getElementById("strukturImage");
    if (struktur?.image_url && strukturImg) {
      strukturImg.src = struktur.image_url;
    }
  } catch (err) {
    console.error("Gagal memuat struktur:", err);
  }

  // ================= GALERI FOTO =================
  try {
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
  } catch (err) {
    console.error("Gagal memuat galeri:", err);
  }

  // ================= AGENDA =================
  try {
    const agendaSection = document.querySelector("#agenda");
    if (agendaSection) {
      const { data: agenda } = await supabase
        .from("landing_agenda")
        .select("*")
        .order("created_at", { ascending: false });

      if (agenda && agenda.length > 0) {
        const html = [
          "<h2>Agenda Kegiatan</h2>",
          ...agenda.map(
            (a) => `
              <article class="agenda-item" data-aos="fade-up">
                <h4>${a.title}</h4>
                <p>${a.tanggal} ${a.lokasi ? "— " + a.lokasi : ""}</p>
              </article>`
          ),
        ].join("");
        agendaSection.innerHTML = html;
      }
    }
  } catch (err) {
    console.error("Gagal memuat agenda:", err);
  }

  // ================= KONTAK & MAPS =================
  try {
    const { data: kontak } = await supabase
      .from("landing_kontak")
      .select("*")
      .limit(1)
      .single();

    if (kontak) {
      const kontakSection = document.getElementById("kontak");

      if (kontakSection) {
        // alamat
        const alamatP = kontakSection.querySelector("p:nth-of-type(1)");
        if (alamatP) alamatP.textContent = kontak.alamat || "";

        // email (buat kalau belum ada)
        let emailP = kontakSection.querySelector(".email");
        if (!emailP && kontak.email) {
          emailP = document.createElement("p");
          emailP.className = "email";
          emailP.textContent = `✉️ ${kontak.email}`;
          kontakSection.insertBefore(emailP, kontakSection.querySelector(".map-container"));
        }

        // whatsapp
        let waLink = kontakSection.querySelector(".whatsapp");
        if (!waLink && kontak.whatsapp) {
          waLink = document.createElement("p");
          waLink.className = "whatsapp";
          waLink.innerHTML = `📞 <a href="https://wa.me/${kontak.whatsapp}" target="_blank">${kontak.whatsapp}</a>`;
          kontakSection.insertBefore(waLink, kontakSection.querySelector(".map-container"));
        }

        // MAP
        const mapContainer = kontakSection.querySelector(".map-container");
        if (mapContainer && kontak.map_embed) {
          if (kontak.map_embed.includes("<iframe")) {
            // kalau di DB tersimpan iframe lengkap
            mapContainer.innerHTML = kontak.map_embed;
          } else {
            // kalau di DB hanya link embed
            mapContainer.innerHTML = `<iframe src="${kontak.map_embed}" width="100%" height="280" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;
          }
        }
      }
    }
  } catch (err) {
    console.error("Gagal memuat kontak:", err);
  }

  // Update tahun otomatis
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
