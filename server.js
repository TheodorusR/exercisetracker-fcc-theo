const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const userSchema = new mongoose.Schema({
  username: String,
  log: []
});

const User = mongoose.model("User", userSchema);

const createNewUser = (someName, done) => {
  User.create({username: someName, log:[]}, (err, data) => {
    if (err) return done(err);
    return done(null,data);
  });
}

const addExercise = (someDesc, someDur, someDate, someId, done) => {
  let exercise = {"description": someDesc, "duration": someDur, "date": someDate};
  User.findByIdAndUpdate(someId, {$push:{log: exercise}},(err, data) => {
    if (err) return done(err);
    return done(null, data);
  });
}

const getLog = (someId, dateFrom, dateTo, limit, done) => {
  User.findById(someId, (err,data) => {
    if (err) return done(err);  
    let exercise = data.log;
    if (dateFrom) {
      exercise = exercise.filter((dataLog) => {
        return new Date(dataLog.date).getTime()>=new Date(dateFrom).getTime();
      });
    }
    if (dateTo) {
      exercise = exercise.filter((dataLog) => {
        return new Date(dataLog.date).getTime()<=new Date(dateTo).getTime();
      });
    }
    if (limit) {
      exercise.splice(limit);
    }
    done(null, {"_id": data._id, "username": data.username, "count": exercise.length, "log": exercise});
  });
}

app.use(bodyParser.urlencoded({extended:false}));

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post("/api/exercise/new-user", (req,res) => {
  createNewUser(req.body.username, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.json({"username": data.username, "_id": data._id});
    }
  });
});

app.get("/api/exercise/users", (req,res) => {
  User.find().select({_id: 1, username: 1}).exec((err,data) => {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  });
});

app.post("/api/exercise/add", (req,res) => {
  if(req.body.date == "") {
    req.body.date = new Date().toDateString();
  } else {
    req.body.date = new Date(req.body.date).toDateString();
  }
  req.body.duration = Number(req.body.duration);
  addExercise(req.body.description, req.body.duration, req.body.date, req.body.userId, (err,data) => {
    if (err) {
      console.log(err);
    } else {
      res.json({"_id": data._id, "username": data.username, "date": req.body.date, "duration":req.body.duration, "description": req.body.description});
    }
  });
});

app.get("/api/exercise/log", (req,res) => {
  getLog(req.query.userId, req.query.from, req.query.to, req.query.limit, (err,data) => {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
