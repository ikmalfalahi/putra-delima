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

document.addEventListener("DOMContentLoaded", async () => {

  const galleryContainer = document.getElementById("galleryContainer");
  const modal = document.getElementById("lightboxModal");
  const modalImg = document.getElementById("lightboxImage");

  if (!galleryContainer || !modal || !modalImg) {
    console.error("❌ Elemen galeri/modal tidak ditemukan di HTML");
    return;
  }

  // ----------------------------------------
  // 1. AMBIL DATA GALERI DARI SUPABASE
  // ----------------------------------------
  async function loadGallery() {
    try {
      galleryContainer.innerHTML = generateSkeletons(6);

      const { data, error } = await supabase
        .from("galeri")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      await sleep(300);

      renderGallery(data);
    } catch (err) {
      console.error("❌ Gagal memuat galeri:", err);
    }
  }

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  // ----------------------------------------
  // 2. SKELETON LOADING
  // ----------------------------------------
  function generateSkeletons(count) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `
        <div class="gallery-item skeleton"></div>
      `;
    }
    return html;
  }

  // ----------------------------------------
  // 3. TAMPILKAN FOTO
  // ----------------------------------------
  let currentIndex = 0;
  let galleryData = [];

  function renderGallery(data) {
    galleryData = data;

    galleryContainer.innerHTML = "";

    data.forEach((item, index) => {
      const imgDiv = document.createElement("div");
      imgDiv.className = "gallery-item";

      const img = document.createElement("img");
      img.src = item.url;
      img.alt = "Foto kegiatan";

      img.onload = () => imgDiv.classList.remove("skeleton");
      img.onerror = () => imgDiv.classList.remove("skeleton");

      img.onclick = () => openModal(index);

      imgDiv.appendChild(img);
      galleryContainer.appendChild(imgDiv);
    });
  }

  // ----------------------------------------
  // 4. MODAL / LIGHTBOX
  // ----------------------------------------
  function openModal(index) {
    currentIndex = index;
    modal.style.display = "flex";
    modalImg.style.opacity = "0";

    setTimeout(() => {
      modalImg.src = galleryData[index].url;
      modalImg.style.opacity = "1";
    }, 50);
  }

  window.closeLightbox = () => {
    modal.style.display = "none";
  };

  window.showPrev = () => {
    currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
    openModal(currentIndex);
  };

  window.showNext = () => {
    currentIndex = (currentIndex + 1) % galleryData.length;
    openModal(currentIndex);
  };

  // ----------------------------------------
  // 5. SWIPE HANDLER (lebih halus)
  // ----------------------------------------
  let touchStartX = 0;

  modal.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
  });

  modal.addEventListener("touchend", e => {
    let diff = e.changedTouches[0].screenX - touchStartX;

    if (Math.abs(diff) > 60) {
      if (diff > 0) showPrev();
      else showNext();
    }
  });

  // ----------------------------------------
  // LOAD GALERI
  // ----------------------------------------
  loadGallery();

});
  
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
