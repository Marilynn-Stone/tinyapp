const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const {getUserByEmail} = require("./helper");


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["dinosaureggs"]
}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID:"aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: "$2a$10$e6t7rmirW4SKwrV9s2lg4.SzXRCqqnW6g.WlcE4anAlGo2iJKyM/q"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: "jaslnevio289457[vawpijtera;snljemrap3mrv.laktovaishefsdn$asd"
  }
};



const generateRandomString = () => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};



const urlsForUser = (user) => {
  const id = user.id;
  console.log(id);
  let database = {};
  for (const shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL]["userID"]) {
      database[shortURL] = urlDatabase[shortURL];
    }
  }
  return database;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.session.userID];
  console.log("user:", user);
  if (!user) {
    const templateVars = {
      urls: urlDatabase,
      user
    };
    res.render("urls_index", templateVars);
  }
  const userDatabase = urlsForUser(user);
  const templateVars = {
    urls: userDatabase,
    user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login?error=You must be logged in to create a new URL.");
    return;
  }
  const user = users[req.session.userID];
  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.userID];
  const userDatabase = urlsForUser(user);
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: userDatabase[req.params.shortURL]["longURL"],
    urls: userDatabase,
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  if (!shortURL) {
    res.redirect("/urls?error=That id does not exist in the database.");
    return;
  }
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const user = users[req.session.userID];
  const error = req.query.error;
  const templateVars = {
    email: req.params.email,
    password: req.params.password,
    user,
    error
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.session.userID];
  const error = req.query.error;
  const templateVars = {
    email: req.params.email,
    password: req.params.password,
    user,
    error
  };
  res.render("urls_login", templateVars);
});


app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.userID;
  const error = req.query.error;
  const newURL = {
    longURL,
    userID,
    error
  };
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.userID];
  const shortURL = req.params.shortURL;
  if (user) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

// redirect to update form
app.post("/urls/:shortURL", (req, res) => {
  const user = users[req.session.userID];
  const shortURL = req.params.shortURL;
  if (user) {
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/update/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL]["longURL"] = longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = getUserByEmail(email, users);
  if (!foundUser) {
    res.redirect("/login?error=User email not found.");
    return;
  }
  if (!(bcrypt.compareSync(password, foundUser.hashedPassword))) {
    res.redirect("/login?error=Password does not match email.");
    return;
  }
  req.session.userID = `${foundUser.id}`;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.session =  null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(`${password}`, 10);
  const foundUser = getUserByEmail(email, users);
  if (!email || !hashedPassword) {
    res.redirect("/register?error=Email or password were not entered.");
    return;
  }
  if (foundUser) {
    res.redirect("/login?error=That email is already registered. Please login.");
    return;
  }
  const newUser = {
    id,
    email,
    hashedPassword,
  };
  users[id] = newUser;
  req.session.userID = `${id}`;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});