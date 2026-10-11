const express = require('express');
const router = express.Router();
const products = require('../data/products.json');
const posts = require('../data/blog.json');

const SITE = {
  name: 'MENOVA',
  tagline: 'Nuôi khoẻ từ gốc',
  legalName: 'Hộ Kinh Doanh Men Vi Sinh MENOVA',
  dkkd: '036200009205',
  phone: '0869 688 384',
  phoneRaw: '0869688384',
  email: 'Menova.cskh@gmail.com',
  address: 'Thôn Tiền Tiến, Xã Minh Thái, Tỉnh Ninh Bình',
  website: 'menova.vn',
  facebook: 'https://www.facebook.com/menovavietnam',
  zalo: 'https://zalo.me/0869688384',
};

router.get('/', (req, res) => {
  const featured = products.filter((p) => p.featured);
  res.render('index', { page: 'home', site: SITE, products: featured, posts: posts.slice(0, 3) });
});

router.get('/ve-menova', (req, res) => {
  res.render('about', { page: 'about', site: SITE });
});

router.get('/san-pham', (req, res) => {
  res.render('products', { page: 'products', site: SITE, products });
});

router.get('/san-pham/:slug', (req, res) => {
  const product = products.find((p) => p.slug === req.params.slug);
  if (!product) return res.status(404).render('404', { page: '404', site: SITE });
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);
  res.render('product', { page: 'product', site: SITE, product, related });
});

router.get('/gio-hang', (req, res) => {
  res.render('cart', { page: 'cart', site: SITE });
});

router.get('/blog', (req, res) => {
  res.render('blog', { page: 'blog', site: SITE, posts });
});

router.get('/blog/:slug', (req, res) => {
  const post = posts.find((p) => p.slug === req.params.slug);
  if (!post) return res.status(404).render('404', { page: '404', site: SITE });
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);
  res.render('blog-post', { page: 'blog-post', site: SITE, post, related });
});

router.get('/lien-he', (req, res) => {
  res.render('contact', { page: 'contact', site: SITE });
});

module.exports = router;
module.exports.SITE = SITE;
