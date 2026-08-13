const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageNumber, NumberFormat, Header, Footer, PageBreak,
  UnderlineType, TabStopPosition, TabStopType, TabLeaderCharacter,
  convertInchesToTwip, LevelFormat, PageOrientation
} = require('docx');
const fs = require('fs');

// ─── COLOURS ─────────────────────────────────────────────────────────────────
const C = {
  primary:   '1F4E79',  // dark navy
  accent:    '2E75B6',  // mid blue
  light:     'BDD7EE',  // pale blue header
  green:     '70AD47',
  orange:    'ED7D31',
  red:       'C00000',
  gray:      'D9D9D9',
  darkGray:  '595959',
  white:     'FFFFFF',
  black:     '000000',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
  });
}
function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
  });
}
function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 60 },
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '000000', ...opts })],
    spacing: { before: 60, after: 60 },
  });
}
function bold(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    spacing: { before: 60, after: 60 },
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level },
    spacing: { before: 40, after: 40 },
  });
}
function gap(lines = 1) {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: lines * 60 } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function reqRow(id, desc, status, notes) {
  const statusColor = status === 'CONFIRMED' ? C.green : status === 'ASSUMPTION' ? C.orange : C.red;
  return new TableRow({
    children: [
      cell(id, { bold: true, size: 18 }, C.white, 1200),
      cell(desc, { size: 18 }, C.white, 5800),
      cell(status, { bold: true, size: 18, color: statusColor }, C.white, 1200),
      cell(notes, { size: 18 }, C.white, 2000),
    ]
  });
}
function cell(text, runOpts = {}, bgColor = C.white, width = 2000) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, ...runOpts })], spacing: { before: 60, after: 60 } })],
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}
function headerRow(cols, widths) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((c, i) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20, color: C.white })], alignment: AlignmentType.LEFT })],
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: C.primary, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    }))
  });
}
function reqBlock(id, title, desc, status = 'CONFIRMED') {
  const statusColor = status === 'CONFIRMED' ? C.green : status === 'ASSUMPTION' ? C.orange : C.red;
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${id}  `, bold: true, size: 22, color: C.primary }),
        new TextRun({ text: title ? `[${title}]  ` : '', italics: true, size: 22, color: C.darkGray }),
        new TextRun({ text: `[${status}]`, bold: true, size: 18, color: statusColor }),
      ],
      spacing: { before: 120, after: 40 },
      border: { left: { style: BorderStyle.SINGLE, size: 6, color: C.accent } },
      indent: { left: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: desc, size: 22 })],
      spacing: { before: 0, after: 100 },
      indent: { left: 160 },
    }),
  ];
}
function oqBlock(id, priority, question, options) {
  const pc = priority === 'P0' ? C.red : priority === 'P1' ? C.orange : C.green;
  const items = [
    new Paragraph({
      children: [
        new TextRun({ text: `${id}  `, bold: true, size: 22, color: C.primary }),
        new TextRun({ text: `[${priority}]`, bold: true, size: 20, color: pc }),
      ],
      spacing: { before: 120, after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: question, size: 22 })],
      spacing: { before: 0, after: 40 },
      indent: { left: 200 },
    }),
  ];
  if (options) {
    items.push(new Paragraph({
      children: [new TextRun({ text: 'Possible Options (BELUM DIPUTUSKAN):', italics: true, size: 20, color: C.darkGray })],
      spacing: { before: 40, after: 20 },
      indent: { left: 200 },
    }));
    options.forEach(o => items.push(
      new Paragraph({
        children: [new TextRun({ text: `• ${o}`, size: 20, color: C.darkGray })],
        spacing: { before: 0, after: 20 },
        indent: { left: 360 },
      })
    ));
  }
  items.push(gap());
  return items;
}

// ─── DOCUMENT ────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullet-ref',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 260 } } } },
        ]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1',
        basedOn: 'Normal', next: 'Normal',
        run: { bold: true, size: 32, color: C.primary, font: 'Calibri' },
        paragraph: { spacing: { before: 400, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent } } },
      },
      {
        id: 'Heading2', name: 'Heading 2',
        basedOn: 'Normal', next: 'Normal',
        run: { bold: true, size: 26, color: C.accent, font: 'Calibri' },
        paragraph: { spacing: { before: 300, after: 80 } },
      },
      {
        id: 'Heading3', name: 'Heading 3',
        basedOn: 'Normal', next: 'Normal',
        run: { bold: true, size: 24, color: C.darkGray, font: 'Calibri' },
        paragraph: { spacing: { before: 200, after: 60 } },
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'TAGANA — System Requirements Specification v1.0', size: 18, color: C.darkGray }),
              new TextRun({ text: '\t', size: 18 }),
              new TextRun({ text: 'CONFIDENTIAL', size: 18, bold: true, color: C.red }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.light } },
            spacing: { after: 60 },
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Halaman ', size: 18, color: C.darkGray }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.darkGray }),
              new TextRun({ text: ' dari ', size: 18, color: C.darkGray }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: C.darkGray }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.light } },
            spacing: { before: 60 },
          })
        ]
      })
    },
    children: [

      // ── COVER ──────────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: ' ', size: 80 })],
        spacing: { before: 1200, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'TAGANA', bold: true, size: 96, color: C.primary, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'System Requirements Specification', size: 44, color: C.accent, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Version 1.0', size: 28, color: C.darkGray })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Status: Draft — Pending Review', size: 24, color: C.orange, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
      }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            cell('Nama Proyek', { bold: true, size: 22 }, C.light, 2500),
            cell('TAGANA — IoT Water Level Monitoring System', { size: 22 }, C.white, 6860),
          ]}),
          new TableRow({ children: [
            cell('Versi Dokumen', { bold: true, size: 22 }, C.light, 2500),
            cell('1.0', { size: 22 }, C.white, 6860),
          ]}),
          new TableRow({ children: [
            cell('Tanggal', { bold: true, size: 22 }, C.light, 2500),
            cell('2025', { size: 22 }, C.white, 6860),
          ]}),
          new TableRow({ children: [
            cell('Tipe Dokumen', { bold: true, size: 22 }, C.light, 2500),
            cell('System Requirements Specification (SRS)', { size: 22 }, C.white, 6860),
          ]}),
          new TableRow({ children: [
            cell('Klasifikasi', { bold: true, size: 22 }, C.light, 2500),
            cell('Confidential — Internal Project', { size: 22 }, C.white, 6860),
          ]}),
        ]
      }),
      pageBreak(),

      // ── 1. DOCUMENT PURPOSE ───────────────────────────────────────────────
      h1('1. Document Purpose'),
      body('Dokumen ini merupakan System Requirements Specification (SRS) untuk sistem TAGANA versi 1.0. Dokumen ini berfungsi sebagai Single Source of Truth (SSOT) yang mendefinisikan seluruh kebutuhan sistem sebelum memasuki tahap desain arsitektur dan implementasi.'),
      gap(),
      body('Dokumen ini menjadi dasar untuk penyusunan artefak berikut:'),
      bullet('Product Requirements Document (PRD)'),
      bullet('Business Process Model and Notation (BPMN)'),
      bullet('Use Case Specification'),
      bullet('Entity-Relationship Diagram (ERD)'),
      bullet('Unified Modeling Language (UML)'),
      bullet('Sequence Diagram'),
      bullet('API Specification'),
      bullet('Database Schema'),
      bullet('UI/UX Design'),
      bullet('Flutter Application Development'),
      bullet('ESP32 Firmware Development'),
      gap(),
      body('Setiap requirement dalam dokumen ini diklasifikasikan sebagai:'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          headerRow(['Status', 'Definisi'], [2000, 7360]),
          new TableRow({ children: [cell('CONFIRMED', { bold: true, color: C.green, size: 22 }, C.white, 2000), cell('Requirement telah diputuskan dan berlaku sebagai kebutuhan final.', {size:22}, C.white, 7360)] }),
          new TableRow({ children: [cell('ASSUMPTION', { bold: true, color: C.orange, size: 22 }, C.white, 2000), cell('Dianggap benar untuk saat ini, namun harus divalidasi sebelum implementasi.', {size:22}, C.white, 7360)] }),
          new TableRow({ children: [cell('OPEN', { bold: true, color: C.red, size: 22 }, C.white, 2000), cell('Belum diputuskan. Harus diselesaikan pada tahap yang ditentukan.', {size:22}, C.white, 7360)] }),
        ]
      }),
      gap(),

      // ── 2. SYSTEM OVERVIEW ────────────────────────────────────────────────
      h1('2. System Overview'),
      body('TAGANA adalah sistem monitoring perangkat IoT yang digunakan untuk memantau kondisi ketinggian air (water level) di lapangan secara real-time. Sistem ini terdiri dari perangkat keras berbasis ESP32 yang terpasang di lokasi pemantauan dan aplikasi mobile berbasis Flutter yang digunakan oleh pengguna untuk memantau data dari perangkat tersebut.'),
      gap(),
      body('Setiap unit perangkat TAGANA memiliki kode identitas unik dengan format:'),
      new Paragraph({
        children: [new TextRun({ text: 'TGN_XXXX', bold: true, size: 28, color: C.primary, font: 'Courier New' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 40 },
      }),
      body('Contoh: TGN_0001, TGN_0002, TGN_0003, dst.'),
      gap(),

      // ── 3. PRODUCT SCOPE ──────────────────────────────────────────────────
      h1('3. Product Scope'),
      h2('3.1 Cakupan Sistem'),
      body('Sistem TAGANA mencakup komponen-komponen berikut:'),
      bullet('Aplikasi mobile berbasis Flutter sebagai antarmuka pengguna utama.'),
      bullet('Perangkat IoT berbasis ESP32 sebagai unit monitoring di lapangan.'),
      bullet('Komunikasi Bluetooth Low Energy (BLE) untuk konfigurasi dan verifikasi perangkat.'),
      bullet('Komunikasi WiFi untuk pengiriman data monitoring ke backend.'),
      bullet('WiFi Hotspot pada ESP32 sebagai jalur akses darurat.'),
      bullet('Local Web Interface pada ESP32 sebagai antarmuka akses lokal.'),
      bullet('Backend/API untuk pemrosesan dan penyimpanan data.'),
      bullet('Supabase sebagai database utama.'),
      bullet('Hasura Cloud sebagai layer GraphQL/API.'),
      gap(),
      h2('3.2 Batasan Cakupan'),
      body('Dokumen ini tidak mencakup:'),
      bullet('Spesifikasi detail hardware sensor yang belum final.'),
      bullet('Desain UI/UX secara visual.'),
      bullet('Spesifikasi firmware ESP32 secara detail.'),
      bullet('Infrastruktur deployment backend.'),
      bullet('Aspek bisnis dan komersial sistem.'),
      gap(),

      // ── 4. BUSINESS CONTEXT ───────────────────────────────────────────────
      h1('4. Business Context'),
      body('TAGANA dirancang untuk kebutuhan pemantauan ketinggian air di lokasi tertentu. Pengguna memerlukan kemampuan untuk memantau kondisi lapangan secara jarak jauh menggunakan aplikasi mobile. Sistem harus dapat beroperasi dalam kondisi koneksi internet normal maupun dalam kondisi darurat tanpa akses internet.'),
      gap(),
      body('Model penggunaan utama adalah sebagai berikut:'),
      bullet('Satu pengguna dapat mendaftarkan dan memantau lebih dari satu perangkat TAGANA.'),
      bullet('Satu pengguna hanya dapat melihat perangkat yang dimiliki atau didaftarkan atas namanya.'),
      bullet('Kepemilikan perangkat dikelola dan disimpan di backend, bukan hanya di penyimpanan lokal aplikasi.'),
      gap(),

      // ── 5. ACTORS ─────────────────────────────────────────────────────────
      h1('5. Actors'),
      h2('5.1 Aktor Terkonfirmasi'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          headerRow(['Aktor', 'Deskripsi', 'Status'], [2000, 6360, 1000]),
          new TableRow({ children: [
            cell('End User', { bold: true, size: 22 }, C.white, 2000),
            cell('Pengguna akhir yang menggunakan aplikasi mobile TAGANA untuk memantau perangkat yang dimilikinya.', {size:22}, C.white, 6360),
            cell('CONFIRMED', { color: C.green, bold: true, size: 20 }, C.white, 1000),
          ]}),
          new TableRow({ children: [
            cell('ESP32 Device', { bold: true, size: 22 }, C.white, 2000),
            cell('Perangkat IoT yang berperan sebagai sumber data monitoring dan aktor dalam komunikasi backend.', {size:22}, C.white, 6360),
            cell('CONFIRMED', { color: C.green, bold: true, size: 20 }, C.white, 1000),
          ]}),
          new TableRow({ children: [
            cell('Backend/API', { bold: true, size: 22 }, C.white, 2000),
            cell('Sistem backend yang menerima data dari perangkat dan menyajikan data kepada aplikasi mobile.', {size:22}, C.white, 6360),
            cell('CONFIRMED', { color: C.green, bold: true, size: 20 }, C.white, 1000),
          ]}),
        ]
      }),
      gap(),
      h2('5.2 Aktor Belum Final'),
      body('OQ-003 — Belum diputuskan apakah terdapat role lain selain End User (misalnya: Admin, Supervisor, atau Operator). Lihat bagian Open Questions.'),
      gap(),

      // ── 6. SYSTEM COMPONENTS ──────────────────────────────────────────────
      h1('6. System Components'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          headerRow(['Komponen', 'Teknologi', 'Fungsi', 'Status'], [2000, 2000, 4360, 1000]),
          ...[
            ['Aplikasi Mobile', 'Flutter', 'Antarmuka pengguna utama untuk monitoring dan konfigurasi perangkat.', 'CONFIRMED'],
            ['Perangkat IoT', 'ESP32', 'Unit monitoring lapangan. Mengumpulkan dan mengirimkan data sensor.', 'CONFIRMED'],
            ['Komunikasi BLE', 'Bluetooth Low Energy', 'Digunakan untuk penemuan, verifikasi, dan konfigurasi perangkat.', 'CONFIRMED'],
            ['Komunikasi WiFi', 'WiFi (802.11)', 'Jalur utama pengiriman data monitoring ke backend melalui internet.', 'CONFIRMED'],
            ['WiFi Hotspot ESP32', 'WiFi Access Point', 'Jalur akses darurat ketika internet tidak tersedia.', 'CONFIRMED'],
            ['Local Web Interface', 'Web (ESP32)', 'Antarmuka berbasis browser yang diakses melalui hotspot ESP32.', 'CONFIRMED'],
            ['Backend/API', 'Tidak dispesifikasikan', 'Menerima data perangkat dan menyajikan ke aplikasi mobile.', 'CONFIRMED'],
            ['Database', 'Supabase', 'Penyimpanan data utama sistem.', 'CONFIRMED'],
            ['API Layer', 'Hasura Cloud (GraphQL)', 'Layer API antara backend dan aplikasi mobile.', 'CONFIRMED'],
          ].map(([comp, tech, func, status]) => new TableRow({ children: [
            cell(comp, { bold: true, size: 20 }, C.white, 2000),
            cell(tech, { size: 20 }, C.white, 2000),
            cell(func, { size: 20 }, C.white, 4360),
            cell(status, { color: C.green, bold: true, size: 18 }, C.white, 1000),
          ]}))
        ]
      }),
      gap(),

      // ── 7. USER MODEL ─────────────────────────────────────────────────────
      h1('7. User Model'),
      h2('7.1 Pembuatan Profil Pengguna'),
      ...reqBlock('FR-001', 'Pembuatan Profil', 'Pada penggunaan pertama, pengguna harus membuat profil sederhana menggunakan nama. Profil ini digunakan untuk mengidentifikasi pengguna dalam sistem.'),
      ...reqBlock('FR-002', 'Tanpa Email/Password', 'Email dan password TIDAK digunakan sebagai metode autentikasi utama pada versi awal sistem ini.'),
      ...reqBlock('ASM-001', 'Identitas Pengguna', 'Diasumsikan bahwa setiap identitas pengguna yang dibuat disimpan di backend sehingga dapat digunakan sebagai basis kepemilikan perangkat.', 'ASSUMPTION'),
      gap(),
      h2('7.2 Autentikasi Jangka Panjang'),
      body('[OQ-006] — Rencana autentikasi jangka panjang belum ditentukan. Lihat bagian Open Questions.'),
      gap(),

      // ── 8. DEVICE MODEL ───────────────────────────────────────────────────
      h1('8. Device Model'),
      h2('8.1 Identitas Perangkat'),
      ...reqBlock('FR-003', 'Device Code', 'Setiap perangkat TAGANA memiliki kode identitas unik dengan format TGN_XXXX, di mana XXXX adalah angka numerik (contoh: TGN_0001).'),
      ...reqBlock('FR-004', 'Keunikan Device Code', 'Kode identitas perangkat harus bersifat unik di seluruh sistem TAGANA. Tidak boleh ada dua perangkat dengan kode yang sama.'),
      gap(),
      h2('8.2 Kepemilikan Perangkat'),
      ...reqBlock('FR-005', 'Ownership di Backend', 'Kepemilikan perangkat oleh pengguna harus disimpan di backend, bukan hanya pada penyimpanan lokal aplikasi mobile.'),
      ...reqBlock('FR-006', 'Multi-Device per User', 'Satu pengguna dapat mendaftarkan dan memiliki lebih dari satu perangkat TAGANA.'),
      body('Model relasi dasar antara pengguna dan perangkat:'),
      new Paragraph({
        children: [new TextRun({ text: 'USER  (1) ─────── owns ───────  (N)  DEVICE', size: 22, font: 'Courier New', color: C.primary })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        shading: { fill: 'F2F7FC', type: ShadingType.CLEAR },
        indent: { left: 720, right: 720 },
      }),
      gap(),
      h2('8.3 Aturan Kepemilikan yang Belum Final'),
      body('Hal-hal berikut terkait kepemilikan perangkat BELUM DIPUTUSKAN dan dicatat sebagai OQ-015:'),
      bullet('Mekanisme pertama kali perangkat diklaim oleh pengguna (device claiming).'),
      bullet('Penanganan jika perangkat sudah dimiliki oleh pengguna lain.'),
      bullet('Apakah kepemilikan perangkat dapat dipindahkan ke pengguna lain.'),
      bullet('Apakah satu perangkat dapat dimiliki oleh lebih dari satu pengguna secara bersamaan.'),
      gap(),

      // ── 9. FUNCTIONAL REQUIREMENTS ───────────────────────────────────────
      h1('9. Functional Requirements'),
      h2('9.1 Onboarding & Pendaftaran Perangkat'),
      ...reqBlock('FR-007', 'Flow Pendaftaran Perangkat Pertama', 'Pada penggunaan pertama, pengguna mendaftarkan perangkat TAGANA melalui flow berikut: (1) Input kode TGN, (2) BLE Discovery, (3) Device Verification, (4) Konfigurasi WiFi, (5) Device Registered, (6) Tampilan Dashboard.'),
      ...reqBlock('FR-008', 'Tambah Perangkat Berikutnya', 'Setelah perangkat pertama berhasil ditambahkan, pengguna dapat menambahkan perangkat tambahan melalui fitur "Tambah Perangkat" dengan flow yang sama seperti pendaftaran perangkat pertama.'),
      gap(),
      h2('9.2 Halaman Utama Aplikasi'),
      ...reqBlock('FR-009', 'Navigasi Utama', 'Aplikasi harus menyediakan halaman-halaman utama yang dapat diakses dari navigasi: (1) Dashboard, (2) Peta, (3) Riwayat. Halaman Pengaturan (Settings) — DETAIL CONTENT BELUM FINAL. Lihat OQ-017.'),
      gap(),
      h2('9.3 Dashboard'),
      ...reqBlock('FR-010', 'Scope Dashboard', 'Dashboard hanya menampilkan perangkat yang dimiliki atau terdaftar pada pengguna yang sedang aktif, bukan seluruh perangkat TAGANA.'),
      ...reqBlock('FR-011', 'Ringkasan Status', 'Dashboard menampilkan ringkasan status perangkat milik pengguna, termasuk: Total Perangkat, Jumlah Online, Jumlah Offline.'),
      ...reqBlock('FR-012', 'Navigasi ke Detail Perangkat', 'Dari Dashboard, pengguna dapat memilih perangkat tertentu untuk melihat halaman detail monitoring perangkat tersebut.'),
      gap(),
      h2('9.4 Detail Perangkat'),
      ...reqBlock('FR-013', 'Informasi Detail Perangkat', 'Halaman detail perangkat menampilkan informasi berikut: Device Code (TGN_XXXX), Water Level, Battery Status, WiFi Status, GPS/Location, Connection Status, Last Update.'),
      gap(),
      h2('9.5 Peta'),
      ...reqBlock('FR-014', 'Scope Peta', 'Halaman Peta menampilkan lokasi perangkat yang dimiliki pengguna, bukan seluruh perangkat TAGANA.'),
      body('[OQ-005] — Detail behavior Halaman Peta belum diputuskan. Lihat bagian Open Questions.'),
      gap(),
      h2('9.6 Riwayat'),
      ...reqBlock('FR-015', 'Tujuan Riwayat', 'Halaman Riwayat digunakan untuk melihat data monitoring historis perangkat.'),
      body('[OQ-004] — Detail riwayat (retensi data, granularitas, rentang waktu, bentuk grafik, export data, aggregasi) BELUM FINAL. Lihat bagian Open Questions.'),
      gap(),
      h2('9.7 Manajemen Perangkat'),
      ...reqBlock('FR-016', 'Manajemen Perangkat', 'Aplikasi harus menyediakan fitur manajemen perangkat yang memungkinkan pengguna melihat dan mengelola perangkat yang terdaftar.'),
      gap(),
      h2('9.8 Konfigurasi WiFi'),
      ...reqBlock('FR-017', 'Input Konfigurasi WiFi', 'Selama proses pendaftaran perangkat, aplikasi harus memungkinkan pengguna untuk memasukkan WiFi credential (SSID, Password, dan Security Type jika diperlukan) melalui antarmuka BLE, kemudian mengirimkan credential tersebut ke ESP32 untuk konfigurasi koneksi WiFi. DETAIL KEAMANAN TRANSMISSION CREDENTIAL VIA BLE — lihat OQ-007.'),
      gap(),
      h2('9.9 Emergency & Local Web Access'),
      ...reqBlock('FR-018', 'Akses Local Web Interface', 'Aplikasi harus menyediakan tombol atau tautan yang memudahkan pengguna untuk membuka Local Web Interface ESP32 ketika perangkat beroperasi dalam mode hotspot. [Juga lihat FR-036 di section 17 untuk konteks emergency operation].'),
      gap(),

      // ── 10. NON-FUNCTIONAL REQUIREMENTS ──────────────────────────────────
      h1('10. Non-Functional Requirements'),
      body('[OQ-010] — Target non-functional requirements (performa, ketersediaan, skalabilitas, latensi, dll.) BELUM DITENTUKAN. Lihat bagian Open Questions.'),
      gap(),
      ...reqBlock('NFR-001', 'Ownership di Backend', 'Data kepemilikan perangkat harus konsisten antara aplikasi dan backend sehingga tidak bergantung sepenuhnya pada local storage.', 'CONFIRMED'),
      gap(),

      // ── 11. HARDWARE REQUIREMENTS ─────────────────────────────────────────
      h1('11. Hardware Requirements'),
      ...reqBlock('HW-001', 'Mikrokontroler', 'Perangkat TAGANA menggunakan ESP32 sebagai mikrokontroler utama.'),
      ...reqBlock('HW-002', 'Kemampuan BLE', 'ESP32 harus mendukung Bluetooth Low Energy (BLE) untuk fungsi penemuan perangkat, verifikasi, dan konfigurasi.'),
      ...reqBlock('HW-003', 'Kemampuan WiFi', 'ESP32 harus mendukung koneksi WiFi untuk pengiriman data ke backend.'),
      ...reqBlock('HW-004', 'Kemampuan WiFi Hotspot', 'ESP32 harus dapat beroperasi sebagai WiFi Access Point (Hotspot) untuk jalur akses darurat.'),
      ...reqBlock('HW-005', 'Local Web Interface', 'ESP32 harus dapat menjalankan local web server yang dapat diakses melalui browser ketika pengguna terhubung ke hotspot ESP32.'),
      ...reqBlock('HW-006', 'Sensor Water Level', 'Perangkat harus dilengkapi sensor water level sebagai data monitoring utama.', 'CONFIRMED'),
      ...reqBlock('ASM-002', 'GPS/Location', 'Diasumsikan perangkat memiliki kemampuan GPS atau mekanisme lain untuk menyediakan data lokasi. Spesifikasi teknis GPS belum ditentukan.', 'ASSUMPTION'),
      ...reqBlock('ASM-003', 'Battery', 'Diasumsikan perangkat menggunakan baterai sebagai sumber daya dan dapat melaporkan status daya baterai.', 'ASSUMPTION'),
      body('[OQ-002] — Spesifikasi teknis sensor water level BELUM FINAL. Lihat bagian Open Questions.'),
      gap(),

      // ── 12. SOFTWARE REQUIREMENTS ─────────────────────────────────────────
      h1('12. Software Requirements'),
      ...reqBlock('SW-001', 'Platform Aplikasi Mobile', 'Aplikasi mobile dikembangkan menggunakan Flutter.'),
      ...reqBlock('SW-002', 'Database', 'Sistem menggunakan Supabase sebagai database utama.'),
      ...reqBlock('SW-003', 'API Layer', 'Sistem menggunakan Hasura Cloud sebagai layer GraphQL/API.'),
      ...reqBlock('ASM-004', 'Platform Mobile Target', 'Diasumsikan aplikasi mobile ditargetkan untuk platform Android dan/atau iOS. Platform target yang spesifik belum diputuskan secara formal.', 'ASSUMPTION'),
      body('[OQ-013] — Cakupan platform (Android, iOS, atau keduanya) dan versi OS minimum BELUM FINAL. Lihat bagian Open Questions.'),
      gap(),

      // ── 13. CONNECTIVITY REQUIREMENTS ────────────────────────────────────
      h1('13. Connectivity Requirements'),
      h2('13.1 Konektivitas Normal'),
      ...reqBlock('NET-001', 'Jalur Normal', 'Dalam kondisi normal, ESP32 mengirimkan data monitoring ke backend melalui koneksi WiFi dengan akses internet, kemudian data diteruskan ke aplikasi Flutter melalui backend.'),
      body('Alur konektivitas normal:'),
      new Paragraph({
        children: [new TextRun({ text: 'ESP32  →  WiFi  →  Internet  →  Backend  →  Flutter App', size: 22, font: 'Courier New', color: C.primary })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        shading: { fill: 'F2F7FC', type: ShadingType.CLEAR },
        indent: { left: 720, right: 720 },
      }),
      gap(),
      h2('13.2 Konektivitas Darurat (Emergency)'),
      ...reqBlock('NET-002', 'Jalur BLE Darurat', 'Jika koneksi internet tidak tersedia, aplikasi Flutter dapat berkomunikasi langsung dengan ESP32 melalui BLE sebagai jalur backup pertama.'),
      ...reqBlock('NET-003', 'Jalur Hotspot Darurat', 'Jika koneksi internet tidak tersedia, ESP32 menyediakan WiFi Hotspot sebagai jalur backup kedua. Pengguna dapat menghubungkan perangkat mobile ke hotspot ESP32 dan mengakses Local Web Interface melalui browser.'),
      body('Alur konektivitas darurat:'),
      new Paragraph({
        children: [new TextRun({ text: 'ESP32 ──┬── BLE ──────────────────── Flutter App\n        └── WiFi Hotspot ── HP ── Browser ── Local Web', size: 20, font: 'Courier New', color: C.primary })],
        alignment: AlignmentType.LEFT,
        spacing: { before: 120, after: 120 },
        shading: { fill: 'F2F7FC', type: ShadingType.CLEAR },
        indent: { left: 720, right: 720 },
      }),
      gap(),
      ...reqBlock('ASM-005', 'Ketersediaan BLE Darurat', 'Diasumsikan BLE pada ESP32 tetap aktif atau dapat diaktifkan kembali saat koneksi internet tidak tersedia, sehingga jalur komunikasi darurat dapat digunakan.', 'ASSUMPTION'),
      gap(),

      // ── 14. DEVICE MANAGEMENT REQUIREMENTS ───────────────────────────────
      h1('14. Device Management Requirements'),
      h2('14.1 BLE Discovery & Verification'),
      ...reqBlock('FR-019', 'Input Device Code', 'Pengguna harus memasukkan kode TGN perangkat secara manual sebagai langkah pertama pendaftaran perangkat. Format kode: TGN_XXXX, dimana XXXX adalah 4 digit numerik (0001-9999).'),
      ...reqBlock('FR-020', 'BLE Discovery', 'Setelah kode TGN dimasukkan, aplikasi melakukan BLE discovery untuk menemukan perangkat yang sesuai.'),
      ...reqBlock('FR-021', 'Device Verification', 'Aplikasi harus memverifikasi bahwa perangkat yang ditemukan melalui BLE adalah perangkat yang benar dengan code TGN yang dimasukkan pengguna. MEKANISME VERIFIKASI DETAIL (e.g. BLE broadcast code, challenge-response, dll.) — lihat OQ-007. Jika perangkat tidak sesuai (device mismatch), proses pendaftaran harus dihentikan.'),
      ...reqBlock('ASM-006', 'BLE Verification Mechanism', 'Diasumsikan ESP32 mengkomunikasikan device code-nya (TGN_XXXX) via BLE sehingga aplikasi dapat memverifikasi kecocokan. Detail implementasi (broadcast di advertisement data, atau via service characteristic) belum ditentukan.', 'ASSUMPTION'),
      body('[OQ-007] — Detail keamanan BLE pairing dan device verification BELUM FINAL. Lihat bagian Open Questions.'),
      gap(),
      h2('14.2 Network Reset'),
      ...reqBlock('FR-022', 'Fungsi Network Reset', 'Sistem harus menyediakan fungsi "Reset Network" yang memungkinkan pengguna mereset konfigurasi jaringan pada perangkat ESP32.'),
      ...reqBlock('FR-023', 'Kondisi Setelah Network Reset', 'Setelah Network Reset berhasil dilakukan: (1) Konfigurasi WiFi sebelumnya di-reset pada ESP32, (2) ESP32 kembali menyediakan akses melalui BLE, (3) ESP32 menyediakan WiFi Hotspot, (4) Pengguna dapat melakukan konfigurasi jaringan ulang. Kepemilikan perangkat dan data monitoring historis TIDAK berubah.'),
      ...reqBlock('ASM-007', 'Implementasi Firmware Reset', 'Detail teknis implementasi Network Reset pada firmware ESP32 belum tersedia. Requirement ini mencatat tujuan fungsional saja, bukan spesifikasi teknis firmware.', 'ASSUMPTION'),
      gap(),
      ...reqBlock('REC-001', 'Recovery Konfigurasi Pasca Network Reset', 'Setelah Network Reset berhasil dilakukan, pengguna harus dapat melakukan konfigurasi WiFi ulang dengan flow yang sama seperti pendaftaran awal (input credential via BLE ke ESP32). PENTING: Device ownership dan asosiasi dengan user pengguna TIDAK berubah, sehingga pengguna tidak perlu mendaftarkan ulang perangkat ke akun. Data monitoring historis TETAP disimpan di backend.'),
      gap(),

      // ── 15. MONITORING REQUIREMENTS ──────────────────────────────────────
      h1('15. Monitoring Requirements'),
      h2('15.1 Data Monitoring'),
      ...reqBlock('FR-024', 'Water Level', 'Perangkat harus menyediakan data water level. Water level adalah informasi monitoring utama dalam sistem TAGANA.'),
      ...reqBlock('FR-025', 'GPS/Location', 'Perangkat harus menyediakan data lokasi GPS.'),
      ...reqBlock('FR-026', 'Battery Status', 'Perangkat harus melaporkan status baterai.'),
      ...reqBlock('FR-027', 'WiFi Status', 'Perangkat harus melaporkan status koneksi WiFi.'),
      ...reqBlock('FR-028', 'Connection Status', 'Sistem harus dapat mengetahui apakah perangkat sedang online atau offline.'),
      ...reqBlock('FR-029', 'Last Update', 'Sistem harus mencatat dan menampilkan waktu terakhir data diterima dari perangkat.'),
      gap(),
      h2('15.2 Data yang Belum Final'),
      body('Hal-hal berikut terkait monitoring BELUM DIPUTUSKAN:'),
      bullet('[OQ-002] Spesifikasi sensor water level (jenis, satuan, rentang nilai, akurasi).'),
      bullet('[OQ-012] Format data GPS/location (koordinat lat/long, format string, dll.).'),
      bullet('[OQ-014] Frekuensi pengiriman data monitoring dalam kondisi normal.'),
      bullet('[OQ-011] Threshold atau ambang batas water level untuk notifikasi/alert.'),
      gap(),

      // ── 16. USER MANAGEMENT REQUIREMENTS ─────────────────────────────────
      h1('16. User Management Requirements'),
      ...reqBlock('FR-030', 'Registrasi Pengguna', 'Pengguna harus dapat membuat profil dengan menggunakan nama. Ini adalah langkah pertama sebelum dapat menggunakan sistem.'),
      ...reqBlock('FR-031', 'Asosiasi Pengguna-Perangkat', 'Sistem harus menyimpan asosiasi antara pengguna dan perangkat yang dimilikinya di backend.'),
      ...reqBlock('FR-032', 'Filter Berdasarkan Kepemilikan', 'Seluruh tampilan data (Dashboard, Peta, Riwayat) harus difilter berdasarkan perangkat yang dimiliki pengguna yang sedang aktif.'),
      gap(),
      h2('16.1 Mekanisme yang Belum Final'),
      body('Hal-hal berikut terkait manajemen pengguna BELUM DIPUTUSKAN:'),
      bullet('[OQ-001] Bagaimana pengguna dikenali kembali setelah aplikasi di-install ulang (recovery identity).'),
      bullet('[OQ-006] Rencana autentikasi jangka panjang (email, OTP, nomor HP, dll.).'),
      bullet('[OQ-008] Batas jumlah perangkat yang dapat dimiliki oleh satu pengguna.'),
      bullet('[OQ-015] Aturan claiming: bagaimana jika perangkat sudah dimiliki pengguna lain, transfer kepemilikan, shared ownership.'),
      gap(),

      // ── 17. EMERGENCY & OFFLINE OPERATION ────────────────────────────────
      h1('17. Emergency & Offline Operation'),
      ...reqBlock('FR-033', 'Deteksi Kondisi Darurat', 'Aplikasi harus dapat mendeteksi atau mengindikasikan kondisi ketika perangkat tidak terhubung ke internet.'),
      ...reqBlock('FR-034', 'Akses Darurat via BLE', 'Ketika internet tidak tersedia, aplikasi harus menyediakan jalur komunikasi langsung ke perangkat melalui BLE.'),
      ...reqBlock('FR-035', 'Akses Darurat via Hotspot', 'Ketika internet tidak tersedia, aplikasi harus menyediakan instruksi atau mekanisme untuk menghubungkan pengguna ke Local Web Interface ESP32 melalui hotspot.'),
      ...reqBlock('FR-036', 'Tombol/Link Local Web', 'Aplikasi harus menyediakan tombol atau tautan yang memudahkan pengguna membuka Local Web Interface ESP32 di browser ketika terhubung ke hotspot ESP32.'),
      gap(),

      // ── 18. NETWORK RESET & RECOVERY ─────────────────────────────────────
      h1('18. Network Reset & Recovery'),
      ...reqBlock('FR-037', 'Trigger Network Reset', 'Pengguna dapat memicu Network Reset melalui antarmuka aplikasi mobile.'),
      ...reqBlock('FR-038', 'Hasil Network Reset', 'Setelah Network Reset: konfigurasi jaringan sebelumnya di-reset/dihapus sesuai implementasi firmware; ESP32 menyediakan BLE; ESP32 menyediakan WiFi Hotspot; pengguna dapat melakukan konfigurasi jaringan ulang.'),
      ...reqBlock('REC-002', 'Recovery Pasca Reinstall', 'Sistem harus menyediakan mekanisme agar perangkat yang sebelumnya dimiliki pengguna dapat dipulihkan tanpa harus mendaftarkan ulang satu per satu setelah aplikasi di-install ulang.', 'OPEN'),
      body('[OQ-001] — Mekanisme recovery identity/user setelah reinstall BELUM DITENTUKAN. Jangan memilih metode spesifik tanpa keputusan formal.'),
      gap(),

      // ── 19. DATA REQUIREMENTS ─────────────────────────────────────────────
      h1('19. Data Requirements'),
      ...reqBlock('DATA-001', 'Penyimpanan Kepemilikan', 'Data kepemilikan perangkat (relasi pengguna-perangkat) harus disimpan di backend Supabase.'),
      ...reqBlock('DATA-002', 'Data Monitoring', 'Data monitoring perangkat (water level, GPS, battery, WiFi status, connection status, last update) harus disimpan di backend.'),
      ...reqBlock('DATA-003', 'Identitas Pengguna', 'Identitas pengguna harus disimpan di backend sebagai basis pengelolaan kepemilikan perangkat.'),
      gap(),
      h2('19.1 Data yang Belum Final'),
      body('Hal-hal berikut terkait data BELUM DIPUTUSKAN:'),
      bullet('[OQ-004] Kebijakan retensi data riwayat monitoring.'),
      bullet('[OQ-004] Granularitas data (per detik, per menit, per jam, dll.).'),
      bullet('[OQ-004] Aggregasi data untuk tampilan riwayat.'),
      bullet('[OQ-004] Kemungkinan fitur export data.'),
      bullet('[OQ-012] Format data GPS/location.'),
      bullet('[OQ-014] Frekuensi pengiriman data dari ESP32 ke backend.'),
      gap(),

      // ── 20. SECURITY REQUIREMENTS ─────────────────────────────────────────
      h1('20. Security Requirements'),
      ...reqBlock('SEC-001', 'Ownership Validation', 'Backend harus memvalidasi bahwa pengguna yang meminta data perangkat adalah pemilik sah perangkat tersebut. Semua request untuk data atau operasi pada perangkat harus melalui validasi ini. Jika validasi gagal, backend harus menolak request dengan error yang jelas (403 Forbidden atau error yang sesuai).'),
      ...reqBlock('SEC-002', 'Device Code Uniqueness', 'Sistem harus memastikan tidak ada duplikasi kode TGN (Device Code) di seluruh sistem. Mekanisme enforcement: Database constraint, API validation, atau kombinasi keduanya.'),
      ...reqBlock('SEC-003', 'Data Isolation per User', 'Seluruh data yang ditampilkan kepada pengguna (Dashboard, Peta, Riwayat, Detail Perangkat) harus di-filter berdasarkan perangkat yang dimiliki pengguna tersebut. Sistem harus menolak akses pengguna untuk melihat atau memodifikasi perangkat yang tidak dimilikinya. Ini adalah enforcement dari ownership validation (SEC-001).'),
      body('[OQ-007] — Detail keamanan BLE pairing dan mekanisme device verification BELUM FINAL. Lihat bagian Open Questions.'),
      body('[OQ-006] — Mekanisme autentikasi pengguna jangka panjang BELUM FINAL. Lihat bagian Open Questions.'),
      gap(),

      // ── 21. ERROR & EXCEPTION REQUIREMENTS ───────────────────────────────
      h1('21. Error & Exception Requirements'),
      body('[OQ-009] — Requirement detail untuk error handling pada seluruh skenario berikut BELUM FINAL. Daftar skenario error yang perlu dipertimbangkan:'),
      gap(),
      h2('21.1 Error Terkait BLE'),
      ...reqBlock('ERR-001', 'BLE Device Tidak Ditemukan', 'Behavior ketika perangkat BLE tidak ditemukan dalam rentang waktu tertentu BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-002', 'Bluetooth Tidak Aktif', 'Behavior ketika Bluetooth pada perangkat mobile tidak aktif BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-003', 'Permission Bluetooth Ditolak', 'Behavior ketika izin Bluetooth pada aplikasi ditolak pengguna BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-004', 'Device Verification Gagal', 'Behavior ketika proses device verification melalui BLE gagal BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-005', 'Device Code Salah', 'Behavior ketika kode TGN yang dimasukkan pengguna tidak valid atau tidak dikenali sistem BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-006', 'Device Mismatch', 'Behavior ketika perangkat BLE yang ditemukan tidak sesuai dengan kode TGN yang dimasukkan BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-007', 'Pairing Gagal', 'Behavior ketika proses BLE pairing gagal BELUM DITENTUKAN.', 'OPEN'),
      gap(),
      h2('21.2 Error Terkait Jaringan'),
      ...reqBlock('ERR-008', 'WiFi Gagal', 'Behavior ketika konfigurasi WiFi pada perangkat gagal BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-009', 'Password WiFi Salah', 'Behavior ketika password WiFi yang dimasukkan salah BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-010', 'WiFi Terputus', 'Behavior ketika koneksi WiFi perangkat terputus setelah berhasil terhubung BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-011', 'Internet Tidak Tersedia', 'Behavior aplikasi ketika koneksi internet tidak tersedia BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-012', 'Backend Tidak Tersedia', 'Behavior aplikasi ketika backend tidak dapat dijangkau BELUM DITENTUKAN.', 'OPEN'),
      gap(),
      h2('21.3 Error Terkait Perangkat'),
      ...reqBlock('ERR-013', 'Device Sudah Dimiliki User Lain', 'Behavior ketika perangkat yang coba didaftarkan sudah terdaftar atas nama pengguna lain BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-014', 'Device Offline Lama', 'Behavior ketika perangkat tidak mengirimkan data dalam waktu yang lama BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-015', 'GPS Tidak Tersedia', 'Behavior ketika data GPS dari perangkat tidak tersedia BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-016', 'GPS Tidak Akurat', 'Behavior ketika data GPS dari perangkat tersedia namun tidak akurat BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-017', 'Battery Kritis', 'Behavior sistem ketika baterai perangkat dalam kondisi kritis BELUM DITENTUKAN.', 'OPEN'),
      gap(),
      h2('21.4 Error Terkait Akses Darurat'),
      ...reqBlock('ERR-018', 'Hotspot Tidak Tersedia', 'Behavior ketika hotspot ESP32 tidak dapat diakses BELUM DITENTUKAN.', 'OPEN'),
      ...reqBlock('ERR-019', 'Local Web Tidak Dapat Diakses', 'Behavior ketika Local Web Interface ESP32 tidak dapat diakses melalui browser BELUM DITENTUKAN.', 'OPEN'),
      gap(),

      // ── 22. ASSUMPTIONS ───────────────────────────────────────────────────
      h1('22. Assumptions'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          headerRow(['ID', 'Asumsi', 'Perlu Validasi'], [1200, 6860, 1300]),
          ...[
            ['ASM-001', 'Identitas pengguna yang dibuat disimpan di backend untuk keperluan asosiasi kepemilikan perangkat.', 'Ya'],
            ['ASM-002', 'Perangkat memiliki kemampuan GPS atau mekanisme lokasi. Spesifikasi teknis belum final.', 'Ya'],
            ['ASM-003', 'Perangkat menggunakan baterai dan dapat melaporkan status daya baterai.', 'Ya'],
            ['ASM-004', 'Aplikasi mobile ditargetkan untuk Android dan/atau iOS. Platform spesifik belum diputuskan.', 'Ya'],
            ['ASM-005', 'BLE pada ESP32 tetap aktif atau dapat diaktifkan saat internet tidak tersedia.', 'Ya — validasi dengan firmware'],
            ['ASM-006', 'Terdapat mekanisme verifikasi BLE untuk memastikan perangkat yang ditemukan adalah perangkat yang benar.', 'Ya — detail belum final'],
            ['ASM-007', 'Detail teknis implementasi Network Reset pada firmware ESP32 belum tersedia. Requirement mencatat tujuan fungsional saja.', 'Ya — validasi dengan tim hardware'],
          ].map(([id, asm, val]) => new TableRow({ children: [
            cell(id, { bold: true, color: C.orange, size: 20 }, C.white, 1200),
            cell(asm, { size: 20 }, C.white, 6860),
            cell(val, { size: 20 }, C.white, 1300),
          ]}))
        ]
      }),
      gap(),

      // ── 23. CONSTRAINTS ───────────────────────────────────────────────────
      h1('23. Constraints'),
      ...reqBlock('CON-001', 'ESP32 sebagai Hardware Utama', 'Sistem HARUS menggunakan ESP32 sebagai mikrokontroler perangkat IoT. Tidak ada alternatif hardware lain yang dipertimbangkan dalam versi ini.'),
      ...reqBlock('CON-002', 'Flutter sebagai Platform Mobile', 'Aplikasi mobile HARUS dikembangkan menggunakan Flutter.'),
      ...reqBlock('CON-003', 'Supabase sebagai Database', 'Database HARUS menggunakan Supabase.'),
      ...reqBlock('CON-004', 'Hasura Cloud sebagai API Layer', 'Layer API HARUS menggunakan Hasura Cloud dengan GraphQL.'),
      ...reqBlock('CON-005', 'Format Device Code', 'Format kode perangkat HARUS menggunakan format TGN_XXXX. Format ini tidak dapat diubah pada versi ini.'),
      ...reqBlock('CON-006', 'Tanpa Email/Password pada Versi Awal', 'Versi awal sistem TIDAK menggunakan email/password sebagai metode autentikasi utama.'),
      ...reqBlock('CON-007', 'BLE untuk Konfigurasi Awal', 'Konfigurasi awal dan verifikasi perangkat HARUS dilakukan melalui BLE.'),
      gap(),

      // ── 24. OPEN QUESTIONS ────────────────────────────────────────────────
      h1('24. Open Questions / Unresolved Requirements'),
      body('Bagian ini mencatat seluruh requirement yang belum diputuskan. Setiap item dikelompokkan berdasarkan prioritas penyelesaian.'),
      gap(),

      // P0
      new Paragraph({
        children: [
          new TextRun({ text: 'P0 ', bold: true, size: 28, color: C.red }),
          new TextRun({ text: '— Harus diputuskan SEBELUM architecture / design dimulai', size: 24, color: C.red }),
        ],
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.red } },
      }),
      gap(),
      ...oqBlock('OQ-001', 'P0',
        'Recovery Identity/User: Bagaimana sistem mengenali dan memulihkan identitas pengguna beserta kepemilikan perangkatnya setelah aplikasi di-uninstall dan di-install kembali? Keputusan ini mempengaruhi seluruh arsitektur autentikasi dan data pengguna.',
        ['Recovery code yang diberikan saat registrasi', 'Email sebagai identitas permanen', 'Nomor HP + OTP', 'Device fingerprint', 'Mekanisme lain — BELUM DIPUTUSKAN']
      ),
      ...oqBlock('OQ-015', 'P0',
        'Device Claiming & Ownership Rules: (a) Bagaimana perangkat pertama kali diklaim oleh pengguna? (b) Apa yang terjadi jika perangkat yang coba didaftarkan sudah dimiliki pengguna lain? (c) Apakah kepemilikan dapat dipindahkan? (d) Apakah satu perangkat dapat dimiliki lebih dari satu pengguna? Keputusan ini mempengaruhi model data, API, dan flow pendaftaran.',
        ['First-come-first-served: siapa pertama mendaftar, dialah pemiliknya', 'Admin approval untuk klaim perangkat', 'Transfer kepemilikan dengan konfirmasi kedua belah pihak', 'Multi-ownership — BELUM DIPUTUSKAN']
      ),
      ...oqBlock('OQ-007', 'P0',
        'Keamanan BLE Pairing & Device Verification: Mekanisme apa yang digunakan untuk memastikan komunikasi BLE aman dan perangkat yang terverifikasi adalah perangkat yang benar? Termasuk: enkripsi, challenge-response, token, dll.',
        ['Challenge-response berbasis shared secret', 'Token yang di-embed pada firmware saat produksi', 'PIN yang ditampilkan di perangkat', 'Tanpa enkripsi tambahan untuk versi awal — BELUM DIPUTUSKAN']
      ),
      ...oqBlock('OQ-006', 'P0',
        'Rencana Autentikasi Jangka Panjang: Apakah sistem akan mengadopsi email/password, OAuth, nomor HP, atau metode lain di masa depan? Keputusan ini mempengaruhi desain database pengguna dan API dari awal.',
        ['Email + password', 'Google/Apple OAuth', 'Nomor HP + OTP', 'Tetap tanpa autentikasi formal — BELUM DIPUTUSKAN']
      ),

      // P1
      new Paragraph({
        children: [
          new TextRun({ text: 'P1 ', bold: true, size: 28, color: C.orange }),
          new TextRun({ text: '— Harus diputuskan SEBELUM implementation dimulai', size: 24, color: C.orange }),
        ],
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.orange } },
      }),
      gap(),
      ...oqBlock('OQ-002', 'P1',
        'Spesifikasi Sensor Water Level: Jenis sensor apa yang digunakan? Apa satuan datanya (cm, meter, %)? Berapa rentang nilai yang valid? Berapa akurasi yang diperlukan? Apakah ada kalibrasi?',
        null
      ),
      ...oqBlock('OQ-004', 'P1',
        'Struktur & Retensi Data Riwayat: (a) Berapa lama data riwayat disimpan? (b) Berapa granularitas data (per detik/menit/jam)? (c) Apakah ada aggregasi data? (d) Dalam bentuk apa riwayat ditampilkan (tabel, grafik)? (e) Apakah ada fitur export data?',
        null
      ),
      ...oqBlock('OQ-009', 'P1',
        'Penanganan Error & Exception: Apa behavior sistem untuk setiap skenario error yang tercatat pada Bab 21? Termasuk pesan error, retry policy, fallback behavior, dan notifikasi kepada pengguna.',
        null
      ),
      ...oqBlock('OQ-010', 'P1',
        'Non-Functional Targets: Berapa target latensi pengiriman data? Berapa target uptime sistem? Berapa jumlah perangkat maksimum yang dapat dikelola? Berapa besar data yang dikirim per pengiriman?',
        null
      ),
      ...oqBlock('OQ-011', 'P1',
        'Notifikasi & Alert: Apakah sistem menyediakan notifikasi ketika water level melampaui ambang batas tertentu? Jika ya: apa threshold-nya? Bagaimana mekanisme notifikasinya (push notification, in-app, dll.)? Siapa yang menerima notifikasi?',
        null
      ),
      ...oqBlock('OQ-014', 'P1',
        'Frekuensi Pengiriman Data: Seberapa sering ESP32 mengirimkan data monitoring ke backend dalam kondisi normal? Apakah frekuensi berubah pada kondisi tertentu (darurat, battery rendah)?',
        null
      ),

      // P2
      new Paragraph({
        children: [
          new TextRun({ text: 'P2 ', bold: true, size: 28, color: C.green }),
          new TextRun({ text: '— Dapat diputuskan setelah architecture/design selesai', size: 24, color: C.green }),
        ],
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.green } },
      }),
      gap(),
      ...oqBlock('OQ-003', 'P2',
        'Role Selain End User: Apakah sistem memerlukan role lain seperti Admin, Supervisor, atau Operator? Jika ya, apa saja hak akses masing-masing role?',
        null
      ),
      ...oqBlock('OQ-005', 'P2',
        'Detail Halaman Peta: Bagaimana behavior halaman Peta secara detail? Apakah ada clustering untuk banyak perangkat? Apakah ada filter berdasarkan status? Apakah ada navigasi ke detail dari pin peta?',
        null
      ),
      ...oqBlock('OQ-008', 'P2',
        'Batas Jumlah Perangkat per User: Apakah ada batas maksimum perangkat yang dapat dimiliki satu pengguna? Jika ya, berapa batasnya?',
        null
      ),
      ...oqBlock('OQ-012', 'P2',
        'Format Data GPS/Location: Dalam format apa data lokasi disimpan dan ditampilkan? (Koordinat desimal lat/long, DMS, format lain?) Apa sumber data lokasi pada perangkat?',
        null
      ),
      ...oqBlock('OQ-013', 'P2',
        'Cakupan Platform: Platform mobile apa yang menjadi target (Android, iOS, atau keduanya)? Berapa versi OS minimum yang didukung?',
        null
      ),
      gap(),

      // P2 CONTINUED - NEW OPEN QUESTIONS
      ...oqBlock('OQ-016', 'P1',
        'Battery Alert & Notification: (a) Apakah sistem menyediakan alert/notifikasi ketika battery level mencapai kondisi kritis? (b) Jika ya: threshold battery kritis berapa persen? (c) Mekanisme notifikasi apa (push notification, in-app alert, dashboard indicator)? (d) Siapa yang menerima notifikasi?',
        null
      ),
      ...oqBlock('OQ-017', 'P2',
        'Halaman Pengaturan (Settings): Apa saja fitur/option yang harus ada di halaman Pengaturan? Possible items: (a) User profile / Account management, (b) Notification preferences, (c) App preferences/settings, (d) About/Help, (e) Logout/Remove account, (f) Other — BELUM DIPUTUSKAN',
        null
      ),
      ...oqBlock('OQ-018', 'P2',
        'Offline Data Caching Strategy: Ketika aplikasi beroperasi offline (via BLE atau Hotspot), (a) Data apa yang di-cache di app? (b) Kapan cache di-refresh ketika online kembali? (c) Apakah pengguna dapat mengubah data offline atau hanya view? (d) Bagaimana handling conflict jika data berubah di backend?',
        null
      ),
      gap(),

      // ── 25. REQUIREMENT TRACEABILITY SUMMARY ─────────────────────────────
      pageBreak(),
      h1('25. Requirement Traceability Summary'),
      body('Tabel berikut merangkum seluruh requirement dalam dokumen ini. Status: CONFIRMED = final; ASSUMPTION = perlu validasi; OPEN = belum diputuskan.'),
      gap(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          headerRow(['ID', 'Requirement', 'Status', 'Notes'], [1200, 5800, 1160, 1200]),
          ...[
            // Functional
            ['FR-001', 'Pembuatan profil pengguna dengan nama', 'CONFIRMED', ''],
            ['FR-002', 'Tanpa email/password pada versi awal', 'CONFIRMED', ''],
            ['FR-003', 'Device code format TGN_XXXX', 'CONFIRMED', ''],
            ['FR-004', 'Keunikan device code di seluruh sistem', 'CONFIRMED', ''],
            ['FR-005', 'Ownership perangkat disimpan di backend', 'CONFIRMED', ''],
            ['FR-006', 'Satu user dapat memiliki banyak perangkat', 'CONFIRMED', ''],
            ['FR-007', 'Flow pendaftaran perangkat pertama via BLE', 'CONFIRMED', ''],
            ['FR-008', 'Tambah perangkat berikutnya via fitur Tambah Perangkat', 'CONFIRMED', ''],
            ['FR-009', 'Empat halaman navigasi utama', 'CONFIRMED', ''],
            ['FR-010', 'Dashboard hanya tampilkan perangkat milik user', 'CONFIRMED', ''],
            ['FR-011', 'Dashboard tampilkan ringkasan status perangkat', 'CONFIRMED', ''],
            ['FR-012', 'Navigasi ke detail perangkat dari Dashboard', 'CONFIRMED', ''],
            ['FR-013', 'Detail perangkat menampilkan 7 informasi utama', 'CONFIRMED', ''],
            ['FR-014', 'Peta menampilkan perangkat milik user saja', 'CONFIRMED', 'Detail behavior: OQ-005'],
            ['FR-015', 'Riwayat untuk data monitoring historis', 'CONFIRMED', 'Detail: OQ-004'],
            ['FR-016', 'Fitur manajemen perangkat', 'CONFIRMED', ''],
            ['FR-017', 'Konfigurasi WiFi via BLE saat pendaftaran', 'CONFIRMED', ''],
            ['FR-018', 'Akses Local Web Interface via tombol/link aplikasi', 'CONFIRMED', ''],
            ['FR-019', 'Input device code manual oleh pengguna', 'CONFIRMED', ''],
            ['FR-020', 'BLE discovery setelah input device code', 'CONFIRMED', ''],
            ['FR-021', 'Device verification berbasis BLE', 'CONFIRMED', 'Detail keamanan: OQ-007'],
            ['FR-022', 'Fungsi Network Reset', 'CONFIRMED', ''],
            ['FR-023', 'Kondisi setelah Network Reset', 'CONFIRMED', 'Detail firmware: ASM-007'],
            ['FR-024', 'Data water level sebagai monitoring utama', 'CONFIRMED', 'Spesifikasi sensor: OQ-002'],
            ['FR-025', 'Data GPS/Location', 'CONFIRMED', 'Format: OQ-012'],
            ['FR-026', 'Battery status', 'CONFIRMED', ''],
            ['FR-027', 'WiFi status', 'CONFIRMED', ''],
            ['FR-028', 'Connection status (online/offline)', 'CONFIRMED', ''],
            ['FR-029', 'Last update timestamp', 'CONFIRMED', ''],
            ['FR-030', 'Registrasi pengguna dengan nama', 'CONFIRMED', ''],
            ['FR-031', 'Asosiasi pengguna-perangkat di backend', 'CONFIRMED', ''],
            ['FR-032', 'Filter data berdasarkan kepemilikan pengguna', 'CONFIRMED', ''],
            ['FR-033', 'Deteksi kondisi darurat (offline)', 'CONFIRMED', ''],
            ['FR-034', 'Akses darurat via BLE', 'CONFIRMED', ''],
            ['FR-035', 'Akses darurat via Hotspot', 'CONFIRMED', ''],
            ['FR-036', 'Tombol/link Local Web Interface di aplikasi', 'CONFIRMED', ''],
            ['FR-037', 'Trigger Network Reset dari aplikasi', 'CONFIRMED', ''],
            ['FR-038', 'Hasil Network Reset pada ESP32', 'CONFIRMED', 'Detail firmware: ASM-007'],
            // NFR
            ['NFR-001', 'Konsistensi data ownership antara app dan backend', 'CONFIRMED', ''],
            // HW
            ['HW-001', 'ESP32 sebagai mikrokontroler', 'CONFIRMED', ''],
            ['HW-002', 'BLE support pada ESP32', 'CONFIRMED', ''],
            ['HW-003', 'WiFi support pada ESP32', 'CONFIRMED', ''],
            ['HW-004', 'WiFi Hotspot pada ESP32', 'CONFIRMED', ''],
            ['HW-005', 'Local Web Interface pada ESP32', 'CONFIRMED', ''],
            ['HW-006', 'Sensor water level', 'CONFIRMED', 'Spesifikasi: OQ-002'],
            // SW
            ['SW-001', 'Flutter untuk aplikasi mobile', 'CONFIRMED', ''],
            ['SW-002', 'Supabase sebagai database', 'CONFIRMED', ''],
            ['SW-003', 'Hasura Cloud sebagai API layer (GraphQL)', 'CONFIRMED', ''],
            // NET
            ['NET-001', 'Jalur konektivitas normal via WiFi-Internet-Backend', 'CONFIRMED', ''],
            ['NET-002', 'Jalur darurat via BLE', 'CONFIRMED', ''],
            ['NET-003', 'Jalur darurat via WiFi Hotspot ESP32', 'CONFIRMED', ''],
            // DATA
            ['DATA-001', 'Penyimpanan kepemilikan di Supabase', 'CONFIRMED', ''],
            ['DATA-002', 'Penyimpanan data monitoring di backend', 'CONFIRMED', 'Retensi: OQ-004'],
            ['DATA-003', 'Identitas pengguna di backend', 'CONFIRMED', ''],
            // SEC
            ['SEC-001', 'Validasi kepemilikan di backend, tolak request yang unauthorized', 'CONFIRMED', ''],
            ['SEC-002', 'Keunikan device code dijaga sistem', 'CONFIRMED', ''],
            ['SEC-003', 'Data isolation per user — filter semua data berdasarkan ownership', 'CONFIRMED', 'Enforcement dari SEC-001 & FR-032'],
            // REC
            ['REC-001', 'Recovery konfigurasi pasca network reset', 'CONFIRMED', ''],
            ['REC-002', 'Recovery perangkat pasca reinstall aplikasi', 'OPEN', 'OQ-001'],
            // ERR
            ['ERR-001', 'BLE device tidak ditemukan', 'OPEN', 'OQ-009'],
            ['ERR-002', 'Bluetooth tidak aktif', 'OPEN', 'OQ-009'],
            ['ERR-003', 'Permission Bluetooth ditolak', 'OPEN', 'OQ-009'],
            ['ERR-004', 'Device verification gagal', 'OPEN', 'OQ-009'],
            ['ERR-005', 'Device code salah/tidak ditemukan', 'OPEN', 'OQ-009'],
            ['ERR-006', 'Device mismatch', 'OPEN', 'OQ-009'],
            ['ERR-007', 'BLE pairing gagal', 'OPEN', 'OQ-009'],
            ['ERR-008', 'Konfigurasi WiFi gagal', 'OPEN', 'OQ-009'],
            ['ERR-009', 'Password WiFi salah', 'OPEN', 'OQ-009'],
            ['ERR-010', 'WiFi terputus', 'OPEN', 'OQ-009'],
            ['ERR-011', 'Internet tidak tersedia', 'OPEN', 'OQ-009'],
            ['ERR-012', 'Backend tidak tersedia', 'OPEN', 'OQ-009'],
            ['ERR-013', 'Device sudah dimiliki user lain', 'OPEN', 'OQ-009, OQ-015'],
            ['ERR-014', 'Device offline dalam waktu lama', 'OPEN', 'OQ-009'],
            ['ERR-015', 'GPS tidak tersedia', 'OPEN', 'OQ-009'],
            ['ERR-016', 'GPS tidak akurat', 'OPEN', 'OQ-009'],
            ['ERR-017', 'Battery kritis', 'OPEN', 'OQ-009, OQ-011'],
            ['ERR-018', 'Hotspot tidak tersedia', 'OPEN', 'OQ-009'],
            ['ERR-019', 'Local web tidak dapat diakses', 'OPEN', 'OQ-009'],
            // ASM
            ['ASM-001', 'Identitas pengguna disimpan di backend', 'ASSUMPTION', ''],
            ['ASM-002', 'Perangkat memiliki kemampuan GPS', 'ASSUMPTION', 'OQ-012'],
            ['ASM-003', 'Perangkat menggunakan baterai', 'ASSUMPTION', ''],
            ['ASM-004', 'Target platform Android dan/atau iOS', 'ASSUMPTION', 'OQ-013'],
            ['ASM-005', 'BLE aktif saat internet tidak tersedia', 'ASSUMPTION', 'Validasi firmware'],
            ['ASM-006', 'Terdapat mekanisme verifikasi BLE', 'ASSUMPTION', 'OQ-007'],
            ['ASM-007', 'Detail firmware network reset belum tersedia', 'ASSUMPTION', ''],
            // CON
            ['CON-001', 'ESP32 sebagai hardware utama (wajib)', 'CONFIRMED', ''],
            ['CON-002', 'Flutter sebagai platform mobile (wajib)', 'CONFIRMED', ''],
            ['CON-003', 'Supabase sebagai database (wajib)', 'CONFIRMED', ''],
            ['CON-004', 'Hasura Cloud sebagai API layer (wajib)', 'CONFIRMED', ''],
            ['CON-005', 'Format device code TGN_XXXX (wajib)', 'CONFIRMED', ''],
            ['CON-006', 'Tanpa email/password pada versi awal (wajib)', 'CONFIRMED', ''],
            ['CON-007', 'BLE wajib untuk konfigurasi awal (wajib)', 'CONFIRMED', ''],
          ].map(([id, req, status, notes]) => reqRow(id, req, status, notes))
        ]
      }),
      gap(),
      gap(),
      new Paragraph({
        children: [
          new TextRun({ text: '— End of Document —', italics: true, size: 22, color: C.darkGray }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('d:/document/TAGANA_SRS_v1.0_REVIEWED.docx', buffer);
  console.log('Done! Document generated as: TAGANA_SRS_v1.0_REVIEWED.docx');
});