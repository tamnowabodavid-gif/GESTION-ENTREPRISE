# GESTION-ENTREPRISE – application Android (APK) de Chantier Pro

GitHub fabrique ici l'application Android, sans rien installer sur l'ordinateur.

- Le dossier `www/` contient l'application. Chaque envoi dans `www/` lance la fabrication d'une nouvelle APK (onglet **Actions**), publiée ensuite dans **Releases**.
- Les 2 secrets `KEYSTORE_B64` et `KEYSTORE_PASS` (Paramètres → Secrets et variables → Actions) signent l'APK. Ne jamais mettre les fichiers de signature dans le dépôt.
- Le dépôt est public : il ne contient que le programme, aucune donnée de chantier ni de client.
- Sur le téléphone : Releases → télécharger `ChantierPro-xxxx.apk` → installer. Dans l'application : ⚙︎ → Dépôt GitHub → `tamnowabodavid-gif/GESTION-ENTREPRISE`.
