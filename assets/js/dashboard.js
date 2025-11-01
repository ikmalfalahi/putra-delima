// dashboard.js (enhanced: modal, toast, validation)
// Must be included after supabase.js
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtns = document.querySelectorAll("#logoutBtn");
  const toggleSidebarBtns = document.querySelectorAll("#toggleSidebar, .hamburger");
  const sidebar = document.querySelector(".sidebar");
  const userNameEl = document.getElementById("userName");
  const roleLabel = document.getElementById("roleLabel");

  // create global modal + toast containers
  createUIHelpers();

  checkAuthAndInit();
  bindLogout();
  bindSidebarToggle();

  // route-like init
  const path = location.pathname;
  if (path.endsWith("/admin.html") || path.endsWith("/admin/") || path.endsWith("/admin")) initDashboard();
  else if (path.endsWith("/anggota.html")) initMembersPage();
  else if (path.endsWith("/iuran.html")) initIuranPage();
  else if (path.endsWith("/keuangan.html")) initKeuanganPage();
  else if (path.endsWith("/profil.html")) initProfilPage();

  /* ---------------- core/auth ---------------- */
  async function checkAuthAndInit() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return (window.location.href = "../login.html");
    const userId = session.user.id;
    try {
      const { data: profile } = await supabase.from("profiles").select("nama, role").eq("id", userId).single();
      if (userNameEl) userNameEl.textContent = profile?.nama || session.user.email;
      if (roleLabel) roleLabel.textContent = profile?.role || "-";
    } catch (e) {
      console.error("profile fetch:", e);
    }
  }

  function bindLogout() {
    logoutBtns.forEach(b => b && b.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "https://ikmalfalahi.github.io/putra-delima/index.html";
    }));
  }

  function bindSidebarToggle() {
    toggleSidebarBtns.forEach(btn => btn && btn.addEventListener("click", () => {
      if (!sidebar) return;
      sidebar.classList.toggle("open");
    }));
  }

  /* ---------------- Dashboard ---------------- */
  async function initDashboard() {
    const totalMembersEl = document.getElementById("totalMembers");
    const totalIuranEl = document.getElementById("totalIuran");
    const totalPemasukanEl = document.getElementById("totalPemasukan");
    const totalPengeluaranEl = document.getElementById("totalPengeluaran");
    const membersPreviewTbody = document.querySelector("#membersPreview tbody");

    // members count
    try {
      const { count } = await supabase.from("members").select("*", { count: "exact", head: true });
      if (totalMembersEl) totalMembersEl.textContent = count ?? "0";
    } catch (e) { if (totalMembersEl) totalMembersEl.textContent = "0"; }

    // sum iuran (fallback to local sum)
    try {
      const { data: iurans } = await supabase.from("iuran").select("jumlah");
      const sum = (iurans || []).reduce((s, r) => s + Number(r.jumlah || 0), 0);
      if (totalIuranEl) totalIuranEl.textContent = `Rp ${formatNumber(sum)}`;
    } catch (e) { if (totalIuranEl) totalIuranEl.textContent = "-"; }

    // pemasukan/pengeluaran
    try {
      const { data: pemasukan } = await supabase.from("transactions").select("amount").eq("type", "pemasukan");
      const pemasukanSum = (pemasukan || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      if (totalPemasukanEl) totalPemasukanEl.textContent = `Rp ${formatNumber(pemasukanSum)}`;
    } catch (e) { if (totalPemasukanEl) totalPemasukanEl.textContent = "Rp 0"; }

    try {
      const { data: pengeluaran } = await supabase.from("transactions").select("amount").eq("type", "pengeluaran");
      const pengeluaranSum = (pengeluaran || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      if (totalPengeluaranEl) totalPengeluaranEl.textContent = `Rp ${formatNumber(pengeluaranSum)}`;
    } catch (e) { if (totalPengeluaranEl) totalPengeluaranEl.textContent = "Rp 0"; }

    // members preview
    try {
      const { data: members } = await supabase.from("members").select("id, nama, umur, rt, rw").order("created_at", { ascending: false }).limit(6);
      if (!members || members.length === 0) membersPreviewTbody.innerHTML = `<tr><td colspan="5" class="empty">Belum ada data</td></tr>`;
      else membersPreviewTbody.innerHTML = members.map((m,i)=>`<tr>
        <td>${i+1}</td>
        <td>${escapeHtml(m.nama)}</td>
        <td>${m.umur||"-"}</td>
        <td>${m.rt||"-"} / ${m.rw||"-"}</td>
        <td>
          <button class="btn" onclick="window.openMemberModal('${m.id}')">Lihat</button>
        </td>
      </tr>`).join("");
    } catch (e) {
      membersPreviewTbody.innerHTML = `<tr><td colspan="5" class="empty">Gagal memuat data</td></tr>`;
      console.error(e);
    }

    // expose helper to open modal
    window.openMemberModal = openEditMember;
  }

/* ---------------- Members page (pakai tabel profiles) ---------------- */
async function initMembersPage() {
  const membersTableBody = document.querySelector("#membersTable tbody");
  const refreshBtn = document.getElementById("refreshMembers");

  // === Load daftar anggota ===
  async function loadMembers() {
    membersTableBody.innerHTML = `<tr><td colspan="6" class="empty">Memuat...</td></tr>`;
    try {
      // Ambil data dari tabel profiles
      const { data: members, error } = await supabase
        .from("profiles")
        .select("id, nama, tanggal_lahir, rt, rw, role, status")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!members || members.length === 0) {
        membersTableBody.innerHTML = `<tr><td colspan="6" class="empty">Belum ada data anggota</td></tr>`;
        return;
      }

      membersTableBody.innerHTML = members
        .map(
          (m, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(m.nama || "-")}</td>
            <td>${m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
            <td>${m.rt || "-"} / ${m.rw || "-"}</td>
            <td>
              <span class="badge ${m.status === "Aktif" ? "green" : m.status === "Ditolak" ? "red" : "gray"}">
                ${escapeHtml(m.status || "-")}
              </span>
            </td>
            <td>
              <button onclick="openMemberDetail('${m.id}')">Detail</button>
              ${
                m.status === "Pending"
                  ? `
                    <button onclick="approveMember('${m.id}')">Setuju</button>
                    <button onclick="rejectMember('${m.id}')">Tolak</button>
                  `
                  : ""
              }
              <button onclick="deleteMember('${m.id}')">Hapus</button>
            </td>
          </tr>`
        )
        .join("");
    } catch (e) {
      console.error(e);
      membersTableBody.innerHTML = `<tr><td colspan="6" class="empty">Gagal memuat data</td></tr>`;
    }
  }

  // === Aksi: Setuju ===
  window.approveMember = async (id) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "Aktif", role: "anggota" })
        .eq("id", id);

      if (error) throw error;
      showToast("success", "Anggota berhasil disetujui!");
      await loadMembers();
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal menyetujui anggota.");
    }
  };

  // === Aksi: Tolak ===
  window.rejectMember = async (id) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "Ditolak" })
        .eq("id", id);

      if (error) throw error;
      showToast("success", "Anggota berhasil ditolak.");
      await loadMembers();
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal menolak anggota.");
    }
  };

  // === Aksi: Hapus ===
  window.deleteMember = async (id) => {
    if (!confirm("Yakin ingin menghapus anggota ini?")) return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      showToast("success", "Anggota berhasil dihapus.");
      await loadMembers();
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal menghapus anggota.");
    }
  };

  // === Detail Anggota ===
  window.openMemberDetail = async (id) => {
    try {
      const { data: member, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const html = `
        <h3>Detail Anggota</h3>
        <p><strong>Nama:</strong> ${escapeHtml(member.nama || "-")}</p>
        <p><strong>Tanggal Lahir:</strong> ${
          member.tanggal_lahir
            ? new Date(member.tanggal_lahir).toLocaleDateString("id-ID")
            : "-"
        }</p>
        <p><strong>RT/RW:</strong> ${member.rt || "-"} / ${member.rw || "-"}</p>
        <p><strong>Status:</strong> ${escapeHtml(member.status || "-")}</p>
        <p><strong>Role:</strong> ${escapeHtml(member.role || "-")}</p>
        <div class="modal-actions"><button id="closeDetail">Tutup</button></div>`;

      const modal = showModal(html);
      modal.querySelector("#closeDetail").addEventListener("click", closeModal);
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal membuka detail anggota.");
    }
  };

  refreshBtn && refreshBtn.addEventListener("click", loadMembers);
  await loadMembers();
}

 /* ---------------- Iuran page ---------------- */
async function initIuranPage() {
  const iuranSelect = document.getElementById("iuran_user");
  const addIuranBtn = document.getElementById("addIuranBtn");
  const iuranMsg = document.getElementById("iuranMsg");
  const iuranTableBody = document.querySelector("#iuranTable tbody");

  // --- Ambil user login dan role ---
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (window.location.href = "../login.html");
  const userId = session.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama")
    .eq("id", userId)
    .single();
  const role = profile?.role || "anggota";

  // --- Sembunyikan elemen admin-only ---
  if (role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => (el.style.display = "none"));
  }

  // --- Muat daftar anggota ke select (khusus admin) ---
  if (role === "admin") {
    const { data: members } = await supabase.from("profiles").select("id, nama").eq("role", "anggota");
    iuranSelect.innerHTML =
      `<option value="">Pilih anggota</option>` +
      (members || []).map(m => `<option value="${m.id}">${m.nama}</option>`).join("");
  }

  // --- Fungsi Load Iuran ---
  async function loadIuran() {
    iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Memuat...</td></tr>`;

    // Ambil semua iuran
    let { data: iurans, error } = await supabase
      .from("iuran")
      .select("*")
      .order("inserted_at", { ascending: false });

    if (error) {
      console.error(error);
      iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat</td></tr>`;
      return;
    }

    // Filter jika bukan admin
    if (role !== "admin") {
      iurans = iurans.filter(u => u.user_id === userId);
    }

    // Ambil nama dari profiles
    const userIds = [...new Set(iurans.map(u => u.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from("profiles")
      .select("id, nama")
      .in("id", userIds);

    const userMap = {};
    (users || []).forEach(u => (userMap[u.id] = u.nama));

    if (!iurans || iurans.length === 0) {
      iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Belum ada data</td></tr>`;
      return;
    }

    iuranTableBody.innerHTML = iurans
      .map(
        (u, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(userMap[u.user_id] || "-")}</td>
          <td>${escapeHtml(u.keterangan || "-")}</td>
          <td>Rp ${formatNumber(u.jumlah)}</td>
          <td>${u.tanggal ? new Date(u.tanggal).toLocaleDateString("id-ID") : "-"}</td>
          <td>${u.status || "-"}</td>
          <td>${u.bukti_url ? `<a href="${u.bukti_url}" target="_blank">📎 Lihat</a>` : "-"}</td>
          <td>
            ${role === "admin"
              ? `<button onclick="markIuranPaid('${u.id}')">Lunas</button>
                 <button onclick="deleteIuran('${u.id}')">Hapus</button>`
              : ""}
          </td>
        </tr>`
      )
      .join("");
  }

  // --- Tambah Iuran (Admin Only) ---
  if (role === "admin" && addIuranBtn) {
    addIuranBtn.addEventListener("click", async () => {
      const keterangan = document.getElementById("iuran_keterangan").value.trim();
      const jumlah = Number(document.getElementById("iuran_jumlah").value);
      const member = document.getElementById("iuran_user").value;

      if (!keterangan || !jumlah || !member) {
        iuranMsg.textContent = "Semua field wajib diisi.";
        return;
      }

      const { error } = await supabase.from("iuran").insert([
        {
          user_id: member,
          jumlah,
          tanggal: new Date().toISOString().split("T")[0],
          status: "belum",
          keterangan,
        },
      ]);

      if (error) {
        iuranMsg.textContent = `Gagal: ${error.message}`;
      } else {
        iuranMsg.textContent = "Berhasil ditambahkan.";
        await loadIuran();
      }
    });
  }

  // --- Aksi Admin ---
  window.markIuranPaid = async id => {
    if (role !== "admin") return;
    await supabase.from("iuran").update({ status: "lunas" }).eq("id", id);
    await loadIuran();
  };

  window.deleteIuran = async id => {
    if (role !== "admin") return;
    if (!confirm("Yakin ingin menghapus iuran ini?")) return;
    await supabase.from("iuran").delete().eq("id", id);
    await loadIuran();
  };

  await loadIuran();
}

/* ---------------- Keuangan page (versi sesuai tabel kamu) ---------------- */
async function initKeuanganPage() {
  const addBtn = document.getElementById("addTransactionBtn");
  const transMsg = document.getElementById("transMsg");
  const transTableBody = document.querySelector("#transTable tbody");

  // === Ambil user login & role ===
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (window.location.href = "../login.html");
  const userId = session.user.id;
  const { data: profile } = await supabase.from("profiles").select("role, nama").eq("id", userId).single();
  const role = profile?.role || "anggota";

  // === Sembunyikan fitur admin jika role bukan admin ===
  if (role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
  }

  // === Load Data Keuangan ===
  async function loadKeuangan() {
    transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Memuat...</td></tr>`;
    try {
      let query = supabase
        .from("keuangan")
        .select("*, profiles:nama(dibuat_oleh)")
        .order("inserted_at", { ascending: false });

      const { data: trans, error } = await query;
      if (error) throw error;

      if (!trans || trans.length === 0) {
        transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Belum ada transaksi</td></tr>`;
        return;
      }

      transTableBody.innerHTML = trans
        .map(
          (t, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(t.jenis || "-")}</td>
            <td>Rp ${formatNumber(t.jumlah || 0)}</td>
            <td>${escapeHtml(t.keterangan || "-")}</td>
            <td>${t.tanggal ? new Date(t.tanggal).toLocaleDateString("id-ID") : "-"}</td>
            <td class="admin-only">
              ${role === "admin"
                ? `<button onclick="window.openTransModal('${t.id}')">Edit</button>
                   <button onclick="deleteTrans('${t.id}')">Hapus</button>`
                : "-"}
            </td>
          </tr>`
        )
        .join("");
    } catch (e) {
      console.error(e);
      transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Gagal memuat data</td></tr>`;
    }
  }

  // === Tambah Data Keuangan (Admin Only) ===
  if (role === "admin" && addBtn) {
    addBtn.addEventListener("click", async () => {
      const jenis = document.getElementById("trans_jenis").value;
      const jumlah = Number(document.getElementById("trans_jumlah").value);
      const keterangan = document.getElementById("trans_keterangan").value.trim();

      if (!jenis || !jumlah || jumlah <= 0) {
        transMsg.textContent = "Semua field wajib diisi dengan benar.";
        return;
      }

      transMsg.textContent = "Menyimpan...";
      try {
        const { error } = await supabase.from("keuangan").insert([
          {
            jenis,
            jumlah,
            keterangan,
            tanggal: new Date().toISOString().split("T")[0],
            dibuat_oleh: userId,
          },
        ]);
        if (error) throw error;
        transMsg.textContent = "Transaksi berhasil ditambahkan.";
        await loadKeuangan();
      } catch (e) {
        transMsg.textContent = `Gagal: ${e.message}`;
        console.error(e);
      }
    });
  }

  // === Aksi Edit ===
  window.openTransModal = async (id) => {
    if (role !== "admin") return;
    try {
      const { data: tr } = await supabase.from("keuangan").select("*").eq("id", id).single();
      if (!tr) return showToast("error", "Data tidak ditemukan");

      const html = `
        <h3>Edit Transaksi</h3>
        <div class="modal-form">
          <label>Jenis
            <select id="modal_jenis">
              <option value="pemasukan" ${tr.jenis === "pemasukan" ? "selected" : ""}>Pemasukan</option>
              <option value="pengeluaran" ${tr.jenis === "pengeluaran" ? "selected" : ""}>Pengeluaran</option>
            </select>
          </label>
          <label>Jumlah <input id="modal_jumlah" type="number" value="${tr.jumlah || 0}" /></label>
          <label>Keterangan <input id="modal_keterangan" value="${escapeHtml(tr.keterangan || "")}" /></label>
          <div class="modal-actions">
            <button id="modalSave">Simpan</button>
            <button id="modalCancel">Batal</button>
          </div>
        </div>`;

      const modal = showModal(html);
      modal.querySelector("#modalCancel").addEventListener("click", closeModal);
      modal.querySelector("#modalSave").addEventListener("click", async () => {
        const jenis = document.getElementById("modal_jenis").value;
        const jumlah = Number(document.getElementById("modal_jumlah").value);
        const keterangan = document.getElementById("modal_keterangan").value.trim();

        if (!jenis || !jumlah || jumlah <= 0) return alert("Data tidak valid!");

        const { error } = await supabase.from("keuangan").update({ jenis, jumlah, keterangan }).eq("id", id);
        if (error) return showToast("error", error.message);
        showToast("success", "Data diperbarui");
        closeModal();
        await loadKeuangan();
      });
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal membuka modal");
    }
  };

  // === Aksi Hapus ===
  window.deleteTrans = async (id) => {
    if (role !== "admin") return;
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      await supabase.from("keuangan").delete().eq("id", id);
      showToast("success", "Transaksi dihapus");
      await loadKeuangan();
    } catch (e) {
      showToast("error", "Gagal menghapus data");
      console.error(e);
    }
  };

  await loadKeuangan();
}

  /* ---------------- Modal/Edit helpers ---------------- */

  // open edit member modal
  async function openEditMember(id) {
    try {
      const { data: member, error } = await supabase.from("members").select("*").eq("id", id).single();
      if (error || !member) return showToast("error","Gagal ambil data anggota");
      // build form
      const html = `
        <h3>Edit Anggota</h3>
        <div class="modal-form">
          <label>Nama <input id="modal_nama" value="${escapeHtml(member.nama||'')}" /></label>
          <label>Umur <input id="modal_umur" type="number" value="${member.umur||''}" /></label>
          <label>Blok <input id="modal_blok" value="${escapeHtml(member.blok||'')}" /></label>
          <label>RT <input id="modal_rt" value="${escapeHtml(member.rt||'')}" /></label>
          <label>RW <input id="modal_rw" value="${escapeHtml(member.rw||'')}" /></label>
          <label>Status <select id="modal_status"><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option></select></label>
          <div class="modal-actions"><button id="modalSave">Simpan</button><button id="modalCancel">Batal</button></div>
        </div>`;
      const modal = showModal(html);
      modal.querySelector("#modal_status").value = member.status_anggota || "pending";
      modal.querySelector("#modalCancel").addEventListener("click", ()=>closeModal());
      modal.querySelector("#modalSave").addEventListener("click", async ()=>{
        const nama = document.getElementById("modal_nama").value.trim();
        const umur = Number(document.getElementById("modal_umur").value);
        const blok = document.getElementById("modal_blok").value.trim();
        const rt = document.getElementById("modal_rt").value.trim();
        const rw = document.getElementById("modal_rw").value.trim();
        const status = document.getElementById("modal_status").value;
        if (!nama) return alert("Nama wajib diisi");
        if (isNaN(umur) || umur<=0) return alert("Umur harus > 0");
        try {
          const { error } = await supabase.from("members").update({ nama, umur, blok, rt, rw, status_anggota: status }).eq("id", id);
          if (error) { showToast("error", error.message); } else { showToast("success","Perubahan tersimpan"); closeModal(); reloadCurrentPage(); }
        } catch (e) { showToast("error","Gagal menyimpan"); console.error(e); }
      });
    } catch (e) { console.error(e); showToast("error","Gagal buka modal"); }
  }

 // open iuran modal
async function openEditIuran(id) {
  try {
    const { data: iuran, error } = await supabase.from("iuran").select("*").eq("id", id).single();
    if (error || !iuran) return showToast("error", "Gagal ambil data iuran");

    const { data: users } = await supabase.from("profiles").select("id,nama").eq("role", "anggota");
    const options = (users || [])
      .map(u => `<option value="${u.id}" ${u.id === iuran.user_id ? "selected" : ""}>${escapeHtml(u.nama)}</option>`)
      .join("");

    const html = `
      <h3>Edit Iuran</h3>
      <div class="modal-form">
        <label>Anggota <select id="modal_iuran_user"><option value="">Pilih</option>${options}</select></label>
        <label>Keterangan <input id="modal_iuran_ket" value="${escapeHtml(iuran.keterangan || "")}" /></label>
        <label>Jumlah <input id="modal_iuran_jumlah" type="number" value="${iuran.jumlah || 0}" /></label>
        <label>Status <select id="modal_iuran_status">
          <option value="belum" ${iuran.status === "belum" ? "selected" : ""}>Belum</option>
          <option value="lunas" ${iuran.status === "lunas" ? "selected" : ""}>Lunas</option>
        </select></label>
        <div class="modal-actions">
          <button id="modalSaveIuran">Simpan</button>
          <button id="modalCancelIuran">Batal</button>
        </div>
      </div>`;

    const modal = showModal(html);
    modal.querySelector("#modalCancelIuran").addEventListener("click", closeModal);
    modal.querySelector("#modalSaveIuran").addEventListener("click", async () => {
      const user_id = document.getElementById("modal_iuran_user").value;
      const jumlah = Number(document.getElementById("modal_iuran_jumlah").value);
      const keterangan = document.getElementById("modal_iuran_ket").value.trim();
      const status = document.getElementById("modal_iuran_status").value;

      if (!user_id || !jumlah || !keterangan)
        return alert("Semua field wajib diisi");

      const { error } = await supabase
        .from("iuran")
        .update({ user_id, jumlah, keterangan, status })
        .eq("id", id);

      if (error) showToast("error", error.message);
      else {
        showToast("success", "Iuran diperbarui");
        closeModal();
        reloadCurrentPage();
      }
    });
  } catch (e) {
    console.error(e);
    showToast("error", "Gagal membuka modal iuran");
  }
}

  // open transaction modal
  async function openEditTrans(id) {
    try {
      const { data: tr } = await supabase.from("transactions").select("*").eq("id", id).single();
      if (!tr) return showToast("error","Data tidak ditemukan");
      const html = `
        <h3>Edit Transaksi</h3>
        <div class="modal-form">
          <label>Tipe <select id="modal_tr_type"><option value="pemasukan">pemasukan</option><option value="pengeluaran">pengeluaran</option></select></label>
          <label>Jumlah <input id="modal_tr_amount" type="number" value="${tr.amount||0}" /></label>
          <label>Keterangan <input id="modal_tr_ket" value="${escapeHtml(tr.keterangan||'')}" /></label>
          <div class="modal-actions"><button id="modalSaveTr">Simpan</button><button id="modalCancelTr">Batal</button></div>
        </div>`;
      const modal = showModal(html);
      modal.querySelector("#modal_tr_type").value = tr.type;
      modal.querySelector("#modalCancelTr").addEventListener("click", ()=>closeModal());
      modal.querySelector("#modalSaveTr").addEventListener("click", async ()=>{
        const type = document.getElementById("modal_tr_type").value;
        const amount = Number(document.getElementById("modal_tr_amount").value);
        const ket = document.getElementById("modal_tr_ket").value.trim();
        if (!amount || isNaN(amount) || amount<=0) return alert("Jumlah harus angka > 0");
        try {
          const { error } = await supabase.from("transactions").update({ type, amount, keterangan: ket }).eq("id", id);
          if (error) showToast("error", error.message); else { showToast("success","Transaksi diperbarui"); closeModal(); reloadCurrentPage(); }
        } catch (e) { showToast("error","Gagal simpan"); }
      });
    } catch (e) { console.error(e); showToast("error","Gagal buka modal"); }
  }

  // helper to reload current admin page data
  function reloadCurrentPage() {
    const path = location.pathname;
    if (path.endsWith("/admin.html")) initDashboard();
    else if (path.endsWith("/anggota.html")) initMembersPage();
    else if (path.endsWith("/iuran.html")) initIuranPage();
    else if (path.endsWith("/keuangan.html")) initKeuanganPage();
    else if (path.endsWith("/profil.html")) initProfilPage();
  }

  /* ---------------- UI helpers: modal + toast ---------------- */
  function createUIHelpers() {
    // toast container
    if (!document.getElementById("toastContainer")) {
      const t = document.createElement("div");
      t.id = "toastContainer";
      t.style.position = "fixed";
      t.style.right = "18px";
      t.style.bottom = "18px";
      t.style.zIndex = 9999;
      document.body.appendChild(t);
    }
    // modal container
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

  function showToast(type, message, timeout = 4500) {
    const c = document.getElementById("toastContainer");
    if (!c) return console.warn("toast container missing");
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.style.marginTop = "8px";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "10px";
    el.style.minWidth = "180px";
    el.style.boxShadow = "0 8px 18px rgba(0,0,0,.25)";
    el.style.color = type==="error"?"#fff":"#111";
    el.style.background = type==="error"?"#b00020":"#f5c542";
    el.textContent = message;
    c.appendChild(el);
    setTimeout(()=>{ el.style.transition="opacity .35s"; el.style.opacity=0; setTimeout(()=>el.remove(),350); }, timeout);
  }

  function showModal(innerHtml) {
    const root = document.getElementById("modalRoot");
    root.innerHTML = "";
    root.style.display = "flex";
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.addEventListener("click", closeModal);
    const dialog = document.createElement("div");
    dialog.style.minWidth = "320px";
    dialog.style.maxWidth = "760px";
    dialog.style.background = "#fff";
    dialog.style.color = "#111";
    dialog.style.borderRadius = "12px";
    dialog.style.padding = "18px";
    dialog.style.zIndex = 10;
    dialog.innerHTML = innerHtml;
    root.appendChild(overlay);
    root.appendChild(dialog);
    // style modal small helpers
    dialog.querySelectorAll("label").forEach(l=>{ l.style.display="block"; l.style.marginBottom="8px"; l.querySelector("input,select,textarea")?.style && (l.querySelector("input,select,textarea").style.width="100%")});
    dialog.querySelectorAll(".modal-actions").forEach(d=>{ d.style.display="flex"; d.style.justifyContent="flex-end"; d.style.gap="8px"; d.style.marginTop="10px" });
    return dialog;
  }
  window.closeModal = closeModal;
  function closeModal() { const root=document.getElementById("modalRoot"); if(root){ root.style.display="none"; root.innerHTML=""; } }

  /* ---------------- small helpers ---------------- */
  function formatNumber(n){ if(!n&&n!==0) return "0"; return Number(n).toLocaleString("id-ID"); }
  function escapeHtml(str){ if(!str&&str!==0) return ""; return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }

  /* ---------------- expose edit modal openers ---------------- */
  window.openEditMember = openEditMember;
  window.openEditIuran = openEditIuran;
  window.openEditTrans = openEditTrans;
});

// === EKSPOR CSV ===
async function exportTableToCSV(filename, tableName) {
  try {
    // ambil data dari Supabase
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw error;
    if (!data || data.length === 0) {
      showToast('Tidak ada data untuk diekspor.', 'error');
      return;
    }

    // ambil kolom dari kunci object
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => JSON.stringify(obj[h] ?? '')).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');

    // buat blob dan download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Berhasil ekspor ${data.length} data.`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Gagal mengekspor data.', 'error');
  }
}

// Contoh event listener umum
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('exportCSV');
  if (btn) {
    btn.addEventListener('click', () => {
      // Ganti "keuangan" sesuai nama tabel Supabase kamu
      exportTableToCSV('keuangan.csv', 'keuangan');
    });
  }
});

// === EKSPOR PDF ===
async function exportTableToPDF(title, tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw error;
    if (!data || data.length === 0) {
      showToast('Tidak ada data untuk dicetak.', 'error');
      return;
    }

    // import library (pastikan sudah ada di <script> HTML)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const marginX = 40;
    let y = 60;

    // === HEADER LAPORAN ===
    const logo = new Image();
    logo.src = 'assets/img/logo-putra-delima.png'; // sesuaikan path logo
    await new Promise(res => (logo.onload = res));

    doc.addImage(logo, 'PNG', marginX, 30, 40, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PUTRA DELIMA', marginX + 55, 50);
    doc.setFontSize(11);
    doc.text('Laporan ' + title, marginX + 55, 68);
    doc.setDrawColor(245, 197, 66);
    doc.line(marginX, 80, 550, 80);

    // === ISI TABEL ===
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => obj[h] ?? ''));

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 90,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [245, 197, 66], textColor: 17 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // === FOOTER ===
    const printed = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${printed}`, marginX, doc.internal.pageSize.height - 30);

    // download file
    doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    showToast(`Berhasil cetak ${data.length} data ke PDF.`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Gagal mencetak PDF.', 'error');
  }
}

// Event listener
document.addEventListener('DOMContentLoaded', () => {
  const pdfBtn = document.getElementById('exportPDF');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      exportTableToPDF('Laporan Keuangan', 'keuangan'); // ganti param sesuai halaman
    });
  }
});










