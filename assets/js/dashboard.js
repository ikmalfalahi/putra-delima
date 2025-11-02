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
  const totalSaldoEl = document.getElementById("totalSaldo");
  const membersPreviewTbody = document.querySelector("#membersPreview tbody"); // deklarasi hanya sekali

  // === Total Anggota ===
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    totalMembersEl.textContent = count ?? "0";
  } catch (e) {
    console.error("Gagal hitung anggota:", e);
    totalMembersEl.textContent = "0";
  }

  // === Total Iuran ===
  let totalIuranValue = 0;
  try {
    const { data: iurans, error } = await supabase
      .from("iuran")
      .select("jumlah");
    if (error) throw error;
    totalIuranValue = (iurans || []).reduce((sum, i) => sum + Number(i.jumlah || 0), 0);
    totalIuranEl.textContent = `Rp ${formatNumber(totalIuranValue)}`;
  } catch (e) {
    console.error("Gagal hitung iuran:", e);
    totalIuranEl.textContent = "-";
  }

  // === Total Pemasukan ===
  let totalPemasukanValue = 0;
  try {
    const { data: pemasukan, error } = await supabase
      .from("keuangan")
      .select("jumlah")
      .eq("jenis", "pemasukan");
    if (error) throw error;
    totalPemasukanValue = (pemasukan || []).reduce((sum, p) => sum + Number(p.jumlah || 0), 0);
    totalPemasukanEl.textContent = `Rp ${formatNumber(totalPemasukanValue)}`;
  } catch (e) {
    console.error("Gagal hitung pemasukan:", e);
    totalPemasukanEl.textContent = "Rp 0";
  }

  // === Total Pengeluaran ===
  let totalPengeluaranValue = 0;
  try {
    const { data: pengeluaran, error } = await supabase
      .from("keuangan")
      .select("jumlah")
      .eq("jenis", "pengeluaran");
    if (error) throw error;
    totalPengeluaranValue = (pengeluaran || []).reduce((sum, p) => sum + Number(p.jumlah || 0), 0);
    totalPengeluaranEl.textContent = `Rp ${formatNumber(totalPengeluaranValue)}`;
  } catch (e) {
    console.error("Gagal hitung pengeluaran:", e);
    totalPengeluaranEl.textContent = "Rp 0";
  }

  // === Total Saldo ===
  try {
    const totalSaldo = totalIuranValue + totalPemasukanValue - totalPengeluaranValue;
    if (totalSaldoEl) totalSaldoEl.textContent = `Rp ${formatNumber(totalSaldo)}`;
  } catch (e) {
    console.error("Gagal hitung saldo:", e);
    if (totalSaldoEl) totalSaldoEl.textContent = "Rp 0";
  }

  // === Preview Semua Anggota (termasuk admin) ===
  if (membersPreviewTbody) {
    try {
      const { data: members, error } = await supabase
        .from("profiles")
        .select("id, nama, tanggal_lahir, blok, rt, rw, avatar_url, role")
        .order("inserted_at", { ascending: false });

      if (error) throw error;

      if (!members || members.length === 0) {
        membersPreviewTbody.innerHTML = `<tr><td colspan="7" class="empty">Belum ada data</td></tr>`;
        return;
      }

      membersPreviewTbody.innerHTML = members
        .map(
          (m, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(m.nama || "-")}</td>
              <td>${escapeHtml(m.role || "-")}</td>
            </tr>`
        )
        .join("");
    } catch (e) {
      console.error("Gagal load anggota:", e);
    }
  }
}


/* ---------------- Members page (pakai tabel profiles) ---------------- */
async function initMembersPage() {
  const membersTableBody = document.querySelector("#membersTable tbody");
  const refreshBtn = document.getElementById("refreshMembers");

  // === Ambil session user (untuk cek role admin) ===
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (window.location.href = "../login.html");

  const userId = session.user.id;
  const { data: currentUser } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isAdmin = currentUser?.role === "admin";

  // === Load daftar anggota ===
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
        return;
      }

      membersTableBody.innerHTML = members
        .map(
          (m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="avatar-cell" style="text-align:center;">
          <img 
            src="${m.avatar_url || 'https://ikmalfalahi.github.io/putra-delima/assets/img/default-avatar.png'}"
            alt="${escapeHtml(m.nama || '-')}" 
            style="width:36px;height:36px;object-fit:cover;border-radius:50%;cursor:pointer;transition:transform .2s ease;"
            onclick="showAvatarModal('${m.avatar_url || ''}', '${escapeHtml(m.nama || '-')}')"
          />
        </td>
        <td>${escapeHtml(m.nama || "-")}</td>
        <td>${m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
        <td>${escapeHtml(m.blok || "-")}</td>
        <td>${escapeHtml(m.rt || "-")} / ${escapeHtml(m.rw || "-")}</td>
        <td>${escapeHtml(m.status || "-")}</td>
        <td>
          ${
            isAdmin
              ? `
                <button onclick="approveMember('${m.id}')" style="background:#4CAF50;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;margin-right:4px;">✔</button>
                <button onclick="rejectMember('${m.id}')" style="background:#F44336;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;margin-right:4px;">✖</button>
                <button onclick="deleteMember('${m.id}')" style="background:#9E9E9E;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;margin-right:4px;">🗑</button>
              `
              : "-"
          }
          <button onclick="openMemberDetail('${m.id}')" style="background:#2196F3;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">🔍</button>
        </td>
      </tr>`
        )
        .join("");
    } catch (e) {
      console.error(e);
      membersTableBody.innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat data</td></tr>`;
    }
  }

  // === Aksi: Setuju ===
  window.approveMember = async (id) => {
    if (!isAdmin) return showToast("error", "Hanya admin yang bisa menyetujui anggota.");
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
    if (!isAdmin) return showToast("error", "Hanya admin yang bisa menolak anggota.");
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
    if (!isAdmin) return showToast("error", "Hanya admin yang bisa menghapus anggota.");
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
        <p><strong>Blok:</strong> ${escapeHtml(member.blok || "-")}</p>
        <p><strong>RT/RW:</strong> ${escapeHtml(member.rt || "-")} / ${escapeHtml(member.rw || "-")}</p>
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
  const searchInput = document.getElementById("searchIuran");

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

  // --- Sembunyikan elemen admin-only jika bukan admin ---
  if (role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => (el.style.display = "none"));
  }

  // --- Muat daftar anggota (termasuk admin) ke dropdown tambah iuran ---
  const { data: members } = await supabase.from("profiles").select("id, nama, role");
  if (members && members.length) {
    iuranSelect.innerHTML =
      `<option value="">Pilih Anggota</option>` +
      members.map(m => `<option value="${m.id}">${m.nama} (${m.role})</option>`).join("");
  }

  // --- Simpan data global untuk pencarian ---
  let allIurans = [];

  // --- Fungsi Load Iuran ---
  async function loadIuran() {
    iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Memuat...</td></tr>`;

    let { data: iurans, error } = await supabase
      .from("iuran")
      .select("*")
      .order("inserted_at", { ascending: false });

    if (error) {
      console.error(error);
      iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Gagal memuat</td></tr>`;
      return;
    }

    // Ambil nama user dari profiles
    const userIds = [...new Set(iurans.map(u => u.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from("profiles")
      .select("id, nama, role")
      .in("id", userIds);

    const userMap = {};
    (users || []).forEach(u => (userMap[u.id] = `${u.nama} (${u.role})`));

    allIurans = iurans.map((u, i) => ({
      ...u,
      nama_user: userMap[u.user_id] || "-",
      index: i + 1,
    }));

    renderIuran(allIurans);
  }

  // --- Fungsi Render Iuran ke Tabel ---
  function renderIuran(data) {
    if (!data || data.length === 0) {
      iuranTableBody.innerHTML = `<tr><td colspan="8" class="empty">Tidak ada hasil.</td></tr>`;
      return;
    }

    iuranTableBody.innerHTML = data
      .map(
        (u) => `
        <tr>
          <td>${u.index}</td>
          <td>${escapeHtml(u.nama_user)}</td>
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

  // --- Event: Kolom pencarian real-time ---
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = allIurans.filter(u =>
        (u.nama_user?.toLowerCase().includes(query)) ||
        (u.keterangan?.toLowerCase().includes(query)) ||
        (u.status?.toLowerCase().includes(query))
      );
      renderIuran(filtered);
    });
  }

  // --- Tambah Iuran (Admin bisa menambah atas nama siapa pun, termasuk dirinya sendiri) ---
  if (role === "admin" && addIuranBtn) {
    addIuranBtn.addEventListener("click", async () => {
      const keterangan = document.getElementById("iuran_keterangan").value.trim();
      const jumlah = Number(document.getElementById("iuran_jumlah").value);
      const member = document.getElementById("iuran_user").value;

      if (!keterangan || !jumlah) {
        iuranMsg.textContent = "Keterangan dan jumlah wajib diisi.";
        return;
      }

      const targetUser = member || userId; // admin bisa memilih dirinya sendiri
      const { error } = await supabase.from("iuran").insert([
        {
          user_id: targetUser,
          jumlah,
          tanggal: new Date().toISOString().split("T")[0],
          status: "belum",
          keterangan,
        },
      ]);

      if (error) {
        iuranMsg.textContent = `Gagal: ${error.message}`;
      } else {
        iuranMsg.textContent = "✅ Iuran berhasil ditambahkan.";
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

/* ---------------- Keuangan page (versi fix) ---------------- */
async function initKeuanganPage() {
  const addBtn = document.getElementById("addTransactionBtn");
  const transMsg = document.getElementById("transMsg");
  const transTableBody = document.querySelector("#transTable tbody");

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

  // --- Sembunyikan elemen admin-only jika bukan admin ---
  if (role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => (el.style.display = "none"));
  }

  // --- Fungsi load data keuangan ---
  async function loadTrans() {
    transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Memuat...</td></tr>`;

    const { data: trans, error } = await supabase
      .from("keuangan")
      .select("*")
      .order("inserted_at", { ascending: false });

    if (error) {
      console.error(error);
      transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Gagal memuat data</td></tr>`;
      return;
    }

    if (!trans || trans.length === 0) {
      transTableBody.innerHTML = `<tr><td colspan="6" class="empty">Belum ada transaksi</td></tr>`;
      return;
    }

    transTableBody.innerHTML = trans.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(t.jenis || "-")}</td>
        <td>Rp ${formatNumber(t.jumlah || 0)}</td>
        <td>${escapeHtml(t.keterangan || "-")}</td>
        <td>${t.inserted_at ? new Date(t.inserted_at).toLocaleString("id-ID") : "-"}</td>
        <td class="admin-only">
          ${role === "admin"
            ? `<button onclick="editTrans('${t.id}')">Edit</button>
               <button onclick="deleteTrans('${t.id}')">Hapus</button>`
            : ""}
        </td>
      </tr>
    `).join("");
  }

  // --- Tambah transaksi (admin only) ---
  if (role === "admin" && addBtn) {
    addBtn.addEventListener("click", async () => {
      const jenis = document.getElementById("trans_jenis").value;
      const jumlah = Number(document.getElementById("trans_jumlah").value);
      const keterangan = document.getElementById("trans_keterangan").value.trim();

      transMsg.textContent = ""; // reset pesan

      // validasi dasar
      if (jenis !== "pemasukan" && jenis !== "pengeluaran") {
        transMsg.textContent = "Jenis harus 'pemasukan' atau 'pengeluaran'.";
        return;
      }
      if (!jumlah || jumlah <= 0 || isNaN(jumlah)) {
        transMsg.textContent = "Jumlah harus angka lebih dari 0.";
        return;
      }

      const { error } = await supabase.from("keuangan").insert([
        {
          jenis,
          jumlah,
          keterangan,
          dibuat_oleh: userId,
          inserted_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error(error);
        showToast("error", `Gagal menambah transaksi: ${error.message}`);
        transMsg.textContent = `Gagal: ${error.message}`;
      } else {
        showToast("success", "Transaksi berhasil ditambahkan!");
        transMsg.textContent = "Transaksi berhasil ditambahkan.";
        document.getElementById("trans_jenis").value = "";
        document.getElementById("trans_jumlah").value = "";
        document.getElementById("trans_keterangan").value = "";
        await loadTrans();
      }
    });
  }

  // --- Edit transaksi (admin only) ---
  window.editTrans = async (id) => {
    if (role !== "admin") return showToast("error", "Hanya admin yang bisa mengedit transaksi.");

    const { data: t } = await supabase.from("keuangan").select("*").eq("id", id).single();
    if (!t) return alert("Data tidak ditemukan");

    const jenis = prompt("Ubah jenis (pemasukan/pengeluaran):", t.jenis);
    const jumlah = prompt("Ubah jumlah:", t.jumlah);
    const ket = prompt("Ubah keterangan:", t.keterangan || "");

    if (!jenis || (jenis !== "pemasukan" && jenis !== "pengeluaran")) {
      showToast("error", "Jenis tidak valid.");
      return;
    }
    if (!jumlah || jumlah <= 0 || isNaN(jumlah)) {
      showToast("error", "Jumlah harus angka > 0.");
      return;
    }

    const { error } = await supabase
      .from("keuangan")
      .update({ jenis, jumlah: Number(jumlah), keterangan: ket })
      .eq("id", id);

    if (error) showToast("error", error.message);
    else {
      showToast("success", "Transaksi berhasil diperbarui.");
      await loadTrans();
    }
  };

  // --- Hapus transaksi (admin only) ---
  window.deleteTrans = async (id) => {
    if (role !== "admin") return showToast("error", "Hanya admin yang bisa menghapus transaksi.");
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;

    const { error } = await supabase.from("keuangan").delete().eq("id", id);
    if (error) showToast("error", error.message);
    else {
      showToast("success", "Transaksi berhasil dihapus.");
      await loadTrans();
    }
  };

  await loadTrans();
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

// === Modal untuk lihat avatar besar + zoom ===
window.showAvatarModal = function (url, nama) {
  if (!url) return showToast("error", "Tidak ada foto avatar.");

  const html = `
    <h3>Foto ${escapeHtml(nama)}</h3>
    <div style="text-align:center;">
      <img 
        id="zoomAvatar" 
        src="${url}" 
        alt="${escapeHtml(nama)}"
        style="max-width: 300px; max-height: 300px; border-radius: 10px; cursor: zoom-in; transition: transform 0.2s ease;"
      />
    </div>
    <div style="text-align:center; margin-top:15px;">
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

// === TOGGLE MODE ===
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const currentTheme = localStorage.getItem("theme") || "dark";

  // Set tema awal
  if (currentTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light");
    themeToggle.textContent = "🌙";
  }

  // Saat tombol diklik
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");

    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
  });
});


