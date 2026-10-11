/*
 * Copy for the interface in English (en) and Turkish (tr).
 * Add a key to both languages together; the app reads them through data-i18n attributes and L().
 */
window.POMO_STR = {
  en: {
    title: 'Pomodoro Timer',
    focus: 'Focus', short: 'Short break', long: 'Long break',
    start: 'Start', pause: 'Pause', resume: 'Resume',
    resetAria: 'Reset timer', skip: 'Skip to next session', modes: 'Session type',
    capFocus: 'Pomodoro {n} of 4', capShort: 'Rest your eyes', capLong: 'Step away for a while',
    task: 'What are you working on?', taskPh: 'e.g. Finish the history essay',
    cycle: 'Cycle', cycleText: '{n} of 4 pomodoros done. Long break after the fourth.',
    today: 'Today', pomodoros: 'pomodoros completed', focused: 'focused time',
    goal: 'Daily goal', goalText: '{n} of {g} pomodoros', goalDone: 'Goal reached',
    logTitle: 'Today’s sessions',
    logEmpty: 'No sessions yet. Finished pomodoros show up here with the time and what you worked on.',
    untitled: 'Untitled session',
    settings: 'Settings', durations: 'Minutes per session', goalSet: 'Daily goal (pomodoros)',
    auto: 'Start the next session automatically', sound: 'Play a sound when time is up',
    clear: 'Reset today’s count', clearConfirm: 'Click again to confirm',
    hint: '<kbd>Space</kbd> start or pause · <kbd>R</kbd> reset · <kbd>S</kbd> skip · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> session · <kbd>T</kbd> theme · <kbd>L</kbd> language',
    method: 'The classic rhythm: 25 minutes of focus, 5 minutes off, and a 15-minute break after every fourth round. Francesco Cirillo built the method around a tomato-shaped kitchen timer in the late 1980s, which is where the name comes from (pomodoro is Italian for tomato).',
    noticeFocusShort: 'Focus session done. Take a short break.',
    noticeFocusLong: 'Four pomodoros done. Time for a long break.',
    noticeBreakDone: 'Break over. Ready for the next pomodoro.',
    themeToDark: 'Switch to dark mode', themeToLight: 'Switch to light mode',
    unitMin: 'min', unitH: 'h', locale: 'en-GB'
  },
  tr: {
    title: 'Pomodoro Zamanlayıcı',
    focus: 'Odak', short: 'Kısa mola', long: 'Uzun mola',
    start: 'Başlat', pause: 'Duraklat', resume: 'Devam et',
    resetAria: 'Zamanlayıcıyı sıfırla', skip: 'Sonraki oturuma geç', modes: 'Oturum türü',
    capFocus: 'Pomodoro {n} / 4', capShort: 'Gözlerini dinlendir', capLong: 'Bir süre ekrandan uzaklaş',
    task: 'Ne üzerinde çalışıyorsun?', taskPh: 'örn. Tarih ödevini bitir',
    cycle: 'Döngü', cycleText: '{n} / 4 pomodoro tamamlandı. Dördüncüden sonra uzun mola.',
    today: 'Bugün', pomodoros: 'tamamlanan pomodoro', focused: 'odaklanılan süre',
    goal: 'Günlük hedef', goalText: '{n} / {g} pomodoro', goalDone: 'Hedefe ulaşıldı',
    logTitle: 'Bugünkü oturumlar',
    logEmpty: 'Henüz oturum yok. Biten pomodorolar saatiyle ve üzerinde çalıştığın işle burada görünür.',
    untitled: 'Adsız oturum',
    settings: 'Ayarlar', durations: 'Oturum süreleri (dakika)', goalSet: 'Günlük hedef (pomodoro)',
    auto: 'Sonraki oturumu otomatik başlat', sound: 'Süre dolunca ses çal',
    clear: 'Bugünkü sayacı sıfırla', clearConfirm: 'Onaylamak için tekrar tıkla',
    hint: '<kbd>Boşluk</kbd> başlat veya duraklat · <kbd>R</kbd> sıfırla · <kbd>S</kbd> atla · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> oturum · <kbd>T</kbd> tema · <kbd>L</kbd> dil',
    method: 'Klasik ritim: 25 dakika odak, 5 dakika mola ve her dördüncü turdan sonra 15 dakikalık uzun mola. Yöntemi 1980’lerin sonunda Francesco Cirillo domates biçimli bir mutfak zamanlayıcısıyla geliştirdi; adı da buradan gelir (pomodoro, İtalyanca’da domates demektir).',
    noticeFocusShort: 'Odak oturumu bitti. Kısa bir mola ver.',
    noticeFocusLong: 'Dört pomodoro tamamlandı. Uzun mola zamanı.',
    noticeBreakDone: 'Mola bitti. Sıradaki pomodoroya hazırsın.',
    themeToDark: 'Koyu temaya geç', themeToLight: 'Açık temaya geç',
    unitMin: 'dk', unitH: 'sa', locale: 'tr-TR'
  }
};
