function loginUser(email, password) {
  return login(email, password).then(function (result) {
    localStorage.setItem('kilimowise_token', result.token);
    localStorage.setItem('kilimowise_farmer', JSON.stringify(result.farmer));
    return result;
  });
}

function registerUser(name, email, password) {
  return registerFarmer(name, email, password).then(function (result) {
    localStorage.setItem('kilimowise_token', result.token);
    localStorage.setItem('kilimowise_farmer', JSON.stringify(result.farmer));
    return result;
  });
}

function logout() {
  localStorage.removeItem('kilimowise_token');
  localStorage.removeItem('kilimowise_farmer');
  window.location.href = 'login.html';
}

function isLoggedIn() {
  return !!localStorage.getItem('kilimowise_token');
}

function getFarmer() {
  try {
    return JSON.parse(localStorage.getItem('kilimowise_farmer'));
  } catch (e) {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('kilimowise_token');
}

function redirectIfNotLoggedIn() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}
