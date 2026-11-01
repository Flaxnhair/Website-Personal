(() => {
  const config = window.TANJUNG_ALAI_SUPABASE || {};
  const baseUrl = String(config.url || '').trim().replace(/\/+$/, '');
  const anonKey = String(config.anonKey || '').trim();
  const sessionKey = 'tanjungAlaiUmkmAdminSession';
  const cartKey = 'tanjungAlaiUmkmCart';
  const table = 'umkm_products';
  const bucket = 'umkm-products';
  const productColumns = 'id,name,category,price,description,image_url,stock,whatsapp,delivery_info,is_active,created_at';

  function isConfigured() {
    return Boolean(baseUrl && anonKey && (/^https:\/\/[a-z0-9.-]+$/.test(baseUrl) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseUrl)));
  }

  function requireConfig() {
    if (!isConfigured()) {
      throw new Error('Supabase belum dikonfigurasi. Isi URL project dan anon key di supabase-config.js.');
    }
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(sessionKey) || 'null');
    } catch (error) {
      localStorage.removeItem(sessionKey);
      return null;
    }
  }

  function saveSession(session) {
    localStorage.setItem(sessionKey, JSON.stringify(session));
  }

  async function request(path, options = {}, token) {
    requireConfig();
    const headers = new Headers(options.headers || {});
    headers.set('apikey', anonKey);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    else headers.set('Authorization', `Bearer ${anonKey}`);
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const text = await response.text();
    let result = null;
    if (text) {
      try {
        result = JSON.parse(text);
      } catch (error) {
        result = text;
      }
    }
    if (!response.ok) {
      const message = result?.msg || result?.message || result?.error_description || result?.error || `Permintaan gagal (${response.status}).`;
      throw new Error(String(message));
    }
    return result;
  }

  async function getAccessToken() {
    const session = readSession();
    if (!session?.access_token) throw new Error('Masuk ke pengelola produk dengan akun admin Supabase terlebih dahulu.');
    if (session.expires_at && session.expires_at > Date.now() + 60000) return session.access_token;
    if (!session.refresh_token) {
      localStorage.removeItem(sessionKey);
      throw new Error('Sesi admin berakhir. Silakan masuk kembali.');
    }

    const refreshed = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const nextSession = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token || session.refresh_token,
      expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000
    };
    saveSession(nextSession);
    return nextSession.access_token;
  }

  async function signIn(email, password) {
    const result = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const session = {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_at: Date.now() + Number(result.expires_in || 3600) * 1000
    };
    saveSession(session);
    return result.user;
  }

  async function signOut() {
    const session = readSession();
    localStorage.removeItem(sessionKey);
    if (!session?.access_token || !isConfigured()) return;
    await request('/auth/v1/logout', { method: 'POST' }, session.access_token);
  }

  async function getProducts(includeInactive = false) {
    const query = new URLSearchParams({
      select: productColumns,
      order: 'created_at.desc'
    });
    let token;
    if (includeInactive) {
      token = await getAccessToken();
    } else {
      query.set('is_active', 'eq.true');
    }
    const products = await request(`/rest/v1/${table}?${query.toString()}`, {}, token);
    if (!Array.isArray(products)) throw new Error('Respons katalog Supabase tidak valid.');
    return products;
  }

  async function saveProduct(product) {
    const token = await getAccessToken();
    const { id, ...values } = product;
    const editing = Boolean(id);
    const response = await request(
      `/rest/v1/${table}${editing ? `?id=eq.${encodeURIComponent(id)}` : ''}`,
      {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(values)
      },
      token
    );
    if (!Array.isArray(response) || response.length === 0) {
      throw new Error('Produk tidak tersimpan. Periksa akses admin dan kebijakan tabel Supabase.');
    }
    return response[0];
  }

  async function uploadProductImage(file) {
    if (!file) return '';
    const token = await getAccessToken();
    if (!file.type.startsWith('image/')) throw new Error('File produk harus berupa gambar.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran foto produk maksimal 10 MB.');

    const imageBlob = await compressImage(file);
    const filename = `${createId()}.jpg`;
    const objectPath = `products/${filename}`;
    await request(`/storage/v1/object/${bucket}/${objectPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: imageBlob
    }, token);
    return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  }

  function createId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const values = new Uint8Array(16);
    crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
  }

  async function deleteProductImage(imageUrl) {
    if (!imageUrl) return;
    const token = await getAccessToken();
    const publicPrefix = `${baseUrl}/storage/v1/object/public/${bucket}/`;
    if (!imageUrl.startsWith(publicPrefix)) return;
    const objectPath = imageUrl.slice(publicPrefix.length).split('/').map(encodeURIComponent).join('/');
    await request(`/storage/v1/object/${bucket}/${objectPath}`, { method: 'DELETE' }, token);
  }

  async function compressImage(file) {
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = imageUrl;
      await image.decode();
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Browser tidak dapat memproses foto produk.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (!blob) throw new Error('Foto produk gagal dikompres.');
      if (blob.size > 2 * 1024 * 1024) throw new Error('Foto masih terlalu besar setelah dikompres; pilih foto yang lebih kecil.');
      return blob;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function deleteProduct(product) {
    const token = await getAccessToken();
    await request(`/rest/v1/${table}?id=eq.${encodeURIComponent(product.id)}`, { method: 'DELETE' }, token);
    try {
      await deleteProductImage(product.image_url);
      return '';
    } catch (error) {
      return `Produk terhapus, tetapi foto lama belum berhasil dihapus: ${error.message}`;
    }
  }

  async function getProduct(id) {
    const query = new URLSearchParams({ select: productColumns, id: `eq.${id}`, is_active: 'eq.true', limit: '1' });
    const products = await request(`/rest/v1/${table}?${query.toString()}`);
    if (!Array.isArray(products)) throw new Error('Respons produk Supabase tidak valid.');
    return products[0] || null;
  }

  function getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      localStorage.removeItem(cartKey);
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('umkm-cart-updated'));
  }

  function addToCart(product, quantity = 1) {
    const amount = Math.max(1, Math.floor(Number(quantity) || 1));
    const cart = getCart();
    const productPhone = normalizeWhatsApp(product.whatsapp);
    if (!productPhone) throw new Error('Nomor WhatsApp penjual belum valid.');
    if (cart.some((item) => normalizeWhatsApp(item.whatsapp) !== productPhone)) {
      throw new Error('Keranjang hanya dapat memuat produk dari satu nomor penjual. Checkout atau kosongkan keranjang sebelum memilih penjual lain.');
    }
    const existing = cart.find((item) => item.id === product.id);
    const nextQuantity = (existing?.quantity || 0) + amount;
    if (nextQuantity > product.stock) throw new Error(`Stok ${product.name} hanya ${product.stock} produk.`);
    const cartItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      stock: Number(product.stock),
      whatsapp: productPhone,
      quantity: nextQuantity
    };
    if (existing) Object.assign(existing, cartItem);
    else cart.push(cartItem);
    saveCart(cart);
    return cart;
  }

  function setQuantity(id, quantity) {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === id);
    if (!item) return cart;
    const amount = Math.floor(Number(quantity));
    if (amount <= 0) return removeFromCart(id);
    if (amount > item.stock) throw new Error(`Stok ${item.name} hanya ${item.stock} produk.`);
    item.quantity = amount;
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) {
    const cart = getCart().filter((item) => item.id !== id);
    saveCart(cart);
    return cart;
  }

  function normalizeWhatsApp(value) {
    let number = String(value || '').replace(/\D/g, '');
    if (number.startsWith('0')) number = `62${number.slice(1)}`;
    else if (number.startsWith('8')) number = `62${number}`;
    return number.length >= 9 && number.length <= 15 ? number : '';
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function checkoutUrl(phone, message) {
    const number = normalizeWhatsApp(phone);
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '';
  }

  window.UmkmStore = {
    isConfigured,
    isSignedIn: () => Boolean(readSession()?.access_token),
    signIn,
    signOut,
    getProducts,
    getProduct,
    saveProduct,
    uploadProductImage,
    deleteProductImage,
    deleteProduct,
    getCart,
    addToCart,
    setQuantity,
    removeFromCart,
    normalizeWhatsApp,
    formatPrice,
    checkoutUrl
  };
})();
