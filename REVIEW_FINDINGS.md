# TAGANA System Requirements Specification v1.0
## Review Findings & Consolidated Issues

**Tanggal Review:** August 13, 2026  
**Status:** Draft — Pending Stakeholder Review  
**Reviewer:** Technical Documentation Review  

---

## 1. MASALAH YANG DITEMUKAN

### 1.1 Critical Issues

#### A. Gap pada Halaman Pengaturan (Settings)
**Severity:** HIGH  
**Issue:** FR-009 menyebutkan 4 halaman navigasi utama (Dashboard, Peta, Riwayat, Pengaturan), namun tidak ada requirement yang mendefinisikan apa yang harus ada di halaman Pengaturan.

**Current State:**
- FR-009: "Aplikasi harus menyediakan empat halaman utama..."
- Tapi Pengaturan (Settings) tidak dijelaskan sama sekali

**Rekomendasi:**
- Tambahkan requirement untuk halaman Pengaturan (FR-039 onwards)
- Atau jika Settings belum final, tandai sebagai OPEN Questions (OQ-016)
- ATAU jika Settings bukan scope v1.0, ubah FR-009 menjadi 3 halaman saja

#### B. Spesifikasi Input WiFi Configuration Tidak Jelas
**Severity:** HIGH  
**Issue:** FR-017 menyebutkan "input konfigurasi WiFi" tapi tidak spesifik apa yang perlu di-input (SSID? Password? Security type?)

**Current State:**
```
FR-017: Selama proses pendaftaran perangkat, aplikasi harus memungkinkan 
pengguna untuk mengonfigurasi koneksi WiFi pada perangkat melalui antarmuka BLE.
```

**Rekomendasi:**
- Jelas-jelas sebutkan bahwa pengguna harus input: SSID, Password, dan mungkin Security Type
- Atau tanda sebagai OPEN jika detail belum final

#### C. Battery Alert vs Status Display
**Severity:** MEDIUM  
**Issue:** Inconsistency antara FR-026 (battery status display) dan ERR-017 (behavior ketika battery kritis)

**Current State:**
- FR-026: "Perangkat harus melaporkan status baterai" [Display status]
- ERR-017: "Behavior ketika baterai perangkat dalam kondisi kritis BELUM DITENTUKAN" [Ask decision]
- OQ-011: Hanya mencakup water level alert, tidak battery alert

**Rekomendasi:**
- Jika ada battery alert feature, tambahkan requirement terpisah (FR-040: Battery Alert)
- Tambahkan ke Open Questions: "OQ-016: Battery Alert Threshold & Notification"
- Klarifikasi apakah battery status hanya display atau ada alert mechanism

#### D. Data Isolation & Multi-User Access Control
**Severity:** HIGH  
**Issue:** Requirement tentang "data isolation per user" tersebar dan tidak eksplisit

**Current State:**
- FR-010: Dashboard hanya tampilkan perangkat milik user
- FR-014: Peta hanya tampilkan perangkat milik user
- FR-032: Filter data berdasarkan kepemilikan
- SEC-001: Backend validate ownership
- Tapi TIDAK ada requirement yang jelas: "Sistem harus menolak akses user untuk melihat/memodifikasi perangkat milik user lain"

**Rekomendasi:**
- Tambahkan requirement eksplisit: FR-041: "Data Access Control — sistem harus menolak permintaan data perangkat yang tidak dimiliki pengguna"
- ATAU konsolidasikan ke NFR-002: "Data Isolation & Access Control"

#### E. Settings Page Features Undefined
**Severity:** HIGH  
**Issue:** Halaman Pengaturan disebutkan di FR-009 tapi content tidak didefinisikan

**Possible Settings Features:**
- User profile management
- Device management
- Notification preferences
- App preferences
- About/Help
- Logout/Remove account

**Rekomendasi:**
- Jika tidak scope v1.0, hapus dari FR-009 atau tandai sebagai OPEN
- Jika scope v1.0, tambahkan FR-042 dst

### 1.2 Moderate Issues

#### A. Konsistensi Naming: "Device Code" vs "Device ID"
**Severity:** MEDIUM  
**Issue:** Dokumen inconsistent menggunakan istilah "Device Code" dan "kode TGN"

**Current State:**
- FR-003: "Device Code"
- FR-019: "Device Code" / "kode TGN"
- Diagram: "TGN_XXXX"

**Rekomendasi:**
- Standardisasi: gunakan "Device Code" atau "Device ID"
- Jelas-jelas state format: TGN_XXXX dengan XXXX adalah 4 digit numerik (0001-9999)

#### B. Pemulihan Pasca Network Reset vs Recovery Identity
**Severity:** MEDIUM  
**Issue:** REC-001 dan REC-002 bisa membingungkan

**Current State:**
- REC-001: "Recovery Pasca Network Reset" — recover konfigurasi jaringan, tidak perlu re-register
- REC-002: "Recovery Pasca Reinstall Aplikasi" — OPEN, perlu mekanisme recovery identity

**Rekomendasi:**
- Jelas-jelas bedakan dua scenario:
  1. Network Reset: perangkat forget WiFi config, app perlu re-config WiFi (tidak forget ownership)
  2. App Reinstall: app forget user identity, perlu mechanism untuk restore (depend OQ-001)

#### C. Undefined "Local Web Interface" Behavior
**Severity:** MEDIUM  
**Issue:** FR-018, FR-035, FR-036 mention local web interface tapi:
- Format akses (URL/localhost port?) tidak didefinisikan
- Apa yang bisa dilakukan di local web tidak jelas
- Apakah offline-only atau bisa akses saat WiFi available?

**Rekomendasi:**
- Tambahkan requirement: "Local Web Interface harus accessible via hotspot dengan URL http://192.168.4.1 [atau definisi lain]"
- Atau tandai sebagai OPEN Questions

#### D. Device Verification Mechanism Is Vague
**Severity:** MEDIUM  
**Issue:** FR-021 menyebutkan "device verification" tapi mechanics tidak jelas

**Current State:**
```
FR-021: Aplikasi harus memverifikasi bahwa perangkat yang ditemukan melalui 
BLE sesuai dengan kode TGN yang dimasukkan pengguna.
```

**Pertanyaan yang belum terjawab:**
- Bagaimana sistem tahu device BLE yang ditemukan adalah TGN_0001 yang benar?
- Apakah ESP32 broadcast TGN_XXXX di BLE advertisement?
- Apakah ada device-specific data yang di-embed?

**Rekomendasi:**
- Ini benar-benar depend pada OQ-007 (BLE Security)
- Untuk sekarang, tambahkan Assumption: ASM-008: "ESP32 mengkomunikasikan device code-nya via BLE saat discovery sehingga aplikasi dapat memverifikasi kecocokan"

#### E. No Requirement for Offline Caching/Sync Strategy
**Severity:** MEDIUM  
**Issue:** Sistem support offline access (BLE + Hotspot + Local Web) tapi tidak ada requirement tentang:
- Data caching strategy
- Sync mechanism ketika reconnected
- Which data harus di-cache di app

**Rekomendasi:**
- Tambahkan requirement tentang offline data strategy
- Atau tandai sebagai OPEN Questions (OQ-017: Offline Data Caching Strategy)

---

## 2. REQUIREMENT YANG PERLU DIPERBAIKI

### 2.1 Requirement yang Harus Ditambahkan

#### FR-039: User Profile Management (ASSUMPTION)
```
Pengguna dapat melihat dan mengedit profil mereka di halaman Pengaturan.
[ATAU tandai OPEN jika belum final]
Status: ASSUMPTION or OPEN
```

#### FR-040: Battery Level Alert (OPEN)
```
Sistem harus mengirimkan alert/notifikasi ketika level baterai perangkat 
mencapai kondisi kritis [THRESHOLD TBD - OQ-016].
Possible channels: push notification, in-app alert, dashboard indicator
Status: OPEN
Related-to: OQ-016 (Battery Alert Threshold & Mechanism)
```

#### FR-041: Data Access Control (CONFIRMED)
```
Backend harus menolak permintaan data atau operasi pada perangkat yang 
tidak dimiliki oleh pengguna yang melakukan request. Sistem harus mengembalikan 
error yang jelas (401/403) jika terjadi violation.
Status: CONFIRMED
```

#### NFR-002: Offline Data Strategy (OPEN)
```
Aplikasi harus mendefinisikan strategi data caching untuk mode offline.
Detail mencakup: (a) Data apa yang di-cache? (b) Kapan cache di-refresh? 
(c) Bagaimana sync ketika online kembali?
Status: OPEN
Related-to: OQ-018 (Offline Data Caching Strategy)
```

#### SW-004: Local Web Interface Technology (ASSUMPTION or OPEN)
```
Local Web Interface pada ESP32 dibangun menggunakan [teknologi TBD].
Accessible via HTTP pada IP [TBD] dengan port [TBD].
Status: ASSUMPTION or OPEN [Development team needs detail]
```

### 2.2 Requirement yang Perlu Klarifikasi/Direvisi

#### FR-009: REVISE
**Current:**
```
Aplikasi harus menyediakan empat halaman utama yang dapat diakses dari 
navigasi: (1) Dashboard, (2) Peta, (3) Riwayat, (4) Pengaturan.
```

**Revise to:**
```
FR-009: REVISE — Halaman Utama Aplikasi
Aplikasi harus menyediakan halaman-halaman berikut yang dapat diakses dari 
navigasi utama:
  (1) Dashboard — Ringkasan status perangkat milik pengguna
  (2) Peta — Visualisasi lokasi perangkat milik pengguna
  (3) Riwayat — Data monitoring historis (detail: OQ-004)
  (4) Pengaturan — [DETAIL TERBUKA - OQ-017]
Status: CONFIRMED (for Dashboard, Peta, Riwayat); OPEN (for Pengaturan content)
```

#### FR-017: CLARIFY
**Current:**
```
Selama proses pendaftaran perangkat, aplikasi harus memungkinkan pengguna 
untuk mengonfigurasi koneksi WiFi pada perangkat melalui antarmuka BLE.
```

**Clarify to:**
```
FR-017: CLARIFY — WiFi Configuration via BLE
Selama proses pendaftaran perangkat, aplikasi harus memungkinkan pengguna 
memasukkan credential WiFi (SSID, Password, [Security Type]) melalui 
antarmuka BLE, dan mengirimkan credential tersebut ke ESP32 untuk konfigurasi 
koneksi WiFi.
Additional details required:
  - Apakah pengguna dapat memilih dari WiFi networks yang di-scan oleh application?
  - Atau manual input SSID?
  - Bagaimana security/encryption dari data credential via BLE? [OQ-007]
Status: CONFIRMED (main requirement); Open detail: security mechanism (OQ-007)
```

#### FR-018 dan FR-036: EVALUATE DUPLICATION
**Current:**
- FR-018 (di section 9.9): "Akses Local Web Interface"
- FR-036 (di section 17): "Tombol/Link Local Web"

**Action:**
- Ini adalah requirement yang sama, dipindahkan ke section yang berbeda
- Consolidate: hapus salah satunya, keep di section 17 (Emergency & Offline Operation)
- ATAU merge: FR-018+FR-036 → FR-018 (Extended)

#### FR-021: CLARIFY
**Current:**
```
Aplikasi harus memverifikasi bahwa perangkat yang ditemukan melalui BLE 
sesuai dengan kode TGN yang dimasukkan pengguna.
```

**Clarify to:**
```
FR-021: CLARIFY — Device Verification via BLE
Aplikasi harus memverifikasi bahwa perangkat yang ditemukan melalui BLE 
adalah perangkat yang benar dengan code TGN yang dimasukkan pengguna. Mekanisme 
verifikasi: [DETAIL TBD - OQ-007].
Possible mechanisms:
  - BLE broadcast device code dalam advertisement data
  - Challenge-response protocol
  - Tulisan di perangkat yang harus di-scan
  - Other [TBD]
Status: CONFIRMED (requirement); Open mechanism (OQ-007)
```

#### REC-001: ADD CLARITY
**Current:**
```
Setelah Network Reset, pengguna harus dapat melakukan konfigurasi WiFi 
ulang menggunakan flow yang sama seperti pendaftaran awal, TANPA PERLU 
mendaftarkan perangkat kembali ke akun.
```

**Improve to:**
```
REC-001: Recovery Pasca Network Reset — Reconfig WiFi
Ketika pengguna melakukan Network Reset:
  1. Konfigurasi WiFi sebelumnya di-reset pada ESP32
  2. ESP32 kembali broadcast BLE dan WiFi Hotspot
  3. Pengguna dapat menjalankan WiFi configuration flow ulang (sama seperti 
     initial setup)
  4. Device ownership dan asosiasi dengan user TIDAK berubah
  5. Data monitoring historis TIDAK terhapus
Status: CONFIRMED
```

---

## 3. KEBUTUHAN TAHAP NORMALISASI

### A. Requirement ID Consistency Check: ✓ PASS
- FR (Functional): 001-041 [akan ditambah FR-039, FR-040, FR-041]
- NFR (Non-Functional): 001-002 [akan ditambah NFR-002]
- HW (Hardware): 001-006 ✓
- SW (Software): 001-003 [akan ditambah SW-004]
- NET (Network): 001-003 ✓
- DATA (Data): 001-003 ✓
- SEC (Security): 001-002 ✓
- REC (Recovery): 001-002 ✓
- ERR (Error): 001-019 ✓
- ASM (Assumption): 001-007 [akan ditambah ASM-008]
- CON (Constraint): 001-007 ✓

### B. Status Distribution Check

**CONFIRMED:**
- Functional: FR-001 through FR-038 (38 items) — GOOD
- Hardware, Software, Network, Data, Security, Recovery (non-error), Constraint: ALL CONFIRMED
- Total CONFIRMED: ~65 requirements

**ASSUMPTION:**
- ASM-001 through ASM-007 (7 items)
- Related to validation points clearly marked
- Total ASSUMPTION: 7 items

**OPEN:**
- REC-002: 1 item (depend OQ-001)
- ERR-001 through ERR-019: 19 items (depend OQ-009)
- Total OPEN: 20 items

**Status Summary: ✓ BALANCED**
- ~65 CONFIRMED, 7 ASSUMPTION, 20 OPEN
- Ratio menunjukkan dokumen sudah mature namun ada areas yang harus diputuskan

---

## 4. OPEN QUESTIONS CHECK: ALL 15 ITEMS ACCOUNTED

✓ OQ-001: Recovery identity setelah reinstall  
✓ OQ-002: Spesifikasi water level sensor  
✓ OQ-003: Role admin/operator  
✓ OQ-004: Struktur dan retensi history  
✓ OQ-005: Detail map behavior  
✓ OQ-006: Authentication jangka panjang  
✓ OQ-007: BLE security & device verification  
✓ OQ-008: Limit device per user  
✓ OQ-009: Error handling untuk 19 scenarios  
✓ OQ-010: Performance & scalability  
✓ OQ-011: Water level alert threshold  
✓ OQ-012: Format GPS  
✓ OQ-013: Platform (Android/iOS)  
✓ OQ-014: Interval pengiriman data  
✓ OQ-015: Device claiming/ownership rules  

**RECOMMENDED ADDITIONS:**
- OQ-016: Battery alert threshold & notification mechanism
- OQ-017: Halaman Pengaturan (Settings) — features & requirements
- OQ-018: Offline data caching strategy

---

## 5. KONSISTENSI REQUIREMENTS: KEY AREAS

### Multi-Device Support
✓ FR-006: User dapat punya multi-device  
✓ FR-010, FR-014, FR-032: Data filtered per user  
✓ FR-031: Asosiasi di backend  
✓ SEC-001: Validasi ownership di backend  
✓ [ADDED] FR-041: Access control di backend  
**Status: KONSISTEN**

### BLE Communication
✓ HW-002: ESP32 support BLE  
✓ FR-019, FR-020, FR-021: Discovery & Verification  
✓ FR-017: WiFi config via BLE  
✓ NET-002: Emergency access via BLE  
✓ ASM-006, OQ-007: Verification mechanism [OPEN]  
**Status: KONSISTEN**

### WiFi & Emergency Connectivity
✓ HW-003: ESP32 support WiFi  
✓ HW-004: ESP32 support Hotspot  
✓ HW-005: Local Web Interface  
✓ NET-001: Normal path (WiFi → Internet → Backend)  
✓ NET-003: Emergency path (Hotspot → Local Web)  
✓ FR-035, FR-036: Access mechanisms  
**Status: KONSISTEN**

### Network Reset
✓ FR-022, FR-023: Reset functionality  
✓ FR-037, FR-038: Trigger & result  
✓ REC-001: Recovery WiFi config pasca reset  
✓ ASM-007: Firmware detail [ASSUMPTION]  
**Status: KONSISTEN**

### Ownership & Device Management
✓ FR-005, FR-006: Ownership model (1:N)  
✓ FR-031: Backend storage  
✓ SEC-001, SEC-002: Validation & uniqueness  
✓ OQ-015: Claiming rules [OPEN untuk detail]  
✓ [ADDED] FR-041: Access control enforcement  
**Status: KONSISTEN** (with clarifications added)

### Monitoring Data Capture
✓ FR-024-029: 6 data types (water level, GPS, battery, WiFi, connection, last update)  
✓ DATA-002: Backend storage  
✓ FR-032: Filter per user  
✓ FR-013: Display on detail page  
✓ OQ-002, OQ-011, OQ-012, OQ-014: Technical details [OPEN]  
**Status: KONSISTEN**

---

## 6. MASALAH KRITIS YANG TIDAK BOLEH DIABAIKAN

### #1 Settings Page Is Completely Undefined
**Impact:** HIGH  
Halaman ke-4 dari 4 navigasi utama tidak ada requirement sama sekali.  
**Action:** MUST resolve sebelum architectural design dimulai

### #2 WiFi Configuration Detail Too Vague
**Impact:** HIGH  
Pengguna input "konfigurasi WiFi" tapi tidak jelas apa yang di-input.  
**Action:** MUST clarify atau mark as OPEN question

### #3 Device Verification is "Magic"
**Impact:** HIGH  
Bagaimana aplikasi tahu device BLE yang ditemukan adalah "TGN_0001" yang benar tidak dijelaskan.  
**Action:** MUST clarify di OQ-007 review

### #4 Battery Alert Feature Missing
**Impact:** MEDIUM  
Battery status harus dilaporkan (FR-026) tapi behavior saat critical tidak jelas.  
**Action:** ADD FR-040 atau clarify apakah hanya display

### #5 Offline Data Strategy Undefined
**Impact:** MEDIUM  
Sistem support offline access tapi cache/sync strategy tidak ada requirement.  
**Action:** ADD NFR-002 atau mark as OPEN question (OQ-018)

---

## 7. CHECKLIST: CONSISTENCY VERIFICATION

| Aspek | Status | Notes |
|-------|--------|-------|
| Multi-Device Support | ✓ OK | Semua related requirements consistent |
| BLE Communication | ✓ OK | Mechanism masih OPEN (OQ-007), tapi overall consistent |
| WiFi & Hotspot | ✓ OK | Both normal dan emergency paths defined |
| Emergency Local Web | ✓ OK | Paths dan access mechanisms defined (ada duplikasi FR-018 & FR-036) |
| Network Reset | ✓ OK | Reset, result, dan recovery all defined |
| Ownership Model | ✓ OK(+) | OK dengan penambahan FR-041 untuk enforcement |
| Monitoring Data | ✓ OK | 6 data types captured, storage defined |
| Status Classification | ✓ OK | CONFIRMED/ASSUMPTION/OPEN clearly marked |
| ID Sequence | ✓ OK | Logical grouping, no gaps |
| Open Questions | ✓ ALL 15 | All listed dan mapped correctly |

---

## SUMMARY RECOMMENDATION

**Dokumen ini sudah MATURE namun memerlukan beberapa NORMALISASI sebelum stakeholder review:**

### KRITIS (Harus diperbaiki):
1. Definisikan isi halaman Pengaturan (FR-009 point 4)
2. Klarifikasi WiFi config detail (FR-017)
3. Dokumentasikan device verification mechanism (FR-021) atau clear dependency ke OQ-007

### PENTING (Harus ditambahkan):
4. Tambahkan FR-040 (Battery Alert) atau klarifikasi tidak ada alert
5. Tambahkan FR-041 (Backend Access Control) — implicit requirement yang perlu eksplisit
6. Tambahkan NFR-002 (Offline Data Strategy) atau mark OQ-018

### ENHANCEMENT (Baik untuk clarity):
7. Remove duplikasi FR-018 & FR-036
8. Standardisasi istilah "Device Code" vs "Device ID"
9. Tambahkan ASM-008: Device code broadcast via BLE advertisement

---

**Status Dokumen Setelah Review:**  
✓ **READY for normalization**  
⚠ **NOT recommended untuk stakeholder review sampai issues di atas resolved**

