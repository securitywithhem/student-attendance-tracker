/** Today's date as YYYY-MM-DD in the server's local time zone. Injected so tests can fix "today". */
const systemClock = {
  today: () => new Date().toLocaleDateString('en-CA'),
};

module.exports = { systemClock };
