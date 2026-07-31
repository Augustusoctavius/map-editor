# Cartographer — Fantasy Map Editor

Vanilla JS / Canvas 2D. Framework yok, CDN yok, dış varlık yok.
59 sembol, 9 arazi tipi, 8 katman, 50 adımlık undo, PNG/SVG/JSON çıktı.

## 1. Klasör yapısı

```
map-editor/
├── index.html
├── serve.py                 # tek dosyalık Python sunucu (opsiyonel)
├── package.json             # npm start / npm run serve
├── css/
│   ├── main.css             # tema, layout, paneller
│   ├── toolbar.css          # üst toolbar
│   └── canvas.css           # tuval alanı + minimap
├── js/
│   ├── symbols.js           # 59 SVG sembol + çizici + SVG export
│   ├── history.js           # undo/redo (raster yama + vektör snapshot)
│   ├── layers.js            # katmanlar + arazi doku pattern'leri
│   ├── canvas.js            # render, zoom/pan, minimap, nehir/yol/etiket çizimi
│   ├── tools.js             # tüm araç mantığı + girdi yönetimi
│   ├── export.js            # PNG / SVG / .json kaydet-yükle
│   ├── ui.js                # panel, i18n (TR/EN), klavye
│   └── app.js               # durum + başlatıcı
└── assets/                  # boş (semboller ve dokular kod içinde üretilir)
```

Klasörü elle oluşturacaksan:

```bash
mkdir -p map-editor/css map-editor/js
mkdir -p map-editor/assets/symbols/{mountains,forests,cities,misc}
mkdir -p map-editor/assets/textures/terrain map-editor/assets/brushes
```

## 2. Lokal sunucuyu başlat

`file://` ile açma — `toDataURL` / `getImageData` işlemleri CORS nedeniyle bloke olur.

**Python (kurulum gerektirmez)**

```bash
cd map-editor
python3 -m http.server 8000
# veya tarayıcıyı da otomatik açan sürüm:
python3 serve.py 8000
```

**Node.js**

```bash
cd map-editor
npx http-server . -p 8000 -c-1 -o
# veya
npm start
```

## 3. Tarayıcıda aç

`http://localhost:8000/`

Chrome / Edge / Firefox güncel sürüm. Konsolda `[Cartographer] hazır — 59 sembol` görürsen her şey yüklendi.

## 4. İlk harita — 5 adım

1. **Kıyıyı çiz.** Sol panel → **Kara**. Fırça 200–400, kıyı sertliği ~0.45. Kıtayı sürükleyerek doldur. Fazlalıkları **Deniz** aracıyla kes, sonra **Kıyıyı yumuşat**'a bas.
2. **Arazi boya.** **Arazi** aracı → bozkır / orman / dağlık / bataklık. "Sadece karaya boya" açık kalsın; boya denize taşmaz.
3. **Nehir ve yol geç.** **Nehir**: kaynaktan ağza doğru tıkla, Enter ile bitir (kaynakta ince, ağızda kalın). **Yol**: patika/ana yol stilini seç, aynı şekilde tıkla-Enter.
4. **Sembol ve etiket koy.** Sağ panel **Kütüphane** → kategori seç → sembole tıkla → haritaya tıkla. Etiket için metni yaz, **Eğim** kaydırıcısıyla bölge isimlerini kavislendir, haritaya tıkla.
5. **Ver.** Üst bar **Parşömen**'i aç, **PNG** veya **SVG** ile dışa aktar. Üzerinde çalışmaya devam edeceksen **Kaydet** (.json) — sonra **Aç** ile aynı yerden devam.

## 5. Kısayollar

| Tuş | İşlev | Tuş | İşlev |
|---|---|---|---|
| `V` | Seç | `B` | Kara |
| `E` | Deniz (silgi) | `T` | Arazi |
| `S` | Sembol | `R` | Nehir |
| `D` | Yol | `L` | Etiket |
| `Space`+sürükle / orta tık | Kaydır | Tekerlek | Zoom (%10–%400) |
| `Enter` | Yolu bitir | `Esc` | Yolu iptal / seçimi bırak |
| `Delete` | Son noktayı sil, yoksa seçimi sil | `Ctrl+Z` / `Ctrl+Y` | Geri / İleri |
| `0` | Ekrana sığdır | `+` / `-` | Zoom |
| `Ctrl+S` | Projeyi kaydet | | |

## 6. Teknik notlar

- **Neden Canvas 2D, WebGL değil?** Raster katmanlar tam çözünürlükte offscreen canvas'ta tutulur (8192² dahil) ve ekrana tek `drawImage` ile aktarılır; tarayıcı bu adımı zaten GPU'ya alır. WebGL yalnızca fırça darbesi başına shader maliyeti eklerdi ve `getImageData` tabanlı kıyı eşikleme ile SVG export'u zorlaştırırdı.
- **Undo belleği.** Fırça darbeleri tam katman kopyası olarak değil, yalnızca etkilenen kutunun PNG yaması olarak saklanır — 8192² tuvalde bile 50 adım birkaç MB tutar.
- **Semboller.** `Sym.SYMBOLS` içinde `{d, f, s, lw, tr}` parçaları olarak durur; aynı veri hem `Path2D` ile canvas'a çizilir hem de SVG export'ta `<path>` olarak yazılır — yani SVG çıktısı gerçekten vektördür, gömülü bitmap değil.
- **Kendi sembolünü ekle.** `js/symbols.js` içinde ilgili kategorinin `items` dizisine `{ id, tr, en, parts: [part('M...', 'fill', 'ink', 3)] }` ekle. Koordinat uzayı 0–100, merkez (50,50).
