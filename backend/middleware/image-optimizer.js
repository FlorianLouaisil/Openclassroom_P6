const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

module.exports = (req, res, next) => {
  if (!req.file) return next(); // Si aucune image n'est téléchargée, passer au middleware suivant

  const imagePath = path.join(__dirname, '../images', req.file.filename);
  const optimizedPath = imagePath.replace(req.file.filename, 'optimized_' + req.file.filename);

  // Optimisation de l'image (compression et redimensionnement)
  sharp(imagePath)
    .resize(1024)
    .toFormat('jpeg', { quality: 80 })
    .toFile(optimizedPath, (err) => {
      if (err) return res.status(500).send('Erreur interne du serveur.');

      fs.rename(optimizedPath, imagePath, (renameErr) => {
        if (renameErr) return res.status(500).send('Erreur interne du serveur.');

        req.file.optimized = true;
        req.file.path = imagePath;
        next(); // Passer au middleware suivant
      });
    });
};
