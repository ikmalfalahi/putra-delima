// assets/js/landing_data.js  (GANTI FILE LAMA)
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof supabase === "undefined") {
    console.error("❌ Supabase belum terdefinisi — pastikan urutan script benar (supabase.js sebelum landing_data.js)");
    return;
  }

  // helper kecil untuk set text jika element ada
  const setText = (selector, txt) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = txt;
  };

  // ================= HERO =================
  try {
    const { data: hero, error } = await supabase
      .from("landing_hero")
      .select("*")
      .limit(1)
      .maybeSingle(); // aman bila tidak ada baris

    if (error) {
      console.warn("hero fetch:", error);
    } else if (hero) {
      const heroTitle = document.querySelector("#home h1");
      const heroDesc = document.querySelector("#home p");
      const heroSection = document.getElementById("home");

      if (heroTitle) heroTitle.textContent = hero.title || "Putra Delima";
      if (heroDesc) heroDesc.textContent = hero.description || "";
      // hanya set background jika ada image_url
      if (hero.image_url && heroSection) {
        heroSection.style.backgroundImage = `url(${hero.image_url})`;
      }
      // juga support heroImage tag (jika ada)
      const heroImgTag = document.getElementById("heroImage");
      if (heroImgTag) {
        if (hero.image_url) {
          heroImgTag.src = hero.image_url;
          heroImgTag.style.display = ""; // tunjukkan
          heroImgTag.onerror = () => (heroImgTag.style.display = "none");
        } else {
          heroImgTag.style.display = "none";
        }
      }
    }
  } catch (err) {
    console.error("Gagal memuat hero:", err);
  }

  // ================= TENTANG KAMI =================
  try {
    const { data: tentang, error } = await supabase
      .from("landing_tentang")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) console.warn("tentang fetch:", error);
    if (tentang?.content) {
      const tentangEl = document.querySelector("#tentang p");
      if (tentangEl) tentangEl.textContent = tentang.content;
    }
  } catch (err) {
    console.error("Gagal memuat tentang:", err);
  }

  // ================= VISI & MISI =================
  try {
    const { data: visiMisi, error } = await supabase
      .from("landing_visi_misi")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) console.warn("visi_misi fetch:", error);
    if (visiMisi) {
      const visiEl = document.querySelector("#visi .card:nth-child(1) p");
      const misiList = document.querySelector("#visi .card:nth-child(2) ul");
      if (visiEl) visiEl.textContent = visiMisi.visi || "-";

      if (misiList) {
        const misiRaw = visiMisi.misi || "";
        const misiArray = misiRaw.split(/\r?\n|·|;|,|-/).map(s => s.trim()).filter(Boolean);
        misiList.innerHTML = misiArray.length ? misiArray.map(m => `<li>${m}</li>`).join("") : `<li>-</li>`;
      }
    }
  } catch (err) {
    console.error("Gagal memuat visi misi:", err);
  }

  // ================= STRUKTUR =================
  try {
    const { data: struktur, error } = await supabase
      .from("landing_struktur")
      .select("*")
      .limit(1)
      .maybeSingle();

    const strukturImg = document.getElementById("strukturImage");
    if (error) {
      console.warn("struktur fetch:", error);
      if (strukturImg) strukturImg.style.display = "none";
    } else if (struktur?.image_url) {
      if (strukturImg) {
        strukturImg.src = struktur.image_url;
        strukturImg.onerror = () => (strukturImg.style.display = "none");
        strukturImg.style.display = ""; // tampilkan
      }
    } else {
      // jangan load file lokal fallback yang menyebabkan 404
      if (strukturImg) strukturImg.style.display = "none";
    }
  } catch (err) {
    console.error("Gagal memuat struktur:", err);
  }

  // ================= GALERI FOTO =================
  try {
    const galleryContainer = document.getElementById("galleryContainer") || document.querySelector("#galeri .gallery");
    if (galleryContainer) {
      const { data: galeri, error } = await supabase
        .from("landing_galeri")
        .select("id, image_url, caption")
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Gagal memuat galeri:", error);
        galleryContainer.innerHTML = `<p style="color:#aaa">Gagal memuat galeri.</p>`;
      } else if (galeri && galeri.length > 0) {
        galleryContainer.innerHTML = galeri
          .map(g => `
            <div class="galeri-item" data-aos="zoom-in">
              <img src="${g.image_url}" alt="${(g.caption||'')}" onerror="this.style.display='none'"/>
              ${g.caption ? `<p class="caption">${g.caption}</p>` : ""}
            </div>`).join("");
      } else {
        galleryContainer.innerHTML = `<p style="color:#aaa">Belum ada foto galeri.</p>`;
      }
    }
  } catch (err) {
    console.error("Gagal memuat galeri:", err);
  }

  // ================= AGENDA =================
  try {
    const { data: agenda, error } = await supabase
      .from("landing_agenda")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.warn("agenda fetch:", error);

    const agendaListEl = document.getElementById("agendaList") || document.getElementById("agenda");
    if (agenda && agenda.length > 0 && agendaListEl) {
      const html = agenda.map(a => `
        <article class="agenda-item" data-aos="fade-up">
          <h4>${a.title}</h4>
          <p>${a.tanggal} ${a.lokasi ? "— " + a.lokasi : ""}</p>
        </article>`).join("");
      // jika #agendaList ada pakai itu, kalau tidak ganti innerHTML section agenda
      if (document.getElementById("agendaList")) document.getElementById("agendaList").innerHTML = html;
      else agendaListEl.innerHTML = `<h2>Agenda Kegiatan</h2>${html}`;
    }
  } catch (err) {
    console.error("Gagal memuat agenda:", err);
  }

  // ================= KONTAK & MAPS =================
  try {
    const { data: kontak, error } = await supabase
      .from("landing_kontak")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) console.warn("kontak fetch:", error);

    if (kontak) {
      const alamatEl = document.getElementById("alamatText");
      if (alamatEl) alamatEl.textContent = kontak.alamat ? `📍 ${kontak.alamat}` : "";

      const emailEl = document.getElementById("emailText");
      if (emailEl) emailEl.textContent = kontak.email ? `✉️ ${kontak.email}` : "";

      const waAnchor = document.querySelector("#whatsappText a");
      if (waAnchor && kontak.whatsapp) {
        waAnchor.href = `https://wa.me/${kontak.whatsapp.replace(/\D/g,'')}`;
        waAnchor.textContent = kontak.whatsapp || kontak.whatsapp;
      }

      const mapFrame = document.getElementById("mapFrame");
      const mapContainer = document.querySelector(".map-container");
      if (mapFrame && kontak.map_embed) {
        // jika map_embed berisi iframe, taruh langsung; jika hanya url, assign src
        if (kontak.map_embed.trim().startsWith("<iframe")) {
          if (mapContainer) mapContainer.innerHTML = kontak.map_embed;
        } else {
          mapFrame.src = kontak.map_embed;
        }
      } else if (mapFrame) {
        mapFrame.style.display = "none";
      }
    }
  } catch (err) {
    console.error("Gagal memuat kontak:", err);
  }

  // Update tahun otomatis
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
