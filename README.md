# Malaysian Police Virtual — Prototaip kerjaya 0.3

Prototaip web 2D top-down berinspirasikan seni pixel menggunakan TypeScript, Canvas 2D dan Vite. Semua nama, pangkat, nilai ekonomi dan prosedur dalam permainan ialah simulasi fiksyen; ia bukan aplikasi rasmi PDRM.

## Fungsi yang dibina dalam versi ini
- Dunia 2D boleh diteroka dengan bandar atau luar bandar, jalan raya, bangunan, balai, rumah, NPC, trafik, penanda misi dan peta mini.
- Kerjaya baharu: pilih wilayah dan kesukaran; kerjaya sedia ada memerlukan pengesahan sebelum diganti.
- Simpanan automatik setempat dengan pemeriksaan asas, backup dan pemulihan backup.
- Kawalan papan kekunci, butang sentuh, lari, masuk/keluar kenderaan, siren dan tangkapan dalam misi berkaitan.
- Tiga tawaran misi, objektif wajib/pilihan, pemasa misi, kegagalan, ganjaran, XP, reputasi dan penggantian tawaran.
- Syif 12 minit bermula selepas taklimat; ringkasan harian, gaji harian sekali sahaja dan hari seterusnya.
- Pangkat, kriteria APC asas, laporan susulan, meja laporan dan bonus laporan sekali sahaja.
- Garaj kenderaan, rumah/kereta/pakaian peribadi, reputasi dan morale paparan.
- Insiden utama, pusat komunikasi, WhatsApp dalaman fiksyen, tetapan audio/kawalan dan menu jeda.
- Tutorial ringkas pada permulaan kerjaya.

## Jalankan secara tempatan
Memerlukan Node.js 20+.

```bash
npm install
npm run dev
```
Buka URL yang Vite paparkan. Untuk semakan pengeluaran:

```bash
npm run build
```

## Had prototaip yang diketahui
- Grafik 2D Canvas ini ialah asas visual permainan, belum aset pixel-art beranimasi khusus.
- AI trafik dan NPC adalah ringkas; bukan simulasi pemanduan/tingkah laku kompleks.
- Kediaman, pakaian dan kenderaan peribadi mempunyai sistem ekonomi asas; interior boleh diteroka secara penuh dan sistem petrol/baik pulih belum dibina.
- Misi laporan, siasatan, tangkapan, trafik dan kecemasan menggunakan objektif ringkas; belum mempunyai naratif bercabang penuh.
- Simpanan hanya pada pelayar/peranti yang sama. Tiada cloud save.
- Build dan ujian pelayar sebenar perlu dijalankan pada mesin dengan dependencies dipasang.
