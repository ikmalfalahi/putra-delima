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

// ================================
//         LOAD GALERI
// ================================
let images = [];
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("galleryContainer");

  if (!container) {
    console.warn("❌ #galleryContainer tidak ditemukan.");
    return;
  }

  // --- SKELETON LOADING ---
  container.innerHTML = `
    <div class="gallery-item skeleton-box"></div>
    <div class="gallery-item skeleton-box"></div>
    <div class="gallery-item skeleton-box"></div>
    <div class="gallery-item skeleton-box"></div>
  `;

  try {
    const { data: galeri, error } = await supabase
      .from("landing_galeri")
      .select("image_url, caption, uploaded_at")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("❌ Error Supabase:", error.message);
      container.innerHTML = `<p style="text-align:center;color:#aaa;">Gagal memuat galeri.</p>`;
      return;
    }

    images = galeri || [];
    container.innerHTML = "";

    if (images.length === 0) {
      container.innerHTML = `<p style="text-align:center;color:#aaa;">Belum ada foto galeri.</p>`;
      return;
    }

    // --- TAMPILKAN FOTO ---
    images.forEach((g, i) => {
      const div = document.createElement("div");
      div.className = "gallery-item"; // FIX: cocok dengan CSS

      const img = document.createElement("img");
      img.src = g.image_url;
      img.alt = g.caption || "";
      img.dataset.index = i;
      img.loading = "lazy";

      // skeleton hilang setelah load
      img.onload = () => {
        div.classList.add("loaded");
        img.style.opacity = "1";
      };

      img.onclick = () => openModal(i);

      div.appendChild(img);
      container.appendChild(div);
    });

  } catch (err) {
    console.error("❌ Gagal load galeri:", err);
    container.innerHTML = `<p style="text-align:center;color:#aaa;">Terjadi kesalahan saat memuat galeri.</p>`;
  }

  initModal();
});

// ======================================
//               MODAL
// ======================================
function initModal() {
  const modal = document.getElementById("lightboxModal");
  const modalImg = document.getElementById("lightboxImage");
  const closeBtn = document.getElementById("closeBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (!modal) {
    console.error("❌ Modal (#lightboxModal) tidak ditemukan");
    return;
  }

  // --- OPEN MODAL ---
  window.openModal = (index) => {
    currentIndex = index;
    modal.classList.add("show");
    updateModal();
  };

  // --- UPDATE IMAGE ---
  function updateModal() {
    if (!images[currentIndex]) return;

    modalImg.style.opacity = "0";
    setTimeout(() => {
      modalImg.src = images[currentIndex].image_url;
      modalImg.style.opacity = "1";
    }, 150); // animasi fade halus
  }

  // --- CLOSE BUTTON ---
  closeBtn.onclick = () => modal.classList.remove("show");

  // --- NEXT ---
  nextBtn.onclick = () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateModal();
  };

  // --- PREVIOUS ---
  prevBtn.onclick = () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateModal();
  };

  // --- CLOSE WHEN CLICK BACKDROP ---
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("show");
  };

  // ============================
  //         SWIPE MOBILE
  // ============================
  let touchStartX = 0;

  modal.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  });

  modal.addEventListener("touchend", (e) => {
    let diff = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) prevBtn.click();
      else nextBtn.click();
    }
  });
}

// ======================================
//      SKELETON OPTIONAL (tidak wajib)
// ======================================
function applyFadeIn() {
  document.querySelectorAll(".gallery-item img").forEach((img) => {
    img.onload = () => img.parentElement.classList.add("loaded");
  });
}
  
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
