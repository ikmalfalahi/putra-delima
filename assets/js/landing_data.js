document.addEventListener("DOMContentLoaded", async () => {
  if (!window.supabase) {
    console.error("❌ Supabase belum dimuat — pastikan urutan script benar");
    return;
  }

  const safeText = (el, text) => {
    if (el) el.textContent = text || "";
  };
  const safeHTML = (el, html) => {
    if (el) el.innerHTML = html || "";
  };

  // === HERO ===
  try {
    const { data: hero, error } = await supabase
      .from("landing_hero")
      .select("title, description, image_url")
      .limit(1);

    if (error) console.warn("Hero error:", error.message);

    if (hero?.length) {
      const h = hero[0];
      safeText(document.getElementById("heroTitle"), h.title);
      safeText(document.getElementById("heroDesc"), h.description);

      const heroImg = document.getElementById("heroImage");
      if (heroImg && h.image_url) {
        heroImg.src = h.image_url;
        heroImg.style.display = "block";
        heroImg.setAttribute("data-aos", "zoom-in");
        heroImg.setAttribute("data-aos-delay", "200");
        heroImg.classList.add("aos-animate");
      }
    }
  } catch (err) {
    console.error("Gagal load hero:", err);
  }

  // === TENTANG ===
  try {
    const { data: tentang } = await supabase
      .from("landing_tentang")
      .select("content")
      .limit(1);

    if (tentang?.length)
      safeText(document.getElementById("aboutText"), tentang[0].content);
  } catch (err) {
    console.error("Gagal load tentang:", err);
  }

  // === VISI & MISI ===
  try {
    const { data: visi } = await supabase
      .from("landing_visi_misi")
      .select("visi, misi")
      .limit(1);

    if (visi?.length) {
      const v = visi[0];
      safeText(document.getElementById("visiText"), v.visi);
      const misiHTML = (v.misi || "")
        .split(/\n|·|;|-/)
        .filter(Boolean)
        .map((m) => `<li>${m.trim()}</li>`)
        .join("");
      safeHTML(document.getElementById("misiText"), misiHTML);
    }
  } catch (err) {
    console.error("Gagal load visi & misi:", err);
  }

  // === STRUKTUR ===
  try {
    const { data: struktur, error } = await supabase
      .from("landing_struktur")
      .select("image_url")
      .limit(1);

    if (error) console.warn("Struktur error:", error.message);

    const strukturImg = document.getElementById("strukturImage");
    if (struktur?.length && struktur[0].image_url) {
      strukturImg.src = struktur[0].image_url;
      strukturImg.alt = "Struktur Organisasi";
      strukturImg.style.display = "block";
    } else {
      strukturImg.src = "assets/img/struktur.jpg";
    }
  } catch (err) {
    console.error("Gagal load struktur:", err);
  }

// === GALERI (FINAL FIXED CLEAN) ===
try {
  const { data: galeri, error } = await supabase
    .from("landing_galeri")
    .select("image_url, caption, uploaded_at")
    .order("uploaded_at", { ascending: false });

  const container = document.getElementById("galleryContainer");

  if (!container) {
    console.warn("❌ Elemen #galleryContainer tidak ditemukan.");
    return;
  }

  // Reset container
  container.innerHTML = "";

  if (error) {
    console.error("❌ Error Supabase:", error.message);
    container.innerHTML = `<p style="color:#aaa;text-align:center;">Gagal memuat galeri.</p>`;
    return;
  }

  if (galeri && galeri.length > 0) {
    galeri.forEach((g, i) => {
      const div = document.createElement("div");
      div.className = "galeri-item";
      div.setAttribute("data-aos", "zoom-in");

      const img = document.createElement("img");
      img.src = g.image_url;
      img.alt = g.caption || `Gambar ${i + 1}`;
      img.loading = "lazy";

      const caption = document.createElement("p");
      caption.className = "caption";
      caption.innerText = g.caption || "";

      div.appendChild(img);
      div.appendChild(caption);

      container.appendChild(div);
    });
  } else {
    container.innerHTML =
      '<p style="color:#aaa;text-align:center;">Belum ada foto galeri.</p>';
  }
} catch (err) {
  console.error("Gagal load galeri:", err);
}

  // === LIGHTBOX ===
setTimeout(() => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");

  document.querySelectorAll(".galeri-item img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImage.src = img.src;
      lightbox.style.display = "flex";
    });
  });

  lightbox.addEventListener("click", () => {
    lightbox.style.display = "none";
  });
}, 500);
  
  // === AGENDA ===
  try {
    const { data: agenda, error } = await supabase
      .from("landing_agenda")
      .select("title, tanggal, lokasi")
      .order("created_at", { ascending: false });

    if (error) console.warn("Agenda error:", error.message);

    const list =
      document.getElementById("agendaList") ||
      document.querySelector("#agenda .agenda-list");

    if (!list) {
      console.warn("Elemen agenda tidak ditemukan di halaman.");
    } else if (agenda?.length) {
      list.innerHTML = agenda
        .map(
          (a) => `
          <article class="agenda-item" data-aos="fade-up">
            <h4>${a.title || "-"}</h4>
            <p>${a.tanggal || ""} ${a.lokasi ? "— " + a.lokasi : ""}</p>
          </article>`
        )
        .join("");
    } else {
      list.innerHTML =
        '<p style="color:#aaa;text-align:center;">Belum ada agenda kegiatan.</p>';
    }
  } catch (err) {
    console.error("Gagal load agenda:", err);
  }

  // === KONTAK ===
  try {
    const { data: kontak, error } = await supabase
      .from("landing_kontak")
      .select("alamat, email, whatsapp, map_embed")
      .limit(1);

    if (error) console.warn("Kontak error:", error.message);

    if (kontak?.length) {
      const k = kontak[0];
      safeText(document.getElementById("alamatText"), `📍 ${k.alamat || ""}`);
      safeText(document.getElementById("emailText"), `✉️ ${k.email || ""}`);

      const wa = document.querySelector("#whatsappText a");
      if (wa && k.whatsapp) {
        wa.href = `https://wa.me/${k.whatsapp.replace(/\D/g, "")}`;
        wa.textContent = k.whatsapp;
      }

      const mapContainer = document.querySelector(".map-container");
      if (mapContainer && k.map_embed) {
        if (k.map_embed.includes("<iframe")) {
          mapContainer.innerHTML = k.map_embed;
        } else {
          mapContainer.innerHTML = `
            <iframe src="${k.map_embed}"
              width="100%" height="280" style="border:0;"
              allowfullscreen="" loading="lazy"></iframe>`;
        }
      }
    }
  } catch (err) {
    console.error("Gagal load kontak:", err);
  }

  // === FOOTER YEAR ===
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
