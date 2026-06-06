function saveProfile(profile) {
  try {
    localStorage.setItem('kilimowise_profile', JSON.stringify(profile));
    if (profile.phoneNumber) localStorage.setItem('kilimowise_phone', profile.phoneNumber);
    if (profile.firstName) localStorage.setItem('kilimowise_first', profile.firstName);
    if (profile.lastName) localStorage.setItem('kilimowise_last', profile.lastName);
    if (profile.dob) localStorage.setItem('kilimowise_dob', profile.dob);
    if (profile.gender) localStorage.setItem('kilimowise_gender', profile.gender);
    if (profile.location) localStorage.setItem('kilimowise_location', profile.location);
    if (profile.firstName || profile.lastName) {
      localStorage.setItem('kilimowise_name', ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim());
    }
  } catch (e) { /* ignore */ }
}

function loginUser(phone, password) {
  return login(phone, password).then(function (result) {
    try {
      localStorage.setItem('kilimowise_token', result.token);
      localStorage.setItem('kilimowise_farmerId', String(result.farmerId));
      localStorage.setItem('kilimowise_name', result.name || '');
      localStorage.setItem('kilimowise_phone', phone);
    } catch (e) { /* ignore */ }
    // Try to fetch full profile (best-effort)
    if (result.farmerId && typeof getFarmerProfile === 'function') {
      getFarmerProfile(result.farmerId).then(saveProfile).catch(function () { /* offline ok */ });
    }
    return result;
  });
}

function registerUser(firstName, lastName, phoneNumber, dob, gender, location, password) {
  return registerFarmer(firstName, lastName, phoneNumber, dob, gender, location, password).then(function () {
    return loginUser(phoneNumber, password);
  });
}

function logout() {
  try {
    localStorage.removeItem('kilimowise_token');
    localStorage.removeItem('kilimowise_farmerId');
    localStorage.removeItem('kilimowise_name');
    localStorage.removeItem('kilimowise_phone');
    localStorage.removeItem('kilimowise_first');
    localStorage.removeItem('kilimowise_last');
    localStorage.removeItem('kilimowise_dob');
    localStorage.removeItem('kilimowise_gender');
    localStorage.removeItem('kilimowise_location');
    localStorage.removeItem('kilimowise_profile');
  } catch (e) { /* ignore */ }
  window.location.href = 'login.html';
}

function isLoggedIn() {
  return !!localStorage.getItem('kilimowise_token') && !!localStorage.getItem('kilimowise_farmerId');
}

function getFarmerId() {
  var id = localStorage.getItem('kilimowise_farmerId');
  return id ? Number(id) : null;
}

function getFarmerName() {
  return localStorage.getItem('kilimowise_name') || '';
}

function getToken() {
  return localStorage.getItem('kilimowise_token');
}

function redirectIfNotLoggedIn() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}
