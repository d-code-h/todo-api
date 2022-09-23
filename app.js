const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const { MongoClient, ObjectId } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017');

const dbName = 'todo';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
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
  try {
    await client.connect();
    let db = client.db(dbName).collection('todos');
    await db.insertOne(t);
  } catch (err) {
    client.close();
    console.log(err);
    return res.json("Couldn't add new todo");
  }
  client.close();
  res.json('A new Todo was successfully added');
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

app.listen(3000, () => {
  console.log('Server started!');
});
