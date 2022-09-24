const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const { MongoClient, ObjectId } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017');

const dbName = 'todo';

// Auth
const passport = require('passport');
const LocalStrategy = require('passport-local');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  require('express-session')({
    secret: 'The Todo API',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    await client.connect();
    let db = client.db(dbName).collection('users');
    let user = await db.findOne({ _id: ObjectId(id) });
    done(null, user);
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    let user;
    try {
      await client.connect();
      let db = client.db(dbName).collection('users');
      user = await db.findOne({ username: username });
      if (!user || user.password !== password) {
        client.close();
        return done(null, false);
      }
    } catch (error) {
      client.close();
      console.log(error);
      return done(error);
    }
    client.close();
    return done(null, user);
  })
);

app.post('/signup', async (req, res) => {
  let user = {
    name: req.body.name.trim(),
    username: req.body.username.trim(),
    password: req.body.password.trim(),
  };

  try {
    await client.connect();
    let db = client.db(dbName).collection('users');
    let exist = await db.findOne({ username: user.username });
    if (!exist) {
      await db.insertOne(user);
      // res.json('New User Added');
      return res.redirect('/login');
    }
  } catch (err) {
    client.close();
    console.log(err);
    return res.json('We encounter an issue, please try back later');
  }
});

app.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  async (req, res) => {
    res.json('Sign in successfully!');
  }
);

app.get('/', async (req, res) => {
  console.log(req.headers);
  console.log(req.user);
  let todos;
  try {
    await client.connect();
    let db = client.db(dbName).collection('todos');
    todos = await db.find().toArray();
  } catch (err) {
    client.close();
    console.log(err);
    return res.json("Couldn't fetch the requested todos");
  }
  client.close();
  res.json(todos);
});

app.post('/', async (req, res) => {
  let t = {
    time: new Date(),
    val: req.body.todo.trim(),
  };
  let todo;
  try {
    await client.connect();
    let db = client.db(dbName).collection('todos');
    todo = await db.insertOne(t);
  } catch (err) {
    client.close();
    console.log(err);
    return res.json("Couldn't add new todo");
  }
  client.close();
  res.json(todo);
});

app.put('/:id', async (req, res) => {
  let t = {
    time: new Date(),
    val: req.body.todo.trim(),
  };
  try {
    await client.connect();
    let db = client.db(dbName).collection('todos');
    await db.updateOne(
      { _id: ObjectId(req.params.id) },
      { $set: { time: t.time, val: t.val } }
    );
  } catch (err) {
    client.close();
    console.log(err);
    return res.json("Couldn't Update the todo");
  }
  client.close();
  res.json('Todo successfully updated');
});

app.delete('/all', async (req, res) => {
  try {
    await client.connect();
    let db = client.db(dbName).collection('todos');
    await db.drop();
  } catch (err) {
    client.close();
    console.log(err);
    return res.json('Unable to Empty DB');
  }
  client.close();
  res.json('All todos deleted successfully');
});

app.delete('/:id', async (req, res) => {
  try {
    await client.connect();
    let db = client.db(dbName).collection('todos');
    await db.deleteOne({ _id: ObjectId(req.params.id) });
  } catch (err) {
    client.close();
    console.log(err);
    res.json('Unable to delete Todo');
  }
  client.close();
  res.json(`Todo with id ${req.params.id} deleted successfully`);
});

app.get('/logout', (req, res) => {
  req.logOut();
  res.json('User Logged out!');
});

app.listen(3000, () => {
  console.log('Server started!');
});
