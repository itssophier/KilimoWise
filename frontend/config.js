window.APP_CONFIG = {
  GRAPHQL_URL: (function () {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
      return 'http://localhost:9090/graphql';
    }
    return 'https://kilimowise-backend.onrender.com/graphql';
  })()
};
