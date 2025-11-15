// =====================================
//   LANDING PAGE DATA LOADER — FIXED
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

  // Helpers
  const safeText = (el, text) => el && (el.textContent = text || "");
  const safeHTML = (el, html) => el && (el.innerHTML = html || "");

  if (!window.supabase) {
    console.error("❌ Supabase belum dimuat");
    return;
  }

  // =====================================
  //               HERO
  // =====================================
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

  // =====================================
  //             TENTANG
  // =====================================
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

  // =====================================
  //           VISI & MISI
  // =====================================
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

  // =====================================
  //             STRUKTUR
  // =====================================
  try {
  const { data: struktur } = await supabase
    .from("landing_struktur")
    .select("image_url")
    .limit(1);

  const strukturImg = document.getElementById("strukturImage");

  if (struktur?.length && struktur[0].image_url) {
    const fileName = struktur[0].image_url; // nama file di storage
    const bucketName = "struktur"; // sesuaikan dengan nama bucket kamu

    // 1️⃣ Cek public URL
    const { data: publicURL } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 2️⃣ Gunakan signed URL jika bucket private
    let imgSrc = publicURL.publicUrl;

    // Contoh generate signed URL (valid 60 detik)
    const { data: signedURL, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(fileName, 60);

    if (error) {
      console.warn("Gagal generate signed URL, pakai public URL:", error);
    } else if (signedURL?.signedUrl) {
      imgSrc = signedURL.signedUrl;
    }

    // Set src & tampilkan
    strukturImg.src = imgSrc;
    strukturImg.style.display = "block";

    // 3️⃣ Fallback jika gambar gagal dimuat
    strukturImg.onerror = () => {
      console.warn("Gambar struktur gagal dimuat, pakai default.");
      strukturImg.src = "assets/img/struktur.jpg";
    };

  } else {
    // fallback default
    strukturImg.src = "assets/img/struktur.jpg";
  }

} catch (err) {
  console.error("Gagal load struktur:", err);
  const strukturImg = document.getElementById("strukturImage");
  strukturImg.src = "assets/img/struktur.jpg";
}

  // =====================================
  //              VIDEO
  // =====================================

 async function loadLandingVideos() {
  const { data: videos, error } = await supabase
    .from("landing_videos")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Gagal load video:", error.message);
    return;
  }
  if (!videos || videos.length === 0) {
    console.warn("Tidak ada video di database");
    return;
  }

  const mainVideo = document.getElementById("mainVideo");
  const thumbs = document.getElementById("videoThumbnails");
  thumbs.innerHTML = "";

  // Set video utama
  const firstVideoID = extractYoutubeID(videos[0].video_link);
  mainVideo.src = `https://www.youtube.com/embed/${firstVideoID}`;

  // Buat thumbnails
  videos.forEach(v => {
    const videoID = extractYoutubeID(v.video_link);
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoID}?controls=0&mute=1`;
    iframe.allowFullscreen = true;

    iframe.addEventListener("click", () => {
      mainVideo.src = `https://www.youtube.com/embed/${videoID}`;
    });

    thumbs.appendChild(iframe);
  });
}

// Fungsi ekstrak YouTube ID (mendukung youtube.com/watch?v=ID dan youtu.be/ID)
function extractYoutubeID(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    } else {
      console.warn("Link bukan YouTube:", url);
      return "";
    }
  } catch (err) {
    console.warn("URL tidak valid:", url);
    return "";
  }
}

document.addEventListener("DOMContentLoaded", loadLandingVideos);

  // =====================================
  //              GALERI
  // =====================================

  let images = [];
  let currentIndex = 0;

  const container = document.getElementById("galleryContainer");

  if (container) {
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

      if (error) {
        container.innerHTML = `<p style="text-align:center;color:#aaa;">Gagal memuat galeri.</p>`;
        return;
      }

      images = galeri || [];
      container.innerHTML = "";

      if (!images.length) {
        container.innerHTML = `<p style="text-align:center;color:#aaa;">Belum ada foto galeri.</p>`;
      }

      images.forEach((g, i) => {
        const div = document.createElement("div");
        div.className = "galeri-item";

        const img = document.createElement("img");
        img.src = g.image_url;
        img.dataset.index = i;
        img.loading = "lazy";
        img.onload = () => div.classList.add("loaded");
        img.onclick = () => openModal(i);

        div.appendChild(img);
        container.appendChild(div);
      });

    } catch (err) {
      console.error("Gagal load galeri:", err);
      container.innerHTML = `<p style="text-align:center;color:#aaa;">Terjadi kesalahan.</p>`;
    }
  }

  // =====================================
  //             MODAL GALERI
  // =====================================
  function initModal() {
    const modal = document.getElementById("lightboxModal");
    const modalImg = document.getElementById("lightboxImage");
    const closeBtn = document.getElementById("closeBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!modal || !modalImg) return;

    window.openModal = (index) => {
      currentIndex = index;
      modal.style.display = "flex";
      update();
    };

    function update() {
      modalImg.src = images[currentIndex].image_url;
    }

    closeBtn.onclick = () => (modal.style.display = "none");
    nextBtn.onclick = () => {
      currentIndex = (currentIndex + 1) % images.length;
      update();
    };
    prevBtn.onclick = () => {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      update();
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };
  }

  initModal();

  // =====================================
  //               AGENDA
  // =====================================
  try {
    const { data: agenda } = await supabase
      .from("landing_agenda")
      .select("title, tanggal, lokasi")
      .order("created_at", { ascending: false });

    const list =
      document.getElementById("agendaList") ||
      document.querySelector("#agenda .agenda-list");

    if (list) {
      if (agenda?.length) {
        list.innerHTML = agenda
          .map(
            (a) => `
          <article class="agenda-item" data-aos="fade-up">
            <h4>${a.title}</h4>
            <p>${a.tanggal} — ${a.lokasi}</p>
          </article>`
          )
          .join("");
      } else {
        list.innerHTML = `<p style="text-align:center;color:#aaa;">Belum ada agenda.</p>`;
      }
    }

  } catch (err) {
    console.error("Gagal load agenda:", err);
  }

  // =====================================
  //               KONTAK
  // =====================================
  try {
    const { data: kontak } = await supabase
      .from("landing_kontak")
      .select("alamat, email, whatsapp, map_embed")
      .limit(1);

    if (kontak?.length) {
      const k = kontak[0];

      safeText(document.getElementById("alamatText"), `📍 ${k.alamat}`);

      const wa = document.querySelector("#whatsappText a");
      if (wa && k.whatsapp) {
        wa.href = "https://wa.me/" + k.whatsapp.replace(/\D/g, "");
        wa.textContent = k.whatsapp;
      }

      const mapContainer = document.querySelector(".map-container");
      if (mapContainer) {
        if (k.map_embed.includes("<iframe")) {
          mapContainer.innerHTML = k.map_embed;
        } else {
          mapContainer.innerHTML = `<iframe src="${k.map_embed}" width="100%" height="280"></iframe>`;
        }
      }
    }
  } catch (err) {
    console.error("Gagal load kontak:", err);
  }

  // =====================================
  //               FOOTER
  // =====================================
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
