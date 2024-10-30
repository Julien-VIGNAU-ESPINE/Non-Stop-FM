const express = require('express');
const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = 3070;

// Middleware pour servir des fichiers statiques
app.use('/Music', express.static('Music'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route pour la page principale
app.get('/', (req, res) => {
    fs.readdir('./Music', (err, files) => {
        if (err) {
            return res.status(500).send('Erreur lors de la lecture du dossier.');
        }

        const mp3Files = files.filter(file => path.extname(file) === '.mp3');
        const trackList = mp3Files.map(file => {
            const fileNameWithoutExtension = path.basename(file, '.mp3'); // Obtenir le nom sans l'extension
            return `<li data-src="Music/${file}">${fileNameWithoutExtension}</li>`;
        }).join('');


        // Lire le fichier HTML et injecter la liste des pistes
        fs.readFile('index.html', 'utf8', (err, htmlContent) => {
            if (err) {
                return res.status(500).send('Erreur lors de la lecture du fichier HTML.');
            }

            // Remplacer la balise placeholder par le contenu dynamique
            const finalHtml = htmlContent.replace('<!-- trackList -->', trackList);
            res.send(finalHtml);
        });
    });
});

// Route pour télécharger une vidéo YouTube
app.post('/download', (req, res) => {
    const { url, author, musicTitle } = req.body;

    if (!url || !author || !musicTitle) {
        return res.status(400).send('URL YouTube, auteur ou titre invalide.');
    }

    const filePath = path.resolve(__dirname, 'Music', `${author} - ${musicTitle}.mp3`);
    if (fs.existsSync(filePath)) {
        return res.status(400).send('Le fichier existe déjà.');
    }

    youtubedl(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: filePath
    })
    .then(output => {
        console.log('Téléchargement réussi :', output);
        res.send('Téléchargement MP3 réussi !');
    })
    .catch(err => {
        console.error('Erreur lors du téléchargement :', err);
        res.status(500).send('Erreur lors du téléchargement.');
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
