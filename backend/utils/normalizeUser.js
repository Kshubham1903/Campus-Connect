// backend/utils/normalizeUser.js

function normalizeUserForClient(u) {
  if (!u) return u;
  // If a Mongoose doc was passed, ensure it's a plain object
  const user = (typeof u.toObject === 'function') ? u.toObject() : { ...u };

  // remove sensitive
  if ('passwordHash' in user) delete user.passwordHash;

  // normalize avatarUrl to always be a path starting with '/'
  if (user.avatarUrl) {
    user.avatarUrl = String(user.avatarUrl).startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`;
  } else {
    user.avatarUrl = null;
  }

  const vis = user.profileVisibility || {
    showEmail: false,
    showEnrollmentYears: true,
    showCareerInfo: true,
  };

  if (!vis.showEmail && 'email' in user) delete user.email;
  if (!vis.showEnrollmentYears) {
    if ('enrollmentYear' in user) delete user.enrollmentYear;
    if ('graduationYear' in user) delete user.graduationYear;
    if ('currentYear' in user) delete user.currentYear;
  }
  if (!vis.showCareerInfo) {
    if ('currentCompany' in user) delete user.currentCompany;
    if ('jobTitle' in user) delete user.jobTitle;
    if ('linkedIn' in user) delete user.linkedIn;
    if ('location' in user) delete user.location;
  }

  return user;
}

module.exports = { normalizeUserForClient };
