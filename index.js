const express = require('express');
const fs = require("fs")
const timeout = require('connect-timeout')
const compression = require('compression');

let api = true;
let gdicons = fs.readdirSync('./icons/iconkit')
const app = express();
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(timeout('25s'));
app.use(haltOnTimedout)
app.set('json spaces', 2)

app.modules = {}
fs.readdirSync('./api').forEach(x => {
  app.modules[x.split('.')[0]] = require('./api/' + x)
})

app.secret = 'Wmfd2893gb7'
app.endpoint = 'http://boomlings.com/database/'
app.config = require('./misc/gdpsConfig')  // tweak settings in this file if you're using a GDPS

const secrets = require("./misc/secretStuff.json")
app.id = secrets.id
app.gjp = secrets.gjp

if (app.id == "account id goes here" || app.gjp == "account gjp goes here") console.log("Warning: No account ID and/or GJP has been provided in secretStuff.json! These are required for level leaderboards to work.")

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}

app.parseResponse = function (responseBody, splitter) {
  if (!responseBody || responseBody == "-1") return {};
  let response = responseBody.split('#')[0].split(splitter || ':');
  let res = {};
  for (let i = 0; i < response.length; i += 2) {
  res[response[i]] = response[i + 1]}
  return res  }

//xss bad
app.clean = function(text) {if (!text || typeof text != "string") return text; else return text.replace(/&/g, "&#38;").replace(/</g, "&#60;").replace(/>/g, "&#62;").replace(/=/g, "&#61;").replace(/"/g, "&#34;").replace(/'/g, "&#39;")}

console.log("Site online!")


// ASSETS

let assets = ['css', 'assets', 'blocks', 'deatheffects', 'difficulty', 'gauntlets', 'gdicon', 'iconkitbuttons', 'levelstyle', 'objects']
app.use('/css', express.static(__dirname + '/assets/css'));
app.use('/assets', express.static(__dirname + '/assets', {maxAge: "7d"}));
app.use('/blocks', express.static(__dirname + '/assets/blocks', {maxAge: "7d"}));
app.use('/deatheffects', express.static(__dirname + '/assets/deatheffects', {maxAge: "7d"}));
app.use('/difficulty', express.static(__dirname + '/assets/gdfaces', {maxAge: "7d"}));
app.use('/gauntlets', express.static(__dirname + '/assets/gauntlets', {maxAge: "7d"}));
app.use('/gdicon', express.static(__dirname + '/icons/iconkit', {maxAge: "7d"}));
app.use('/iconkitbuttons', express.static(__dirname + '/assets/iconkitbuttons', {maxAge: "7d"}));
app.use('/levelstyle', express.static(__dirname + '/assets/initial', {maxAge: "7d"}));
app.use('/objects', express.static(__dirname + '/assets/objects', {maxAge: "7d"}));


// POST REQUESTS

app.post("/like", function(req, res) { app.modules.like(app, req, res) })  
app.post("/postComment", function(req, res) { app.modules.postComment(app, req, res) })  
app.post("/postProfileComment", function(req, res) { app.modules.postProfileComment(app, req, res) })  


// HTML

app.get("/", function(req, res) { res.sendFile(__dirname + "/html/home.html") })   
app.get("/analyze/:id", async function(req, res) { res.sendFile(__dirname + "/html/analyze.html") })
app.get("/api", function(req, res) { res.sendFile(__dirname + "/html/api.html") })
app.get("/comments/:id", function(req, res) { res.sendFile(__dirname + "/html/comments.html") })
app.get("/gauntlets", function(req, res) { res.sendFile(__dirname + "/html/gauntlets.html") })
app.get("/iconkit", function(req, res) { res.sendFile(__dirname + "/html/iconkit.html") })
app.get("/leaderboard", function(req, res) { res.sendFile(__dirname + "/html/leaderboard.html") })
app.get("/leaderboard/:text", function(req, res) { res.sendFile(__dirname + "/html/levelboard.html") })
app.get("/mappacks", function(req, res) { res.sendFile(__dirname + "/html/mappacks.html") })
app.get("/search", function(req, res) { res.sendFile(__dirname + "/html/filters.html") })
app.get("/search/:text", function(req, res) { res.sendFile(__dirname + "/html/search.html") })


// API

app.get("/api/analyze/:id", async function(req, res) { app.modules.level(app, req, res, api, true) })
app.get("/api/comments/:id", function(req, res) { app.modules.comments(app, req, res, api) })
app.get("/api/credits", function(req, res) { res.send(require('./misc/credits.json')) })
app.get("/api/leaderboard", function(req, res, api) { app.modules[req.query.hasOwnProperty("accurate") ? "accurateLeaderboard" : "leaderboard"](app, req, res) })
app.get("/api/leaderboardLevel/:id", function(req, res) { app.modules.leaderboardLevel(app, req, res, api) })
app.get("/api/level/:id", async function(req, res) { app.modules.level(app, req, res, api) })
app.get("/api/mappacks", async function(req, res) { res.send(require('./misc/mapPacks.json')) })
app.get("/api/profile/:id", function(req, res) { app.modules.profile(app, req, res, api) })
app.get("/api/search/:text", function(req, res) { app.modules.search(app, req, res, api) })


// API AND HTML
   
app.get("/profile/:id", function(req, res) { app.modules.profile(app, req, res) })
app.get("/:id", function(req, res) { app.modules.level(app, req, res) }) 
 

// REDIRECTS

app.get("/icon", function(req, res) { res.redirect('/iconkit') })
app.get("/iconkit/:text", function(req, res) { res.redirect('/icon/' + req.params.text) })
app.get("/leaderboards/:id", function(req, res) { res.redirect('/leaderboard/' + req.params.id) })
app.get("/l/:id", function(req, res) { res.redirect('/leaderboard/' + req.params.id) })
app.get("/a/:id", function(req, res) { res.redirect('/analyze/' + req.params.id) })
app.get("/c/:id", function(req, res) { res.redirect('/comments/' + req.params.id) })
app.get("/u/:id", function(req, res) { res.redirect('/profile/' + req.params.id) })
app.get("/p/:id", function(req, res) { res.redirect('/profile/' + req.params.id) })


// MISC

app.get("/assets/sizecheck.js", function(req, res) { res.sendFile(__dirname + "/misc/sizecheck.js") }) 
app.get('/api/icons', function(req, res) { res.send(gdicons); });
app.get("/icon/:text", function(req, res) { app.modules.icon(app, req, res) })

app.get('*', function(req, res) {
  if (req.path.startsWith('/api')) res.send('-1')
  if (assets.some(x => req.path.startsWith("/" + x))) res.send("Looks like this file doesn't exist ¯\\_(ツ)_/¯<br>You can check out all of the assets on <a target='_blank' href='https://github.com/GDColon/GDBrowser/tree/master/assets'>GitHub</a>")
  else res.redirect('/search/404%20')
});

app.listen(2000);