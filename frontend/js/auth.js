function loginUser(phone, password) {
  return login(phone, password).then(function (result) {
    localStorage.setItem('kilimowise_token', result.token);
    localStorage.setItem('kilimowise_farmerId', String(result.farmerId));
    localStorage.setItem('kilimowise_name', result.name || '');
    return result;
  });
}

function registerUser(firstName, lastName, phoneNumber, dob, gender, location, password) {
  return registerFarmer(firstName, lastName, phoneNumber, dob, gender, location, password).then(function () {
    return loginUser(phoneNumber, password);
  });
}

function logout() {
  localStorage.removeItem('kilimowise_token');
  localStorage.removeItem('kilimowise_farmerId');
  localStorage.removeItem('kilimowise_name');
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
