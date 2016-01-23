'use script';

require('dotenv').load();

var http = require('http');
var express = require('express');
var Cookies = require('cookies');
var keygrip = require('keygrip');
var api = require('instagram-node').instagram();
var app = express();

app.use(express.static('public'));

app.set('views', './views');
app.set('view engine', 'jade');

var redirect_uri = process.env.APP_URL + 'auth/instagram';
var keys = [process.env.COOKIE_SECRET_A, process.env.COOKIE_SECRET_B, process.env.COOKIE_SECRET_C];

/**
 * Handle home route.
 * @param req
 * @param res
 */
exports.handleHome = function (req, res) {
  var cookies = new Cookies(req, res, keys);
  if (! cookies.get('chop')) {
    api.use({
      client_id: process.env.INSTAGRAM_KEY,
      client_secret: process.env.INSTAGRAM_SECRET
    });
    res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: '' }));
  } else {
    api.use({ access_token: cookies.get('chop') });

    /**
     * Get user profile.
     */
    api.user(cookies.get('chop_user'), function(err, result) {

      res.render('home', {
        title: 'Chop for Instagram'
      });

    });
  }
};
app.get('/', exports.handleHome);

/**
 * Handle authorization route.
 * @param req
 * @param res
 */
exports.handleAuth = function(req, res) {
  /**
   * Set up the API to use client id + secret.
   */
  api.use({
    client_id: process.env.INSTAGRAM_KEY,
    client_secret: process.env.INSTAGRAM_SECRET
  });

  /**
   * Authorize the user.
   */
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      var cookies = new Cookies(req, res, keys);
      cookies.set('chop', result.access_token, { signed: true, overwrite: true });
      cookies.set('chop_user', result.user.id, { signed: true, overwrite: true });
      res.redirect('/');
    }
  });
};
app.get('/auth/instagram', exports.handleAuth);

exports.handleApiMedia = function(req, res) {
  var cookies = new Cookies(req, res, keys);

  var id = cookies.get('chop_user');
  var token = cookies.get('chop');
  var hdl = function(err, medias, pagination, remaining, limit) {
    var user_media = medias;
    /**
     * Return data.
     */
    res.send({'media' : user_media});
  };

  api.user_self_liked({count: 100, max_like_id: req.query.last_media_id}, hdl);
};
app.get('/api/media', exports.handleApiMedia);

exports.handleApiProfile = function(req, res) {
  var cookies = new Cookies(req, res, keys);
  api.use({ access_token: cookies.get('chop') });
  api.user(cookies.get('chop_user'), function(err, result) {
    res.send(result);
  });
};
app.get('/api/profile', exports.handleApiProfile);

app.get('/auth/forget', function(req, res) {
  res.clearCookie('chop');
  res.clearCookie('chop_user');
  res.redirect('/');
});

http.createServer(app).listen(80, function(){
  console.log("Express server listening on port 80");
});