(function (global) {
  'use strict';

  var BADGES = [
    { id: 'badge-first-answer', name: 'İlk Cevap', description: 'Derste ilk quiz cevabını verdin.', icon: '⚡', rarity: 'common' },
    { id: 'badge-fast-answer', name: 'Hızlı Cevaplayıcı', description: '10 saniyeden kısa sürede doğru cevap verdin.', icon: '🏃', rarity: 'rare' },
    { id: 'badge-problem-solver', name: 'Problem Çözücü', description: '3 doğru quiz cevabı arka arkaya.', icon: '🧩', rarity: 'epic' },
    { id: 'badge-wb-hero', name: 'Whiteboard Kahramanı', description: 'Whiteboard\'da çözüm yazdın.', icon: '📝', rarity: 'epic' },
    { id: 'badge-curious', name: 'Soru Soran Zihin', description: 'Öğretmene anlamlı soru sordun.', icon: '💡', rarity: 'common' },
    { id: 'badge-focus', name: 'Odak Ustası', description: 'Odak modunda 15 dakika kaldın.', icon: '🎯', rarity: 'rare' },
    { id: 'badge-team', name: 'Takım Oyuncusu', description: 'Arkadaşlarını alkışladın.', icon: '🤝', rarity: 'common' },
    { id: 'badge-brave', name: 'Yardım İsteyen Cesur', description: 'Anlamadım geri bildirimi verdin.', icon: '🙋', rarity: 'common' },
    { id: 'badge-streak-5', name: '5 Günlük Seri', description: '5 gün üst üste derse katıldın.', icon: '🔥', rarity: 'legendary' },
    { id: 'badge-quiet', name: 'Sessiz Katılımcı', description: 'Dikkatli dinleyerek katıldın.', icon: '🤫', rarity: 'common' },
    { id: 'badge-explain', name: 'Harika Açıklama', description: 'Whiteboard\'da net açıklama yaptın.', icon: '✨', rarity: 'epic' },
    { id: 'badge-quiz-master', name: 'Quiz Ustası', description: '10 quiz sorusunu doğru cevapladın.', icon: '🏆', rarity: 'legendary' },
    { id: 'badge-hand-raiser', name: 'El Kaldıran', description: '5 kez el kaldırdın.', icon: '✋', rarity: 'common' },
    { id: 'badge-connection', name: 'Bağlantı Savaşçısı', description: 'Zayıf bağlantıya rağmen derste kaldın.', icon: '📶', rarity: 'rare' },
    { id: 'badge-open-answer', name: 'Açık Uçlu Uzman', description: '3 açık uçlu cevap yazdın.', icon: '📖', rarity: 'rare' },
    { id: 'badge-early', name: 'Erken Kuş', description: 'Derse zamanında katıldın.', icon: '🌅', rarity: 'common' },
    { id: 'badge-helper', name: 'Yardımsever', description: 'Arkadaşına yardım ettin.', icon: '💬', rarity: 'rare' },
    { id: 'badge-math-star', name: 'Matematik Yıldızı', description: 'Matematik dersinde yüksek XP kazandın.', icon: '⭐', rarity: 'epic' },
    { id: 'badge-persistence', name: 'Azimli', description: 'Yanlış cevaptan sonra tekrar denedin.', icon: '💪', rarity: 'common' },
    { id: 'badge-clap', name: 'Alkış Ustası', description: '10 alkış reaksiyonu gönderdin.', icon: '👏', rarity: 'common' },
    { id: 'badge-heart', name: 'Kalp Atışı', description: 'Beğeni reaksiyonu gönderdin.', icon: '❤', rarity: 'common' },
    { id: 'badge-slow-feedback', name: 'Tempo Geri Bildirimi', description: 'Yavaşla geri bildirimi verdin.', icon: '🐢', rarity: 'common' },
    { id: 'badge-speed-up', name: 'Hızlan', description: 'Hızlan geri bildirimi verdin.', icon: '🚀', rarity: 'common' },
    { id: 'badge-wb-selected', name: 'Tahtaya Çıktı', description: 'İlk kez whiteboard\'a seçildin.', icon: '🎨', rarity: 'rare' },
    { id: 'badge-teacher-bonus', name: 'Öğretmen Teşviki', description: 'Öğretmenden bonus XP aldın.', icon: '🎁', rarity: 'epic' },
    { id: 'badge-perfect-quiz', name: 'Mükemmel Quiz', description: 'Tüm quiz sorularını doğru cevapladın.', icon: '💯', rarity: 'legendary' },
    { id: 'badge-notes', name: 'Not Ustası', description: 'Derste 5 not aldın.', icon: '📓', rarity: 'common' },
    { id: 'badge-screenshot', name: 'Ekran Kaydı', description: '3 ekran görüntüsü ekledin.', icon: '📸', rarity: 'common' },
    { id: 'badge-reconnect', name: 'Yeniden Bağlandı', description: 'Bağlantı kopunca geri döndün.', icon: '🔌', rarity: 'rare' },
    { id: 'badge-confused', name: 'Meraklı Zihin', description: 'Anlamadım diyerek öğrenmeye açık olduğunu gösterdin.', icon: '🤔', rarity: 'common' },
    { id: 'badge-level-5', name: 'Seviye 5', description: 'Seviye 5\'e ulaştın.', icon: '🌟', rarity: 'epic' },
    { id: 'badge-xp-500', name: '500 XP Kulübü', description: 'Toplam 500 XP kazandın.', icon: '💎', rarity: 'legendary' },
    { id: 'badge-participation', name: 'Aktif Katılımcı', description: 'Katılım skoru 80+ oldu.', icon: '📊', rarity: 'rare' },
    { id: 'badge-collab', name: 'İş Birliği', description: 'Sınıf tartışmasına katkı verdin.', icon: '🗣', rarity: 'common' },
    { id: 'badge-wb-stroke-50', name: 'Çizim Ustası', description: '50 stroke çizdin.', icon: '✏', rarity: 'epic' },
    { id: 'badge-question-featured', name: 'Öne Çıkan Soru', description: 'Sorun öğretmen tarafından öne çıkarıldı.', icon: '🌠', rarity: 'rare' },
    { id: 'badge-break-return', name: 'Ara Sonrası Dönüş', description: 'Ara sonrası derse geri döndün.', icon: '⏸', rarity: 'common' },
    { id: 'badge-end-summary', name: 'Ders Tamamlandı', description: 'Ders sonu özetini gördün.', icon: '🎓', rarity: 'common' },
    { id: 'badge-focus-complete', name: 'Odak Tamamlandı', description: 'Odak modunu başarıyla tamamladın.', icon: '🔒', rarity: 'rare' },
    { id: 'badge-hand-first', name: 'İlk El', description: 'İlk el kaldıran oldun.', icon: '🥇', rarity: 'rare' }
  ];

  var ACHIEVEMENTS = [
    { id: 'ach-quiz-10', title: '10 Quiz Cevabı', description: '10 quiz sorusuna cevap ver.', progressTarget: 10 },
    { id: 'ach-correct-5', title: '5 Doğru Cevap', description: '5 doğru quiz cevabı ver.', progressTarget: 5 },
    { id: 'ach-hand-3', title: '3 El Kaldırma', description: 'Derste 3 kez el kaldır.', progressTarget: 3 },
    { id: 'ach-wb-1', title: 'Whiteboard\'a Çık', description: 'Whiteboard\'a en az 1 kez seçil.', progressTarget: 1 },
    { id: 'ach-xp-100', title: '100 XP', description: 'Bugün 100 XP kazan.', progressTarget: 100 },
    { id: 'ach-question-1', title: 'Soru Sor', description: 'Öğretmene 1 soru sor.', progressTarget: 1 },
    { id: 'ach-reaction-5', title: '5 Reaksiyon', description: '5 reaksiyon gönder.', progressTarget: 5 },
    { id: 'ach-active-30', title: '30 dk Aktif', description: '30 dakika aktif kal.', progressTarget: 30 },
    { id: 'ach-open-3', title: '3 Açık Uçlu', description: '3 açık uçlu cevap yaz.', progressTarget: 3 },
    { id: 'ach-streak-3', title: '3 Günlük Seri', description: '3 gün üst üste derse katıl.', progressTarget: 3 },
    { id: 'ach-wb-stroke-20', title: '20 Stroke', description: 'Whiteboard\'da 20 stroke çiz.', progressTarget: 20 },
    { id: 'ach-clap-10', title: '10 Alkış', description: '10 alkış reaksiyonu gönder.', progressTarget: 10 },
    { id: 'ach-focus-10', title: '10 dk Odak', description: 'Odak modunda 10 dk kal.', progressTarget: 10 },
    { id: 'ach-chat-5', title: '5 Chat Mesajı', description: '5 anlamlı chat mesajı gönder.', progressTarget: 5 },
    { id: 'ach-quiz-fast', title: 'Hızlı Cevap', description: '15 sn altında doğru cevap ver.', progressTarget: 1 },
    { id: 'ach-level-5', title: 'Seviye 5', description: 'Seviye 5\'e ulaş.', progressTarget: 5 },
    { id: 'ach-participation-80', title: 'Katılım 80', description: 'Katılım skorunu 80\'e çıkar.', progressTarget: 80 },
    { id: 'ach-wb-solution', title: 'Çözüm Tamamla', description: 'Whiteboard çözümünü tamamla.', progressTarget: 1 },
    { id: 'ach-confused-3', title: '3 Anlamadım', description: '3 anlamadım geri bildirimi ver.', progressTarget: 3 },
    { id: 'ach-lesson-complete', title: 'Dersi Tamamla', description: 'Canlı dersi sonuna kadar takip et.', progressTarget: 1 }
  ];

  global.BilenyumBadges = { BADGES: BADGES, ACHIEVEMENTS: ACHIEVEMENTS };

})(typeof window !== 'undefined' ? window : this);
