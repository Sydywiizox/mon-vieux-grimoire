Télécharger le front : https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres et le lancer avec `npm start`
Lancer le backend avec `nodemon ./server.js`

## Configuration

Créer un fichier `.env` à la racine du projet avec :

```
MONGO_URI=VOTRE_URI_MONGODB
TOKEN_SECRET=VOTRE_TOKEN_SECRET

# Configuration Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
CLOUDINARY_UPLOAD_PRESET=images_mvg
```

### Cloudinary

Ce projet utilise maintenant **Cloudinary** pour le stockage et l'optimisation des images au lieu du stockage local.

Pour configurer Cloudinary :

1. Créez un compte sur [Cloudinary](https://cloudinary.com)
2. Dans le dashboard, allez dans "Settings" puis "Upload"
3. Créez un **Upload Preset** nommé `images_mvg` avec ces paramètres :
   - **Signing mode** : Unsigned (pour simplifier l'utilisation)
   - **Folder** : book-covers (optionnel)
   - **Format** : WebP
   - **Transformations** :
     - Width : 800
     - Height : 1000
     - Quality : 80
4. Récupérez vos identifiants dans le dashboard (Settings > Product environment credentials) :
   - Cloud name
   - API Key
   - API Secret
5. Ajoutez tous ces paramètres dans votre fichier `.env`

Les images seront automatiquement optimisées selon votre preset.
