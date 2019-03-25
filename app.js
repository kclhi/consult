const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session')
const logger = require('./config/winston');

// Environment variables
require('dotenv').config()

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/dialogue", express.static(path.join(__dirname, 'public')));

const dialogueRouter = require('./routes/dialogue');
const userRouter = require('./routes/user');

app.use('/dialogue', dialogueRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
