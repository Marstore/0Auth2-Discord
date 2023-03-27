const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');
const { get } = require('http');

const app = express();
const port = 3000;
const clientID = 'id-client';
const clientSecret = 'seu-secret';
const redirectUri = 'http://localhost:3000/login/discord/callback';

// Configuração da sessão
app.use(session({
  secret: 'seu_secret',
  resave: false,
  saveUninitialized: false
}));

// Configuração do Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuração da estratégia do Passport
passport.use(new DiscordStrategy({
  clientID: clientID,
  clientSecret: clientSecret,
  callbackURL: redirectUri,
  scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile));
}));

// Serialização e desserialização do usuário
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Rota de login
app.get('/login/discord', passport.authenticate('discord'));

// Rota de callback do login
app.get('/login/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/profile');
});

// Rota de logout
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Rota de perfil
app.get('/profile', async (req, res) => {
  if (req.isAuthenticated()) {
    const token = req.user.accessToken;
    const response = await axios.get ('https://discord.com/api/users/@me', {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const user = response.data;

    res.send(`
      <h1>Seu perfil</h1>
      <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="Avatar">
      <p>Nome: ${user.username}#${user.discriminator}</p>
      <p>ID: ${user.id}</p>
      <a href="/logout">Sair</a>
    `);
  } else {
    res.redirect('/');
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.send(`
    <h1>Homepage</h1>
    <a href="/login/discord">Entrar com Discord</a>
  `);
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});