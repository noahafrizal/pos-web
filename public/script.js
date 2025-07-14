// --- Variable global --- 
let dataBarang = [];
let filteredDataBarang = [];
let dataPenjualan = [];
let editIndex = -1; // Menyimpan index barang yang sedang diedit (-1 = tidak edit)

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