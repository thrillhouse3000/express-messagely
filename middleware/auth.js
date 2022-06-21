/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const Message = require('../models/message');

/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    const tokenFromBody = req.body._token;
    const payload = jwt.verify(tokenFromBody, SECRET_KEY);
    req.user = payload; // create a current user
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    return next({ status: 401, message: "Unauthorized" });
  } else {
    return next();
  }
}

/** Middleware: Requires correct username. */

function ensureCorrectUser(req, res, next) {
  try {
    if (req.user.username === req.params.username) {
      return next();
    } else {
      return next({ status: 401, message: "Unauthorized" });
    }
  } catch (err) {
    // errors would happen here if we made a request and req.user is undefined
    return next({ status: 401, message: "Unauthorized" });
  }
}

/** Requires username to be either sender or recipient */

async function isSenderRecipient(req, res, next) {
  try{
    const m = await Message.get(req.params.id)
    if (m.to_user.username === req.user.username || m.from_user.username === req.user.username) {
      return next();
    } else {
      return next({ status: 401, message: "Unauthorized" });
    }
  } catch(err) {
    return next({ status: 401, message: "Unauthorized" });
  }
}

/** Requires username to be recipient */

async function isRecipient(req, res, next) {
  try{
    const m = await Message.get(req.params.id)
    if (m.to_user.username === req.user.username) {
      return next();
    } else {
      return next({ status: 401, message: "Unauthorized" });
    }
  } catch(err) {
    return next({ status: 401, message: "Unauthorized" });
  }
}
// end

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  isSenderRecipient,
  isRecipient
};
