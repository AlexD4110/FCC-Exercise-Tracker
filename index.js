const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const e = require('express')
require('dotenv').config()
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL)

const UserSchema = new Schema({
  username: String,
});

const User = mongoose.model('User', UserSchema)

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', ExerciseSchema);

//Middleware
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res) => {
    const users = await User.find({}).select("_id username");
    if (!users) {
      res.send("No users");
    } else {
      res.json(users);
    }
  })

app.post("/api/users", async (req, res) => { //need async because we are using await
  console.log(req.body);
  const userObj =  new User({
    username: req.body.username
  })

  try{
    const user = await userObj.save() //waits for it to save it then moves on 
    console.log(user) //Tells us what user is by logging
    res.json(user) //Response with user json object
  } catch(err){
    console.log(err)
  }
   
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("Could not find user");
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });

      await exerciseObj.save(); // Save the exercise object to the database

      res.json({
        _id: user._id,
        username: user.username,
        description: exerciseObj.description,
        duration: exerciseObj.duration,
        date: exerciseObj.date.toDateString(), // Format the date
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    res.status(404).send("Could not find user");
    return;
  } 
  let dateObj = {}
  if (from) {
    dateObj['$gte'] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
    filter.date = dateObj
  }
  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),
  }));

res.json({
  username: user.username,
  count: exercises.length,
  _id: user._id,
  log
});
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
