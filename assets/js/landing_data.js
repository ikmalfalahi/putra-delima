// =====================================
// LANDING PAGE DATA LOADER — FIXED & VIDEO READY
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

  // ===========================
  // Helpers
  // ===========================
  const safeText = (el, text) => el && (el.textContent = text || "");
  const safeHTML = (el, html) => el && (el.innerHTML = html || "");

  if (!window.supabase) {
    console.error("❌ Supabase belum dimuat");
    return;
  }

  // ===========================
  // YouTube ID extractor
  // ===========================
  function extractYoutubeID(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
      return "";
    } catch {
      return "";
    }
  }

  // ===========================
  // HERO
  // ===========================
  try {
    const { data: hero } = await supabase
      .from("landing_hero")
      .select("title, description, image_url")
      .limit(1);

    if (hero?.length) {
      const h = hero[0];
      safeText(document.getElementById("heroTitle"), h.title);
      safeText(document.getElementById("heroDesc"), h.description);

      const heroImg = document.getElementById("heroImage");
      if (heroImg && h.image_url) {
        heroImg.src = h.image_url;
        heroImg.style.display = "block";
      }
    }
  } catch (err) {
    console.error("Gagal load hero:", err);
  }

  // ===========================
  // TENTANG
  // ===========================
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

  // ===========================
  // VISI & MISI
  // ===========================
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
        .map(m => `<li>${m.trim()}</li>`)
        .join("");

      safeHTML(document.getElementById("misiText"), misiHTML);
    }
  } catch (err) {
    console.error("Gagal load visi & misi:", err);
  }

  // ===========================
  // STRUKTUR
  // ===========================
  try {
    const { data: struktur } = await supabase
      .from("landing_struktur")
      .select("image_url")
      .limit(1);

    const strukturImg = document.getElementById("strukturImage");

    if (struktur?.length && struktur[0].image_url) {
      const fileName = struktur[0].image_url;
      const bucketName = "struktur";

      const { data: signedURL, error } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(fileName, 60);

      if (error) {
        console.warn("Gagal generate signed URL, pakai public URL:", error);
        strukturImg.src = `https://sosjorfcrsktcitaawyi.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
      } else {
        strukturImg.src = signedURL.signedUrl;
      }

      strukturImg.style.display = "block";
      strukturImg.onerror = () => {
        strukturImg.src = "assets/img/struktur.jpg";
      };
    } else {
      strukturImg.src = "assets/img/struktur.jpg";
    }
  } catch (err) {
    console.error("Gagal load struktur:", err);
    const strukturImg = document.getElementById("strukturImage");
    strukturImg.src = "assets/img/struktur.jpg";
  }

  // ===========================
  // VIDEO
  // ===========================
  async function loadLandingVideos() {
    try {
      const { data: videos, error } = await supabase
        .from("landing_videos")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      if (!videos || videos.length === 0) return;

      const mainVideo = document.getElementById("mainVideo");
      const thumbs = document.getElementById("videoThumbnails");
      thumbs.innerHTML = "";

      // Video utama
      const firstVideoID = extractYoutubeID(videos[0].video_link);
      mainVideo.src = `https://www.youtube.com/embed/${firstVideoID}`;

      // Thumbnails
      videos.forEach(v => {
        const videoID = extractYoutubeID(v.video_link);
        if (!videoID) return;

        const thumbImg = document.createElement("img");
        thumbImg.src = `https://img.youtube.com/vi/${videoID}/mqdefault.jpg`;
        thumbImg.alt = "Video thumbnail";
        thumbImg.className = "video-thumb";
        thumbImg.addEventListener("click", () => {
          mainVideo.src = `https://www.youtube.com/embed/${videoID}`;
        });

        thumbs.appendChild(thumbImg);
      });

    } catch (err) {
      console.error("Gagal load video:", err);
    }
  }

  await loadLandingVideos();

 // ===========================
// GALERI
// ===========================
let images = [];
let currentIndex = 0;
const container = document.getElementById("galleryContainer");

async function loadGaleri() {
  if (!container) return;

  container.innerHTML = `
    <div class="skeleton"></div>
    <div class="skeleton"></div>
    <div class="skeleton"></div>
    <div class="skeleton"></div>
  `;

  try {
    const { data: galeri, error } = await supabase
      .from("landing_galeri")
      .select("image_url, caption, uploaded_at")
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    images = galeri || [];
    container.innerHTML = "";

    if (!images.length) {
      container.innerHTML = `<p style="text-align:center;color:#aaa;">Belum ada foto galeri.</p>`;
      return;
    }

    images.forEach((g, i) => {
      const div = document.createElement("div");
      div.className = "galeri-item";

      const img = document.createElement("img");
      img.src = g.image_url; // pastikan public URL
      img.dataset.index = i;
      img.loading = "lazy";
      img.onclick = () => openModal(i);

      div.appendChild(img);
      container.appendChild(div);
    });

  } catch (err) {
    console.error("Gagal load galeri:", err);
    container.innerHTML = `<p style="text-align:center;color:#aaa;">Terjadi kesalahan.</p>`;
  }
}

// ===========================
// MODAL GALERI
// ===========================
function initModal() {
  const modal = document.getElementById("lightboxModal");
  const modalImg = document.getElementById("lightboxImage");
  const closeBtn = document.getElementById("closeBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (!modal || !modalImg) return;

  window.openModal = index => {
    currentIndex = index;
    modal.style.display = "flex";
    modalImg.src = images[currentIndex].image_url;
  };

  closeBtn.onclick = () => (modal.style.display = "none");

  nextBtn.onclick = () => {
    if (!images.length) return;
    currentIndex = (currentIndex + 1) % images.length;
    modalImg.src = images[currentIndex].image_url;
  };

  prevBtn.onclick = () => {
    if (!images.length) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    modalImg.src = images[currentIndex].image_url;
  };

  modal.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
  };
}

// Panggil async
await loadGaleri();
initModal();

  // ===========================
  // AGENDA
  // ===========================
  try {
    const { data: agenda } = await supabase
      .from("landing_agenda")
      .select("title, tanggal, lokasi")
      .order("created_at", { ascending: false });

    const list = document.getElementById("agendaList") || document.querySelector("#agenda .agenda-list");

    if (list) {
      if (agenda?.length) {
        list.innerHTML = agenda.map(a => `
          <article class="agenda-item">
            <h4>${a.title}</h4>
            <p>${a.tanggal} — ${a.lokasi}</p>
          </article>
        `).join("");
      } else list.innerHTML = `<p style="text-align:center;color:#aaa;">Belum ada agenda.</p>`;
    }
  } catch (err) {
    console.error("Gagal load agenda:", err);
  }

  // ===========================
  // KONTAK
  // ===========================
  try {
    const { data: kontak } = await supabase
      .from("landing_kontak")
      .select("alamat, email, whatsapp, map_embed")
      .limit(1);

    if (kontak?.length) {
      const k = kontak[0];
      safeText(document.getElementById("alamatText"), `📍 ${k.alamat}`);
      const mapContainer = document.querySelector(".map-container");
      if (mapContainer) {
        if (k.map_embed.includes("<iframe")) mapContainer.innerHTML = k.map_embed;
        else mapContainer.innerHTML = `<iframe src="${k.map_embed}" width="100%" height="280" allowfullscreen></iframe>`;
      }
    }
  } catch (err) {
    console.error("Gagal load kontak:", err);
  }

  // ===========================
  // FOOTER
  // ===========================
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
