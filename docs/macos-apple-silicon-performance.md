# macOS / Apple Silicon Performans Optimizasyonu — Araştırma Raporu

> **Tarih:** 2026-07-21
> **Tetikleyici:** MacBook Air M2 (Mac14,2), macOS 26.1 (25B78) üzerinde 40 dakikalık crawl sonrası
> post-crawl fazında main process V8 heap OOM crash'i (`hata.txt` — EXC_BREAKPOINT / brk 0,
> `LowMemoryNotification` → `FatalProcessOutOfMemory`, `node::sqlite::StatementSync::All` içinde).
> **Kapsam:** FreeCrawl SEO'nun düşük donanımlı Apple Silicon Mac'lerde (8–16 GB unified memory,
> fansız MacBook Air) darboğazsız çalışması.
>
> **Kanıt durumu:** 26 kaynak tarandı, 125 iddia çıkarıldı. Doğrulama fazının bir kısmı oturum
> limitine takıldığından 25 iddianın 6'sı 3-0 çapraz doğrulamadan geçti, 3'ü çürütüldü (rapora
> alınmadı), kalanlar kaynak alıntılı ancak tek kaynaklı — ⚠️ ile işaretli.

---

## 1. En kritik bulgu: Crash'in tavanı RAM değil, Electron'un 4 GB V8 kafesi ✅

**hata.txt'deki çökme 8 GB'lık Air'de değil, 64 GB'lık Mac Studio'da da aynen yaşanırdı.**

- Electron 14'ten beri **pointer compression** etkin: V8 heap'i process başına **maksimum 4 GB**
  ile sınırlı — makinedeki fiziksel RAM'den bağımsız.
  ([electronjs.org/blog/v8-memory-cage](https://www.electronjs.org/blog/v8-memory-cage)) ✅ 3-0
- Electron 21'den beri **sandboxed pointers** de etkin; crash raporundaki
  `Memory Tag 255 = 1.3 TB` bu sandbox'ın **sanal adres rezervasyonu** — gerçek RAM tüketimi
  değil, zararsız. ([v8.dev/blog/sandbox](https://v8.dev/blog/sandbox)) ✅ 3-0 (rezervasyon boyutu ⚠️)
- ⚠️ `--max-old-space-size` **işe yaramaz**: pointer-compression kafesi flag'i ezer;
  `app.commandLine.appendSwitch('js-flags', ...)` main process için no-op (isolate zaten
  yaratılmış). Maintainer'lara göre runtime workaround yok; tek çıkış özel Electron derlemesi.
  ([electron#31330](https://github.com/electron/electron/issues/31330))
- ⚠️ **En sinsi detay:** Electron'da ArrayBuffer/Buffer verisi de Node.js'in aksine kafes
  **içinde** tutuluyor (maintainer nornagon'un tespiti). "Büyük veriyi Buffer'a al, heap
  rahatlasın" taktiği Electron'da **çalışmaz**.
- ⚠️ **Mimari sonuç:** `worker_threads` aynı process'te yaşadığından main isolate + reader
  worker'lar + writer worker'lar **tek 4 GB kafesi paylaşıyor**. Worker havuzları CPU
  paralelliği sağlıyor ama bellek tavanını genişletmiyor; worker→main `postMessage` structured
  clone anlık olarak veriyi ikiye katlıyor.

**Windows/Intel kafasından fark:** "Page file büyür, idare eder" varsayımı Electron'da her
platformda geçersiz — kafes 4 GB. Düşük RAM'li Mac bunu sadece daha erken hissettirir
(compression/swap baskısı kafes OOM'undan önce başlar).

**Gerçek çözüm — veri hacmini heap'e hiç sokmamak:**
- `StatementSync.prototype.iterate()` — tam bu amaçla eklendi, Node v22.13.0'a backport edildi,
  Electron 41.2.2'nin Node 22.x'inde mevcut.
  ([nodejs.org/api/sqlite.html](https://nodejs.org/api/sqlite.html),
  [nodejs/node#54213](https://github.com/nodejs/node/pull/54213))
- Gerçekten büyük heap gerektiren işler için maintainer önerisi: işi Electron dışına taşımak.
  Pratik karşılığı **`utilityProcess`** — ayrı OS process = ayrı 4 GB kafes + ayrı crash domain'i.

---

## 2. `procRole: Background` — App Nap + E-core hapsi ✅

Crash raporundaki `Role: Background` tesadüf değil; crawl arka planda çalışıyordu:

- **App Nap** koşulları: ön planda değil + görünür içerik güncellenmiyor + ses yok + assertion
  alınmamış → aday. ✅ 3-0
- App Nap üç mekanizmayla vurur: ✅ 3-0
  1. **Priority reduction** → daha az CPU payı
  2. **Timer throttling** → `setInterval`/`setTimeout` tabanlı PQueue iş dağıtımı seyrekleşir
  3. **I/O throttling** → SQLite disk yazışları kısılır
- Resmi çıkış: NSProcessInfo activity assertion → sistem App Nap'e sokmaz. ✅ 3-0
  Electron karşılığı: `powerSaveBlocker.start('prevent-app-suspension')`.
  ([Apple App Nap docs](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/power_efficiency_guidelines_osx/AppNap.html))
- ⚠️ Ödünleşim: `prevent-app-suspension` sistem uykusunu da engeller; "sadece App Nap'i engelle"
  granülerliği Electron'da yok ('not planned' kapatıldı). Crawl aktifken aç, bitince `stop()`.
- ⚠️ **E-core hapsi** (Apple Silicon'a özgü): QoS `background` (9) thread'ler **yalnızca
  E-core'larda** çalışır; P-core'lar boşta olsa bile terfi yok, dışarıdan terfi de mümkün değil.
  ([eclecticlight.co](https://eclecticlight.co/2024/12/17/tune-for-performance-core-types/))
- ⚠️ App Nap'e girmiş uygulamalar bellek baskısında **compression/swap için öncelikli hedef**.

---

## 3. Fansız Air'de sustained load — termal adaptasyon ⚠️

- macOS termal durum API'si: `nominal / fair / serious / critical`. Apple önerisi: `fair`'de
  proaktif azalt, `serious`'ta CPU+I/O düşür, `critical`'de minimuma in.
  ([Apple thermal docs](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/power_efficiency_guidelines_osx/RespondToThermalStateChanges.html))
- **Native modül gerekmez:** Electron 41.2.2'de `powerMonitor.getCurrentThermalState()` ve
  `'thermal-state-change'` event'i mevcut (electron.d.ts'ten doğrulandı).
- Uyarı: desteklenmeyen sistemler her zaman `nominal` döndürür → tek sinyal olarak kullanma;
  mevcut adaptive-throttle (yanıt süresi bazlı) ile birleştir.
- Önerilen merdiven: `fair` → concurrency %75, `serious` → %50, `critical` → minimum.

---

## 4. SQLite × APFS — Windows'tan gerçekten farklı davranan katman ⚠️

- **macOS'ta `fsync()` dayanıklılık garantisi vermez** — güç kesintisi garantisi için
  `F_FULLFSYNC` gerekir; o da çok pahalı. Apple'ın sistem SQLite'ı bile `fullfsync=on`'u sessizce
  `F_BARRIERFSYNC`'e çevirir.
  ([mjtsai.com](https://mjtsai.com/blog/2025/09/05/sqlite-on-macos-not-acid/),
  [avi.im/blag/2025/sqlite-fsync](https://avi.im/blag/2025/sqlite-fsync/))
- Crawl projesi için doğru nokta: **`WAL` + `synchronous=NORMAL`** — corruption-safe, fsync
  yalnızca checkpoint'te; kaybedilebilecek şey son commit'ler (yeniden fetch edilebilir veri).
  `fullfsync` açma.
- **WAL sınırsız büyüyebilir:** 40+ dk sürekli yazan crawl'da `wal_autocheckpoint` +
  faz aralarında `PRAGMA wal_checkpoint(TRUNCATE)`.
  ([phiresky](https://phiresky.github.io/blog/2020/sqlite-performance-tuning/))
- `mmap_size` (256 MB–1 GB): read syscall'larını page-cache mapping'e çevirir; yalnızca sanal
  bellek rezerve eder.
- **Apple Silicon 16 KB VM sayfası kullanır** — 1 MB'lık TEXT blob'lar için `page_size=8192/16384`
  düşünülebilir (yeni DB'lerde; mevcutlara VACUUM gerekir).
- Sorgu hijyeni: body kolonunu list/aggregate sorgularından dışla; Google eşiği "4 KB'ın birkaç
  katı üstü dosyaya" — 1 MB gövdeler için uzun vadede dosya + path kolonu meşru seçenek.

---

## 5. macOS bellek yönetimi — düşük RAM'li Mac'te ne olur? ⚠️

- Kademeli davranış: önce **memory compression** (10.9+), sonra **swap**; process kill son çare
  ve önce düşük öncelik bandı. Jetsam'in masaüstü agresifliği konusunda kaynaklar çelişkili
  (iki karşıt iddia da çürütüldü) — net olan: **bizim crash sistem kill'i değil, V8'in 4 GB
  tavanına çarpması** (`LowMemoryNotification` → abort zinciri kanıtı).
- `DISPATCH_SOURCE_TYPE_MEMORYPRESSURE` (10.9+) native baskı bildirimi verir; native köprüsüz
  pratik alternatif: büyük materialization öncesi `v8.getHeapStatistics()` headroom kontrolü.
- Unified memory'de RAM aynı zamanda VRAM: 8 GB Air'de efektif bellek nominalden az.

---

## 6. macOS 26 (Tahoe) — bilinen Electron sorunları ⚠️

| Sorun | Durum | FreeCrawl'a etkisi |
|---|---|---|
| `_cornerMask` private-API override → WindowServer GPU spike, sistem geneli kasma | Electron 36+'ya backport (PR #48376, 2025-09-26) ile düzeltildi | **Yok** — 41.2.2 düzeltmeyi içerir ([theregister](https://www.theregister.com/2025/10/02/macos_26_electron_slowdown/), [#48311](https://github.com/electron/electron/issues/48311)) |
| MAS/App Sandbox + arm64 + macOS 26'da başlangıçta `EXC_BREAKPOINT` (MAP_JIT sıkılaşması hipotezi) | Açık; Apple DTS "JIT rehberi değişmedi" diyor, maintainer onayı yok | **App Store dağıtımı planlanırsa kritik**; sandbox'sız DMG'de üremiyor ([#51351](https://github.com/electron/electron/issues/51351), [Apple forums](https://developer.apple.com/forums/thread/821584)) |
| 26.2'de Electron uygulamalarının crash log'suz SIGKILL'lenmesi | Tek kullanıcı raporu, 'not planned', doğrulanmamış | İzlenmeli ([#49261](https://github.com/electron/electron/issues/49261)) |
| AutoFill (`NSAutoFillHeuristicController`) scroll yavaşlığı | 26.0.1'de kısmen düzeltildi | Düşük |

**Teşhis ipucu:** Bu regresyon sınıfının istisna imzası bizimkiyle aynı (`EXC_BREAKPOINT` /
brk 0, V8 içinde). Ayrım: OOM'da stack'te `LowMemoryNotification` + `node::sqlite` frame'leri
var ve çökme dakikalar sonra; JIT regresyonunda çökme başlangıçta ve JIT/compiler thread'inde.

---

## 7. Eylem planı ve durum

| # | Öncelik | İş | Durum |
|---|---|---|---|
| 1 | P0 | `recomputeBoilerplateCoverage`: `.all(sampleSize)` → 64'lük keyset batch + `SUBSTR(body,1,200000)`; `dbCall` ile writer worker'a taşındı (tepe bellek ~2–4 GB → ~25 MB) | ✅ 2026-07-21 |
| 2 | P0 | Diğer toplu `url_sources.body` okuyucuları tarandı — `seoTextCorpus` body'yi zaten dışlıyor, duplicate clustering yalnızca `simhash` okuyor; başka toplu okuyucu yok | ✅ 2026-07-21 |
| 3 | P0 | Crawl sırasında `powerSaveBlocker('prevent-app-suspension')` — ref-count'lu, `done` + yeni `stopped` event'iyle bırakılıyor | ✅ 2026-07-21 |
| 4 | P1 | `callReaderOrFallback`: ağır metotlarda (HEAVY_METHODS) main-thread fallback kaldırıldı — rejection döner, sidebar eski sayıları korur ve sonraki tick'te yeniden dener | ✅ 2026-07-21 |
| 5 | P1 | Termal-adaptif concurrency: `Crawler.setThrottleScale` (dış tavan, lag-adaptasyonuyla kompoze) + macOS'ta `powerMonitor` `thermal-state-change` → nominal 1 / fair 0.75 / serious 0.5 / critical 0.25; crawl başlangıcında mevcut durum da uygulanır | ✅ 2026-07-21 |
| 6 | P1 | SQLite pragma seti — inceleme sonucu **zaten mevcuttu** (`WAL`, `synchronous=NORMAL`, `mmap_size=30GB`, `wal_autocheckpoint=2000`, `busy_timeout`, `temp_store=MEMORY`); eksik olan tek parça eklendi: post-crawl `wal_checkpoint(TRUNCATE)` (writer worker üzerinden) | ✅ 2026-07-21 |
| 7 | P2 | DB worker'ları `worker_threads` → `utilityProcess` (ayrı 4 GB kafes + crash izolasyonu) — **bilinçli ertelendi** (2026-07-21): crawl yazma yolunu değiştiren en riskli iş, gerçek crawl smoke-testleriyle doğrulanabileceği ayrı bir oturuma bırakıldı; watchdog SAB'ı cross-process çalışmadığından heartbeat'lerin mesaj tabanlıya çevrilmesi de gerekecek | ⏸ |
| 8 | P2 | Heap headroom guard: `ensureHeapHeadroom` (core, `v8.getHeapStatistics` tabanlı, 256 MB rezerv) — XLSX export satır biriktirme döngüsü (50K'da bir) + workbook build öncesi + Log Analyzer export'una uygulandı; OOM abort yerine anlaşılır "use CSV" hatası | ✅ 2026-07-21 |
| 9 | P2 | Sorgu/export hijyeni: (a) `iterateUrlsByCategory` + `iterateIndexableUrls` **sahte streamer'dı** (içeride `.all()`) — keyset-paginated gerçek streaming'e çevrildi (1M-URL CSV export tepe belleği ~yüzlerce MB → sabit); (b) `queryUrls`'a server-side limit clamp (≤10K); (c) `SELECT *` bilinçli korundu — `urls`'ta sınırsız kolon yok, mapping tüm kolonları tüketiyor, 187 kolonluk el listesi drift riski; (d) bonus: proje şifreleme/çözme tam-dosya-Buffer'dan 8 MB streaming'e çevrildi (format aynı; 9 senaryoluk round-trip testiyle doğrulandı) | ✅ 2026-07-21 |
| 10 | P2 | Uzun vade: `url_sources.body`'yi DB dışına (dosya + path) taşıma — şema migrasyonu + tüm okuma/yazma yollarını değiştiren büyük iş; P0–P2 sonrası acil bellek baskısı kalmadığından ihtiyaç doğana kadar ertelendi | ⏸ |
