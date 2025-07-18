// index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const path = require('path');

// Serve folder public sebagai static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Koneksi database SQLite
const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) {
    console.error('Gagal konek ke database:', err.message);
    process.exit(1);
  }
  console.log('Terhubung ke database SQLite');
});

// Buat tabel jika belum ada
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      namaBarang TEXT,
      kodeBarang TEXT UNIQUE,
      hargaBeli INTEGER,
      hargaJual INTEGER,
      stok INTEGER,
      variasi TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS penjualan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nota TEXT,
      tanggal TEXT,
      total INTEGER
    )
  `);
db.all('PRAGMA table_info(penjualan)', (err, cols) => {
    if(!err && !cols.find(c => c.name === 'nota')){
      db.run('ALTER TABLE penjualan ADD COLUMN nota TEXT');
    }
  });

  // Insert user admin default jika belum ada
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('Error mengecek user admin:', err.message);
    } else if (!row) {
      db.run('INSERT INTO users(username, password) VALUES (?, ?)', ['admin', '123'], (err2) => {
        if (err2) {
          console.error('Gagal menambahkan user default admin:', err2.message);
        } else {
          console.log('User default "admin" berhasil dibuat dengan password "123"');
        }
      });
    } else {
      console.log('User default sudah ada');
    }
  });
});

// API Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if(!username || !password){
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      console.error('Error query login:', err.message);
      return res.status(500).json({ success: false, message: 'Kesalahan server' });
    }
    if (row) {
      // Untuk keamanan, jangan kirim password kembali
      return res.json({ success: true, user: { id: row.id, username: row.username } });
    }
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  });
});

// API dapatkan semua barang
app.get('/api/barang', (req, res) => {
  db.all('SELECT * FROM barang', [], (err, rows) => {
    if (err) {
      console.error('Error ambil data barang:', err.message);
      return res.status(500).json({ success: false, message: 'Kesalahan server' });
    }
    const data = rows.map(item => {
      return {
        ...item,
        variations: item.variasi ? JSON.parse(item.variasi) : [] // pastikan key variabel bernama variations
      };
    });
    res.json(data);
  });
});

// API dapatkan semua penjualan
app.get('/api/penjualan', (req, res) => {
  db.all('SELECT * FROM penjualan', [], (err, rows) => {
    if (err) {
      console.error('Error ambil data penjualan:', err.message);
      return res.status(500).json({ success: false, message: 'Kesalahan server' });
    }
    res.json(rows);
  });
});

// API tambah data penjualan sederhana
app.post('/api/penjualan', (req, res) => {
  const { tanggal, total, items, nota } = req.body;
  if(!tanggal || total === undefined || !Array.isArray(items)){
    return res.status(400).json({ success:false, message:'Field penjualan tidak lengkap' });
  }
  db.run('INSERT INTO penjualan(tanggal,total,nota) VALUES(?,?,?)', [tanggal, total, nota || null], function(err){
    if(err){
      console.error('Error tambah penjualan:', err.message);
      return res.status(500).json({ success:false, message:'Gagal menambah penjualan' });
    }
    const id = this.lastID;
    let finalNota = nota;
    if(!finalNota){
      const [year, month, day] = tanggal.split('-');
      const datePart = day + month + year.slice(-2);
      finalNota = `ELN-${datePart}${String(id).padStart(4,'0')}`;
      db.run('UPDATE penjualan SET nota=? WHERE id=?', [finalNota, id]);
    }
    // update stok barang
    items.forEach(it => {
      db.get('SELECT * FROM barang WHERE id=?', [it.id], (err2, row) => {
        if(err2 || !row) return;
        let stok = row.stok || 0;
        let variations = [];
        if(row.variasi){
          try{ variations = JSON.parse(row.variasi); }catch(e){ variations = []; }
        }
        if(variations.length > 0 && it.varIndex !== undefined && variations[it.varIndex]){
          variations[it.varIndex].stok = Math.max(0, (variations[it.varIndex].stok || 0) - it.qty);
        } else {
          stok = Math.max(0, stok - it.qty);
        }
        db.run('UPDATE barang SET stok=?, variasi=? WHERE id=?', [stok, JSON.stringify(variations), it.id]);
      });
    });
    res.json({ success:true, id, nota: finalNota });
  });
});

// API tambah barang baru
app.post('/api/barang', (req, res) => {
  const { namaBarang, kodeBarang, hargaBeli, hargaJual, stok, variasi } = req.body;

  if(!namaBarang || !kodeBarang || hargaBeli === undefined || hargaJual === undefined){
    return res.status(400).json({ success: false, message: 'Field wajib belum lengkap' });
  }

  const variasiStr = JSON.stringify(variasi || []);

  db.run(
    `INSERT INTO barang (namaBarang, kodeBarang, hargaBeli, hargaJual, stok, variasi)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [namaBarang, kodeBarang, hargaBeli, hargaJual, stok || 0, variasiStr],
    function(err) {
      if (err) {
        console.error('Error tambah barang:', err.message);
        return res.status(500).json({ success: false, message: 'Gagal menambah data barang', detail: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// API update barang by id
app.put('/api/barang/:id', (req, res) => {
  const id = req.params.id;
  const { namaBarang, kodeBarang, hargaBeli, hargaJual, stok, variasi } = req.body;

  if(!namaBarang || !kodeBarang || hargaBeli === undefined || hargaJual === undefined){
    return res.status(400).json({ success: false, message: 'Field wajib belum lengkap' });
  }

  const variasiStr = JSON.stringify(variasi || []);

  db.run(
    `UPDATE barang SET namaBarang=?, kodeBarang=?, hargaBeli=?, hargaJual=?, stok=?, variasi=?
    WHERE id=?`,
    [namaBarang, kodeBarang, hargaBeli, hargaJual, stok || 0, variasiStr, id],
    function(err){
      if(err){
        console.error('Error update barang:', err.message);
        return res.status(500).json({ success: false, message: 'Gagal update data barang', detail: err.message });
      }
      if(this.changes === 0){
        return res.status(404).json({ success: false, message: 'Data barang tidak ditemukan'});
      }
      res.json({ success: true, changes: this.changes });
    }
  );
});

// (Optional) API delete barang by id
app.delete('/api/barang/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM barang WHERE id = ?', [id], function(err){
    if(err){
      return res.status(500).json({ success:false, message:'Gagal hapus barang'});
    }
    if(this.changes === 0){
      return res.status(404).json({ success:false, message:'Barang tidak ditemukan'});
    }
    res.json({ success:true });
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
});