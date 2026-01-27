# Configuration Email de Confirmation - Supabase

## Activer l'email de confirmation

### 1. Aller dans Supabase Dashboard
- Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Sélectionnez votre projet "Meteo-Trip"

### 2. Configuration Authentication
1. Dans le menu de gauche, cliquez sur **Authentication**
2. Puis cliquez sur **Providers**
3. Trouvez **Email** et cliquez dessus

### 3. Activer la confirmation par email
- Activez l'option **"Confirm email"** (Enable email confirmations)
- Cliquez sur **Save**

### 4. Personnaliser l'email (optionnel)
1. Allez dans **Authentication** → **Email Templates**
2. Sélectionnez **Confirm signup**
3. Personnalisez le message si vous voulez :

```html
<h2>Confirmez votre inscription à Météo Trip</h2>
<p>Merci de vous être inscrit ! Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
```

### 5. Mettre à jour le code (déjà fait !)
Le code enregistre déjà le username dans les métadonnées utilisateur lors de l'inscription.

## Comment ça marche ?

1. L'utilisateur s'inscrit avec email + pseudo
2. Supabase envoie automatiquement un email de confirmation
3. L'utilisateur clique sur le lien dans l'email
4. Le compte est activé et l'utilisateur peut se connecter

## Tester

1. Inscrivez-vous avec une vraie adresse email
2. Vérifiez votre boîte mail (+ spams)
3. Cliquez sur le lien de confirmation
4. Connectez-vous !

---

**Note importante :** En développement, Supabase peut avoir des limites d'envoi d'emails. Pour la production, configurez un service SMTP personnalisé dans **Settings** → **Auth** → **SMTP Settings**.
