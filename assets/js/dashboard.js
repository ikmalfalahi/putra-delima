// dashboard.js (final, refactor & role-based access)
// Must be included AFTER supabase.js (which provides `supabase` global)

document.addEventListener("DOMContentLoaded", () => {
  // -----------------------
  // Global state
  // -----------------------
  let currentUser = null;
  let currentRole = "anggota"; // default
  const pathname = location.pathname;

  // Create UI containers for toast/modal
  createUIHelpers();

  // bootstrap: check auth & initialize proper page
  (async function boot() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return (window.location.href = "../login.html");

      // fetch profile once
      const userId = session.user.id;
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, nama, role")
        .eq("id", userId)
        .single();

      if (profileErr) {
        console.error("fetch profile:", profileErr);
      } else {
        currentUser = profile;
        currentRole = profile?.role || "anggota";
      }

      // set UI username/role where available
      const userNameEl = document.getElementById("userName");
      const roleLabel = document.getElementById("roleLabel");
      if (userNameEl) userNameEl.textContent = profile?.nama || session.user.email;
      if (roleLabel) roleLabel.textContent = currentRole || "-";

      bindLogout();
      bindSidebarToggle();
      applyThemeFromStorage();

      // route init
      if (pathname.endsWith("/admin.html") || pathname.endsWith("/admin/") || pathname.endsWith("/admin")) {
        await initDashboard();
      } else if (pathname.endsWith("/anggota.html")) {
        await initMembersPage();
      } else if (pathname.endsWith("/iuran.html")) {
        await initIuranPage();
      } else if (pathname.endsWith("/keuangan.html")) {
        await initKeuanganPage();
      } else if (pathname.endsWith("/profil.html")) {
        if (typeof initProfilPage === "function") initProfilPage(); // optional
      }

      // wire export buttons (global)
      bindExportButtons();

    } catch (e) {
      console.error("boot error:", e);
      // try redirect to login
      try { window.location.href = "../login.html"; } catch {}
    }
  })();

  // -----------------------
  // Common helpers
  // -----------------------
  function createUIHelpers() {
    if (!document.getElementById("toastContainer")) {
      const t = document.createElement("div");
      t.id = "toastContainer";
      t.style.position = "fixed";
      t.style.right = "18px";
      t.style.bottom = "18px";
      t.style.zIndex = 9999;
      document.body.appendChild(t);
    }
    if (!document.getElementById("modalRoot")) {
      const m = document.createElement("div");
      m.id = "modalRoot";
      m.style.position = "fixed";
      m.style.inset = "0";
      m.style.display = "none";
      m.style.alignItems = "center";
      m.style.justifyContent = "center";
      m.style.zIndex = 9998;
      document.body.appendChild(m);
    }
  }

  function showToast(type, message, timeout = 3500) {
    const c = document.getElementById("toastContainer");
    if (!c) return console.warn("toast container missing");
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.style.marginTop = "8px";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "10px";
    el.style.minWidth = "160px";
    el.style.boxShadow = "0 8px 18px rgba(0,0,0,.25)";
    el.style.color = type === "error" ? "#fff" : "#111";
    el.style.background = type === "error" ? "#b00020" : "#f5c542";
    el.textContent = message;
    c.appendChild(el);
    setTimeout(() => { el.style.transition = "opacity .35s"; el.style.opacity = 0; setTimeout(() => el.remove(), 350); }, timeout);
  }

  function showModal(innerHtml, options = {}) {
    const root = document.getElementById("modalRoot");
    root.innerHTML = "";
    root.style.display = "flex";

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.addEventListener("click", () => { if (!options.preventClose) closeModal(); });

    const dialog = document.createElement("div");
    dialog.style.minWidth = "320px";
    dialog.style.maxWidth = "860px";
    dialog.style.maxHeight = "90vh";
    dialog.style.overflow = "auto";
    dialog.style.background = "#fff";
    dialog.style.color = "#111";
    dialog.style.borderRadius = "12px";
    dialog.style.padding = "18px";
    dialog.style.zIndex = 10;
    dialog.innerHTML = innerHtml;

    root.appendChild(overlay);
    root.appendChild(dialog);

    // small niceties
    dialog.querySelectorAll("label").forEach(l => {
      l.style.display = "block";
      l.style.marginBottom = "8px";
      const input = l.querySelector("input,select,textarea");
      if (input && input.style) input.style.width = "100%";
    });
    dialog.querySelectorAll(".modal-actions").forEach(d => {
      d.style.display = "flex";
      d.style.justifyContent = "flex-end";
      d.style.gap = "8px";
      d.style.marginTop = "10px";
    });

    return dialog;
  }

  function closeModal() {
    const root = document.getElementById("modalRoot");
    if (!root) return;
    root.style.display = "none";
    root.innerHTML = "";
  }
  window.closeModal = closeModal; // exposed for modal buttons

  function formatNumber(n) {
    if (n === null || n === undefined) return "0";
    const num = Number(n) || 0;
    return num.toLocaleString("id-ID");
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function bindLogout() {
    const logoutBtns = document.querySelectorAll("#logoutBtn");
    logoutBtns.forEach(b => b && b.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "../index.html";
    }));
  }

  function bindSidebarToggle() {
    const toggleBtns = document.querySelectorAll("#toggleSidebar, .hamburger");
    const sidebar = document.querySelector(".sidebar");
    toggleBtns.forEach(btn => btn && btn.addEventListener("click", () => {
      if (!sidebar) return;
      sidebar.classList.toggle("open");
    }));
  }

  // Apply role UI: hide admin-only controls for anggota
  function applyRoleUI() {
    const isAdmin = currentRole === "admin";
    // elements marked admin-only (class) will be hidden for non-admin
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = isAdmin ? "" : "none";
    });
    // buttons with .btn-action (for safety)
    document.querySelectorAll(".btn-action").forEach(btn => {
      btn.style.display = isAdmin ? "" : "none";
    });
  }

  // Apply theme from localStorage
  function applyThemeFromStorage() {
    const themeToggle = document.getElementById("themeToggle");
    const currentTheme = localStorage.getItem("theme") || "dark";
    if (currentTheme === "light") {
      document.body.classList.add("light");
      if (themeToggle) themeToggle.textContent = "☀️";
    } else {
      document.body.classList.remove("light");
      if (themeToggle) themeToggle.textContent = "🌙";
    }
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light");
        const isLight = document.body.classList.contains("light");
        localStorage.setItem("theme", isLight ? "light" : "dark");
        themeToggle.textContent = isLight ? "☀️" : "🌙";
      });
    }
  }

  function bindExportButtons() {
    const csvBtn = document.getElementById("exportCSV");
    if (csvBtn) csvBtn.addEventListener("click", () => exportTableToCSV("keuangan.csv", "keuangan"));
    const pdfBtn = document.getElementById("exportPDF");
    if (pdfBtn) pdfBtn.addEventListener("click", () => exportTableToPDF("Laporan Keuangan", "keuangan"));
  }

  // -----------------------
  // Dashboard page
  // -----------------------
  async function initDashboard() {
    applyRoleUI();

    const totalMembersEl = document.getElementById("totalMembers");
    const totalIuranEl = document.getElementById("totalIuran");
    const totalPemasukanEl = document.getElementById("totalPemasukan");
    const totalPengeluaranEl = document.getElementById("totalPengeluaran");
    const totalSaldoEl = document.getElementById("totalSaldo");
    const membersPreviewTbody = document.querySelector("#membersPreview tbody");

    // total members
    try {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      if (totalMembersEl) totalMembersEl.textContent = count ?? "0";
    } catch (e) {
      console.error("Gagal hitung anggota:", e);
      if (totalMembersEl) totalMembersEl.textContent = "0";
    }

    // total iuran
    let totalIuranValue = 0;
    try {
      const { data: iurans, error } = await supabase.from("iuran").select("jumlah");
      if (error) throw error;
      totalIuranValue = (iurans || []).reduce((s, r) => s + Number(r.jumlah || 0), 0);
      if (totalIuranEl) totalIuranEl.textContent = `Rp ${formatNumber(totalIuranValue)}`;
    } catch (e) {
      console.error("Gagal hitung iuran:", e);
      if (totalIuranEl) totalIuranEl.textContent = "-";
    }

    // pemasukan / pengeluaran from keuangan
    let totalPemasukanValue = 0;
    let totalPengeluaranValue = 0;
    try {
      const [{ data: pemasukan }, { data: pengeluaran }] = await Promise.all([
        supabase.from("keuangan").select("jumlah").eq("jenis", "pemasukan"),
        supabase.from("keuangan").select("jumlah").eq("jenis", "pengeluaran"),
      ]);
      totalPemasukanValue = (pemasukan || []).reduce((s, r) => s + Number(r.jumlah || 0), 0);
      totalPengeluaranValue = (pengeluaran || []).reduce((s, r) => s + Number(r.jumlah || 0), 0);
      if (totalPemasukanEl) totalPemasukanEl.textContent = `Rp ${formatNumber(totalPemasukanValue)}`;
      if (totalPengeluaranEl) totalPengeluaranEl.textContent = `Rp ${formatNumber(totalPengeluaranValue)}`;
    } catch (e) {
      console.error("Gagal hitung pemasukan/pengeluaran:", e);
      if (totalPemasukanEl) totalPemasukanEl.textContent = "Rp 0";
      if (totalPengeluaranEl) totalPengeluaranEl.textContent = "Rp 0";
    }

    // saldo
    try {
      const totalSaldo = totalIuranValue + totalPemasukanValue - totalPengeluaranValue;
      if (totalSaldoEl) totalSaldoEl.textContent = `Rp ${formatNumber(totalSaldo)}`;
    } catch (e) {
      console.error("Gagal hitung saldo:", e);
      if (totalSaldoEl) totalSaldoEl.textContent = "Rp 0";
    }

    // load preview members
    if (membersPreviewTbody) {
      try {
        const { data: members, error } = await supabase
          .from("profiles")
          .select("id, nama, role")
          .order("inserted_at", { ascending: false });

        if (error) throw error;
        if (!members || members.length === 0) {
          membersPreviewTbody.innerHTML = `<tr><td colspan="7" class="empty">Belum ada data</td></tr>`;
        } else {
          membersPreviewTbody.innerHTML = members.map((m, i) => `
            <tr>
              <td>${i+1}</td>
              <td>${escapeHtml(m.nama || "-")}</td>
              <td>${escapeHtml(m.role || "-")}</td>
            </tr>
          `).join("");
        }
      } catch (e) {
        console.error("Gagal load anggota:", e);
      }
    }
  }

  // -----------------------
  // Members page
  // -----------------------
  async function initMembersPage() {
    applyRoleUI();

    const membersTableBody = document.querySelector("#membersTable tbody");
    const refreshBtn = document.getElementById("refreshMembers");
    const searchInput = document.getElementById("searchMember");
    let allMembers = [];

    function renderMembers(list) {
      if (!list || list.length === 0) {
        membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Tidak ada data ditemukan</td></tr>`;
        return;
      }
      membersTableBody.innerHTML = list.map((m, i) => `
        <tr>
          <td>${i+1}</td>
          <td class="avatar-cell" style="text-align:center;">
            <img src="${m.avatar_url || 'https://ikmalfalahi.github.io/putra-delima/assets/img/default-avatar.png'}"
                 alt="${escapeHtml(m.nama||'-')}" style="width:36px;height:36px;object-fit:cover;border-radius:50%;cursor:pointer;" onclick="showAvatarModal('${m.avatar_url || ''}', '${escapeHtml(m.nama || '-')}')"/>
          </td>
          <td>${escapeHtml(m.nama || "-")}</td>
          <td>${m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
          <td>${escapeHtml(m.blok || "-")}</td>
          <td>${escapeHtml(m.rt || "-")} / ${escapeHtml(m.rw || "-")}</td>
          <td>${escapeHtml(m.status || "-")}</td>
          <td>
            ${currentRole === "admin" ? `
              <button class="btn-action btn-edit" onclick="approveMember('${m.id}')">✔</button>
              <button class="btn-action btn-del" onclick="rejectMember('${m.id}')">✖</button>
              <button class="btn-action btn-del" onclick="deleteMember('${m.id}')">🗑</button>
            ` : ""}
            <button class="btn-action btn-view" onclick="openMemberDetail('${m.id}')">🔍</button>
          </td>
        </tr>
      `).join("");
      // ensure role UI applied for elements created after render
      applyRoleUI();
    }

    async function loadMembers() {
      membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Memuat...</td></tr>`;
      try {
        let query = supabase.from("profiles").select("id, nama, tanggal_lahir, blok, rt, rw, avatar_url, role, status").order("inserted_at", { ascending: false });
        // For anggota role: still show all active members but hide admin users
        if (currentRole !== "admin") {
          query = query.eq("status", "Aktif").neq("role", "admin");
        }
        const { data: members, error } = await query;
        if (error) throw error;
        allMembers = members || [];
        renderMembers(allMembers);
      } catch (e) {
        console.error(e);
        membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat data</td></tr>`;
      }
    }

    // search
    searchInput?.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allMembers.filter(m =>
        (m.nama || "").toLowerCase().includes(term) ||
        (m.blok || "").toLowerCase().includes(term) ||
        (m.status || "").toLowerCase().includes(term)
      );
      renderMembers(filtered);
    });

    // refresh
    refreshBtn?.addEventListener("click", loadMembers);

    // admin actions
    window.approveMember = async (id) => {
      if (currentRole !== "admin") return showToast("error", "Hanya admin yang bisa menyetujui anggota.");
      try {
        const { error } = await supabase.from("profiles").update({ status: "Aktif", role: "anggota" }).eq("id", id);
        if (error) throw error;
        showToast("success", "Anggota disetujui!");
        await loadMembers();
      } catch (e) { console.error(e); showToast("error", "Gagal menyetujui anggota."); }
    };

    window.rejectMember = async (id) => {
      if (currentRole !== "admin") return showToast("error", "Hanya admin yang bisa menolak anggota.");
      try {
        const { error } = await supabase.from("profiles").update({ status: "Ditolak" }).eq("id", id);
        if (error) throw error;
        showToast("success", "Anggota ditolak.");
        await loadMembers();
      } catch (e) { console.error(e); showToast("error", "Gagal menolak anggota."); }
    };

    window.deleteMember = async (id) => {
      if (currentRole !== "admin") return showToast("error", "Hanya admin yang bisa menghapus anggota.");
      if (!confirm("Yakin ingin menghapus anggota ini?")) return;
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", id);
        if (error) throw error;
        showToast("success", "Anggota dihapus.");
        await loadMembers();
      } catch (e) { console.error(e); showToast("error", "Gagal menghapus anggota."); }
    };

    window.openMemberDetail = async (id) => {
      try {
        const { data: member, error } = await supabase.from("profiles").select("*").eq("id", id).single();
        if (error) throw error;
        const html = `
          <h3>Detail Anggota</h3>
          <p><strong>Nama:</strong> ${escapeHtml(member.nama || "-")}</p>
          <p><strong>Tanggal Lahir:</strong> ${member.tanggal_lahir ? new Date(member.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</p>
          <p><strong>Blok:</strong> ${escapeHtml(member.blok || "-")}</p>
          <p><strong>RT/RW:</strong> ${escapeHtml(member.rt || "-")} / ${escapeHtml(member.rw || "-")}</p>
          <p><strong>Status:</strong> ${escapeHtml(member.status || "-")}</p>
          <p><strong>Role:</strong> ${escapeHtml(member.role || "-")}</p>
          <div class="modal-actions"><button id="closeDetail">Tutup</button></div>
        `;
        const modal = showModal(html);
        modal.querySelector("#closeDetail").addEventListener("click", closeModal);
      } catch (e) {
        console.error(e);
        showToast("error", "Gagal membuka detail anggota.");
      }
    };

    await loadMembers();
  }

  // -----------------------
  // Iuran page
  // -----------------------
  async function initIuranPage() {
    applyRoleUI();

    const iuranSelect = document.getElementById("iuran_user");
    const addIuranBtn = document.getElementById("addIuranBtn");
    const iuranMsg = document.getElementById("iuranMsg");
    const iuranTableBody = document.querySelector("#iuranTable tbody");
    const searchInput = document.getElementById("searchIuran");
    let allIurans = [];

    // load members for dropdown (admin only)
    if (iuranSelect && currentRole === "admin") {
      try {
        const { data: members } = await supabase.from("profiles").select("id, nama, role").order("nama", { ascending: true });
        if (members && members.length) {
          iuranSelect.innerHTML = `<option value="">Pilih Anggota</option>` + members.map(m => `<option value="${m.id}">${escapeHtml(m.nama)} (${escapeHtml(m.role)})</option>`).join("");
        }
      } catch (e) { console.error("load members for iuran:", e); }
    }

    async function loadIuran() {
      if (!iuranTableBody) return;
      iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Memuat...</td></tr>`;
      try {
        const { data: iurans, error } = await supabase.from("iuran").select("*").order("inserted_at", { ascending: false });
        if (error) throw error;
        if (!iurans || iurans.length === 0) {
          iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Belum ada iuran</td></tr>`;
          allIurans = [];
          return;
        }

        // map user names
        const userIds = [...new Set(iurans.map(x => x.user_id).filter(Boolean))];
        let users = [];
        if (userIds.length) {
          const { data } = await supabase.from("profiles").select("id, nama, role").in("id", userIds);
          users = data || [];
        }
        const userMap = {};
        (users || []).forEach(u => userMap[u.id] = `${u.nama} (${u.role})`);

        allIurans = iurans.map((u, i) => ({
          ...u,
          index: i + 1,
          nama_user: userMap[u.user_id] || "-",
          tanggal_formatted: u.tanggal ? new Date(u.tanggal).toLocaleDateString("id-ID") : "-"
        }));

        renderIuran(allIurans);
      } catch (e) {
        console.error(e);
        if (iuranTableBody) iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat data</td></tr>`;
      }
    }

    function renderIuran(list) {
      if (!iuranTableBody) return;
      if (!list || list.length === 0) {
        iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Tidak ada hasil.</td></tr>`;
        return;
      }
      iuranTableBody.innerHTML = list.map(u => `
        <tr>
          <td>${u.index}</td>
          <td>${escapeHtml(u.nama_user)}</td>
          <td>${escapeHtml(u.keterangan || "-")}</td>
          <td>Rp ${formatNumber(u.jumlah || 0)}</td>
          <td>${u.tanggal_formatted}</td>
          <td>${escapeHtml(u.status || "-")}</td>
          <td>${u.bukti_url ? `<a href="${u.bukti_url}" target="_blank">📎 Lihat</a>` : "-"}</td>
          <td class="admin-only">
            ${currentRole === "admin" ? `<button class="btn-action" onclick="markIuranPaid('${u.id}')">✔️ Lunas</button>
                                        <button class="btn-action" onclick="deleteIuran('${u.id}')">🗑️ Hapus</button>` : ""}
          </td>
        </tr>
      `).join("");
      applyRoleUI();
    }

    // search
    searchInput?.addEventListener("input", () => {
      const q = (searchInput.value || "").toLowerCase();
      const filtered = allIurans.filter(u =>
        (u.nama_user || "").toLowerCase().includes(q) ||
        (u.keterangan || "").toLowerCase().includes(q) ||
        (u.status || "").toLowerCase().includes(q)
      );
      renderIuran(filtered);
    });

    // add iuran (admin only)
    if (addIuranBtn && currentRole === "admin") {
      addIuranBtn.addEventListener("click", async () => {
        const keterangan = document.getElementById("iuran_keterangan")?.value.trim();
        const jumlah = Number(document.getElementById("iuran_jumlah")?.value);
        const member = document.getElementById("iuran_user")?.value;
        iuranMsg && (iuranMsg.textContent = "");
        if (!keterangan || !jumlah || isNaN(jumlah) || jumlah <= 0) {
          iuranMsg && (iuranMsg.textContent = "Keterangan dan jumlah valid wajib diisi.");
          return;
        }
        const targetUser = member || currentUser.id;
        try {
          const { error } = await supabase.from("iuran").insert([{
            user_id: targetUser,
            jumlah,
            tanggal: new Date().toISOString().split("T")[0],
            status: "belum",
            keterangan
          }]);
          if (error) throw error;
          showToast("success", "Iuran berhasil ditambahkan.");
          document.getElementById("iuran_keterangan").value = "";
          document.getElementById("iuran_jumlah").value = "";
          await loadIuran();
        } catch (e) {
          console.error(e);
          showToast("error", `Gagal menambah iuran: ${e.message || e}`);
        }
      });
    }

    // admin actions (exposed)
    window.markIuranPaid = async (id) => {
      if (currentRole !== "admin") return showToast("error", "Hanya admin yang bisa melakukan aksi ini.");
      try {
        const { error } = await supabase.from("iuran").update({ status: "lunas" }).eq("id", id);
        if (error) throw error;
        showToast("success", "Iuran ditandai lunas.");
        await loadIuran();
      } catch (e) { console.error(e); showToast("error", "Gagal update iuran."); }
    };

    window.deleteIuran = async (id) => {
      if (currentRole !== "admin") return showToast("error", "Hanya admin yang bisa melakukan aksi ini.");
      if (!confirm("Yakin ingin menghapus iuran ini?")) return;
      try {
        const { error } = await supabase.from("iuran").delete().eq("id", id);
        if (error) throw error;
        showToast("success", "Iuran berhasil dihapus.");
        await loadIuran();
      } catch (e) { console.error(e); showToast("error", "Gagal hapus iuran."); }
    };

    await loadIuran();
  }

  // -----------------------
  // Keuangan page
  // -----------------------
  async function initKeuanganPage() {
    applyRoleUI();

    const addBtn = document.getElementById("addTransactionBtn");
    const transMsg = document.getElementById("transMsg");
    const transTableBody = document.querySelector("#transTable tbody");
    const searchInput = document.getElementById("searchTrans");
    let allTrans = [];

    async function loadTrans() {
      if (!transTableBody) return;
      transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Memuat...</td></tr>`;
      try {
        const { data: trans, error } = await supabase.from("keuangan").select("*").order("inserted_at", { ascending: false });
        if (error) throw error;
        if (!trans || trans.length === 0) {
          transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Belum ada transaksi</td></tr>`;
          allTrans = [];
          return;
        }
        allTrans = trans.map((t, i) => ({ ...t, index: i+1, tanggal_formatted: t.inserted_at ? new Date(t.inserted_at).toLocaleString("id-ID") : "-" }));
        renderTrans(allTrans);
      } catch (e) {
        console.error(e);
        transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Gagal memuat data</td></tr>`;
      }
    }

    function renderTrans(list) {
      if (!transTableBody) return;
      if (!list || list.length === 0) {
        transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Tidak ada hasil.</td></tr>`;
        return;
      }
      transTableBody.innerHTML = list.map(t => `
        <tr>
          <td>${t.index}</td>
          <td>${escapeHtml(t.jenis || "-")}</td>
          <td>Rp ${formatNumber(t.jumlah || 0)}</td>
          <td>${escapeHtml(t.keterangan || "-")}</td>
          <td>${t.tanggal_formatted}</td>
          <td class="admin-only">
            ${currentRole === "admin" ? `<button class="btn-action" onclick="editTrans('${t.id}')">✏️ Edit</button>
                                        <button class="btn-action" onclick="deleteTrans('${t.id}')">🗑️ Hapus</button>` : ""}
          </td>
        </tr>
      `).join("");
      applyRoleUI();
    }

    // search
    searchInput?.addEventListener("input", () => {
      const q = (searchInput.value || "").toLowerCase();
      const filtered = allTrans.filter(t =>
        (t.jenis || "").toLowerCase().includes(q) ||
        (t.keterangan || "").toLowerCase().includes(q) ||
        String(t.jumlah || "").includes(q) ||
        (t.tanggal_formatted || "").toLowerCase().includes(q)
      );
      renderTrans(filtered);
    });

    // add (admin)
    if (addBtn && currentRole === "admin") {
      addBtn.addEventListener("click", async () => {
        const jenis = (document.getElementById("trans_jenis")?.value || "").trim();
        const jumlah = Number(document.getElementById("trans_jumlah")?.value);
        const keterangan = (document.getElementById("trans_keterangan")?.value || "").trim();
        transMsg && (transMsg.textContent = "");
        if (!["pemasukan", "pengeluaran"].includes(jenis)) {
          transMsg && (transMsg.textContent = "Jenis harus 'pemasukan' atau 'pengeluaran'.");
          return;
        }
        if (!jumlah || isNaN(jumlah) || jumlah <= 0) {
          transMsg && (transMsg.textContent = "Jumlah harus angka > 0.");
          return;
        }
        try {
          const { error } = await supabase.from("keuangan").insert([{
            jenis, jumlah, keterangan, dibuat_oleh: currentUser.id, inserted_at: new Date().toISOString()
          }]);
          if (error) throw error;
          showToast("success", "Transaksi berhasil ditambahkan!");
          document.getElementById("trans_jenis").value = "";
          document.getElementById("trans_jumlah").value = "";
          document.getElementById("trans_keterangan").value = "";
          await loadTrans();
        } catch (e) {
          console.error(e);
          showToast("error", `Gagal menambah transaksi: ${e.message || e}`);
        }
      });
    }

    // admin edit/delete (exposed)
    window.editTrans = async (id) => {
      if (currentRole !== "admin") return showToast("error", "Hanya admin yang bisa mengedit transaksi.");
      try {
        const { data: t, error } = await supabase.from("keuangan").select("*").eq("id", id).single();
        if (error) throw error;
        const jenis = prompt("Ubah jenis (pemasukan/pengeluaran):", t.jenis) || t.jenis;
        const jumlah = prompt("Ubah jumlah:", t.jumlah) || t.jumlah;
        const ket = prompt("Ubah keterangan:", t.keterangan || "") || t.keterangan;
        if (!["pemasukan","pengeluaran"].includes(jenis)) return showToast("error","Jenis tidak valid.");
        if (!jumlah || isNaN(Number(jumlah)) || Number(jumlah) <= 0) return showToast("error","Jumlah harus angka > 0.");
        const { error: upErr } = await supabase.from("keuangan").update({ jenis, jumlah: Number(jumlah), keterangan: ket }).eq("id", id);
        if (upErr) throw upErr;
        showToast("success", "Transaksi berhasil diperbarui.");
        await loadTrans();
      } catch (e) {
        console.error(e);
        showToast("error", "Gagal edit transaksi.");
      }
    };

    window.deleteTrans = async (id) => {
      if (currentRole !== "admin") return showToast("error", "Hanya admin yang bisa menghapus transaksi.");
      if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
      try {
        const { error } = await supabase.from("keuangan").delete().eq("id", id);
        if (error) throw error;
        showToast("success", "Transaksi berhasil dihapus.");
        await loadTrans();
      } catch (e) {
        console.error(e);
        showToast("error", "Gagal menghapus transaksi.");
      }
    };

    await loadTrans();
  }

  // -----------------------
  // Export helpers (CSV & PDF)
  // -----------------------
  async function exportTableToCSV(filename, tableName) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      if (!data || data.length === 0) { showToast('error', 'Tidak ada data untuk diekspor.'); return; }
      const headers = Object.keys(data[0]);
      const rows = data.map(obj => headers.map(h => JSON.stringify(obj[h] ?? '')).join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', `Berhasil ekspor ${data.length} data.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal mengekspor data.');
    }
  }

  async function exportTableToPDF(title, tableName) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      if (!data || data.length === 0) { showToast('error', 'Tidak ada data untuk dicetak.'); return; }
      if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.autoTable) {
        showToast('error', 'Library jsPDF / autoTable tidak ditemukan di halaman.');
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
      const marginX = 40;
      // header logo (best-effort)
      try {
        const logo = new Image();
        logo.src = 'assets/img/logo-putra-delima.png';
        await new Promise(res => { logo.onload = res; logo.onerror = res; });
        doc.addImage(logo, 'PNG', marginX, 30, 40, 40);
      } catch {}
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PUTRA DELIMA', marginX + 55, 50);
      doc.setFontSize(11);
      doc.text('Laporan ' + title, marginX + 55, 68);
      doc.setDrawColor(245, 197, 66);
      doc.line(marginX, 80, 550, 80);

      const headers = Object.keys(data[0]);
      const rows = data.map(obj => headers.map(h => obj[h] ?? ''));
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 90,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [245,197,66], textColor: 17 },
      });

      const printed = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
      doc.setFontSize(10);
      doc.text(`Dicetak pada: ${printed}`, marginX, doc.internal.pageSize.height - 30);
      doc.save(`${title.replace(/\s+/g,'_').toLowerCase()}.pdf`);
      showToast('success', `Berhasil cetak ${data.length} data ke PDF.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal mencetak PDF.');
    }
  }

  // -----------------------
  // Avatar modal helper
  // -----------------------
  window.showAvatarModal = function (url, nama) {
    if (!url) return showToast("error", "Tidak ada foto avatar.");
    const html = `
      <h3>Foto ${escapeHtml(nama)}</h3>
      <div style="text-align:center;">
        <img id="zoomAvatar" src="${url}" alt="${escapeHtml(nama)}" style="max-width:300px;max-height:300px;border-radius:10px;cursor:zoom-in;transition:transform .2s ease;" />
      </div>
      <div style="text-align:center;margin-top:15px;">
        <button id="closeAvatar">Tutup</button>
      </div>
    `;
    const modal = showModal(html);
    const img = modal.querySelector("#zoomAvatar");
    let zoomed = false;
    img.addEventListener("click", () => {
      zoomed = !zoomed;
      img.style.transform = zoomed ? "scale(1.8)" : "scale(1)";
      img.style.cursor = zoomed ? "zoom-out" : "zoom-in";
    });
    modal.querySelector("#closeAvatar").addEventListener("click", closeModal);
  };

  // expose some app-level helpers for debugging if needed
  window.app = {
    currentUser: () => currentUser,
    currentRole: () => currentRole,
    reloadCurrentPage: function () {
      const p = location.pathname;
      if (p.endsWith("/admin.html")) initDashboard();
      else if (p.endsWith("/anggota.html")) initMembersPage();
      else if (p.endsWith("/iuran.html")) initIuranPage();
      else if (p.endsWith("/keuangan.html")) initKeuanganPage();
      else if (typeof initProfilPage === "function") initProfilPage();
    }
  };
});
