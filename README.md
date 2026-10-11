# Pomodoro Timer / Pomodoro Zamanlayıcı

**[Canlı demo / Live demo →](https://pomodoro-timer-begs.vercel.app)**

**TR:** Türkçe ve İngilizce arayüzlü, açık/koyu temalı Pomodoro zamanlayıcı. Kurulum, derleme adımı veya bağımlılık yok: saf HTML, CSS ve JavaScript.

**EN:** A Pomodoro timer with an English/Turkish interface and light/dark themes. No install, no build step, no dependencies: plain HTML, CSS and JavaScript.

## Özellikler / Features

- Odak, kısa mola ve uzun mola oturumları / Focus, short break and long break sessions
- Dört turluk döngü takibi, ardından uzun mola / Four-round cycle tracker followed by a long break
- Sonraki oturumu otomatik başlatma seçeneği / Option to start the next session automatically
- Günlük hedef, tamamlanan pomodoro sayısı, odaklanılan süre ve oturum günlüğü / Daily goal, completed count, focused time and a session log
- EN/TR dil düğmesi / EN/TR language switch
- Cihaz ayarını izleyen açık/koyu tema düğmesi / Light/dark toggle that follows the device by default
- Oturum bitince ses ve görsel uyarı; eylemler için kısa ses ipuçları / Chime and visual cue when a session ends, short sound cues for actions
- Dil, tema, görev metni, ayarlar ve çalışan geri sayım yenilemeden sonra korunur / Language, theme, task text, settings and the running countdown survive a refresh
- Mobil uyumlu düzen / Responsive layout

## Klavye kısayolları / Keyboard shortcuts

| Tuş / Key | İşlev / Action |
| --- | --- |
| `Space` | Başlat veya duraklat / Start or pause |
| `R` | Sıfırla / Reset |
| `S` | Sonraki oturuma geç / Skip |
| `1` `2` `3` | Odak, kısa mola, uzun mola / Focus, short break, long break |
| `T` | Tema değiştir / Toggle theme |
| `L` | Dil değiştir / Toggle language |

Kısayollar bir yazı alanındayken çalışmaz. / Shortcuts are ignored while typing in a field.

## Klasör yapısı / Project structure

```
PomodoroTimer/
├── index.html            Sayfa yapısı / Page markup
├── css/style.css         Tasarım, açık ve koyu tema / Styles, light and dark themes
├── js/translations.js    EN ve TR metinleri / English and Turkish copy
├── js/app.js             Zamanlayıcı, durum ve kayıt mantığı / Timer, state and persistence
├── standalone/
│   └── pomodoro-timer.html   Her şey tek dosyada / Everything in one file
├── .gitignore
├── README.md
└── LICENSE
```

Yeni bir dil veya metin eklemek için `js/translations.js` dosyasında her iki dile aynı anahtarı ekleyin. / To add or change copy, add the same key to both languages in `js/translations.js`.

## Çalıştırma / Run locally

Depoyu indirin ve `index.html` dosyasına çift tıklayın. Dosyalar birbirine göreli yollarla bağlı olduğu için klasör yapısını bozmayın. / Download the repository and double-click `index.html`. Keep the folder structure intact, since the files link to each other by relative paths.

```bash
git clone https://github.com/begs44/PomodoroTimer.git
cd PomodoroTimer
```

## Yayınlama / Deployment

Site [Vercel](https://vercel.com) üzerinde yayında. GitHub deposuna her `git push` yapıldığında site otomatik güncellenir. / The site is hosted on Vercel and updates automatically on every `git push` to the GitHub repository.

## Veriler nerede saklanır? / Where is data stored?

Her şey yalnızca kendi tarayıcınızın `localStorage` alanında tutulur; hiçbir veri sunucuya gönderilmez. / Everything stays in your own browser's `localStorage`; nothing is sent to a server.

| Anahtar / Key | İçerik / Contents |
| --- | --- |
| `pomo.lang` | Dil (`en` veya `tr`) / Language |
| `pomo.theme` | Tema (`light` veya `dark`); yoksa cihaz ayarı izlenir / Theme; if absent, the device setting is followed |
| `pomo.task` | Görev metni / Task text |
| `pomo.settings` | Süreler, günlük hedef, otomatik başlatma ve ses ayarları / Durations, goal, auto-start and sound |
| `pomo.stats` | Bugünün sayacı ve oturum günlüğü / Today's counters and log |
| `pomo.session` | Açık oturum: mod, döngü sırası ve geri sayım / Current session: mode, cycle position, countdown |

## Teknik notlar / Technical notes

- Saf HTML, CSS ve JavaScript; çerçeve yok. / Plain HTML, CSS and JavaScript; no framework.
- Yazı tipleri Google Fonts üzerinden yüklenir; çevrimdışıyken sistem yazı tipleri kullanılır. / Fonts load from Google Fonts; system fonts are used offline.
- `js/app.js` bölümlere ayrılmış ve yorumlanmıştır. / `js/app.js` is organized into commented sections.

## Lisans / License

MIT, ayrıntılar için `LICENSE` dosyasına bakın. / MIT, see `LICENSE`.
