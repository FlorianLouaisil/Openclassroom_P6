const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/user');
const app = express();
const path = require("path");
app.use(express.json());

// Middleware pour gérer les CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Connexion à MongoDB
mongoose.connect('mongodb+srv://florapha02:lAtO9bY52J0KR3cW@cluster0.kaas7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('Connexion à MongoDB réussie !');
  })
  .catch((err) => {
    console.error('Connexion à MongoDB échouée :', err.message);
  });

app.use(bodyParser.json());

app.use('/api/auth', userRoutes);
app.use("/api/books", bookRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;
