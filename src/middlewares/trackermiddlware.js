const trackVisits = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next();
  }

  if (!user.visitedUrls) {
    user.visitedUrls = [];
  }

  const url = req.originalUrl;
  const requiredUrls = ['/hash', '/block', '/blockchain'];

  // console.log('Before:', user.visitedUrls);

  if (requiredUrls.includes(url) && !user.visitedUrls.includes(url)) {
    user.visitedUrls.push(url);
    // console.log('Visited URLs:', user.visitedUrls);
  }

  if (requiredUrls.every((u) => user.visitedUrls.includes(u))) {
    user.tutorialCompleted = true;
    try {
      await user.save();
      console.log('Tutorial completed for user:', user.username);
    } catch (err) {
      console.error('Error updating tutorial status:', err);
    }
  } else {
    try {
      await user.save();
    } catch (err) {
      console.error('Error saving visited URLs:', err);
    }
  }

  next();
};

export default trackVisits;
