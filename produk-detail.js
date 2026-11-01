const productId = new URLSearchParams(location.search).get('id');
const productDetail = document.getElementById('productDetail');
const productStatus = document.getElementById('productStatus');
const productFeedback = document.getElementById('productFeedback');
let currentProduct = null;

function renderDetailCart() {
  const cart = UmkmStore.getCart();
  const container = document.getElementById('detailCartItems');
  container.replaceChildren();
  if (cart.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'cart-empty';
    empty.textContent = 'Keranjang masih kosong.';
    container.append(empty);
  } else {
    cart.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      const info = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = item.name;
      const price = document.createElement('span');
      price.textContent = `${item.quantity} × ${UmkmStore.formatPrice(item.price)}`;
      info.append(name, price);
      const controls = document.createElement('div');
      controls.className = 'cart-controls';
      const quantity = document.createElement('input');
      quantity.type = 'number';
      quantity.min = '1';
      quantity.max = String(item.stock);
      quantity.value = String(item.quantity);
      quantity.setAttribute('aria-label', `Jumlah ${item.name}`);
      quantity.dataset.cartQuantity = item.id;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Hapus';
      remove.dataset.removeCartItem = item.id;
      controls.append(quantity, remove);
      row.append(info, controls);
      container.append(row);
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('detailCartTotal').textContent = UmkmStore.formatPrice(total);
  const checkout = document.getElementById('detailCheckoutButton');
  checkout.disabled = cart.length === 0;
  document.getElementById('detailCheckoutStatus').textContent = cart.length
    ? 'Checkout mengirim ringkasan pesanan ke WhatsApp penjual.'
    : 'Tambahkan produk ke keranjang untuk mulai memesan.';
}

function renderProduct(product) {
  currentProduct = product;
  document.title = `${product.name} | UMKM Tanjung Alai`;
  productDetail.hidden = false;
  productStatus.hidden = true;
  document.getElementById('productName').textContent = product.name;
  document.getElementById('productCategory').textContent = product.category;
  document.getElementById('productPrice').textContent = UmkmStore.formatPrice(product.price);
  document.getElementById('productStock').textContent = product.stock > 0 ? `Stok tersedia: ${product.stock}` : 'Stok habis';
  document.getElementById('productDescription').textContent = product.description;
  document.getElementById('productDelivery').textContent = product.delivery_info || 'Tanyakan cara pengiriman atau pengambilan kepada penjual melalui WhatsApp.';
  document.getElementById('productQuantity').max = String(product.stock);
  const image = document.getElementById('productImage');
  const placeholder = document.getElementById('productImagePlaceholder');
  if (product.image_url) {
    image.src = product.image_url;
    image.alt = `Foto ${product.name}`;
    image.hidden = false;
    placeholder.hidden = true;
  } else {
    image.hidden = true;
    placeholder.hidden = false;
  }
  const contact = UmkmStore.normalizeWhatsApp(product.whatsapp);
  const contactRow = document.getElementById('productSellerContact');
  contactRow.replaceChildren();
  if (contact) {
    const link = document.createElement('a');
    link.href = `https://wa.me/${contact}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `Hubungi penjual: +${contact}`;
    contactRow.append(link);
  } else {
    contactRow.textContent = 'Kontak penjual belum tersedia.';
  }
  document.getElementById('productAddButton').disabled = product.stock <= 0;
  renderDetailCart();
}

document.getElementById('productAddButton').addEventListener('click', () => {
  if (!currentProduct) return;
  const quantity = Number(document.getElementById('productQuantity').value);
  try {
    UmkmStore.addToCart(currentProduct, quantity);
    productFeedback.textContent = 'Produk berhasil ditambahkan ke keranjang.';
    renderDetailCart();
  } catch (error) {
    productFeedback.textContent = error.message;
  }
});

document.getElementById('detailCartItems').addEventListener('change', (event) => {
  const input = event.target.closest('[data-cart-quantity]');
  if (!input) return;
  try {
    UmkmStore.setQuantity(input.dataset.cartQuantity, input.value);
    renderDetailCart();
  } catch (error) {
    document.getElementById('detailCheckoutStatus').textContent = error.message;
    renderDetailCart();
  }
});

document.getElementById('detailCartItems').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-cart-item]');
  if (!button) return;
  UmkmStore.removeFromCart(button.dataset.removeCartItem);
  renderDetailCart();
});

document.getElementById('detailCheckoutButton').addEventListener('click', () => {
  const cart = UmkmStore.getCart();
  if (!cart.length) return;
  const contact = cart[0].whatsapp;
  const buyerName = document.getElementById('detailBuyerName').value.trim();
  const notes = document.getElementById('detailBuyerNotes').value.trim();
  if (!buyerName) {
    document.getElementById('detailCheckoutStatus').textContent = 'Isi nama pemesan sebelum melanjutkan checkout.';
    document.getElementById('detailBuyerName').focus();
    return;
  }
  const lines = [
    'Halo, saya ingin memesan produk UMKM Desa Tanjung Alai:',
    ...cart.map((item) => `- ${item.name} (${item.quantity} x ${UmkmStore.formatPrice(item.price)}) = ${UmkmStore.formatPrice(item.quantity * item.price)}`),
    `Total produk: ${UmkmStore.formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}`,
    `Nama pemesan: ${buyerName}`
  ];
  if (notes) lines.push(`Catatan: ${notes}`);
  lines.push('Mohon konfirmasi ketersediaan, ongkir, dan cara pembayaran. Terima kasih.');
  const url = UmkmStore.checkoutUrl(contact, lines.join('\n'));
  if (!url) {
    document.getElementById('detailCheckoutStatus').textContent = 'Nomor WhatsApp penjual tidak valid. Hubungi admin desa.';
    return;
  }
  location.href = url;
});

window.addEventListener('storage', (event) => {
  if (event.key === 'tanjungAlaiUmkmCart') renderDetailCart();
});
window.addEventListener('umkm-cart-updated', renderDetailCart);

renderDetailCart();
if (!UmkmStore.isConfigured()) {
  productStatus.textContent = 'Katalog belum tersambung. Konfigurasi Supabase belum diisi.';
} else if (!productId) {
  productStatus.textContent = 'ID produk tidak ditemukan. Kembali ke katalog UMKM.';
} else {
  UmkmStore.getProduct(productId)
    .then((product) => {
      if (!product) {
        productStatus.textContent = 'Produk tidak tersedia atau sudah tidak aktif.';
        return;
      }
      renderProduct(product);
    })
    .catch((error) => {
      productStatus.textContent = `Produk gagal dimuat: ${error.message}`;
    });
}
