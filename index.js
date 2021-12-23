const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const paginate = require('express-paginate');

// Création du serveur Express
const app = express();

// Configuration du serveur
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(paginate.middleware(10, 50));


// Connexion à la base de donnée SQlite
const db_name = path.join(__dirname, "data", "db.sqlite");
const db = new sqlite3.Database(db_name, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion réussie à la base de données 'apptest.db'");
});

// Création de la table Livres (Livre_ID, Titre, Auteur, Commentaires)
const sql_show = `SELECT * FROM 'users' LIMIT 0,30;`;
db.run(sql_show, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Création réussie de la table 'users'");
});

// Démarrage du serveur
app.listen(3000, () => {
    console.log("Serveur démarré (http://localhost:3000/) !");
});

// GET /
app.get("/", (req, res) => {
  // res.send("Bonjour le monde...");
  res.render("index");
});


// GET /data
app.get("/user/:id", (req, res) => {
  let query="SELECT * FROM users WHERE id = "+req.params.id;
  db.get(query, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    query="SELECT url FROM 'media' WHERE userId = "+req.params.id;
    db.get(query, [], (err, media) => {
      if (err) {
        return console.error(err.message);
      }
      query="SELECT * FROM messages WHERE senderId = "+req.params.id +" OR receiverId = "+req.params.id+";";
      console.log(query);
      db.all(query, [], (err, messages) => {
        if (err) {
          return console.error(err.message);
        }
        //TODO complete with names of emitters and receivers
        res.render("user", { user: result,
                            messages: messages,
                            media: media});
      });
    });
  });

});



function generateSQLQuery(isdeleted, username, country, name, city, limit, skip) {
  let queryfilter = "";
  console.log(isdeleted + username + country +  name + city);
  if (isdeleted != "" && isdeleted != undefined){
    //TODO Use transformation to not set null or 1 in the front end to filter on this

    if (isdeleted == 'true') {
      queryfilter += "AND isDeleted = true";
    }

    else {
      queryfilter += "AND isDeleted is NULL";
    }
  }
  if (username){
    queryfilter += "AND username LIKE '%"+username+"%'";
  }
  if (country){
    queryfilter += "AND country LIKE '%"+country+"%'";
  }
  if (name){
    queryfilter += "AND name LIKE '%"+name+"%'";
  }
  if (city){
    queryfilter += "AND city LIKE '%"+city+"%'";
  }
  //Remove the first AND
  queryfilter = queryfilter.substring(4);
  console.log(queryfilter);
  let query = "SELECT * FROM 'users'";
  if (queryfilter != "") {
    query += " WHERE "+queryfilter;
  }
  if (skip === undefined){
    skip = 0;
  }
  query += " ORDER BY id LIMIT "+limit+" OFFSET "+skip;
  console.log(query);
  return query;
}

app.get("/users", async (req, res, next) => {
  console.log(req.query.page)
  const sql = generateSQLQuery(req.query.isdeleted,
                              req.query.username,
                            req.query.country,
                          req.query.name,
                        req.query.city,
                      req.query.limit,
                    req.query.limit*(req.query.page-1))

  // TODO : set request async
  const result = await db.get("SELECT count(id) FROM 'users'", []);
  const pageCount = Math.ceil(result.row / req.query.limit);
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("users", { model: rows,
                          count: pageCount,
                          currentPage: req.query.page,
                        });
  });
});
