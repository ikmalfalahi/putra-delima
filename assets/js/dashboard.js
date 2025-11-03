// dashboard.js (final: role-based read-only for anggota, full access for admin)
// Must be included after supabase.js
document.addEventListener("DOMContentLoaded", () => {
  /* ---------------- Basic DOM refs ---------------- */
  const logoutBtns = Array.from(document.querySelectorAll("#logoutBtn"));
  const toggleSidebarBtns = Array.from(document.querySelectorAll("#toggleSidebar, .hamburger"));
  const sidebar = document.querySelector(".sidebar");
  const userNameEl = document.getElementById("userName");
  const roleLabel = document.getElementById("roleLabel");
  const themeToggle = document.getElementById("themeToggle");

  /* ---------------- Helpers + UI containers ---------------- */
  createUIHelpers();

  // small util helpers
  function formatNumber(n) { if (n === null || n === undefined) return "0"; return Number(n).toLocaleString("id-ID"); }
  function escapeHtml(str) { if (str === null || str === undefined) return ""; return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
  function showToast(type, message = "", timeout = 4200) {
    const c = document.getElementById("toastContainer"); if (!c) return;
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.style.padding = "10px 14px";
    el.style.marginTop = "8px";
    el.style.borderRadius = "10px";
    el.style.minWidth = "180px";
    el.style.boxShadow = "0 8px 18px rgba(0,0,0,.25)";
    el.style.color = type === "error" ? "#fff" : "#111";
    el.style.background = type === "error" ? "#b00020" : "#f5c542";
    el.textContent = message;
    c.appendChild(el);
    setTimeout(()=>{ el.style.transition="opacity .35s"; el.style.opacity=0; setTimeout(()=>el.remove(),350); }, timeout);
  }

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

  function showModal(innerHtml) {
    const root = document.getElementById("modalRoot");
    if (!root) return null;
    root.innerHTML = "";
    root.style.display = "flex";
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.addEventListener("click", closeModal);
    const dialog = document.createElement("div");
    dialog.style.minWidth = "320px";
    dialog.style.maxWidth = "860px";
    dialog.style.background = "#fff";
    dialog.style.color = "#111";
    dialog.style.borderRadius = "12px";
    dialog.style.padding = "18px";
    dialog.style.zIndex = 10;
    dialog.innerHTML = innerHtml;
    root.appendChild(overlay);
    root.appendChild(dialog);
    // minor styling on modal children
    dialog.querySelectorAll("label").forEach(l=>{
      l.style.display = "block";
      l.style.marginBottom = "8px";
      const ctrl = l.querySelector("input,select,textarea");
      if (ctrl && ctrl.style) ctrl.style.width = "100%";
    });
    dialog.querySelectorAll(".modal-actions").forEach(d=>{
      d.style.display = "flex";
      d.style.justifyContent = "flex-end";
      d.style.gap = "8px";
      d.style.marginTop = "10px";
    });
    return dialog;
  }
  window.closeModal = function closeModal() {
    const root = document.getElementById("modalRoot"); if (!root) return;
    root.style.display = "none"; root.innerHTML = "";
  };

  /* ---------------- Auth & Role handling ---------------- */
  let currentUser = null;
  let currentProfile = null;
  let isAdmin = false;

  async function checkAuthAndInit() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // not logged in => back to login
        // use relative path fallback
        const base = location.pathname.includes("/admin") ? "../login.html" : "login.html";
        return (window.location.href = base);
      }
      currentUser = session.user;
      // fetch profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, nama, role, status")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("profile fetch err:", error);
        currentProfile = null;
        isAdmin = false;
      } else {
        currentProfile = profile;
        isAdmin = (profile?.role === "admin");
      }

      if (userNameEl) userNameEl.textContent = currentProfile?.nama || currentUser.email || "-";
      if (roleLabel) roleLabel.textContent = currentProfile?.role || "-";

      // hide admin-only UI for non-admin early (for static buttons)
      if (!isAdmin) {
        document.querySelectorAll(".admin-only").forEach(el => {
          // hide visually but keep in DOM for layout (if needed)
          el.style.display = "none";
        });
      }

    } catch (e) {
      console.error("checkAuthAndInit:", e);
    }
  }

  /* ---------------- Bindings ---------------- */
  function bindLogout() {
    logoutBtns.forEach(b => {
      if (!b) return;
      b.addEventListener("click", async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) { console.error("signOut:", e); }
        // navigate to homepage
        window.location.href = "index.html";
      });
    });
  }

  function bindSidebarToggle() {
    toggleSidebarBtns.forEach(btn => {
      if (!btn) return;
      btn.addEventListener("click", () => {
        if (!sidebar) return;
        sidebar.classList.toggle("open");
      });
    });
  }

  function bindThemeToggle() {
    if (!themeToggle) return;
    const currentTheme = localStorage.getItem("theme") || "dark";
    if (currentTheme === "light") {
      document.body.classList.add("light");
      themeToggle.textContent = "☀️";
    } else {
      document.body.classList.remove("light");
      themeToggle.textContent = "🌙";
    }
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light");
      const isLight = document.body.classList.contains("light");
      localStorage.setItem("theme", isLight ? "light" : "dark");
      themeToggle.textContent = isLight ? "☀️" : "🌙";
    });
  }

  /* ---------------- Router-ish init ---------------- */
  // call auth init, then route-specific initializers
  (async function initAll() {
    await checkAuthAndInit();
    bindLogout();
    bindSidebarToggle();
    bindThemeToggle();
    // determine which page to init by pathname (works for your file names)
    const path = location.pathname;
    if (path.endsWith("/admin.html") || path.endsWith("/admin/") || path.endsWith("/admin")) await initDashboard();
    else if (path.endsWith("/anggota.html")) await initMembersPage();
    else if (path.endsWith("/iuran.html")) await initIuranPage();
    else if (path.endsWith("/keuangan.html")) await initKeuanganPage();
    else if (path.endsWith("/profil.html")) await initProfilPage();
  })();

  /* ---------------- Dashboard page ---------------- */
  async function initDashboard() {
    const totalMembersEl = document.getElementById("totalMembers");
    const totalIuranEl = document.getElementById("totalIuran");
    const totalPemasukanEl = document.getElementById("totalPemasukan");
    const totalPengeluaranEl = document.getElementById("totalPengeluaran");
    const totalSaldoEl = document.getElementById("totalSaldo");
    const membersPreviewTbody = document.querySelector("#membersPreview tbody");

    // total anggota (hitung status Aktif)
    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .neq("status", "Pending"); // optional: exclude pending if you prefer
      if (error) throw error;
      if (totalMembersEl) totalMembersEl.textContent = (count ?? 0).toString();
    } catch (e) {
      console.error("Gagal hitung anggota:", e);
      if (totalMembersEl) totalMembersEl.textContent = "0";
    }

    // total iuran (sum jumlah for all iuran)
    let totalIuranValue = 0;
    try {
      const { data: iurans, error } = await supabase.from("iuran").select("jumlah");
      if (error) throw error;
      totalIuranValue = (iurans || []).reduce((s, it) => s + Number(it.jumlah || 0), 0);
      if (totalIuranEl) totalIuranEl.textContent = `Rp ${formatNumber(totalIuranValue)}`;
    } catch (e) {
      console.error("Gagal hitung iuran:", e);
      if (totalIuranEl) totalIuranEl.textContent = `Rp 0`;
    }

    // pemasukan & pengeluaran
    let pemasukan = 0, pengeluaran = 0;
    try {
      const { data: pemasukanRows, error: e1 } = await supabase.from("keuangan").select("jumlah").eq("jenis", "pemasukan");
      if (e1) throw e1;
      pemasukan = (pemasukanRows || []).reduce((s,r) => s + Number(r.jumlah||0), 0);
      if (totalPemasukanEl) totalPemasukanEl.textContent = `Rp ${formatNumber(pemasukan)}`;
    } catch (err) {
      console.error(err);
      if (totalPemasukanEl) totalPemasukanEl.textContent = `Rp 0`;
    }

    try {
      const { data: pengeluaranRows, error: e2 } = await supabase.from("keuangan").select("jumlah").eq("jenis", "pengeluaran");
      if (e2) throw e2;
      pengeluaran = (pengeluaranRows || []).reduce((s,r) => s + Number(r.jumlah||0), 0);
      if (totalPengeluaranEl) totalPengeluaranEl.textContent = `Rp ${formatNumber(pengeluaran)}`;
    } catch (err) {
      console.error(err);
      if (totalPengeluaranEl) totalPengeluaranEl.textContent = `Rp 0`;
    }

    try {
      const saldo = totalIuranValue + pemasukan - pengeluaran;
      if (totalSaldoEl) totalSaldoEl.textContent = `Rp ${formatNumber(saldo)}`;
    } catch (e) {
      console.error("Gagal hitung saldo:", e);
      if (totalSaldoEl) totalSaldoEl.textContent = `Rp 0`;
    }

    // members preview
    if (membersPreviewTbody) {
      try {
        const { data: members, error } = await supabase
          .from("profiles")
          .select("id, nama, role")
          .order("inserted_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        if (!members || members.length === 0) {
          membersPreviewTbody.innerHTML = `<tr><td colspan="3" class="empty">Belum ada data</td></tr>`;
          return;
        }
        membersPreviewTbody.innerHTML = members.map((m,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${escapeHtml(m.nama||"-")}</td>
            <td>${escapeHtml(m.role||"-")}</td>
          </tr>
        `).join("");
      } catch (e) {
        console.error("Gagal load anggota preview:", e);
      }
    }
  }

  /* ---------------- Members page ---------------- */
  async function initMembersPage() {
    const membersTableBody = document.querySelector("#membersTable tbody");
    const refreshBtn = document.getElementById("refreshMembers");
    const searchInput = document.getElementById("searchMember");

    if (!membersTableBody) return;

    // load all members (for both admin & anggota) but render actions only for admin
    let allMembers = [];

    async function loadMembers() {
      membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Memuat...</td></tr>`;
      try {
        const { data: members, error } = await supabase
          .from("profiles")
          .select("id, nama, tanggal_lahir, blok, rt, rw, avatar_url, role, status")
          .order("inserted_at", { ascending: false });

        if (error) throw error;
        if (!members || members.length === 0) {
          membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Belum ada data</td></tr>`;
          allMembers = [];
          return;
        }
        allMembers = members;
        renderMembers(allMembers);
      } catch (e) {
        console.error(e);
        membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat data</td></tr>`;
      }
    }

    function renderMembers(list) {
      if (!list || list.length === 0) {
        membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Tidak ada data ditemukan</td></tr>`;
        return;
      }
      membersTableBody.innerHTML = list.map((m,i)=>`
        <tr>
          <td>${i+1}</td>
          <td style="text-align:center;">
            <img src="${m.avatar_url || 'https://ikmalfalahi.github.io/putra-delima/assets/img/default-avatar.png'}"
                 alt="${escapeHtml(m.nama||'-')}"
                 style="width:36px;height:36px;object-fit:cover;border-radius:50%;"/>
          </td>
          <td>${escapeHtml(m.nama||"-")}</td>
          <td>${m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
          <td>${escapeHtml(m.blok||"-")}</td>
          <td>${escapeHtml(m.rt||"-")} / ${escapeHtml(m.rw||"-")}</td>
          <td>${escapeHtml(m.status||"-")}</td>
          <td>
            ${isAdmin ? `
              <button class="btn-action btn-edit" onclick="approveMember('${m.id}')">✔</button>
              <button class="btn-action btn-del" onclick="rejectMember('${m.id}')">✖</button>
              <button class="btn-action btn-del" onclick="deleteMember('${m.id}')">🗑</button>
            ` : ""}
            <button class="btn-action btn-edit" onclick="openMemberDetail('${m.id}')">🔍</button>
          </td>
        </tr>
      `).join("");
    }

    // search filter
    searchInput?.addEventListener("input", (e)=>{
      const term = (e.target.value || "").toLowerCase();
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
      if (!isAdmin) return showToast("error", "Hanya admin yang bisa menyetujui anggota.");
      try {
        const { error } = await supabase.from("profiles").update({ status: "Aktif", role: "anggota" }).eq("id", id);
        if (error) throw error;
        showToast("success", "Anggota disetujui.");
        await loadMembers();
      } catch (e) { console.error(e); showToast("error","Gagal approve"); }
    };

    window.rejectMember = async (id) => {
      if (!isAdmin) return showToast("error", "Hanya admin yang bisa menolak anggota.");
      try {
        const { error } = await supabase.from("profiles").update({ status: "Ditolak" }).eq("id", id);
        if (error) throw error;
        showToast("success", "Anggota ditolak.");
        await loadMembers();
      } catch (e) { console.error(e); showToast("error","Gagal reject"); }
    };

    window.deleteMember = async (id) => {
      if (!isAdmin) return showToast("error", "Hanya admin yang bisa menghapus anggota.");
      if (!confirm("Yakin ingin menghapus anggota ini?")) return;
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", id);
        if (error) throw error;
        showToast("success", "Anggota dihapus.");
        await loadMembers();
      } catch (e) { console.error(e); showToast("error","Gagal hapus"); }
    };

    window.openMemberDetail = async (id) => {
      try {
        const { data: member, error } = await supabase.from("profiles").select("*").eq("id", id).single();
        if (error || !member) return showToast("error","Gagal ambil detail anggota.");
        const html = `
          <h3>Detail Anggota</h3>
          <p><strong>Nama:</strong> ${escapeHtml(member.nama||"-")}</p>
          <p><strong>Tanggal Lahir:</strong> ${member.tanggal_lahir? new Date(member.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</p>
          <p><strong>Blok:</strong> ${escapeHtml(member.blok||"-")}</p>
          <p><strong>RT/RW:</strong> ${escapeHtml(member.rt||"-")} / ${escapeHtml(member.rw||"-")}</p>
          <p><strong>Status:</strong> ${escapeHtml(member.status||"-")}</p>
          <p><strong>Role:</strong> ${escapeHtml(member.role||"-")}</p>
          <div class="modal-actions"><button id="closeDetail">Tutup</button></div>
        `;
        const modal = showModal(html);
        modal.querySelector("#closeDetail").addEventListener("click", closeModal);
      } catch (e) { console.error(e); showToast("error","Gagal tampilkan detail"); }
    };

    await loadMembers();
  }

/* ---------------- Iuran page ---------------- */
async function initIuranPage() {
  const iuranSelect = document.getElementById("iuran_user");
  const addIuranBtn = document.getElementById("addIuranBtn");
  const iuranMsg = document.getElementById("iuranMsg");
  const iuranTableBody = document.querySelector("#iuranTable tbody");

  // Pastikan searchInput selalu ada, tampil untuk semua user
  let searchInput = document.getElementById("searchIuran");
  if (!searchInput) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("search-wrapper");
    wrapper.innerHTML = `<input type="text" id="searchIuran" placeholder="Cari iuran...">`;
    iuranTableBody.parentElement.insertBefore(wrapper, iuranTableBody);
    searchInput = document.getElementById("searchIuran");
  }

  if (!iuranTableBody) return;

  let allIurans = [];

  // load members for dropdown only if admin
  if (iuranSelect && isAdmin) {
    try {
      const { data: members } = await supabase.from("profiles").select("id, nama").order("nama", { ascending: true });
      if (members) {
        iuranSelect.innerHTML = `<option value="">Pilih Anggota</option>` + members.map(m=>`<option value="${m.id}">${escapeHtml(m.nama)}</option>`).join("");
      }
    } catch (e) { console.error("fail load members for iuran select", e); }
  }

  async function loadIuran() {
    iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Memuat...</td></tr>`;
    try {
      const { data: iurans, error } = await supabase.from("iuran").select("*").order("inserted_at", { ascending: false });
      if (error) throw error;
      if (!iurans || iurans.length === 0) {
        iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Belum ada iuran</td></tr>`;
        allIurans = [];
        return;
      }

      const userMap = {};
      const totals = {};
      const latestIuran = {};
      for (const i of iurans) {
        if (!totals[i.user_id]) totals[i.user_id] = 0;
        if (i.status === "Belum Lunas") totals[i.user_id] += Number(i.jumlah || 0);
        if (!latestIuran[i.user_id] || new Date(i.inserted_at) > new Date(latestIuran[i.user_id].inserted_at)) {
          latestIuran[i.user_id] = i;
        }
      }

      const userIds = Object.keys(latestIuran).filter(Boolean);
      let users = [];
      if (userIds.length) {
        const res = await supabase.from("profiles").select("id, nama").in("id", userIds);
        users = res.data || [];
      }
      users.forEach(u => userMap[u.id] = u.nama);

      allIurans = userIds.map((uid, idx) => ({
        index: idx + 1,
        user_id: uid,
        nama_user: userMap[uid] || "-",
        jumlah: totals[uid],
        tanggal: latestIuran[uid]?.tanggal || "-",
        status: latestIuran[uid]?.status || "-",
        keterangan: latestIuran[uid]?.keterangan || "-",
        bukti_url: latestIuran[uid]?.bukti_url || null,
      }));

      renderIuran(allIurans);
    } catch (e) {
      console.error(e);
      iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat data</td></tr>`;
    }
  }

  function renderIuran(list) {
    if (!list || list.length === 0) {
      iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Tidak ada hasil.</td></tr>`;
      return;
    }
    iuranTableBody.innerHTML = list.map(u=>`
      <tr>
        <td>${u.index}</td>
        <td>${escapeHtml(u.nama_user)}</td>
        <td>${escapeHtml(u.keterangan || "-")}</td>
        <td>Rp ${formatNumber(u.jumlah || 0)}</td>
        <td>${u.tanggal ? new Date(u.tanggal).toLocaleDateString("id-ID") : "-"}</td>
        <td>${escapeHtml(u.status || "-")}</td>
        <td>${u.bukti_url ? `<a href="${u.bukti_url}" target="_blank">📎 Lihat</a>` : "-"}</td>
        <td class="admin-only">
          ${isAdmin ? `<button onclick="markIuranPaid('${u.user_id}')">✔️ Lunas</button> <button onclick="deleteIuran('${u.user_id}')">🗑️ Hapus</button>` : ""}
        </td>
      </tr>
    `).join("");
  }

  // search: tampil untuk semua user
  searchInput?.addEventListener("input", ()=>{
    const q = (searchInput.value || "").toLowerCase();
    const filtered = allIurans.filter(u =>
      (u.nama_user||"").toLowerCase().includes(q) ||
      (u.keterangan||"").toLowerCase().includes(q) ||
      (u.status||"").toLowerCase().includes(q)
    );
    renderIuran(filtered);
  });

  // add iuran (admin only)
  if (addIuranBtn && isAdmin) {
    addIuranBtn.addEventListener("click", async ()=>{
      const keterangan = (document.getElementById("iuran_keterangan")?.value || "").trim();
      const jumlah = Number(document.getElementById("iuran_jumlah")?.value || 0);
      const member = document.getElementById("iuran_user")?.value || null;
      if (!keterangan || !jumlah || isNaN(jumlah) || jumlah <= 0 || !member) {
        if (iuranMsg) iuranMsg.textContent = "Pilih anggota dan masukkan jumlah dengan benar.";
        return;
      }
      try {
        const { data: existing, error: fetchError } = await supabase
          .from("iuran")
          .select("*")
          .eq("user_id", member)
          .eq("status", "Belum Lunas")
          .order("inserted_at", { ascending: false })
          .limit(1);
        if (fetchError) throw fetchError;

        if (existing && existing.length > 0) {
          const oldIuran = existing[0];
          const { error: updateError } = await supabase
            .from("iuran")
            .update({ jumlah: oldIuran.jumlah + jumlah, keterangan })
            .eq("id", oldIuran.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase.from("iuran").insert([{
            user_id: member,
            jumlah,
            tanggal: new Date().toISOString().split("T")[0],
            status: "Belum Lunas",
            keterangan
          }]);
          if (insertError) throw insertError;
        }

        showToast("success", "Iuran berhasil ditambahkan.");
        if (iuranMsg) iuranMsg.textContent = "";
        document.getElementById("iuran_keterangan").value = "";
        document.getElementById("iuran_jumlah").value = "";
        await loadIuran();
      } catch (e) {
        console.error(e);
        showToast("error", "Gagal tambah iuran.");
        if (iuranMsg) iuranMsg.textContent = `Gagal: ${e.message || e}`;
      }
    });
  } else {
    if (addIuranBtn && !isAdmin) addIuranBtn.style.display = "none";
  }

  // admin actions
  window.markIuranPaid = async (user_id) => {
    if (!isAdmin) return showToast("error","Hanya admin yang bisa melakukan ini.");
    try {
      const { error } = await supabase.from("iuran").update({ status: "Lunas" }).eq("user_id", user_id).eq("status","Belum Lunas");
      if (error) throw error;
      showToast("success","Iuran ditandai lunas.");
      await loadIuran();
    } catch (e) { console.error(e); showToast("error","Gagal update"); }
  };

  window.deleteIuran = async (user_id) => {
    if (!isAdmin) return showToast("error","Hanya admin yang bisa melakukan ini.");
    if (!confirm("Yakin ingin menghapus iuran ini?")) return;
    try {
      const { error } = await supabase.from("iuran").delete().eq("user_id", user_id);
      if (error) throw error;
      showToast("success","Iuran dihapus.");
      await loadIuran();
    } catch (e) { console.error(e); showToast("error","Gagal hapus"); }
  };

  await loadIuran();
}

  /* ---------------- Keuangan page ---------------- */
  async function initKeuanganPage() {
    const addBtn = document.getElementById("addTransactionBtn");
    const transMsg = document.getElementById("transMsg");
    const transTableBody = document.querySelector("#transTable tbody");
    const searchInput = document.getElementById("searchTrans");

    if (!transTableBody) return;

    let allTrans = [];

    async function loadTrans() {
      transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Memuat...</td></tr>`;
      try {
        const { data: trans, error } = await supabase.from("keuangan").select("*").order("inserted_at", { ascending: false });
        if (error) throw error;
        if (!trans || trans.length === 0) {
          transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Belum ada transaksi</td></tr>`;
          allTrans = [];
          return;
        }
        allTrans = trans.map((t,i)=>({
          ...t,
          index: i+1,
          tanggal: t.inserted_at ? new Date(t.inserted_at).toLocaleString("id-ID") : "-"
        }));
        renderTrans(allTrans);
      } catch (e) {
        console.error(e);
        transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Gagal memuat data</td></tr>`;
      }
    }

    function renderTrans(list) {
      if (!list || list.length === 0) {
        transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Tidak ada hasil.</td></tr>`;
        return;
      }
      transTableBody.innerHTML = list.map(t=>`
        <tr>
          <td>${t.index}</td>
          <td>${escapeHtml(t.jenis || "-")}</td>
          <td>Rp ${formatNumber(t.jumlah||0)}</td>
          <td>${escapeHtml(t.keterangan || "-")}</td>
          <td>${t.tanggal}</td>
          <td class="admin-only">
            ${isAdmin ? `<button onclick="editTrans('${t.id}')">✏️ Edit</button><button onclick="deleteTrans('${t.id}')">🗑️ Hapus</button>` : ""}
          </td>
        </tr>
      `).join("");
    }

    // search
    searchInput?.addEventListener("input", ()=>{
      const q = (searchInput.value||"").toLowerCase();
      const filtered = allTrans.filter(t =>
        (t.jenis||"").toLowerCase().includes(q) ||
        (t.keterangan||"").toLowerCase().includes(q) ||
        (String(t.jumlah||"")).includes(q) ||
        (t.tanggal||"").toLowerCase().includes(q)
      );
      renderTrans(filtered);
    });

    // add transaction (admin only)
    if (addBtn && isAdmin) {
      addBtn.addEventListener("click", async ()=>{
        const jenis = (document.getElementById("trans_jenis")?.value || "").trim();
        const jumlah = Number(document.getElementById("trans_jumlah")?.value || 0);
        const keterangan = (document.getElementById("trans_keterangan")?.value || "").trim();
        if (!["pemasukan","pengeluaran"].includes(jenis)) {
          if (transMsg) transMsg.textContent = "Jenis harus 'pemasukan' atau 'pengeluaran'.";
          return;
        }
        if (!jumlah || isNaN(jumlah) || jumlah <= 0) {
          if (transMsg) transMsg.textContent = "Jumlah harus angka > 0.";
          return;
        }
        try {
          const { error } = await supabase.from("keuangan").insert([{
            jenis, jumlah, keterangan, dibuat_oleh: currentUser.id, inserted_at: new Date().toISOString()
          }]);
          if (error) throw error;
          showToast("success","Transaksi ditambahkan.");
          if (transMsg) transMsg.textContent = "";
          document.getElementById("trans_jenis").value = "";
          document.getElementById("trans_jumlah").value = "";
          document.getElementById("trans_keterangan").value = "";
          await loadTrans();
        } catch (e) { console.error(e); showToast("error","Gagal tambah transaksi"); if (transMsg) transMsg.textContent = `Gagal: ${e.message||e}`; }
      });
    } else if (addBtn && !isAdmin) {
      addBtn.style.display = "none";
    }

    // admin actions: editTrans, deleteTrans
    window.editTrans = async (id) => {
      if (!isAdmin) return showToast("error","Hanya admin yang bisa mengedit transaksi.");
      try {
        const { data: t, error } = await supabase.from("keuangan").select("*").eq("id", id).single();
        if (error || !t) return showToast("error","Data tidak ditemukan");
        const jenis = prompt("Ubah jenis (pemasukan/pengeluaran):", t.jenis);
        const jumlah = prompt("Ubah jumlah:", t.jumlah);
        const ket = prompt("Ubah keterangan:", t.keterangan || "");
        if (!["pemasukan","pengeluaran"].includes(jenis)) return showToast("error","Jenis tidak valid.");
        if (!jumlah || isNaN(jumlah) || Number(jumlah) <= 0) return showToast("error","Jumlah harus angka > 0.");
        const { error: e } = await supabase.from("keuangan").update({ jenis, jumlah: Number(jumlah), keterangan: ket }).eq("id", id);
        if (e) throw e;
        showToast("success","Transaksi diperbarui.");
        await loadTrans();
      } catch (e) { console.error(e); showToast("error","Gagal edit"); }
    };

    window.deleteTrans = async (id) => {
      if (!isAdmin) return showToast("error","Hanya admin yang bisa menghapus transaksi.");
      if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
      try {
        const { error } = await supabase.from("keuangan").delete().eq("id", id);
        if (error) throw error;
        showToast("success","Transaksi dihapus.");
        await loadTrans();
      } catch (e) { console.error(e); showToast("error","Gagal hapus"); }
    };

    await loadTrans();
  }

  /* ---------------- Profil page (basic view & edit own profile) ---------------- */
  async function initProfilPage() {
    const profileWrap = document.querySelector(".profile-wrap");
    // if no container, do nothing
    if (!profileWrap) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return (window.location.href = "login.html");
      const userId = session.user.id;
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      // simple render (assumes HTML has placeholders)
      const nameEl = document.getElementById("profileName");
      if (nameEl) nameEl.textContent = profile.nama || "-";
      const emailEl = document.getElementById("profileEmail");
      if (emailEl) emailEl.textContent = profile.email || "-";
      const avatarEl = document.getElementById("profileAvatar");
      if (avatarEl && profile.avatar_url) avatarEl.src = profile.avatar_url;
      // edit own profile (if form exists)
      const saveBtn = document.getElementById("saveProfile");
      if (saveBtn) {
        saveBtn.addEventListener("click", async ()=>{
          const nama = document.getElementById("edit_nama")?.value?.trim() || "";
          const tanggal_lahir = document.getElementById("edit_tanggal_lahir")?.value || null;
          const blok = document.getElementById("edit_blok")?.value || null;
          try {
            const { error } = await supabase.from("profiles").update({ nama, tanggal_lahir, blok }).eq("id", userId);
            if (error) throw error;
            showToast("success","Profil diperbarui.");
          } catch (e) { console.error(e); showToast("error","Gagal simpan profil"); }
        });
      }
    } catch (e) {
      console.error("initProfilPage:", e);
    }
  }

  /* ---------------- Misc helpers exposed ---------------- */
  // openEditMember / openEditIuran / openEditTrans are implemented above in respective pages
  // showAvatarModal helper
  window.showAvatarModal = function (url, nama) {
    if (!url) return showToast("error","Tidak ada foto avatar.");
    const html = `
      <h3>Foto ${escapeHtml(nama)}</h3>
      <div style="text-align:center;">
        <img id="zoomAvatar" src="${url}" alt="${escapeHtml(nama)}" style="max-width:300px;max-height:300px;border-radius:8px;cursor:zoom-in;transition:transform .2s ease"/>
      </div>
      <div style="text-align:center;margin-top:12px;"><button id="closeAvatar">Tutup</button></div>
    `;
    const modal = showModal(html);
    const img = modal.querySelector("#zoomAvatar");
    let zoomed = false;
    img.addEventListener("click", ()=>{
      zoomed = !zoomed;
      img.style.transform = zoomed ? "scale(1.8)" : "scale(1)";
      img.style.cursor = zoomed ? "zoom-out" : "zoom-in";
    });
    modal.querySelector("#closeAvatar").addEventListener("click", closeModal);
  };

  /* ---------------- Export CSV / PDF (optional) ---------------- */
  // keep as-is but safe
  async function exportTableToCSV(filename, tableName) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      if (!data || data.length === 0) { showToast('error','Tidak ada data untuk diekspor.'); return; }
      const headers = Object.keys(data[0]);
      const rows = data.map(obj => headers.map(h => JSON.stringify(obj[h] ?? '')).join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      showToast('success', `Berhasil ekspor ${data.length} data.`);
    } catch (e) { console.error(e); showToast('error','Gagal mengekspor data.'); }
  }

  // wire export buttons if exist
  document.getElementById('exportCSV')?.addEventListener('click', ()=> exportTableToCSV('keuangan.csv','keuangan'));
  document.getElementById('exportPDF')?.addEventListener('click', ()=> {
    // If you want PDF export keep your previous implementation (requires jspdf & autotable)
    showToast('error','Fitur PDF belum diaktifkan di script ini.');
  });

}); // end DOMContentLoaded



