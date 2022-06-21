const express = require('express');
const router = new express.Router();
const Message = require('../models/message');
const { ensureLoggedIn, isSenderRecipient, isRecipient } = require("../middleware/auth");



/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', isSenderRecipient, async (req, res, next) => {
    const message = await Message.get(req.params.id);
    return res.json({message: message});
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async(req, res, next) => {
    const {to_username, body} = req.body;
    const from_username = req.user.username
    const message = await Message.create({from_username, to_username, body});
    return res.json({message: message})
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', isRecipient, async (req, res, next) => {
    const result = await Message.markRead(req.params.id);
    return res.json({message: result})
})


module.exports = router;