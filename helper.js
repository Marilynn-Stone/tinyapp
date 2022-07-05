const getUserByEmail = (email, database) => {
  for (const userID in database) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};

module.exports = {getUserByEmail};