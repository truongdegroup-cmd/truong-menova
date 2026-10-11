require('dotenv').config();
const express = require('express');
const path = require('node:path');

const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);
app.use('/', pagesRouter);

app.use((req, res) => {
  res.status(404).render('404', { page: '404', site: pagesRouter.SITE });
});

app.listen(PORT, () => {
  console.log(`MENOVA dang chay tai http://localhost:${PORT}`);
});
