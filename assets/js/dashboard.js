// === dashboard.js (FINAL STABLE VERSION) ===
// Pastikan file ini dimuat SETELAH supabase.js

document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     ELEMENT DASAR & SETUP
  ========================================================= */
  const logoutBtns = document.querySelectorAll("#logoutBtn");
  const toggleSidebarBtns = document.querySelectorAll("#toggleSidebar, .hamburger");
  const sidebar = document.querySelector(".sidebar");
  const userNameEl = document.getElementById("userName");
  const roleLabel = document.getElementById("roleLabel");

  createUIHelpers();
  checkAuthAndInit();
  bindLogout();
  bindSidebarToggle();

  /* =========================================================
     ROUTING OTOMATIS BERDASARKAN HALAMAN
  ========================================================= */
  const path = location.pathname;
  if (path.endsWith("/admin.html")) initDashboard();
  else if (path.endsWith("/anggota.html")) initMembersPage();
  else if (path.endsWith("/iuran.html")) initIuranPage();
  else if (path.endsWith("/keuangan.html")) initKeuanganPage();
  else if (path.endsWith("/profil.html")) initProfilPage();

  /* =========================================================
     AUTHENTICATION
  ========================================================= */
  async function checkAuthAndInit() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return (window.location.href = "../login.html");

    const userId = session.user.id;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nama, role")
        .eq("id", userId)
        .single();

      if (userNameEl) userNameEl.textContent = profile?.nama || session.user.email;
      if (roleLabel) roleLabel.textContent = profile?.role || "-";
    } catch (e) {
      console.error("Gagal ambil profil:", e);
    }
  }

  function bindLogout() {
    logoutBtns.forEach(btn =>
      btn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "https://ikmalfalahi.github.io/putra-delima/index.html";
      })
    );
  }

  function bindSidebarToggle() {
    toggleSidebarBtns.forEach(btn =>
      btn.addEventListener("click", () => sidebar?.classList.toggle("open"))
    );
  }

  /* =========================================================
     DASHBOARD: Total + Preview Anggota
  ========================================================= */
  async function initDashboard() {
    const totalMembersEl = document.getElementById("totalMembers");
    const totalIuranEl = document.getElementById("totalIuran");
    const totalPemasukanEl = document.getElementById("totalPemasukan");
    const totalPengeluaranEl = document.getElementById("totalPengeluaran");
    const membersPreviewTbody = document.querySelector("#membersPreview tbody");

    // === Total Anggota ===
    try {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      totalMembersEl.textContent = count ?? "0";
    } catch {
      totalMembersEl.textContent = "0";
    }

    // === Total Iuran ===
    try {
      const { data } = await supabase.from("iuran").select("jumlah");
      const total = (data || []).reduce((a, b) => a + Number(b.jumlah || 0), 0);
      totalIuranEl.textContent = `Rp ${formatNumber(total)}`;
    } catch {
      totalIuranEl.textContent = "Rp 0";
    }

    // === Total Pemasukan & Pengeluaran ===
    for (const jenis of ["pemasukan", "pengeluaran"]) {
      try {
        const { data } = await supabase.from("keuangan").select("jumlah").eq("jenis", jenis);
        const total = (data || []).reduce((a, b) => a + Number(b.jumlah || 0), 0);
        if (jenis === "pemasukan")
          totalPemasukanEl.textContent = `Rp ${formatNumber(total)}`;
        else totalPengeluaranEl.textContent = `Rp ${formatNumber(total)}`;
      } catch {
        if (jenis === "pemasukan") totalPemasukanEl.textContent = "Rp 0";
        else totalPengeluaranEl.textContent = "Rp 0";
      }
    }

    // === Preview Anggota ===
    try {
      const { data: members } = await supabase
        .from("profiles")
        .select("nama, tanggal_lahir, blok, rt, rw, avatar_url")
        .order("inserted_at", { ascending: false });

      if (!members?.length) {
        membersPreviewTbody.innerHTML = `<tr><td colspan="7">Belum ada data</td></tr>`;
        return;
      }

      membersPreviewTbody.innerHTML = members
        .map(
          (m, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="text-align:center;">
            <img 
              src="${m.avatar_url || 'https://ikmalfalahi.github.io/putra-delima/assets/img/default-avatar.png'}"
              alt="${escapeHtml(m.nama || '-')}"
              style="width:30px;height:30px;border-radius:50%;object-fit:cover;cursor:pointer;"
              onclick="showAvatarModal('${m.avatar_url || ''}', '${escapeHtml(m.nama || '-')}')"
            />
          </td>
          <td>${escapeHtml(m.nama || "-")}</td>
          <td>${m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
          <td>${escapeHtml(m.blok || "-")}</td>
          <td>${escapeHtml(m.rt || "-")}</td>
          <td>${escapeHtml(m.rw || "-")}</td>
        </tr>`
        )
        .join("");
    } catch (e) {
      console.error("Gagal muat anggota:", e);
      membersPreviewTbody.innerHTML = `<tr><td colspan="7">Gagal memuat data</td></tr>`;
    }
  }

  /* =========================================================
     HALAMAN ANGGOTA
  ========================================================= */
  async function initMembersPage() {
    const membersTableBody = document.querySelector("#membersTable tbody");
    const refreshBtn = document.getElementById("refreshMembers");

    async function loadMembers() {
      membersTableBody.innerHTML = `<tr><td colspan="8">Memuat...</td></tr>`;
      try {
        const { data: members } = await supabase
          .from("profiles")
          .select("nama, tanggal_lahir, blok, rt, rw, avatar_url, role, status")
          .order("inserted_at", { ascending: false });

        if (!members?.length) {
          membersTableBody.innerHTML = `<tr><td colspan="8">Belum ada data</td></tr>`;
          return;
        }

        membersTableBody.innerHTML = members
          .map(
            (m, i) => `
          <tr>
            <td>${i + 1}</td>
            <td style="text-align:center;">
              <img 
                src="${m.avatar_url || 'https://ikmalfalahi.github.io/putra-delima/assets/img/default-avatar.png'}"
                alt="${escapeHtml(m.nama || '-')}"
                style="width:32px;height:32px;border-radius:50%;object-fit:cover;cursor:pointer;"
                onclick="showAvatarModal('${m.avatar_url || ''}', '${escapeHtml(m.nama || '-')}')"
              />
            </td>
            <td>${escapeHtml(m.nama || "-")}</td>
            <td>${m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
            <td>${escapeHtml(m.blok || "-")}</td>
            <td>${escapeHtml(m.rt || "-")}</td>
            <td>${escapeHtml(m.rw || "-")}</td>
            <td>${escapeHtml(m.role || "-")}</td>
          </tr>`
          )
          .join("");
      } catch (e) {
        console.error("Gagal muat anggota:", e);
        membersTableBody.innerHTML = `<tr><td colspan="8">Gagal memuat data</td></tr>`;
      }
    }

    refreshBtn?.addEventListener("click", loadMembers);
    await loadMembers();
  }

  /* =========================================================
     HELPER UI (Toast, Modal, Format)
  ========================================================= */
  function createUIHelpers() {
    if (!document.getElementById("toastContainer")) {
      const t = document.createElement("div");
      t.id = "toastContainer";
      Object.assign(t.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: 9999,
      });
      document.body.appendChild(t);
    }
    if (!document.getElementById("modalRoot")) {
      const m = document.createElement("div");
      m.id = "modalRoot";
      Object.assign(m.style, {
        position: "fixed",
        inset: "0",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
      });
      document.body.appendChild(m);
    }
  }

  function showToast(type, msg, timeout = 4000) {
    const c = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      padding: "10px 14px",
      borderRadius: "10px",
      marginTop: "8px",
      color: type === "error" ? "#fff" : "#111",
      background: type === "error" ? "#d32f2f" : "#f5c542",
    });
    c.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }

  window.showAvatarModal = (url, nama) => {
    if (!url) return showToast("error", "Tidak ada foto avatar.");
    const html = `
      <h3>Foto ${escapeHtml(nama)}</h3>
      <div style="text-align:center;">
        <img src="${url}" style="max-width:300px;max-height:300px;border-radius:10px;cursor:zoom-in;" id="zoomAvatar" />
      </div>
      <div style="text-align:center;margin-top:15px;">
        <button id="closeAvatar">Tutup</button>
      </div>`;
    const modal = showModal(html);
    const img = modal.querySelector("#zoomAvatar");
    let zoom = false;
    img.addEventListener("click", () => {
      zoom = !zoom;
      img.style.transform = zoom ? "scale(1.7)" : "scale(1)";
      img.style.transition = "transform 0.3s ease";
      img.style.cursor = zoom ? "zoom-out" : "zoom-in";
    });
    modal.querySelector("#closeAvatar").addEventListener("click", closeModal);
  };

  function showModal(innerHtml) {
    const root = document.getElementById("modalRoot");
    root.innerHTML = "";
    root.style.display = "flex";
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      background: "rgba(0,0,0,0.5)",
    });
    overlay.addEventListener("click", closeModal);
    const dialog = document.createElement("div");
    Object.assign(dialog.style, {
      background: "#fff",
      padding: "18px",
      borderRadius: "10px",
      maxWidth: "90%",
      maxHeight: "90%",
      overflow: "auto",
    });
    dialog.innerHTML = innerHtml;
    root.append(overlay, dialog);
    return dialog;
  }

  function closeModal() {
    const root = document.getElementById("modalRoot");
    if (root) {
      root.style.display = "none";
      root.innerHTML = "";
    }
  }

  function escapeHtml(str) {
    return str
      ? str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]))
      : "";
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString("id-ID");
  }
});
