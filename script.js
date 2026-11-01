const STORAGE_KEY = 'tanjungAlaiAdminData';
const AUTH_KEY = 'tanjungAlaiAdminAuth';
const VISIT_COUNT_KEY = 'tanjungAlaiWebsiteVisits';

const defaultState = {
  profile: {
    year: '1994',
    population: '1.200+',
    tourism: '3',
    local: '100%',
    motto: 'Dari desa lama yang tenggelam oleh kenangan, bangkit menjadi mutira wisata kampar yang menawan',
    image: '',
    populationStats: {
      total: '',
      male: '',
      female: '',
      households: '',
      mutations: '',
      temporary: ''
    },
    apbd: {
      income: '',
      expenditure: ''
    },
    vision: '',
    mission: '',
    history: ''
  },
  structure: [
    {
      role: 'Kepala Desa',
      name: 'H. Amiruddin',
      description: 'Memimpin arah pembangunan, kebijakan desa, dan koordinasi dengan warga.'
    },
    {
      role: 'Sekretaris Desa',
      name: 'Rizal Hidayat',
      description: 'Mengelola administrasi, dokumen, dan koordinasi pelaksanaan program desa.'
    },
    {
      role: 'Kasi Pemerintahan',
      name: 'Indra Wijaya',
      description: 'Menangani tata kelola pemerintahan, pelayanan, dan kebijakan lokal.'
    },
    {
      role: 'Kasi Pemberdayaan',
      name: 'Siti Rahma',
      description: 'Mendorong UMKM, potensi desa, serta kesejahteraan masyarakat berbasis lokal.'
    }
  ],
  destinations: [
    {
      title: 'Wisata Religi',
      type: '01 / Religi',
      category: 'religi',
      description: 'Ziarah ke maqam Syekh H. Abdurrahman bin Paduko Lakmano, mursyid Thariqat Naqsyabandiyah.',
      mapUrl: '',
      entranceFee: '',
      parkingFee: '',
      facilities: '',
      large: true
    },
    {
      title: 'Wisata Alam Gulamo',
      type: '02 / Alam',
      category: 'alam',
      description: 'Nikmati suasana sungai dan pemandangan hijau di kawasan Gulamo.',
      mapUrl: '',
      entranceFee: '',
      parkingFee: '',
      facilities: '',
      large: false
    },
    {
      title: 'Wisata Kuliner',
      type: '03 / Kuliner',
      category: 'kuliner',
      description: 'Kenali cita rasa lokal dan pilihan sajian khas di Desa Tanjung Alai.',
      mapUrl: '',
      entranceFee: '',
      parkingFee: '',
      facilities: '',
      large: false
    }
  ],
  news: Array.from({ length: 4 }, () => ({
    title: '',
    date: '',
    summary: '',
    content: '',
    image: ''
  })),
  photos: [],
  villageInfo: {
    contact: '',
    importantPhones: '',
    socialMedia: ''
  }
};

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const adminLoginBtn = document.querySelector('.admin-login-btn');
const adminModal = document.getElementById('adminModal');
const closeAdminBtn = document.querySelector('.close-admin');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginView = document.getElementById('adminLoginView');
const addDestinationForm = document.getElementById('addDestinationForm');
const addPhotoForm = document.getElementById('addPhotoForm');
const adminPhotoList = document.getElementById('adminPhotoList');
const structureEditor = document.getElementById('structureEditor');
const destinationEditor = document.getElementById('destinationEditor');
const newsEditor = document.getElementById('newsEditor');
const addNewsBtn = document.getElementById('addNewsBtn');
const newsGrid = document.getElementById('newsGrid');
const newsDetailDialog = document.getElementById('newsDetailDialog');
const umkmGrid = document.getElementById('umkmGrid');
const umkmStatus = document.getElementById('umkmStatus');
const umkmAdminStatus = document.getElementById('umkmAdminStatus');
const umkmAdminProducts = document.getElementById('umkmAdminProducts');
const umkmProductForm = document.getElementById('umkmProductForm');
const umkmAdminSignIn = document.getElementById('umkmAdminSignIn');
const umkmAdminSignOut = document.getElementById('umkmAdminSignOut');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const addStructureBtn = document.getElementById('addStructureBtn');

let adminState = loadState();
let umkmProducts = [];
let umkmAdminProductsCache = [];

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(saved);
    return {
      ...defaultState,
      ...parsed,
      profile: {
        ...defaultState.profile,
        ...(parsed.profile || {}),
        populationStats: {
          ...defaultState.profile.populationStats,
          ...(parsed.profile?.populationStats || {})
        },
        apbd: {
          ...defaultState.profile.apbd,
          ...(parsed.profile?.apbd || {})
        }
      },
      news: Array.from({ length: Math.max(4, parsed.news?.length || 0) }, (_, index) => ({
        ...defaultState.news[index % defaultState.news.length],
        ...(parsed.news?.[index] || {}),
        image: parsed.news?.[index]?.image || ''
      })),
      structure: (parsed.structure || defaultState.structure).map((item) => ({ ...item, image: item.image || '' })),
      destinations: (parsed.destinations || defaultState.destinations).map((item) => ({
        ...item,
        mapUrl: item.mapUrl || '',
        entranceFee: item.entranceFee || '',
        parkingFee: item.parkingFee || '',
        facilities: item.facilities || '',
        image: item.image || ''
      })),
      photos: parsed.photos || defaultState.photos,
      villageInfo: { ...defaultState.villageInfo, ...(parsed.villageInfo || {}) }
    };
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(adminState));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function isGoogleMapsUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    const shortMapsLink = url.hostname === 'maps.app.goo.gl';
    const googleMapsPath = url.hostname === 'maps.google.com'
      || ((url.hostname === 'google.com' || url.hostname.endsWith('.google.com')) && url.pathname.startsWith('/maps'));
    return url.protocol === 'https:' && (shortMapsLink || googleMapsPath);
  } catch (error) {
    return false;
  }
}

function renderProfile() {
  const year = document.getElementById('desaYear');
  const motto = document.getElementById('desaMotto');
  const population = document.getElementById('populationValue');
  const tourism = document.getElementById('tourismValue');
  const local = document.getElementById('localValue');

  if (year) year.textContent = adminState.profile.year;
  if (motto) motto.textContent = adminState.profile.motto;
  if (population) population.textContent = adminState.profile.population;
  if (tourism) tourism.textContent = adminState.profile.tourism;
  if (local) local.textContent = adminState.profile.local;

  const vision = document.getElementById('desaVision');
  const mission = document.getElementById('desaMission');
  const history = document.getElementById('desaHistory');
  const profileVisionInput = document.getElementById('adminVision');
  const profileMissionInput = document.getElementById('adminMission');
  const profileHistoryInput = document.getElementById('adminHistory');

  if (vision) {
    vision.textContent = adminState.profile.vision || 'Visi desa belum ditambahkan. Silakan lengkapi melalui panel admin.';
  }
  if (mission) {
    mission.replaceChildren();
    const missionItems = adminState.profile.mission.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (missionItems.length === 0) missionItems.push('Misi desa belum ditambahkan. Silakan lengkapi melalui panel admin.');
    missionItems.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      mission.append(listItem);
    });
  }
  if (history) {
    history.textContent = adminState.profile.history || 'Sejarah desa belum ditambahkan. Silakan lengkapi melalui panel admin.';
  }

  const profileYearInput = document.getElementById('adminYear');
  const profilePopulationInput = document.getElementById('adminPopulation');
  const profileTourismInput = document.getElementById('adminTourism');
  const profileLocalInput = document.getElementById('adminLocal');
  const profileMottoInput = document.getElementById('adminMotto');

  if (profileYearInput) profileYearInput.value = adminState.profile.year;
  if (profilePopulationInput) profilePopulationInput.value = adminState.profile.population;
  if (profileTourismInput) profileTourismInput.value = adminState.profile.tourism;
  if (profileLocalInput) profileLocalInput.value = adminState.profile.local;
  if (profileMottoInput) profileMottoInput.value = adminState.profile.motto;
  if (profileVisionInput) profileVisionInput.value = adminState.profile.vision;
  if (profileMissionInput) profileMissionInput.value = adminState.profile.mission;
  if (profileHistoryInput) profileHistoryInput.value = adminState.profile.history;

  const populationStatFields = {
    total: 'adminPopulationTotal',
    male: 'adminPopulationMale',
    female: 'adminPopulationFemale',
    households: 'adminHouseholds',
    mutations: 'adminPopulationMutations',
    temporary: 'adminTemporaryPopulation'
  };
  Object.entries(populationStatFields).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (input) input.value = adminState.profile.populationStats[key];
    const value = document.querySelector(`[data-population-stat="${key}"]`);
    if (value) value.textContent = adminState.profile.populationStats[key] || 'Belum diisi';
  });
  const apbdFields = {
    income: 'adminApbdIncome',
    expenditure: 'adminApbdExpenditure'
  };
  Object.entries(apbdFields).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (input) input.value = adminState.profile.apbd[key];
    const value = document.querySelector(`[data-apbd="${key}"]`);
    if (value) value.textContent = adminState.profile.apbd[key] || 'Belum diisi';
  });

  const profileImage = document.querySelector('.profile-image');
  const profilePhotoPreview = document.getElementById('adminProfilePhotoPreview');
  const removeProfilePhoto = document.getElementById('removeProfilePhoto');
  if (profileImage) {
    profileImage.style.backgroundImage = adminState.profile.image
      ? `linear-gradient(180deg,rgba(24,61,58,.1),rgba(24,61,58,.18)),url("${adminState.profile.image}")`
      : '';
  }
  if (profilePhotoPreview) {
    profilePhotoPreview.src = adminState.profile.image;
    profilePhotoPreview.classList.toggle('hidden', !adminState.profile.image);
  }
  if (removeProfilePhoto) removeProfilePhoto.classList.toggle('hidden', !adminState.profile.image);
}

function renderVillageInfo() {
  const contact = document.getElementById('villageContact');
  const phones = document.getElementById('importantPhones');
  const socialMedia = document.getElementById('villageSocialMedia');
  const visitCount = document.getElementById('websiteVisitCount');
  const contactInput = document.getElementById('adminVillageContact');
  const phonesInput = document.getElementById('adminImportantPhones');
  const socialInput = document.getElementById('adminSocialMedia');

  if (contact) {
    contact.textContent = adminState.villageInfo.contact || 'Informasi kontak belum tersedia.';
  }
  renderInfoLinks(phones, adminState.villageInfo.importantPhones, 'Nomor telepon belum tersedia.', true);
  renderInfoLinks(socialMedia, adminState.villageInfo.socialMedia, 'Akun sosial media belum tersedia.');
  if (visitCount) visitCount.textContent = localStorage.getItem(VISIT_COUNT_KEY) || '0';
  if (contactInput) contactInput.value = adminState.villageInfo.contact;
  if (phonesInput) phonesInput.value = adminState.villageInfo.importantPhones;
  if (socialInput) socialInput.value = adminState.villageInfo.socialMedia;
}

function renderInfoLinks(container, entries, emptyText, telephone = false) {
  if (!container) return;
  container.replaceChildren();
  const rows = entries.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  if (rows.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'info-empty';
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  rows.forEach((row) => {
    const [labelText, ...valueParts] = row.split('|');
    const label = labelText.trim();
    const value = valueParts.join('|').trim();
    const item = document.createElement('div');
    item.className = 'info-link-item';
    if (!value) {
      item.textContent = label;
      container.append(item);
      return;
    }

    const link = document.createElement('a');
    link.textContent = `${label}: ${value}`;
    if (telephone) {
      const phoneValue = value.replace(/[^\d+]/g, '');
      if (!phoneValue) {
        item.textContent = `${label}: ${value}`;
        container.append(item);
        return;
      }
      link.href = `tel:${phoneValue}`;
    } else {
      let url;
      try {
        url = new URL(value);
      } catch (error) {
        item.textContent = `${label}: ${value}`;
        container.append(item);
        return;
      }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        item.textContent = `${label}: ${value}`;
        container.append(item);
        return;
      }
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
    item.append(link);
    container.append(item);
  });
}

function renderStructureCards() {
  const structureGrid = document.getElementById('structureGrid');
  if (!structureGrid) return;

  structureGrid.replaceChildren();
  adminState.structure.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'structure-card';
    card.dataset.index = String(index);
    if (item.image) {
      const image = document.createElement('img');
      image.className = 'structure-photo';
      image.src = item.image;
      image.alt = `Foto ${item.role}`;
      image.loading = 'lazy';
      card.append(image);
    }
    const role = document.createElement('span');
    role.className = 'structure-role';
    role.textContent = item.role;
    const name = document.createElement('h3');
    name.textContent = item.name;
    const description = document.createElement('p');
    description.textContent = item.description;
    card.append(role, name, description);
    structureGrid.append(card);
  });

  const structureEditorContainer = document.getElementById('structureEditor');
  if (!structureEditorContainer) return;

  structureEditorContainer.innerHTML = adminState.structure.map((item, index) => `
    <div class="structure-editor-row">
      <label>
        <span>Jabatan</span>
        <input data-structure-index="${index}" data-field="role" value="${item.role}" />
      </label>
      <label>
        <span>Nama</span>
        <input data-structure-index="${index}" data-field="name" value="${item.name}" />
      </label>
      <label>
        <span>Deskripsi</span>
        <textarea data-structure-index="${index}" data-field="description" rows="3">${item.description}</textarea>
      </label>
      <label>
        <span>Foto anggota</span>
        <input type="file" accept="image/*" data-structure-photo="${index}" />
      </label>
      ${item.image ? `<div class="editor-photo-preview"><img src="${item.image}" alt="Foto ${item.role}" /><button type="button" class="remove-photo" data-remove-structure-photo="${index}">Hapus foto</button></div>` : ''}
      <button type="button" class="remove-structure" data-index="${index}">Hapus</button>
    </div>
  `).join('');
}

function renderDestinations() {
  const destinationGrid = document.getElementById('destinationGrid');
  if (!destinationGrid) return;

  destinationGrid.innerHTML = adminState.destinations.map((item, index) => {
    const classes = ['destination-card'];
    if (index === 0 || item.large) classes.push('large');
    const imageClass = item.category === 'alam' ? 'hill' : item.category === 'kuliner' ? 'sunset' : 'village';
    const label = item.type || `${index + 1} / ${item.category}`;

    return `
      <article class="${classes.join(' ')}" data-category="${escapeHtml(item.category)}">
        <div class="destination-image ${imageClass}"></div>
        <div class="destination-overlay">
          <span class="destination-type">${escapeHtml(label)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <a class="round-arrow" href="wisata-detail.html?kategori=${encodeURIComponent(item.category)}" target="_blank" rel="noopener" aria-label="Detail ${escapeHtml(item.title)}">↗</a>
        </div>
      </article>
    `;
  }).join('');

  destinationGrid.querySelectorAll('.destination-image').forEach((image, index) => {
    const source = adminState.destinations[index].image;
    if (source) image.style.backgroundImage = `linear-gradient(180deg,transparent 25%,rgba(7,29,26,.88)),url("${source}")`;
  });

  if (destinationEditor) {
    destinationEditor.innerHTML = adminState.destinations.map((item, index) => `
      <div class="destination-editor-row">
        <strong>${escapeHtml(item.title)}</strong>
        <label>
          <span>Tautan Google Maps (URL sematan untuk peta langsung)</span>
          <input type="url" placeholder="https://www.google.com/maps/embed?..." data-destination-index="${index}" data-destination-field="mapUrl" value="${escapeHtml(item.mapUrl || '')}" />
        </label>
        <label>
          <span>Tarif masuk</span>
          <input type="text" placeholder="Contoh: Gratis atau Rp 10.000" data-destination-index="${index}" data-destination-field="entranceFee" value="${escapeHtml(item.entranceFee || '')}" />
        </label>
        <label>
          <span>Tarif parkir</span>
          <input type="text" placeholder="Contoh: Rp 2.000" data-destination-index="${index}" data-destination-field="parkingFee" value="${escapeHtml(item.parkingFee || '')}" />
        </label>
        <label class="full-width">
          <span>Fasilitas (satu fasilitas per baris)</span>
          <textarea rows="3" placeholder="Contoh: Area parkir&#10;Toilet umum" data-destination-index="${index}" data-destination-field="facilities">${escapeHtml(item.facilities || '')}</textarea>
        </label>
        <label>
          <span>Foto ${item.title}</span>
          <input type="file" accept="image/*" data-destination-photo="${index}" />
        </label>
        ${item.image ? `<div class="editor-photo-preview"><img src="${escapeHtml(item.image)}" alt="Foto ${escapeHtml(item.title)}" /><button type="button" class="remove-photo" data-remove-destination-photo="${index}">Hapus foto</button></div>` : '<span class="destination-photo-empty">Belum ada foto khusus</span>'}
      </div>
    `).join('');
  }

  bindFilterHandlers();
}

function renderPhotos() {
  const photoGrid = document.getElementById('photoGrid');
  if (!photoGrid) return;

  photoGrid.replaceChildren();
  if (adminState.photos.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'photo-empty';
    emptyMessage.textContent = 'Belum ada foto. Admin dapat menambahkan dokumentasi desa melalui panel admin.';
    photoGrid.append(emptyMessage);
  } else {
    adminState.photos.forEach((photo) => {
      const item = document.createElement('figure');
      item.className = 'photo-card';

      const image = document.createElement('img');
      image.src = photo.image;
      image.alt = photo.title;
      image.loading = 'lazy';

      const caption = document.createElement('figcaption');
      caption.textContent = photo.title;
      item.append(image, caption);
      photoGrid.append(item);
    });
  }

  if (!adminPhotoList) return;
  adminPhotoList.replaceChildren();
  adminState.photos.forEach((photo, index) => {
    const item = document.createElement('div');
    item.className = 'admin-photo-item';

    const image = document.createElement('img');
    image.src = photo.image;
    image.alt = '';

    const title = document.createElement('span');
    title.textContent = photo.title;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-photo';
    removeButton.dataset.index = String(index);
    removeButton.textContent = 'Hapus';
    removeButton.setAttribute('aria-label', `Hapus foto ${photo.title}`);

    item.append(image, title, removeButton);
    adminPhotoList.append(item);
  });
}

function renderNews() {
  if (newsGrid) {
    newsGrid.replaceChildren();
    const publishedNews = adminState.news
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.title.trim() && item.content.trim());

    if (publishedNews.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'news-empty';
      emptyMessage.textContent = 'Berita desa akan ditampilkan di sini setelah diterbitkan melalui panel admin.';
      newsGrid.append(emptyMessage);
    }

    publishedNews.forEach(({ item, index }) => {
      const card = document.createElement('article');
      card.className = 'news-card';

      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'news-card-open';
      openButton.dataset.newsIndex = String(index);
      openButton.setAttribute('aria-haspopup', 'dialog');

      if (item.image) {
        const image = document.createElement('img');
        image.className = 'news-thumbnail';
        image.src = item.image;
        image.alt = '';
        image.loading = 'lazy';
        openButton.append(image);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'news-thumbnail news-thumbnail-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = 'TA';
        openButton.append(placeholder);
      }

      const copy = document.createElement('span');
      copy.className = 'news-card-copy';
      if (item.date) {
        const date = document.createElement('time');
        date.className = 'news-card-date';
        date.dateTime = item.date;
        date.textContent = formatNewsDate(item.date);
        copy.append(date);
      }
      const title = document.createElement('strong');
      title.className = 'news-card-title';
      title.textContent = item.title;
      const summary = document.createElement('span');
      summary.className = 'news-card-summary';
      summary.textContent = item.summary || item.content;
      const readMore = document.createElement('span');
      readMore.className = 'news-card-read-more';
      readMore.textContent = 'Baca berita →';
      copy.append(title, summary, readMore);
      openButton.append(copy);
      card.append(openButton);
      newsGrid.append(card);
    });
  }

  if (!newsEditor) return;
  newsEditor.replaceChildren();
  adminState.news.forEach((item, index) => {
    const row = document.createElement('fieldset');
    row.className = 'news-editor-row';
    const legend = document.createElement('legend');
    legend.textContent = `Berita ${index + 1}`;
    row.append(legend);

    const fields = [
      { key: 'title', label: 'Judul berita', type: 'text', placeholder: 'Contoh: Gotong royong warga desa', maxLength: 100 },
      { key: 'date', label: 'Tanggal berita', type: 'date' },
      { key: 'summary', label: 'Ringkasan berita', type: 'textarea', placeholder: 'Ringkasan singkat yang tampil pada kartu berita', maxLength: 240 },
      { key: 'content', label: 'Isi lengkap berita', type: 'textarea', placeholder: 'Tuliskan detail berita untuk dibaca pengunjung' }
    ];

    fields.forEach((field) => {
      const label = document.createElement('label');
      label.className = field.key === 'title' || field.key === 'date' ? '' : 'full-width';
      const labelText = document.createElement('span');
      labelText.textContent = field.label;
      const control = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (field.type !== 'textarea') control.type = field.type;
      if (field.placeholder) control.placeholder = field.placeholder;
      if (field.maxLength) control.maxLength = field.maxLength;
      if (field.type === 'textarea') control.rows = field.key === 'content' ? 6 : 3;
      control.value = item[field.key] || '';
      control.dataset.newsIndex = String(index);
      control.dataset.newsField = field.key;
      label.append(labelText, control);
      row.append(label);
    });

    const photoLabel = document.createElement('label');
    photoLabel.className = 'full-width';
    const photoLabelText = document.createElement('span');
    photoLabelText.textContent = 'Foto thumbnail (opsional)';
    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.dataset.newsPhoto = String(index);
    photoLabel.append(photoLabelText, photoInput);
    row.append(photoLabel);

    if (item.image) {
      const preview = document.createElement('div');
      preview.className = 'editor-photo-preview news-editor-preview';
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = `Thumbnail berita ${index + 1}`;
      const removeImage = document.createElement('button');
      removeImage.type = 'button';
      removeImage.className = 'remove-photo';
      removeImage.dataset.removeNewsPhoto = String(index);
      removeImage.textContent = 'Hapus thumbnail';
      preview.append(image, removeImage);
      row.append(preview);
    }

    const actions = document.createElement('div');
    actions.className = 'news-editor-actions';
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'button button-primary';
    saveButton.dataset.saveNews = String(index);
    saveButton.textContent = 'Simpan Berita';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-structure';
    removeButton.dataset.removeNews = String(index);
    removeButton.textContent = 'Hapus berita';
    actions.append(saveButton, removeButton);
    row.append(actions);
    newsEditor.append(row);
  });
}

function openNewsDetail(index) {
  const item = adminState.news[index];
  if (!item || !item.title.trim() || !item.content.trim() || !newsDetailDialog) return;

  const title = document.getElementById('newsDetailTitle');
  const date = document.getElementById('newsDetailDate');
  const image = document.getElementById('newsDetailImage');
  const content = document.getElementById('newsDetailContent');
  title.textContent = item.title;
  date.textContent = item.date ? formatNewsDate(item.date) : '';
  date.hidden = !item.date;
  image.hidden = !item.image;
  image.src = item.image || '';
  image.alt = item.image ? `Thumbnail berita ${item.title}` : '';
  content.replaceChildren();
  item.content.split(/\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean).forEach((paragraph) => {
    const text = document.createElement('p');
    text.textContent = paragraph;
    content.append(text);
  });
  newsDetailDialog.showModal();
}

function renderUmkmProducts(products) {
  umkmProducts = products;
  umkmGrid.replaceChildren();
  if (products.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'umkm-empty';
    empty.textContent = 'Belum ada produk yang tersedia. Produk UMKM akan tampil setelah diterbitkan oleh pengelola.';
    umkmGrid.append(empty);
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'umkm-product-card';
    if (product.image_url) {
      const image = document.createElement('img');
      image.className = 'umkm-product-image';
      image.src = product.image_url;
      image.alt = `Foto ${product.name}`;
      image.loading = 'lazy';
      card.append(image);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'umkm-product-image umkm-product-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = 'UMKM';
      card.append(placeholder);
    }

    const body = document.createElement('div');
    body.className = 'umkm-product-body';
    const category = document.createElement('span');
    category.className = 'umkm-product-category';
    category.textContent = product.category;
    const title = document.createElement('h3');
    title.textContent = product.name;
    const description = document.createElement('p');
    description.textContent = product.description;
    const footer = document.createElement('div');
    footer.className = 'umkm-product-footer';
    const price = document.createElement('strong');
    price.textContent = UmkmStore.formatPrice(product.price);
    const stock = document.createElement('span');
    stock.textContent = product.stock > 0 ? `Stok ${product.stock}` : 'Stok habis';
    footer.append(price, stock);
    const actions = document.createElement('div');
    actions.className = 'umkm-product-actions';
    const detail = document.createElement('a');
    detail.className = 'umkm-product-detail-link button button-primary';
    detail.href = `produk-detail.html?id=${encodeURIComponent(product.id)}`;
    detail.target = '_blank';
    detail.rel = 'noopener';
    detail.textContent = 'Detail & pesan';
    actions.append(detail);
    body.append(category, title, description, footer, actions);
    card.append(body);
    umkmGrid.append(card);
  });
}

function renderUmkmAdminProducts(products) {
  umkmAdminProductsCache = products;
  umkmAdminProducts.replaceChildren();
  if (!UmkmStore.isSignedIn()) {
    umkmProductForm.hidden = true;
    const message = document.createElement('p');
    message.className = 'umkm-admin-empty';
    message.textContent = 'Masuk dengan akun Supabase admin untuk menambah, mengubah, dan menghapus produk.';
    umkmAdminProducts.append(message);
    return;
  }

  umkmProductForm.hidden = false;
  if (products.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'umkm-admin-empty';
    empty.textContent = 'Belum ada produk di katalog. Tambahkan produk melalui formulir di atas.';
    umkmAdminProducts.append(empty);
    return;
  }

  products.forEach((product) => {
    const row = document.createElement('article');
    row.className = 'umkm-admin-product';
    if (product.image_url) {
      const image = document.createElement('img');
      image.src = product.image_url;
      image.alt = '';
      row.append(image);
    }
    const details = document.createElement('div');
    details.className = 'umkm-admin-product-info';
    const title = document.createElement('strong');
    title.textContent = product.name;
    const meta = document.createElement('span');
    meta.textContent = `${UmkmStore.formatPrice(product.price)} · Stok ${product.stock}${product.is_active ? '' : ' · Nonaktif'}`;
    details.append(title, meta);
    const actions = document.createElement('div');
    actions.className = 'umkm-admin-product-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'button button-light';
    edit.textContent = 'Ubah';
    edit.dataset.umkmEditProduct = product.id;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-structure';
    remove.textContent = 'Hapus';
    remove.dataset.umkmDeleteProduct = product.id;
    actions.append(edit, remove);
    row.append(details, actions);
    umkmAdminProducts.append(row);
  });
}

async function loadUmkmProducts() {
  if (!UmkmStore.isConfigured()) {
    umkmStatus.textContent = 'Katalog UMKM belum aktif. Pengelola perlu mengisi URL project dan anon key Supabase di supabase-config.js.';
    renderUmkmProducts([]);
    return;
  }

  umkmStatus.textContent = 'Memuat katalog produk UMKM...';
  try {
    const products = await UmkmStore.getProducts();
    renderUmkmProducts(products);
    umkmStatus.textContent = `${products.length} produk tersedia. Pembayaran dan pengiriman dikonfirmasi langsung dengan penjual.`;
  } catch (error) {
    umkmStatus.textContent = `Katalog gagal dimuat: ${error.message}`;
    renderUmkmProducts([]);
  }
}

async function loadUmkmAdminProducts() {
  if (!UmkmStore.isSignedIn()) {
    umkmAdminStatus.textContent = UmkmStore.isConfigured()
      ? 'Masuk dengan akun admin Supabase untuk mengelola produk.'
      : 'Supabase belum dikonfigurasi. Isi URL project dan anon key pada supabase-config.js.';
    umkmAdminSignIn.disabled = !UmkmStore.isConfigured();
    umkmAdminSignIn.hidden = false;
    umkmAdminSignOut.hidden = true;
    renderUmkmAdminProducts([]);
    return;
  }

  umkmAdminSignIn.hidden = true;
  umkmAdminSignOut.hidden = false;
  umkmAdminStatus.textContent = 'Memuat produk pengelola...';
  try {
    const products = await UmkmStore.getProducts(true);
    renderUmkmAdminProducts(products);
    umkmAdminStatus.textContent = 'Akun admin Supabase aktif.';
  } catch (error) {
    umkmAdminStatus.textContent = `Produk pengelola gagal dimuat: ${error.message}`;
    renderUmkmAdminProducts([]);
  }
}

function resetUmkmProductForm() {
  umkmProductForm.reset();
  document.getElementById('umkmProductId').value = '';
  document.getElementById('umkmProductSave').textContent = 'Terbitkan produk';
  document.getElementById('umkmProductCancel').hidden = true;
}

function setUmkmProductForm(product) {
  document.getElementById('umkmProductId').value = product.id;
  document.getElementById('umkmProductName').value = product.name;
  document.getElementById('umkmProductCategory').value = product.category;
  document.getElementById('umkmProductPrice').value = String(product.price);
  document.getElementById('umkmProductStock').value = String(product.stock);
  document.getElementById('umkmProductDescription').value = product.description;
  document.getElementById('umkmProductWhatsApp').value = product.whatsapp;
  document.getElementById('umkmProductDelivery').value = product.delivery_info || '';
  document.getElementById('umkmProductImage').value = '';
  document.getElementById('umkmProductSave').textContent = 'Simpan perubahan';
  document.getElementById('umkmProductCancel').hidden = false;
  umkmProductForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function initializeUmkm() {
  await Promise.all([loadUmkmProducts(), loadUmkmAdminProducts()]);
}

function formatNewsDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File foto tidak dapat dibaca.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('File yang dipilih bukan gambar yang valid.'));
      image.onload = () => {
        const maxDimension = 1400;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Browser tidak dapat memproses foto ini.'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
        if (compressedImage.length > 900000) {
          reject(new Error('Ukuran foto masih terlalu besar setelah diproses. Pilih foto yang lebih kecil.'));
          return;
        }
        resolve(compressedImage);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function processSelectedPhoto(file) {
  if (!file) throw new Error('Pilih file foto terlebih dahulu.');
  if (!file.type.startsWith('image/')) throw new Error('File yang dipilih harus berupa gambar.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran file foto maksimal 10 MB.');
  return compressPhoto(file);
}

function bindFilterHandlers() {
  const filters = document.querySelectorAll('.filter');
  const destinationCards = document.querySelectorAll('.destination-card');

  filters.forEach((filter) => {
    filter.onclick = () => {
      filters.forEach((item) => item.classList.remove('active'));
      filter.classList.add('active');
      const category = filter.dataset.filter;
      destinationCards.forEach((card) => {
        const visible = category === 'all' || card.dataset.category.includes(category);
        card.hidden = !visible;
      });
    };
  });
}

function setAdminVisible(isVisible) {
  adminModal.classList.toggle('hidden', !isVisible);
  if (isVisible) {
    adminModal.removeAttribute('aria-hidden');
  } else {
    adminModal.setAttribute('aria-hidden', 'true');
  }
}

function toggleAdminPanel() {
  const isLoggedIn = localStorage.getItem(AUTH_KEY) === 'true';
  if (isLoggedIn) {
    adminLoginView.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    setAdminVisible(true);
    renderProfile();
    renderStructureCards();
    renderDestinations();
    return;
  }

  adminLoginView.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
  setAdminVisible(true);
}

menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

adminLoginBtn?.addEventListener('click', () => {
  toggleAdminPanel();
});

closeAdminBtn?.addEventListener('click', () => {
  setAdminVisible(false);
});

adminModal?.addEventListener('click', (event) => {
  if (event.target === adminModal) {
    setAdminVisible(false);
  }
});

adminLoginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(adminLoginForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem(AUTH_KEY, 'true');
    adminLoginView.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    renderProfile();
    renderStructureCards();
    renderPhotos();
    renderVillageInfo();
    return;
  }

  alert('Username atau password tidak valid.');
});

saveProfileBtn?.addEventListener('click', () => {
  adminState.profile.year = document.getElementById('adminYear').value || adminState.profile.year;
  adminState.profile.population = document.getElementById('adminPopulation').value || adminState.profile.population;
  adminState.profile.tourism = document.getElementById('adminTourism').value || adminState.profile.tourism;
  adminState.profile.local = document.getElementById('adminLocal').value || adminState.profile.local;
  adminState.profile.motto = document.getElementById('adminMotto').value || adminState.profile.motto;
  adminState.profile.vision = document.getElementById('adminVision').value.trim();
  adminState.profile.mission = document.getElementById('adminMission').value.trim();
  adminState.profile.history = document.getElementById('adminHistory').value.trim();
  adminState.profile.populationStats = {
    total: document.getElementById('adminPopulationTotal').value.trim(),
    male: document.getElementById('adminPopulationMale').value.trim(),
    female: document.getElementById('adminPopulationFemale').value.trim(),
    households: document.getElementById('adminHouseholds').value.trim(),
    mutations: document.getElementById('adminPopulationMutations').value.trim(),
    temporary: document.getElementById('adminTemporaryPopulation').value.trim()
  };
  adminState.profile.apbd = {
    income: document.getElementById('adminApbdIncome').value.trim(),
    expenditure: document.getElementById('adminApbdExpenditure').value.trim()
  };
  saveState();
  renderProfile();
  alert('Profil desa berhasil diperbarui.');
});

document.getElementById('saveVillageInfoBtn')?.addEventListener('click', () => {
  const previousInfo = adminState.villageInfo;
  adminState.villageInfo = {
    contact: document.getElementById('adminVillageContact').value.trim(),
    importantPhones: document.getElementById('adminImportantPhones').value.trim(),
    socialMedia: document.getElementById('adminSocialMedia').value.trim()
  };
  try {
    saveState();
  } catch (error) {
    adminState.villageInfo = previousInfo;
    alert('Informasi desa gagal disimpan. Perubahan belum diterapkan.');
    return;
  }
  renderVillageInfo();
  alert('Informasi desa berhasil diperbarui.');
});

document.getElementById('adminProfilePhoto')?.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const previousImage = adminState.profile.image;
    adminState.profile.image = await processSelectedPhoto(file);
    try {
      saveState();
    } catch (error) {
      adminState.profile.image = previousImage;
      throw error;
    }
    renderProfile();
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Foto profil gagal disimpan. Pastikan ruang penyimpanan browser masih tersedia.');
    event.target.value = '';
  }
});

document.getElementById('removeProfilePhoto')?.addEventListener('click', () => {
  const previousImage = adminState.profile.image;
  adminState.profile.image = '';
  try {
    saveState();
  } catch (error) {
    adminState.profile.image = previousImage;
    alert('Foto profil gagal dihapus. Perubahan belum tersimpan.');
    return;
  }
  renderProfile();
});

addStructureBtn?.addEventListener('click', () => {
  adminState.structure.push({ role: 'Jabatan Baru', name: 'Nama Baru', description: 'Deskripsi baru...', image: '' });
  saveState();
  renderStructureCards();
});

structureEditor?.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

  const index = Number(target.dataset.structureIndex);
  const field = target.dataset.field;
  if (Number.isNaN(index) || !field || !adminState.structure[index]) return;

  adminState.structure[index][field] = target.value;
  saveState();
  renderStructureCards();
});

structureEditor?.addEventListener('click', (event) => {
  const removePhotoButton = event.target.closest('[data-remove-structure-photo]');
  if (removePhotoButton) {
    const photoIndex = Number(removePhotoButton.dataset.removeStructurePhoto);
    if (!Number.isInteger(photoIndex) || !adminState.structure[photoIndex]) return;
    const previousImage = adminState.structure[photoIndex].image;
    adminState.structure[photoIndex].image = '';
    try {
      saveState();
    } catch (error) {
      adminState.structure[photoIndex].image = previousImage;
      alert('Foto struktur gagal dihapus. Perubahan belum tersimpan.');
      return;
    }
    renderStructureCards();
    return;
  }

  const button = event.target.closest('.remove-structure');
  if (!button) return;

  const index = Number(button.dataset.index);
  if (Number.isNaN(index)) return;

  adminState.structure.splice(index, 1);
  saveState();
  renderStructureCards();
});

structureEditor?.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-structure-photo]');
  if (!input || !input.files[0]) return;

  const index = Number(input.dataset.structurePhoto);
  if (!Number.isInteger(index) || !adminState.structure[index]) return;
  try {
    const image = await processSelectedPhoto(input.files[0]);
    const previousImage = adminState.structure[index].image;
    adminState.structure[index].image = image;
    try {
      saveState();
    } catch (error) {
      adminState.structure[index].image = previousImage;
      throw error;
    }
    renderStructureCards();
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Foto struktur gagal disimpan. Pastikan ruang penyimpanan browser masih tersedia.');
    input.value = '';
  }
});

destinationEditor?.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-destination-photo]');
  if (!input || !input.files[0]) return;

  const index = Number(input.dataset.destinationPhoto);
  if (!Number.isInteger(index) || !adminState.destinations[index]) return;
  try {
    const image = await processSelectedPhoto(input.files[0]);
    const previousImage = adminState.destinations[index].image;
    adminState.destinations[index].image = image;
    try {
      saveState();
    } catch (error) {
      adminState.destinations[index].image = previousImage;
      throw error;
    }
    renderDestinations();
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Foto wisata gagal disimpan. Pastikan ruang penyimpanan browser masih tersedia.');
    input.value = '';
  }
});

destinationEditor?.addEventListener('change', (event) => {
  const input = event.target.closest('[data-destination-field]');
  if (!input) return;
  const index = Number(input.dataset.destinationIndex);
  const field = input.dataset.destinationField;
  if (!Number.isInteger(index) || !field || !adminState.destinations[index]) return;

  const value = input.value.trim();
  if (field === 'mapUrl' && !isGoogleMapsUrl(value)) {
    input.value = adminState.destinations[index].mapUrl || '';
    alert('Gunakan tautan HTTPS Google Maps yang valid.');
    return;
  }
  const previousValue = adminState.destinations[index][field] || '';
  adminState.destinations[index][field] = value;
  try {
    saveState();
  } catch (error) {
    adminState.destinations[index][field] = previousValue;
    input.value = previousValue;
    alert('Informasi wisata gagal disimpan. Perubahan belum diterapkan.');
  }
});

destinationEditor?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-destination-photo]');
  if (!button) return;

  const index = Number(button.dataset.removeDestinationPhoto);
  if (!Number.isInteger(index) || !adminState.destinations[index]) return;
  const previousImage = adminState.destinations[index].image;
  adminState.destinations[index].image = '';
  try {
    saveState();
  } catch (error) {
    adminState.destinations[index].image = previousImage;
    alert('Foto wisata gagal dihapus. Perubahan belum tersimpan.');
    return;
  }
  renderDestinations();
});

addDestinationForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = document.getElementById('destinationTitle').value.trim();
  const category = document.getElementById('destinationCategory').value;
  const type = document.getElementById('destinationType').value.trim();
  const description = document.getElementById('destinationDescription').value.trim();
  const photoFile = document.getElementById('destinationPhoto').files[0];
  const mapUrl = document.getElementById('destinationMapUrl').value.trim();
  const entranceFee = document.getElementById('destinationEntranceFee').value.trim();
  const parkingFee = document.getElementById('destinationParkingFee').value.trim();
  const facilities = document.getElementById('destinationFacilities').value.trim();

  if (!title || !type || !description) {
    alert('Semua field wisata harus diisi.');
    return;
  }
  if (!isGoogleMapsUrl(mapUrl)) {
    alert('Gunakan tautan HTTPS Google Maps yang valid.');
    return;
  }

  try {
    const image = photoFile ? await processSelectedPhoto(photoFile) : '';
    adminState.destinations.push({ title, type, category, description, image, mapUrl, entranceFee, parkingFee, facilities, large: false });

    const previousTourismCount = adminState.profile.tourism;
    adminState.profile.tourism = String(adminState.destinations.length);
    try {
      saveState();
    } catch (error) {
      adminState.destinations.pop();
      adminState.profile.tourism = previousTourismCount;
      throw error;
    }
    renderProfile();
    renderDestinations();
    addDestinationForm.reset();
    alert('Wisata baru berhasil ditambahkan.');
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Wisata gagal disimpan. Pastikan ruang penyimpanan browser masih tersedia.');
  }
});

addPhotoForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const titleInput = document.getElementById('photoTitle');
  const fileInput = document.getElementById('photoFile');
  const file = fileInput.files[0];
  const title = titleInput.value.trim();

  if (!file || !title) {
    alert('Judul dan file foto wajib diisi.');
    return;
  }
  try {
    const image = await processSelectedPhoto(file);
    adminState.photos.push({ title, image });
    try {
      saveState();
    } catch (error) {
      adminState.photos.pop();
      throw error;
    }
    renderPhotos();
    addPhotoForm.reset();
    alert('Foto berhasil ditambahkan ke galeri.');
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Foto gagal disimpan. Pastikan ruang penyimpanan browser masih tersedia.');
  }
});

adminPhotoList?.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-photo');
  if (!button) return;

  const index = Number(button.dataset.index);
  if (!Number.isInteger(index) || index < 0 || index >= adminState.photos.length) return;

  const [photo] = adminState.photos.splice(index, 1);
  try {
    saveState();
  } catch (error) {
    adminState.photos.splice(index, 0, photo);
    alert('Foto gagal dihapus. Perubahan belum tersimpan.');
    return;
  }
  renderPhotos();
});

newsGrid?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-news-index]');
  if (!button) return;
  const index = Number(button.dataset.newsIndex);
  if (!Number.isInteger(index)) return;
  openNewsDetail(index);
});

newsEditor?.addEventListener('input', (event) => {
  const input = event.target.closest('[data-news-field]');
  if (!input) return;
  const index = Number(input.dataset.newsIndex);
  const field = input.dataset.newsField;
  if (!Number.isInteger(index) || !field || !adminState.news[index]) return;
  adminState.news[index][field] = input.value;
});

newsEditor?.addEventListener('click', (event) => {
  const saveButton = event.target.closest('[data-save-news]');
  if (saveButton) {
    const index = Number(saveButton.dataset.saveNews);
    if (!Number.isInteger(index) || !adminState.news[index]) return;
    if (!adminState.news[index].title.trim() || !adminState.news[index].content.trim()) {
      alert('Isi judul dan berita lengkap sebelum menyimpan berita.');
      return;
    }
    try {
      saveState();
      renderNews();
      alert('Berita desa berhasil disimpan dan diterbitkan.');
    } catch (error) {
      alert('Berita desa gagal disimpan. Perubahan belum tersimpan.');
    }
    return;
  }

  const removeImageButton = event.target.closest('[data-remove-news-photo]');
  if (removeImageButton) {
    const index = Number(removeImageButton.dataset.removeNewsPhoto);
    if (!Number.isInteger(index) || !adminState.news[index]) return;
    const previousImage = adminState.news[index].image;
    adminState.news[index].image = '';
    try {
      saveState();
      renderNews();
    } catch (error) {
      adminState.news[index].image = previousImage;
      alert('Thumbnail berita gagal dihapus. Perubahan belum tersimpan.');
    }
    return;
  }

  const removeButton = event.target.closest('[data-remove-news]');
  if (!removeButton) return;
  const index = Number(removeButton.dataset.removeNews);
  if (!Number.isInteger(index) || !adminState.news[index]) return;
  const previousNews = adminState.news.slice();
  adminState.news.splice(index, 1);
  if (adminState.news.length === 0) adminState.news.push({ title: '', date: '', summary: '', content: '', image: '' });
  try {
    saveState();
    renderNews();
  } catch (error) {
    adminState.news = previousNews;
    alert('Berita gagal dihapus. Perubahan belum tersimpan.');
  }
});

newsEditor?.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-news-photo]');
  if (!input || !input.files[0]) return;
  const index = Number(input.dataset.newsPhoto);
  if (!Number.isInteger(index) || !adminState.news[index]) return;
  try {
    const image = await processSelectedPhoto(input.files[0]);
    const previousImage = adminState.news[index].image;
    adminState.news[index].image = image;
    try {
      saveState();
    } catch (error) {
      adminState.news[index].image = previousImage;
      throw error;
    }
    renderNews();
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Thumbnail berita gagal disimpan. Pastikan ruang penyimpanan browser masih tersedia.');
    renderNews();
  }
});

addNewsBtn?.addEventListener('click', () => {
  adminState.news.push({ title: '', date: '', summary: '', content: '', image: '' });
  try {
    saveState();
    renderNews();
    newsEditor.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    adminState.news.pop();
    alert('Kolom berita baru gagal dibuat. Pastikan ruang penyimpanan browser masih tersedia.');
  }
});

document.querySelector('.news-detail-close')?.addEventListener('click', () => {
  newsDetailDialog?.close();
});

newsDetailDialog?.addEventListener('click', (event) => {
  if (event.target === newsDetailDialog) newsDetailDialog.close();
});

umkmAdminSignIn?.addEventListener('click', async () => {
  const email = document.getElementById('umkmAdminEmail').value.trim();
  const password = document.getElementById('umkmAdminPassword').value;
  if (!email || !password) {
    umkmAdminStatus.textContent = 'Isi email dan kata sandi admin Supabase.';
    return;
  }
  umkmAdminSignIn.disabled = true;
  umkmAdminStatus.textContent = 'Memverifikasi akun admin Supabase...';
  try {
    await UmkmStore.signIn(email, password);
    document.getElementById('umkmAdminPassword').value = '';
    await loadUmkmAdminProducts();
  } catch (error) {
    umkmAdminStatus.textContent = `Login gagal: ${error.message}`;
  } finally {
    umkmAdminSignIn.disabled = false;
  }
});

umkmAdminSignOut?.addEventListener('click', async () => {
  umkmAdminSignOut.disabled = true;
  try {
    await UmkmStore.signOut();
    resetUmkmProductForm();
    umkmAdminStatus.textContent = 'Anda telah keluar dari pengelola produk.';
    await loadUmkmAdminProducts();
  } catch (error) {
    umkmAdminStatus.textContent = `Sesi lokal dihapus, tetapi Supabase gagal mengakhiri sesi: ${error.message}`;
    await loadUmkmAdminProducts();
  } finally {
    umkmAdminSignOut.disabled = false;
  }
});

umkmProductForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('umkmProductId').value;
  const name = document.getElementById('umkmProductName').value.trim();
  const category = document.getElementById('umkmProductCategory').value.trim();
  const price = Number(document.getElementById('umkmProductPrice').value);
  const stock = Number(document.getElementById('umkmProductStock').value);
  const description = document.getElementById('umkmProductDescription').value.trim();
  const whatsapp = UmkmStore.normalizeWhatsApp(document.getElementById('umkmProductWhatsApp').value);
  const deliveryInfo = document.getElementById('umkmProductDelivery').value.trim();
  const file = document.getElementById('umkmProductImage').files[0];
  if (!name || !category || !description || !whatsapp || !Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(stock) || stock < 0) {
    umkmAdminStatus.textContent = 'Periksa isian nama, kategori, harga, stok, deskripsi, dan nomor WhatsApp sebelum menyimpan.';
    return;
  }

  const submitButton = document.getElementById('umkmProductSave');
  submitButton.disabled = true;
  umkmAdminStatus.textContent = 'Menyimpan produk ke katalog bersama...';
  let uploadedImageUrl = '';
  try {
    const existing = id ? umkmAdminProductsCache.find((item) => item.id === id) : null;
    uploadedImageUrl = file ? await UmkmStore.uploadProductImage(file) : '';
    const imageUrl = uploadedImageUrl || existing?.image_url || '';
    await UmkmStore.saveProduct({
      ...(id ? { id } : {}),
      name,
      category,
      price,
      description,
      image_url: imageUrl,
      stock,
      whatsapp,
      delivery_info: deliveryInfo,
      is_active: true
    });
    let cleanupWarning = '';
    if (uploadedImageUrl && existing?.image_url) {
      try {
        await UmkmStore.deleteProductImage(existing.image_url);
      } catch (error) {
        cleanupWarning = ` Produk tersimpan, tetapi foto sebelumnya belum berhasil dibersihkan: ${error.message}`;
      }
    }
    resetUmkmProductForm();
    await Promise.all([loadUmkmProducts(), loadUmkmAdminProducts()]);
    umkmAdminStatus.textContent = `Produk berhasil dipublikasikan untuk pengunjung.${cleanupWarning}`;
  } catch (error) {
    let cleanupWarning = '';
    if (uploadedImageUrl) {
      try {
        await UmkmStore.deleteProductImage(uploadedImageUrl);
      } catch (cleanupError) {
        cleanupWarning = ` Foto baru juga belum berhasil dibersihkan: ${cleanupError.message}`;
      }
    }
    umkmAdminStatus.textContent = `Produk gagal disimpan: ${error.message}.${cleanupWarning}`;
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById('umkmProductCancel')?.addEventListener('click', resetUmkmProductForm);

umkmAdminProducts?.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-umkm-edit-product]');
  if (editButton) {
    const product = umkmAdminProductsCache.find((item) => item.id === editButton.dataset.umkmEditProduct);
    if (product) setUmkmProductForm(product);
    return;
  }
  const removeButton = event.target.closest('[data-umkm-delete-product]');
  if (!removeButton) return;
  const product = umkmAdminProductsCache.find((item) => item.id === removeButton.dataset.umkmDeleteProduct);
  if (!product || !window.confirm(`Hapus produk "${product.name}" dari katalog?`)) return;
  removeButton.disabled = true;
  umkmAdminStatus.textContent = 'Menghapus produk...';
  try {
    const cleanupWarning = await UmkmStore.deleteProduct(product);
    resetUmkmProductForm();
    await Promise.all([loadUmkmProducts(), loadUmkmAdminProducts()]);
    umkmAdminStatus.textContent = `Produk berhasil dihapus.${cleanupWarning ? ` ${cleanupWarning}` : ''}`;
  } catch (error) {
    umkmAdminStatus.textContent = `Produk gagal dihapus sepenuhnya: ${error.message}`;
    removeButton.disabled = false;
  }
});

const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.main-nav a');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

sections.forEach((section) => observer.observe(section));

renderProfile();
renderStructureCards();
renderDestinations();
renderPhotos();
renderNews();
initializeUmkm();
const visitCount = Number(localStorage.getItem(VISIT_COUNT_KEY) || 0) + 1;
localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));
renderVillageInfo();

if (localStorage.getItem(AUTH_KEY) === 'true') {
  adminLoginView.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
}
