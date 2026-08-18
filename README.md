# Wayborne Map Editor (Cartographer)

Fantastik / ortaçağ tarzı, tarayıcı üzerinde çalışan bir harita editörü. Tamamen vanilla JavaScript ve Canvas 2D ile yazılmıştır — framework, build adımı, bundler, npm bağımlılığı veya CDN varlığı yoktur. Karada, denizde, kıyıda, arazi dokularında, izometrik binalarda kullanılan her şey (472 sembol, 20 arazi tipi, onlarca izometrik yapı) kodun içinde üretilir; dışarıdan görsel dosyası yüklenmez.

Arayüz 10 dilde kullanılabilir: Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Portekizce, Hollandaca, Lehçe, Rusça. Sağ üstteki 🌐 simgesinden değiştirilir.

## Çalıştırma

Derleme/kurulum gerektirmez, statik dosyalardır.

```bash
python3 serve.py 8000
# veya
python3 -m http.server 8000
# veya (Node varsa)
npx http-server . -p 8000 -c-1 -o
```

Tarayıcıda `http://localhost:8000/` adresini açın. **`index.html`'i doğrudan `file://` ile açmayın** — PNG/SVG dışa aktarım ve kıyı efekti `toDataURL`/`getImageData` kullanır, bu API'ler `file://` altında CORS tarafından engellenir.

## Üst araç çubuğu

| Buton | İşlev |
|---|---|
| **Yeni** | Tuvali temizleyip yeni, boş bir harita başlatır. |
| **Aç** | Daha önce kaydedilmiş bir `.json` proje dosyasını yükler (tüm katmanlar, nesneler ve ayarlarla birlikte). |
| **Kaydet** | Projenin tamamını (raster katmanlar + vektör nesneler + ayarlar) `.json` dosyası olarak indirir. `Ctrl+S` kısayolu da aynı işi yapar. |
| **↶ / ↷ (Geri al / Yinele)** | 50 adıma kadar geri al/yinele geçmişi. `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`. |
| **PNG / PNG 2× / PNG 4×** | Haritayı normal, 2× veya 4× çözünürlükte PNG olarak dışa aktarır. |
| **SVG** | Haritayı gerçek vektör SVG olarak dışa aktarır — sembol yolları (`Path2D` verisi) doğrudan `<path>` olarak yazılır, bitmap gömme değildir. Kıyı parlaması ve yükselti gölgelendirmesi gibi raster efektler base64 `<image>` olarak gömülür. |
| **🌐 Dil** | 10 dilli arayüz dili seçici (bayraklı, açılır menü). |

## Araç çubuğu (sol taraf, dikey)

Her araç, sağ paneldeki ilgili seçenekler bölümünü açar ve tuşlarla da seçilebilir:

| Araç | Tuş | İşlev |
|---|---|---|
| **Seç** | `V` | Vektör nesneleri (nehir, yol, göl, bölge, sembol, etiket) seçmek, taşımak, düzenlemek için. Seçili bir yol/göl/bölgenin bezier tutamaçları (handle) buradan sürüklenir. |
| **Kara** | `B` | Kara kütlesi fırçası — karayı boyar, deniz ile arasına otomatik kıyı efekti (glow) uygulanır. Aynı panelde **prosedürel kara üreteci** de bulunur: Kıta / Ada / Takımada şablonlarından biriyle, tohumlu Perlin gürültüsüne dayalı tek tıkla rastgele kıyı çizgisi üretir (detay/pürüzlülük ayarlanabilir, harici kütüphane kullanılmaz). |
| **Deniz** | `E` | Silgi — boyanmış karayı (ve üzerindeki arazi dokusunu) tek adımda kaldırır. |
| **Doldur** | `F` | Kova doldurma — kalemle çizilmiş kapalı bir kıyı çevriminin (ring) içini tek tıkla dolduran flood-fill aracı; tıklanan pikselle aynı kara/deniz durumundaki bitişik alanı doldurur. |
| **Arazi** | `T` | 20 arazi tipinden biriyle doku boyar (otlak, orman, karanlık orman, tayga, bozkır, savan, çöl, bataklık, kayalık, kar/buz vb.). Her fırça darbesinde desen rastgele serpilir; iki darbe asla birebir aynı görünmez. Fırçanın kara sınırlarını aşmaması otomatik sağlanır. |
| **Yükselti** | `U` | Yükseklik/elevation fırçası — sürükleyerek araziyi yükseltir; "Alçaltma modu" işaretliyken çukurlaştırır. Sonuç, gölgelendirme (hillshade) ve/veya kontur çizgileri olarak otomatik render edilir; ayarlanabilir kontur aralığı vardır. |
| **Sembol** | `S` | ~200+ düz (ink-style) sembol ve onlarca izometrik bina/yapıdan (kale, kulübe, değirmen, köprü vb.) birini yerleştirir. Renk tonu (hue) ve "yıpranma/wear" (eskime lekesi) kaydırıcıları ile özelleştirilebilir; `[` / `]` ile döndürülür. **Fırça modu** açıkken sürükleyerek onlarca sembolü otomatik kümeleyerek dizer (orman/dağ sırası gibi); "Karaya kenetle" işaretliyken denize taşan noktalar otomatik atlanır ve sonradan deniz o bölgeye genişlerse sembol otomatik gizlenir. |
| **Nehir** | `R` | Tıklayarak yol noktaları eklenen akarsu çizim aracı; kavis/meander ayarı vardır. `Enter` ile bitirilir. |
| **Göl** | `K` | Kapalı bir gölet/deniz gölü şekli çizer; kıyı rengi altındaki arazi dokusuna göre otomatik uyarlanır. |
| **Bölge** | `G` | Toprak/bölge (territory) doldurma aracı — kesikli kenarlıklı, yarı saydam dolgulu kapalı bir alan çizer; sınır/siyasi harita amaçlı. |
| **Bölge bağlantısı** | `M` | Haritaya tıklayıp isim vererek yeni, boş bir **alt harita** (bölge/şehir haritası) oluşturur ve üzerine bir bağlantı iğnesi yerleştirir. Bkz. aşağıdaki "Çoklu harita" bölümü. |
| **Kaynak** | `Y` | Maden, tarım, avlanma, balıkçılık, ticaret ve taş ocağı olmak üzere 6 türden birini seçip haritaya oyun-tasarımı amaçlı kaynak işareti yerleştirir (kervan/ticaret temalı haritalar için). |
| **Yol** | `D` | Kervan güzergâhı / kara yolu çizim aracı, nehirle aynı mantıkta. |
| **Etiket** | `L` | Metin etiketi yerleştirir; hazır stil (başlık, şehir adı, bölge adı vb.) ön ayarları mevcuttur. **"Yola oturt"** işaretliyse ve tıklama bir nehre/yola yakınsa, etiket o çizginin gerçek şekline harf harf oturur (dairesel yay değil, çizilmiş eğrinin kendisi). |
| **Örnekle** | `I` | Doku eyedropper — haritanın bir bölgesinden dokuyu örnekleyip başka bir yere aynı stille "boyayabilme" aracı; ① alan seç → ② boyamaya başla akışıyla çalışır. |
| **Ölç** | `Q` | Sürüklenebilir mesafe cetveli — iki nokta arası gerçek mesafeyi ölçek çubuğuna göre hesaplayıp gösterir. Ölçüm çizgileri seçilip taşınabilir/silinebilir; PNG/SVG çıktısına dahil edilmez. |
| **Kement** | `X` | Raster lasso seçim — sürükleyerek kapalı bir alan çiz; Kara + Arazi + Yükselti katmanlarındaki o bölge birlikte kaldırılıp taşınabilir/döndürülebilir hâle gelir (tutamaçla döndür). `Enter` ile onayla (tek adımlık geri alınabilir işlem), `Escape` ile iptal et, `Delete` ile alanı tamamen sil. |
| **Kaydır** | `Space` (basılı tutarak) | Tuvali sürükleyerek kaydırma; sağ tık ile de her araçtan bağımsız pan yapılabilir. |

Tüm çizim yolları (nehir/yol/göl/bölge) isteğe bağlı **bezier tutamaç** düzenlemeyi destekler: bir noktayı seçip tutamaçlarını sürükleyerek eğriyi elle şekillendirebilirsiniz; tutamaç eklenmemiş eski projeler otomatik (Catmull-Rom eşdeğeri) eğriyle bire bir aynı görünmeye devam eder.

## Çoklu harita (dünya ↔ bölge bağlantısı)

Büyük bir dünya haritasından, bir şehrin veya bölgenin kendi ayrıntılı haritasına geçiş yapılabilir — her biri kendi katmanlarına, nesnelerine ve geri al/yinele geçmişine sahip ayrı bir dokümandır:

1. **Bölge bağlantısı** aracıyla (`M`) haritaya tıklayın, bölgeye bir isim verin → yeni, boş bir alt harita oluşur ve üzerine bir iğne yerleşir.
2. **Seç** aracıyla iğneye çift tıklayın (veya seçince görünen **"Bölgeye gir →"** butonuna basın) → o bölge haritasına geçilir.
3. Sol üstte beliren gezinme çubuğundaki **"◀ Geri"** ile bir üst haritaya dönülür.

Bağlantı iğneleri yalnızca editör içi gezinme yardımcısıdır; PNG/SVG çıktısına dahil edilmez. `.json` proje dosyası tüm harita ağacını (dünya + tüm alt haritalar) tek seferde saklar.

## Sağ panel — seçenekler

Seçili araca göre değişen ayarlar burada görünür: fırça boyutu, opaklık, renk, kenarlık rengi/kalınlığı, kıyı stili (kumlu / kayalık / resif), yükselti gücü ve alçaltma modu, pusula gülü stili, ölçek çubuğu ayarları, ızgaraya yapış (snap-to-grid) açma/kapama, referans görsel yükleme/opaklık ve görünüm (yakınlaştır/sığdır) kontrolleri.

**Referans görsel — iz sürme (trace) modu:** Bir referans görsel yüklendikten sonra "İz sürme modu" işaretlenirse, görsel boyanan kara/arazi katmanlarının üstünde yarı saydam olarak gösterilmeye devam eder (normalde opak fırça darbeleri altında kalırdı) ve kara/deniz fırçası, referanstaki en yakın belirgin kenara (elle çizilmiş kıyı hattı gibi) otomatik kenetlenir. Bu mod yalnızca ekranda geçerlidir, PNG/SVG çıktısını etkilemez.

Bir nesne seçildiğinde ek işlemler görünür: **Çoğalt**, **Sil**, öne/arkaya getir, en öne/en arkaya gönder, gruplama/grup çözme.

**Harita çerçevesi:** "Seç" panelinde, tuvalin etrafına dekoratif bir kenarlık uygulanabilir — Sade çizgi, Halat veya Süslü stillerinden biri; renk ve kalınlık ayarlanabilir. Hem PNG hem SVG çıktısına dahildir.

**Katman karışım (blend) modu:** Katmanlar panelinde her raster katman (Kara, Arazi, Yükselti) için Normal, Çarpma, Bindirme, Yumuşak ışık veya Ekranlama karışım modlarından biri seçilebilir — ışık/gölge efektleri veya doku katmanlarını birleştirmek için.

## Alt/yan panel sekmeleri

- **Katmanlar** — Referans görsel, Kara, Arazi, Yükselti, Bölgeler, Nehirler, Yollar, Semboller, Kaynaklar, Harita bağlantıları, Ölçümler, Etiketler, Kaplama olmak üzere 13 katman; her biri görünürlük ve opaklık kontrolüyle açılıp kapatılabilir, sıralanabilir.
- **Kütüphane** — Tüm sembol/bina kataloğu; kategoriye göre gezinilebilir ve arama kutusuyla filtrelenebilir. Kendi PNG sembolünüzü de yükleyip kütüphaneye ekleyebilirsiniz.
- **Geçmiş** — Yapılan işlemlerin (fırça darbesi, nesne ekleme/silme vb.) kronolojik listesi; herhangi bir adıma geri dönülebilir.

## Diğer özellikler

- **Ölçek çubuğu** — Haritada sürüklenip yeniden boyutlandırılabilen, birim/etiket özelleştirilebilir interaktif ölçek göstergesi.
- **Pusula gülü (windrose)** — Klasik veya minimal stilde, haritaya yerleştirilebilen yön göstergesi.
- **Izgaraya yapış** — Sembol/nokta yerleştirmeyi belirli bir aralığa hizalar.
- **Minimap** — Sağ altta, tüm haritanın küçük genel görünümü ve hızlı gezinme.
- **Klavye kısayolları** — Araç seçimi için tek harf tuşları (yukarıdaki tabloda), yön tuşlarıyla kaydırma, `+`/`-`/`0` ile yakınlaştır/uzaklaştır/sığdır, `Delete` ile seçili nesneyi (veya son yol noktasını) sil, `Escape` ile çizimi iptal et.

## Mimari (geliştiriciler için)

Kod tabanının modül yapısı, yükleme sırası ve her dosyanın sorumluluğu için bkz. [`CLAUDE.md`](./CLAUDE.md).
