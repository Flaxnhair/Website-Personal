const STORAGE_KEY = 'tanjungAlaiAdminData';
const category = new URLSearchParams(window.location.search).get('kategori');

const categoryLabels = {
  religi: 'Wisata Religi',
  alam: 'Wisata Alam',
  kuliner: 'Wisata Kuliner'
};

const defaultDestinations = [
  {
    title: 'Wisata Religi',
    type: '01 / Religi',
    category: 'religi',
    description: 'Ziarah ke maqam Syekh H. Abdurrahman bin Paduko Lakmano, mursyid Thariqat Naqsyabandiyah.'
  },
  {
    title: 'Wisata Alam Gulamo',
    type: '02 / Alam',
    category: 'alam',
    description: 'Nikmati suasana sungai dan pemandangan hijau di kawasan Gulamo.'
  },
  {
    title: 'Wisata Kuliner',
    type: '03 / Kuliner',
    category: 'kuliner',
    description: 'Kenali cita rasa lokal dan pilihan sajian khas di Desa Tanjung Alai.'
  }
];

function showUnavailable(message) {
  document.getElementById('destinationTitle').textContent = 'Informasi wisata belum tersedia';
  document.getElementById('destinationDescription').textContent = message;
  document.getElementById('destinationNotice').textContent = message;
  document.getElementById('destinationNotice').hidden = false;
  document.querySelector('.detail-information').hidden = true;
}

function trustedMapsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const isGoogleMaps = url.hostname === 'maps.google.com'
      || ((url.hostname === 'google.com' || url.hostname.endsWith('.google.com')) && url.pathname.startsWith('/maps'));
    const isMapsShortLink = url.hostname === 'maps.app.goo.gl';
    return isGoogleMaps || isMapsShortLink ? url : null;
  } catch (error) {
    return null;
  }
}

function renderDestination(destination) {
  document.title = `${destination.title} | Wisata Desa Tanjung Alai`;
  document.getElementById('destinationType').textContent = destination.type || categoryLabels[destination.category] || 'Wisata Desa';
  document.getElementById('destinationTitle').textContent = destination.title;
  document.getElementById('destinationDescription').textContent = destination.description || 'Deskripsi wisata belum diisi.';

  const image = document.getElementById('destinationPhoto');
  const placeholder = document.getElementById('destinationPhotoPlaceholder');
  if (destination.image) {
    image.src = destination.image;
    image.alt = `Foto ${destination.title}`;
    image.hidden = false;
    placeholder.hidden = true;
  }

  document.getElementById('entranceFee').textContent = destination.entranceFee || 'Belum diisi';
  document.getElementById('parkingFee').textContent = destination.parkingFee || 'Belum diisi';

  const mapUrl = trustedMapsUrl(destination.mapUrl);
  const mapDescription = document.getElementById('mapDescription');
  const mapLink = document.getElementById('mapLink');
  const mapPreview = document.getElementById('mapPreview');
  if (mapUrl) {
    mapDescription.textContent = 'Lihat titik lokasi dan petunjuk perjalanan di Google Maps.';
    mapLink.href = mapUrl.href;
    mapLink.hidden = false;
    if (mapUrl.hostname === 'www.google.com' && mapUrl.pathname.startsWith('/maps/embed')) {
      const frame = document.createElement('iframe');
      frame.src = mapUrl.href;
      frame.title = `Peta ${destination.title}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.allowFullscreen = true;
      mapPreview.append(frame);
      mapPreview.hidden = false;
    }
  }

  const facilities = (destination.facilities || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const facilitiesList = document.getElementById('facilitiesList');
  facilities.forEach((facility) => {
    const item = document.createElement('li');
    item.textContent = facility;
    facilitiesList.append(item);
  });
  document.getElementById('facilitiesEmpty').hidden = facilities.length > 0;
}

try {
  if (!category || !categoryLabels[category]) {
    showUnavailable('Pilih wisata dari bagian Potensi Desa di halaman utama.');
  } else {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const state = savedState ? JSON.parse(savedState) : null;
    const destinations = Array.isArray(state?.destinations) ? state.destinations : defaultDestinations;
    const destination = destinations.find((item) => item.category === category)
      || defaultDestinations.find((item) => item.category === category);
    if (destination) {
      renderDestination(destination);
    } else {
      showUnavailable('Rincian wisata belum tersedia. Silakan kembali ke halaman utama atau hubungi pengelola desa.');
    }
  }
} catch (error) {
  showUnavailable('Data wisata tidak dapat dibaca dari browser ini. Silakan coba kembali.');
}
