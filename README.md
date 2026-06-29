# Abisena / Panates Hasta Takip Sistemi

React 18 + TypeScript ile hazırlanmış poliklinik hasta randevu ve takip paneli.

## Özellikler

- Hasta kayıtlarını `GET https://v0-json-api-three.vercel.app/api/data` üzerinden yükler.
- Yeni hasta ekleme, düzenleme ve silme işlemlerini local state üzerinde yapar.
- İsim, tanı, not ve etiketler üzerinde arama sağlar.
- Departman ve durum filtreleri ile randevu, oluşturulma tarihi, hasta adı veya skora göre sıralama içerir.
- TR / EN arayüz desteği sunar.
- Responsive tablo, modal form, loading, empty ve error state'leri vardır.

## Kurulum

```bash
pnpm install
pnpm dev
```

## Kontrol

```bash
pnpm lint
pnpm build
```
