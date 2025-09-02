const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const msg = req.body.message.toLowerCase();
  let reply = "Sorry, I didn't understand that. Can you try again?";

  if (msg.includes("recommend") || msg.includes("suggest")) {
    reply = "Sure! What genre are you interested in — Fiction, Science, or Self-Help?";
  } else if (msg.includes("fiction")) {
    reply = "Try 'The Alchemist' or 'Pride and Prejudice'.";
  } else if (msg.includes("science")) {
    reply = "I'd suggest 'Brief History of Time' or 'The Selfish Gene'.";
  } else if (msg.includes("self-help")) {
    reply = "Try 'Atomic Habits' or 'The Power of Now'.";
  } else if (msg.includes("how to donate") || msg.includes("donate book")) {
    reply = "To donate, go to the Add Book page, fill in details, and submit.";
  } else if (msg.includes("how to swap") || msg.includes("swap book")) {
    reply = "You can go to Gallery and look for books marked as 'Swap'.";
  } else if (msg.includes("pickup")) {
    reply = "To schedule pickup, go to Pickup Request page and fill in your info.";
  } else if (msg.includes("form")) {
    reply = "Visit the relevant form page and make sure all fields are filled correctly.";
  } else if (msg.includes("hello") || msg.includes("hi")) {
    reply = "Hello! I'm your Book Assistant. How can I help you today?";
  }

  res.json({ reply });
});

module.exports = router;
