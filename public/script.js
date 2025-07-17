// --- Variable global --- 
let dataBarang = [];
let filteredDataBarang = [];
let dataPenjualan = [];
let editIndex = -1; // Menyimpan index barang yang sedang diedit (-1 = tidak edit)
let itemsPenjualan = [];

// Fungsi format angka ke Rupiah
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Render daftar barang dengan tombol Edit dan Hapus
function renderListBarang(dataToRender) {
    const tbody = document.querySelector('#tableBarang tbody');
    tbody.innerHTML = '';

    if (!dataToRender || dataToRender.length === 0) {
        document.getElementById('msg-list').textContent = 'Belum ada data barang.';
        return;
    } else {
        document.getElementById('msg-list').textContent = '';
    }

    dataToRender.forEach((item, index) => {
        const tr = document.createElement('tr');
        let stokTotal = 0;
        if (item.variations && item.variations.length > 0) {
            stokTotal = item.variations.reduce((total, v) => total + v.stok, 0);
        } else {
            stokTotal = item.stok || 0;
        }

        tr.setAttribute('data-id', item.id);

        tr.innerHTML = `
            <td>${index + 1}</td> <!-- nomor urut -->
            <td>${item.kodeBarang}</td>
            <td>${item.namaBarang}</td>
            <td>${formatRupiah(item.hargaBeli)}</td>
            <td>${formatRupiah(item.hargaJual)}</td>
            <td>${stokTotal}</td>
            <td>
                <button class="btn-edit" data-id="${item.id}">Edit</button>
                <button class="btn-delete" data-id="${item.id}">Hapus</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Pasang event tombol Edit
    const btnEdits = document.querySelectorAll('.btn-edit');
    btnEdits.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            bukaPopupEditById(id);
        });
    });

    // Pasang event tombol Hapus
    const btnDeletes = document.querySelectorAll('.btn-delete');
    btnDeletes.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            konfirmasiHapusBarang(id);
        });
    });
}
function renderListPenjualan(data) {
    const tbody = document.querySelector('#tablePenjualan tbody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        document.getElementById('msg-list-penjualan').textContent = 'Belum ada data penjualan.';
        return;
    } else {
        document.getElementById('msg-list-penjualan').textContent = '';
    }

    data.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.tanggal || ''}</td>
            <td>${formatRupiah(item.total || 0)}</td>
        `;
        tbody.appendChild(tr);
    });
}
// --- Referensi elemen DOM ---
const popupModal = document.getElementById('popupModal');
const btnOpenPopup = document.getElementById('btnOpenPopup');
const btnClosePopup = document.getElementById('closePopup');
const formBarang = document.getElementById('formBarang');

const checkboxVariasi = document.getElementById('checkboxVariasi');
const stokUtamaContainer = document.getElementById('stokUtamaContainer');
const tabBtn1 = document.getElementById('tabBtn1');
const tabBtn2 = document.getElementById('tabBtn2');
const tab1Content = document.getElementById('tab-1');
const tab2Content = document.getElementById('tab-2');

const tableVariasiBody = document.querySelector('#tableVariasi tbody');
const btnAddVariasi = document.getElementById('btnAddVariasi');

const modalConfirmDelete = document.getElementById('modalConfirmDelete');
const btnConfirmYes = document.getElementById('btnConfirmYes');
const btnConfirmNo = document.getElementById('btnConfirmNo');

// Elemen untuk penjualan
const btnAddPenjualan = document.getElementById('btnAddPenjualan');
const modalPenjualan = document.getElementById('modalPenjualan');
const closePenjualan = document.getElementById('closePenjualan');
const formPenjualan = document.getElementById('formPenjualan');
const inputNoResi = document.getElementById('noResi');
const inputCariBarang = document.getElementById('cariBarang');
const tableListJualBody = document.querySelector('#tableListJual tbody');
const totalPcsEl = document.getElementById('totalPcs');
const subTotalEl = document.getElementById('subTotal');
const grandTotalEl = document.getElementById('grandTotal');
const diskonPersenGlobalInput = document.getElementById('diskonPersenGlobal');
const diskonRpGlobalInput = document.getElementById('diskonRpGlobal');

const searchInput = document.getElementById('searchInput'); // Pastikan searchInput ada di HTML
const menuDataBarang = document.getElementById('menu-data-barang');
const menuDataPenjualan = document.getElementById('menu-data-penjualan');

const sectionDataBarang = document.getElementById('section-data-barang');
const sectionDataPenjualan = document.getElementById('section-data-penjualan');

function showSection(section) {
    sectionDataBarang.style.display = 'none';
    sectionDataPenjualan.style.display = 'none';
    section.style.display = 'block';
}

function setActiveMenu(menu) {
    menuDataBarang.classList.remove('active');
    menuDataPenjualan.classList.remove('active');
    menu.classList.add('active');
}

menuDataBarang.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveMenu(menuDataBarang);
    showSection(sectionDataBarang);
});

menuDataPenjualan.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveMenu(menuDataPenjualan);
    showSection(sectionDataPenjualan);
});

// Switch tab
function switchTab(tabId) {
    if(tabId === 'tab-1') {
        tab1Content.style.display = 'block';
        tab2Content.style.display = 'none';
        tabBtn1.classList.add('active');
        tabBtn2.classList.remove('active');
    } else if(tabId === 'tab-2') {
        tab1Content.style.display = 'none';
        tab2Content.style.display = 'block';
        tabBtn1.classList.remove('active');
        tabBtn2.classList.add('active');
    }
}

// Event klik tab
tabBtn1.addEventListener('click', () => switchTab('tab-1'));
tabBtn2.addEventListener('click', () => { if(!tabBtn2.disabled) switchTab('tab-2'); });

// Fungsi tambah baris variasi
function tambahBarisVariasi(warna='', ukuran='', stok=0){
    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td><input type="text" class="input-warna" value="${warna}" placeholder="Warna (opsional)"></td>
        <td><input type="text" class="input-ukuran" value="${ukuran}" placeholder="Ukuran (opsional)"></td>
        <td><input type="number" class="input-stokvar" value="${stok}" min="0" required></td>
        <td><button type="button" class="btn-hapus-vari">Hapus</button></td>
    `;

    tr.querySelector('.btn-hapus-vari').addEventListener('click', () => {
        tr.remove();
    });

    tableVariasiBody.appendChild(tr);
}

// Checkbox variasi toggle stok utama & tab
checkboxVariasi.addEventListener('change', () => {
    if(checkboxVariasi.checked) {
        stokUtamaContainer.style.display = 'none';
        tabBtn2.disabled = false;
        switchTab('tab-2');
        if(tableVariasiBody.children.length === 0){
            tambahBarisVariasi();
        }
        document.getElementById('stokBarang').required = false;
    } else {
        stokUtamaContainer.style.display = 'block';
        tabBtn2.disabled = true;
        switchTab('tab-1');
        tableVariasiBody.innerHTML = '';
        document.getElementById('stokBarang').required = true;
    }
});
btnAddVariasi.addEventListener('click', () => tambahBarisVariasi());

// Validasi variasi sebelum submit
function validasiVariasi(){
    const rows = tableVariasiBody.querySelectorAll('tr');
    if(rows.length === 0){
        alert('Minimal harus ada satu variasi.');
        return false;
    }
    for(let tr of rows){
        const stok = tr.querySelector('.input-stokvar').value;
        if(stok === '' || Number(stok) < 0){
            alert('Stok variasi harus diisi dan tidak boleh kurang dari 0.');
            return false;
        }
    }
    return true;
}

// Buka popup edit barang berdasarkan id
function bukaPopupEditById(id) {
    const barang = dataBarang.find(item => item.id == id);
    if(!barang) {
        alert('Data barang tidak ditemukan!');
        return;
    }

    editIndex = dataBarang.indexOf(barang);
    popupModal.style.display = 'block';

    formBarang.namaBarang.value = barang.namaBarang || '';
    formBarang.kodeBarang.value = barang.kodeBarang || '';
    formBarang.hargaBeliBarang.value = barang.hargaBeli ?? '';
    formBarang.hargaJualBarang.value = barang.hargaJual ?? '';

    const hasVariasi = Array.isArray(barang.variations) && barang.variations.length > 0;
    if(hasVariasi){
        checkboxVariasi.checked = true;
        stokUtamaContainer.style.display = 'none';
        tabBtn2.disabled = false;
        switchTab('tab-2');

        tableVariasiBody.innerHTML = '';
        barang.variations.forEach(v => tambahBarisVariasi(v.warna || '', v.ukuran || '', v.stok || 0));
        document.getElementById('stokBarang').required = false;
    } else {
        checkboxVariasi.checked = false;
        stokUtamaContainer.style.display = 'block';
        tabBtn2.disabled = true;
        switchTab('tab-1');
        formBarang.stokBarang.value = barang.stok ?? '';
        tableVariasiBody.innerHTML = '';
        document.getElementById('stokBarang').required = true;
    }
}

// Tombol buka popup input barang baru
btnOpenPopup.addEventListener('click', () => {
    editIndex = -1;
    popupModal.style.display = 'block';
    formBarang.reset();
    checkboxVariasi.checked = false;
    stokUtamaContainer.style.display = 'block';
    tabBtn2.disabled = true;
    switchTab('tab-1');
    tableVariasiBody.innerHTML = '';
    document.getElementById('stokBarang').required = true;
});

// Tombol tutup popup modal
btnClosePopup.addEventListener('click', () => popupModal.style.display = 'none');
window.addEventListener('click', (event) => { if(event.target === popupModal) popupModal.style.display = 'none'; });

// Modal konfirmasi hapus
function konfirmasiHapusBarang(id) {
    modalConfirmDelete.classList.add('show');

    btnConfirmYes.onclick = () => {
        modalConfirmDelete.classList.remove('show');
        hapusBarang(id);
        clearHandlers();
    };
    btnConfirmNo.onclick = () => {
        modalConfirmDelete.classList.remove('show');
        clearHandlers();
    };

    function clearHandlers() {
        btnConfirmYes.onclick = null;
        btnConfirmNo.onclick = null;
    }
}

// Fungsi hapus barang dengan fetch DELETE
function hapusBarang(id) {
    fetch(`/api/barang/${id}`, { method: 'DELETE' })
        .then(res => {
            if(!res.ok) {
                return res.json().then(err => { throw new Error(err.message || 'Gagal menghapus data'); });
            }
            return res.json();
        })
        .then(() => {
            alert('Data barang berhasil dihapus.');
            fetchDataBarang();
        })
        .catch(err => {
            alert('Kesalahan saat menghapus: ' + err.message);
            console.error(err);
        });
}

// Fetch data barang dari backend dan render list
function fetchDataBarang() {
    fetch('/api/barang')
    .then(res => res.json())
    .then(data => {
        dataBarang = data;
        filteredDataBarang = dataBarang; // Awal tanpa filter
        renderListBarang(filteredDataBarang);
    })
    .catch(err => {
        console.error('Gagal mengambil data barang:', err);
        alert('Gagal mengambil data barang dari server.');
    });
}
function fetchDataPenjualan() {
    fetch('/api/penjualan')
    .then(res => res.json())
    .then(data => {
        dataPenjualan = data;
        renderListPenjualan(dataPenjualan);
    })
    .catch(err => {
        console.error('Gagal mengambil data penjualan:', err);
        alert('Gagal mengambil data penjualan dari server.');
    });
}
// ----- Penjualan -----
function hitungSubTotal(item){
    let sub = item.harga * item.qty;
    if(item.diskonPersen){
        sub -= sub * (item.diskonPersen/100);
    }
    if(item.diskonRp){
        sub -= item.diskonRp;
    }
    if(sub < 0) sub = 0;
    return sub;
}
function updateSummary(){
    const totalPcs = itemsPenjualan.reduce((sum,it) => sum + Number(it.qty), 0);
    const subTotal = itemsPenjualan.reduce((sum,it) => sum + hitungSubTotal(it), 0);
    totalPcsEl.textContent = totalPcs;
    subTotalEl.textContent = formatRupiah(subTotal);
    let grand = subTotal;
    const dPersen = parseFloat(diskonPersenGlobalInput.value) || 0;
    if(dPersen > 0){
        grand -= grand * (dPersen/100);
    }
    const dRp = parseFloat(diskonRpGlobalInput.value) || 0;
    grand -= dRp;
    if(grand < 0) grand = 0;
    grandTotalEl.textContent = formatRupiah(grand);
}
function renderItemsPenjualan() {
    tableListJualBody.innerHTML = '';
    itemsPenjualan.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const subTotal = hitungSubTotal(item);
        tr.innerHTML = `
            <td>${item.nama}</td>
            <td>${formatRupiah(item.harga)}</td>
            <td><input type="number" min="1" value="${item.qty}" data-index="${idx}" class="qty-input" style="width:80px;"></td>
            <td><input type="number" min="0" value="${item.diskonPersen || 0}" data-index="${idx}" class="diskon-persen-input" style="width:80px;"></td>
            <td><input type="number" min="0" value="${item.diskonRp || 0}" data-index="${idx}" class="diskon-rp-input" style="width:120px;"></td>
            <td class="subtotal-cell">${formatRupiah(subTotal)}</td>
            <td>
              <button type="button" class="btn-add-jual" data-id="${item.id}">Tambah</button>
              <button type="button" class="btn-hapus-jual" data-index="${idx}">Hapus</button>
            </td>
        `;
        tableListJualBody.appendChild(tr);
    });

    tableListJualBody.querySelectorAll('.qty-input').forEach(inp => {
        inp.addEventListener('change', e => {
            const i = e.target.getAttribute('data-index');
            let val = parseInt(e.target.value);
            if(val < 1) val = 1;
            itemsPenjualan[i].qty = val;
            e.target.value = val;
            renderItemsPenjualan();
        });
    });
    tableListJualBody.querySelectorAll('.diskon-persen-input').forEach(inp => {
        inp.addEventListener('change', e => {
            const i = e.target.getAttribute('data-index');
            let val = parseFloat(e.target.value);
            if(val < 0) val = 0;
            itemsPenjualan[i].diskonPersen = val;
            e.target.value = val;
            renderItemsPenjualan();
        });
    });
    tableListJualBody.querySelectorAll('.diskon-rp-input').forEach(inp => {
        inp.addEventListener('change', e => {
            const i = e.target.getAttribute('data-index');
            let val = parseFloat(e.target.value);
            if(val < 0) val = 0;
            itemsPenjualan[i].diskonRp = val;
            e.target.value = val;
            renderItemsPenjualan();
        });
    });
    tableListJualBody.querySelectorAll('.btn-hapus-jual').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = btn.getAttribute('data-index');
            itemsPenjualan.splice(i, 1);
            renderItemsPenjualan();
        });
    });
    tableListJualBody.querySelectorAll('.btn-add-jual').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const barang = dataBarang.find(b => b.id == id);
            if(barang) pilihBarang(barang);
        });
    });

    updateSummary();
}
function showSelectBarang(results){
    listSelectBarang.innerHTML = '';
    results.forEach((barang, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="kode-col">${barang.kodeBarang}</span>
            <span class="nama-col">${barang.namaBarang}</span>`;
        li.setAttribute('tabindex', '0');
        li.addEventListener('click', () => {
            modalSelectBarang.style.display = 'none';
            pilihBarang(barang);
        });
        li.addEventListener('keydown', e => {
            if(e.key === 'Enter') {
                e.preventDefault();
                li.click();
            } else if(e.key === 'ArrowDown') {
                e.preventDefault();
                li.nextElementSibling && li.nextElementSibling.focus();
            } else if(e.key === 'ArrowUp') {
                e.preventDefault();
                li.previousElementSibling && li.previousElementSibling.focus();
            }
        });
        listSelectBarang.appendChild(li);
    });
    modalSelectBarang.style.display = 'block';
    const first = listSelectBarang.querySelector('li');
    if(first) first.focus();
}

function showSelectVariasi(barang){
    listSelectVariasi.innerHTML = '';
    barang.variations.forEach((v, idx) => {
        const warna = v.warna || '';
        const ukuran = v.ukuran || '';
        const namaVar = `${warna}${ukuran ? ' ' + ukuran : ''}`.trim();
        const stokText = typeof v.stok === 'number' ? v.stok : 0;
        const li = document.createElement('li');
        li.setAttribute('tabindex', '0');
        li.innerHTML = `
            <span class="var-col">${warna}</span>
            <span class="var-col">${ukuran}</span>
            <span class="var-stock">(${stokText})</span>`;
        li.addEventListener('click', () => {
            modalSelectVariasi.style.display = 'none';
            itemsPenjualan.push({ id: barang.id, varIndex: idx, nama: `${barang.namaBarang} - ${namaVar}`, harga: barang.hargaJual, qty: 1, diskonPersen: 0, diskonRp: 0 });
            renderItemsPenjualan();
            inputCariBarang.focus();
        });
        li.addEventListener('keydown', e => {
            if(e.key === 'Enter') {
                e.preventDefault();
                li.click();
            } else if(e.key === 'ArrowDown') {
                e.preventDefault();
                li.nextElementSibling && li.nextElementSibling.focus();
            } else if(e.key === 'ArrowUp') {
                e.preventDefault();
                li.previousElementSibling && li.previousElementSibling.focus();
            }
        });
        listSelectVariasi.appendChild(li);
    });
    modalSelectVariasi.style.display = 'block';
    const first = listSelectVariasi.querySelector('li');
    if(first) first.focus();
}

function pilihBarang(barang){
    if(barang.variations && barang.variations.length > 0){
        showSelectVariasi(barang);
    } else {
        itemsPenjualan.push({ id: barang.id, nama: barang.namaBarang, harga: barang.hargaJual, qty: 1, diskonPersen: 0, diskonRp: 0 });
        renderItemsPenjualan();
    }
}

btnAddPenjualan.addEventListener('click', () => {
    modalPenjualan.style.display = 'block';
    formPenjualan.reset();
    itemsPenjualan = [];
    renderItemsPenjualan();
    inputNoResi.focus();
    diskonPersenGlobalInput.value = 0;
    diskonRpGlobalInput.value = 0;
    updateSummary();
});
closePenjualan.addEventListener('click', () => modalPenjualan.style.display = 'none');
// Tangani tombol Escape untuk setiap modal
document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        if(modalSelectVariasi.style.display === 'block') {
            modalSelectVariasi.style.display = 'none';
            modalPenjualan.style.display = 'block';
        } else if(modalSelectBarang.style.display === 'block') {
            modalSelectBarang.style.display = 'none';
            modalPenjualan.style.display = 'block';
        } else if(modalPenjualan.style.display === 'block') {
            modalPenjualan.style.display = 'none';
        }
    }
});
closeSelectBarang.addEventListener("click", () => modalSelectBarang.style.display = "none");
closeSelectVariasi.addEventListener("click", () => modalSelectVariasi.style.display = "none");
window.addEventListener("click", (e) => { if(e.target === modalSelectBarang) modalSelectBarang.style.display = "none"; });
window.addEventListener("click", (e) => { if(e.target === modalSelectVariasi) modalSelectVariasi.style.display = "none"; });
inputNoResi.addEventListener('keydown', e => {
    if(e.key === 'Enter') {
        e.preventDefault();
        inputCariBarang.focus();
    }
});

inputCariBarang.addEventListener("keydown", e => {
    if(e.key === "Enter") {
        e.preventDefault();
    const kata = inputCariBarang.value.trim().toLowerCase();
        if(!kata) return;
        const hasil = dataBarang.filter(b => b.kodeBarang.toLowerCase().includes(kata) || b.namaBarang.toLowerCase().includes(kata));
        inputCariBarang.value = "";
        if(hasil.length === 0){
            alert("Barang tidak ditemukan");
        } else if(hasil.length === 1){
            pilihBarang(hasil[0]);
        } else {
            showSelectBarang(hasil);
        }
        renderItemsPenjualan();
        inputCariBarang.value = '';
    }
});
diskonPersenGlobalInput.addEventListener('change', updateSummary);
diskonRpGlobalInput.addEventListener('change', updateSummary);

formPenjualan.addEventListener('submit', e => {
    e.preventDefault();
    const total = itemsPenjualan.reduce((sum, it) => sum + hitungSubTotal(it), 0);
    const data = {
        tanggal: new Date().toISOString().split("T")[0],
        total,
        items: itemsPenjualan.map(it => ({ id: it.id, qty: it.qty, varIndex: it.varIndex }))
    };
    fetch('/api/penjualan', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        modalPenjualan.style.display = 'none';
        fetchDataPenjualan();
    })
    .catch(err => {
        alert('Gagal menyimpan penjualan');
        console.error(err);
    });
});
// Fungsi filter data berdasarkan pencarian
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    filteredDataBarang = dataBarang.filter(item => 
        item.namaBarang.toLowerCase().includes(keyword) || 
        item.kodeBarang.toLowerCase().includes(keyword)
    );
    renderListBarang(filteredDataBarang);
});

// Submit form tambah/edit barang
formBarang.addEventListener('submit', (event) => {
    event.preventDefault();

    let namaBarang = formBarang.namaBarang.value.trim();
    let kodeBarang = formBarang.kodeBarang.value.trim();

    let hargaBeli = Number(formBarang.hargaBeliBarang.value);
    let hargaJual = Number(formBarang.hargaJualBarang.value);

    if(hargaBeli < 0 || hargaJual < 0){
        alert('Harga beli dan harga jual harus >= 0');
        return;
    }

    const kodeIndex = dataBarang.findIndex(b => b.kodeBarang.toLowerCase() === kodeBarang.toLowerCase());
    if(kodeIndex !== -1 && kodeIndex !== editIndex){
        alert('Kode barang sudah ada, gunakan kode lain.');
        return;
    }

    let stok = 0;
    let variations = [];

    if(checkboxVariasi.checked){
        if(!validasiVariasi()) return;
        const rows = tableVariasiBody.querySelectorAll('tr');
        for(let tr of rows){
            let warna = tr.querySelector('.input-warna').value.trim();
            let ukuran = tr.querySelector('.input-ukuran').value.trim();
            let stokVar = Number(tr.querySelector('.input-stokvar').value);
            variations.push({ warna, ukuran, stok: stokVar });
        }
    } else {
        stok = Number(formBarang.stokBarang.value);
    }

    const barangData = {
        namaBarang,
        kodeBarang,
        hargaBeli,
        hargaJual,
        stok,
        variasi: variations
    };

    const url = (editIndex === -1) ? '/api/barang' : `/api/barang/${dataBarang[editIndex].id}`;
    const method = (editIndex === -1) ? 'POST' : 'PUT';

    fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(barangData)
    })
    .then(res => {
        if(!res.ok) return res.json().then(err => { throw new Error(err.message || 'Kesalahan server'); });
        return res.json();
    })
    .then(() => {
        alert(`Barang "${namaBarang}" berhasil disimpan!`);
        popupModal.style.display = 'none';
        editIndex = -1;
        fetchDataBarang();
    })
    .catch(err => {
        alert('Gagal menyimpan barang: ' + err.message);
        console.error(err);
    });
});

// Inisialisasi data saat halaman siap v.2
document.addEventListener('DOMContentLoaded', () => {
    fetchDataBarang();
    fetchDataPenjualan();
    setActiveMenu(menuDataBarang);
    showSection(sectionDataBarang);
});