# Handoff: Bilenyum Landing Page (v2)

## Overview
Bilenyum, ilkokul ve ortaokul öğrencileri için canlı sınıf temelli bir EdTech platformudur. Bu paket, ürünün tanıtım (landing) sayfasının uzay temalı, canlı/renkli versiyonunun (v2) tasarım referansını içerir. 12 bölümden oluşan tek sayfa bir akış: hero → problem/çözüm → canlı sınıf → nasıl çalışır → video → veli paneli → paketler → başarılar → yorum slider → SSS → CTA → footer.

## About the Design Files
Bu pakette yer alan `Bilenyum Landing v2.html` dosyası **HTML ile hazırlanmış bir tasarım referansıdır** — production kodu olarak doğrudan kullanılmak üzere değil, görünüm ve davranış niyetini göstermek üzere hazırlanmıştır. Görev: bu HTML tasarımını **hedef kod tabanının mevcut ortamında** (React, Vue, Next.js, SwiftUI vs.) ve onun yerleşik componentleri / patternleri ile yeniden inşa etmektir. Eğer bir kod tabanı henüz yoksa, proje için en uygun framework'ü seçip o ortamda hayata geçirin (React + Tailwind veya Next.js App Router yaygın bir tercih olur).

## Fidelity
**High-fidelity (hifi).** Renkler, tipografi, boşluklar, animasyonlar ve etkileşimler nihai niyeti yansıtır. Geliştirici, kod tabanının mevcut UI kütüphanesini kullanarak tasarımı **piksel düzeyinde** yeniden üretmelidir. Tek istisna: ikonlar yer yer yer tutucudur (emoji/glyph) — proje ikon kütüphanesi ile değiştirilmelidir.

## Design Tokens

### Color
| Token | Value | Kullanım |
|---|---|---|
| `--bg-0` | `#07091a` | Hero, koyu sayfa zeminleri |
| `--bg-1` | `#0f1330` | Problem/Sınıf koyu zemin |
| `--bg-2` | `#171c44` | Video bölümü |
| `--bg-3` | `#f5f3ff` | Açık mor zemin (Nasıl çalışır, Paketler, SSS) |
| `--bg-4` | `#ffffff` | Veli paneli, yorumlar |
| `--ink-0` | `#f6f6ff` | Koyu zeminde primary text |
| `--ink-1` | `#c5c8e6` | Koyu zeminde body text |
| `--ink-2` | `#8a8fb8` | Koyu zeminde muted/eyebrow |
| `--ink-dark-0` | `#15172b` | Açık zeminde primary text |
| `--ink-dark-1` | `#4a4f78` | Açık zeminde body text |
| `--ink-dark-2` | `#797ea6` | Açık zeminde muted |
| `--p-purple` | `#7c5cff` | **Marka primary** — eyebrow, CTA, dot active |
| `--p-sun` | `#ffb547` | Yıldız ratingi, accent #1 |
| `--p-aqua` | `#4ad6ff` | Accent #2 |
| `--p-pink` | `#ff7ab8` | Accent #3 |
| `--p-green` | `#6dd49e` | Live dot, success accent |
| `--line` | `rgba(255,255,255,0.12)` | Koyu zeminde border |
| `--line-dark` | `rgba(20,22,50,0.10)` | Açık zeminde border |

### Typography
- **Sans**: `'Plus Jakarta Sans', system-ui` — weights 400, 500, 600, 700, 800
- **Mono**: `'JetBrains Mono'` — weights 400, 500 (eyebrows, meta, level pill labels)
- **Scale**:
  - h1 (hero): 72px / line-height 1.02 / weight 800 / letter-spacing -0.025em
  - h2 (section): 48px / lh 1.08 / w 800 / ls -0.015em
  - h3 (card): 22px / lh 1.25 / w 700
  - lead: 19px / lh 1.55 / `--ink-1`
  - body: 14–16px
  - eyebrow: 12px mono uppercase, ls 0.16em, mor renkte ● ile başlar

### Radius & Spacing
- `--r-s` 10, `--r-m` 18, `--r-l` 28, `--r-xl` 40 px
- Section padding: `112px 32px`
- `--maxw` 1200px

### Shadows
- Primary button: `0 12px 32px -8px rgba(124,92,255,0.6), inset 0 1px 0 rgba(255,255,255,0.2)`
- Classroom stage: `0 50px 120px -40px rgba(0,0,0,0.6)`
- Planet: `inset -30px -40px 80px rgba(0,0,0,0.5), 0 30px 80px rgba(124,92,255,0.45), 0 0 120px rgba(124,92,255,0.3)`

## Screens / Sections

12 bölümden oluşan tek dikey scroll sayfa. Bölümler arasında SVG dalga (wave) geçişleri vardır.

### 01 · Hero (`#hero`, `.sec-hero`)
- **Layout**: 2 sütunlu grid (1.1fr / 1fr), 80px gap, ortalanmış. Sticky nav üstte.
- **Sol**: pill rozet ("Yeni · Seviyene uygun canlı sınıflar artık açık") → h1 başlık (mor accent ile vurgu) → lead → 2 buton (primary mor gradient + ghost) → trust bar (4 avatar üst üste + ★★★★★ + "12.000+ veli güveniyor · App Store 4.9").
- **Sağ**: Animasyonlu uzay illüstrasyonu — mor gezegen (radial gradient + iç gölge), eğimli halka, 2 yörünge (dashed dön), 4 köşe uydu kartı (sun/aqua/pink/green renkli, mono yazılı: CANLI · SEVİYE · VELİ · RAPOR).
- **Animasyonlar**:
  - `heroGlow1` 16s alternate — sağ üst mor halenin sürüklenmesi
  - `heroGlow2` 22s alternate — sol alt aqua halenin sürüklenmesi
  - `planetFloat` 9s ease-in-out — gezegen yukarı-aşağı
  - `planetGlow` 5s — gezegen ışıltısının nefes alması
  - `ringTilt` 12s — halka eğiminin hafif değişmesi
  - `satFloat` 6s — uydu kartlarının staggered (0/-1.5/-3/-4.5s gecikme) yüzmesi
  - `spin` o1=40s, o2=60s reverse — dashed yörünge dönüşü
  - `drift` 18s + `twinkle` 3s — yıldız parıltıları

### 02 · Problem / Çözüm (`#problem`)
- **Layout**: eyebrow + h2 + lead, ardından 2 sütunlu kart grid (problem | solution), 20px gap, 64px üst margin.
- **Problem kart**: nötr border, "× Mevcut online eğitim" tag. 4 madde: × ikonu + bold başlık + açıklama (Tek tip içerik / Soru sorulmuyor / Veli karanlıkta / Hesap verecek kimse yok).
- **Çözüm kart**: mor gradient zemin, mor border, "★ Bilenyum farkı" tag. 4 madde: ✓ yeşil ikon + bold başlık + açıklama (Seviyene uygun sınıf / Gerçek öğretmenle canlı ders / Veliye haftalık rapor / Sistem hatırlatır, takip eder).

### 03 · Canlı Sınıf — ★ ana özellik (`#classroom`)
- **Layout**: eyebrow + h2 + lead → tab bar (4 sekme: Canlı ders · Seviye sistemi · Öğretmen · Veli iletişimi) → büyük "stage" container (3 sütun: 280px / 1fr / 280px, 580px min-height, koyu mor radial gradient).
  - **Sol panel**: "Seviyeler · Yörünge" başlığı, 5 level-pill (Merkür 1-2 · Dünya 3-4 · Mars 5-6 (active mor) · Jüpiter 7-8 · Süperstar LGS).
  - **Orta panel**: video mock — sol üst 3 nokta + sağ üst kırmızı LIVE rozeti (atan dot ile).
  - **Sağ panel**: 4 status kartı (Ders saati 18:30 · Bugünün konusu · Devamlılık · Sonraki test).
- **Altta**: 4 sütunlu metrik şeridi (5 yörünge · 4 ders/hafta · 8 kişi · 45 dk).

### 04 · Nasıl Çalışır (`#how`, light)
- **Layout**: 4 sütunlu step grid, kart kart. Her kart: yörünge numarası rozeti (01-04) + h3 + body.
- **Steps**: Kayıt & tanıma / Seviye testi / Canlı sınıf / Gelişim raporu.

### 05 · Video (`#video`)
- **Layout**: ortalanmış başlık + 16:9 video player wireframe (büyük play butonu, alt kontroller).

### 06 · Veli Paneli (`#panel`, light)
- **Layout**: 2 sütun grid (1fr / 1.15fr, 64px gap). Sol: panel mockup placeholder (laptop/tablet kompozisyonu). Sağ: eyebrow + h2 + lead + 4 panel-feature satırı (48px mor ikon kutusu + h3 + p) + 2 buton.
- **Features**: Haftalık rapor / Devamlılık takibi / Öğretmen ile sohbet / Çoklu çocuk yönetimi.

### 07 · Paketler (`#pricing`, light)
- **Layout**: eyebrow + h2 + Aylık/Yıllık toggle (yıllık = "2 ay bedava") → 3 paket kartı.
- **Paketler**: Keşif (1 ders/hafta) / Yörünge (4 ders/hafta — popular badge'li, mor border) / Galaksi (sınırsız + birebir).

### 08 · Başarılar (`#success`)
- **Layout**: eyebrow + h2 + 4 sütunlu istatistik kartları (12.400+ aktif öğrenci sun / 186.000 ders aqua / %94 memnuniyet green / %37 not artışı pink) + altında 3 sütunlu mini-case-study/öğrenci başarı kartları.

### 09 · Yorumlar — Slider (`#testi`, light)
- **Layout**: eyebrow + h2 + lead → kaydırılabilir testimonial slider.
- **Slider**: 5 kart, yatay flex track, `scroll-snap-type: x mandatory`, `scroll-behavior: smooth`. Her kart 320px min-height. Desktop'ta 3, tablet'te 2, mobilde 1 kart görünür (`flex: 0 0 calc((100% - 40px) / 3)`).
- **Etkileşim**: drag-to-scroll (pointer events), prev/next ok butonları (44px daire), 5 dot indicator (active mor, 28→44px genişler).
- **5 Yorum**: Aylin Ç. (İstanbul) / Mehmet T. (Ankara) / Burcu Y. (İzmir) / Selen K. (Bursa) / Onur D. (Antalya) — her biri tek cümlelik, ★★★★★ + avatar gradient + isim/şehir.

### 10 · SSS (`#faq`, light)
- **Layout**: 860px max-width, accordion liste. Her item: soru + cevap + +/− toggle. İlk item açık.
- **6 soru**: yaş aralığı, öğretmen seçimi, devamsızlık telafisi, cihaz/internet, tek yorum/iptal, fiyat değişimi.

### 11 · CTA (`#cta`)
- **Layout**: ortalanmış, koyu mor gradient zemin, yıldızlı arka plan. h2 + lead + 2 buton (Ücretsiz başla → / Önce demo gör) + ufak guarantee/security pill rozetleri.

### 12 · Footer (`#footer`)
- **Layout**: 4 sütun grid (1.4fr / 1fr / 1fr / 1fr). Sol: logo + kısa açıklama + 3 sosyal ikon. Diğer 3: Ürün / Şirket / Yasal link grupları. Altta tek satır copyright + dil seçici.

## Interactions & Behavior

### Sticky Nav
- Üstte sabit, scroll edildiğinde `backdrop-filter: blur(16px)` ile yarı saydam.
- Bölüm linkleri: `01 · Canlı sınıf` → `09 · Yorumlar` formatında numaralı, hover'da renk değişir.

### Buttons
- Primary: mor gradient, `0 12px 32px -8px rgba(124,92,255,0.6)` shadow. Hover'da `translateY(-1px)`.
- Ghost: yarı saydam zemin, ince border. Hover'da koyulaşır.

### Pricing Toggle
- Aylık / Yıllık iki segment. Aktif segmentte mor pill arka plan, "2 ay bedava" rozeti.

### Classroom Tabs
- 4 sekme. Aktif sekmede beyaz pill arka plan. (Şu an statik; gerçek implementasyonda her sekme stage içeriğini değiştirecek.)

### FAQ Accordion
- Tek seferde tek item açık. + ↔ − toggle ikonu. Cevap yumuşak height transition.

### Testimonial Slider
- Yatay scroll-snap track (1 dosya içi `<script>` ile yönetiliyor).
- **State**: `activeIndex = round(scrollLeft / step)`.
- **step**: ilk kart genişliği + gap (20px).
- **Olaylar**:
  - `scroll` (passive): dotları günceller.
  - dot click: `track.scrollTo({ left: i*step, behavior: 'smooth' })`.
  - prev/next click: `scrollBy({ left: ±step, behavior: 'smooth' })`.
  - pointerdown/move/up: drag-to-scroll, `setPointerCapture` ile.
- React'a port edilirken: `useRef` ile track referansı + `IntersectionObserver` veya `scroll` event ile aktif index, `Embla Carousel` veya `Keen Slider` da uygun bir kütüphanedir.

### Animasyonlar (Hero)
Hepsi pure CSS keyframe. React/Tailwind'e portda `@keyframes` global CSS'e veya `framer-motion` ile yeniden kurulabilir. Listesi yukarıda "01 · Hero → Animasyonlar" başlığında.

## Responsive Behavior
- `>= 960px`: full grid layouts.
- `<= 960px`: hero ve panel grid → 1 sütun. Classroom stage → 1 sütun. Steps/pricing/stats/testi/footer → 2 sütun.
- `<= 640px`: nav-links gizlenir (hamburger ikonu eklenmeli — şu an wireframe'de yok). 2 sütun gridler → 1 sütun. Testi card 100% width.

## State Management (öneri)
- `pricingPeriod`: `'monthly' | 'yearly'`
- `classroomTab`: `'live' | 'levels' | 'teacher' | 'communication'`
- `faqOpen`: `string | null` (aktif soru id'si)
- `testiIndex`: `number` (0–4)

## Assets
- **Fontlar**: Google Fonts üzerinden Plus Jakarta Sans + JetBrains Mono. Self-host'lamak production için önerilir.
- **İkonlar**: Şu an çoğunlukla glyph/emoji yer tutucu (🪐 🌍 ★ ▶ ●). Lucide / Heroicons / Phosphor ile değiştirilmelidir.
- **Görseller**: Hero gezegen ve halka pure CSS — vector / 3D render ile değiştirilebilir. Veli paneli ve video bölümü placeholder içeriyor; gerçek panel screenshot'u + ürün videosu gerekir.
- **Logo**: Şu an metin tipografi + küçük gezegen mark. Gerçek logo varlığı kullanıcıdan alınmalıdır.

## Files
- `Bilenyum Landing v2.html` — tüm tasarım tek dosyada, inline CSS ve testimonials için inline JS.

## Notlar
- Türkçe içerik. Locale `lang="tr"`.
- Bölümlerde `data-screen-label` attribute'ları yorum/anchor referansı içindir; production'da kaldırılabilir.
- Classroom tab içerik geçişleri ve FAQ accordion için JS henüz mock — gerçek state management eklenmeli.
- Pricing fiyatları yer tutucu olabilir; finalize edilmeli.
