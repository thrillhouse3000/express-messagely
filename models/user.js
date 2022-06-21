/** User class for message.ly */
const db = require('../db')
const bcrypt = require('bcrypt')
const ExpressError = require('../expressError');
const {BCRYPT_WORK_FACTOR} = require('../config')


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users
      VALUES ($1, $2, $3, $4, $5)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    await User.updateLoginTimestamp(username);
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0]
    if(user) {
      if(await bcrypt.compare(password, user.password)) {
        await User.updateLoginTimestamp(username);
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE username=$1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users`)
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username=$1`,
      [username]
    );
    const user = result.rows[0]

    if(!user) {
      throw new ExpressError('No user with that username exists', 404)
    }

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id, m.body, m.sent_at, m.read_at, 
      json_build_object('username', t.username, 'first_name', t.first_name, 'last_name', t.last_name, 'phone', t.phone) AS to_user
      FROM messages AS m
      JOIN users AS t
      ON m.to_username = t.username
      WHERE from_username=$1`,
      [username]
    );

    return results.rows;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id, m.body, m.sent_at, m.read_at, 
      json_build_object('username', f.username, 'first_name', f.first_name, 'last_name', f.last_name, 'phone', f.phone) AS from_user
      FROM messages AS m
      JOIN users AS f
      ON m.from_username = f.username
      WHERE to_username=$1`,
      [username]
    );

    return results.rows;
  }
}


module.exports = User;