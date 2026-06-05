var API_URL = window.APP_CONFIG ? window.APP_CONFIG.GRAPHQL_URL : 'http://localhost:8080/graphql';

function graphqlRequest(query, variables) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query, variables: variables || {} })
  }).then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (json) {
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  });
}

function login(email, password) {
  return graphqlRequest(
    'mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token farmer { id name email } } }',
    { email: email, password: password }
  ).then(function (data) { return data.login; });
}

function registerFarmer(name, email, password) {
  return graphqlRequest(
    'mutation Register($name: String!, $email: String!, $password: String!) { registerFarmer(name: $name, email: $email, password: $password) { token farmer { id name email } } }',
    { name: name, email: email, password: password }
  ).then(function (data) { return data.registerFarmer; });
}

function analyzeProblem(input, type) {
  return graphqlRequest(
    'mutation Analyze($input: String!, $type: String!) { analyzeProblem(input: $input, type: $type) { diagnosis confidence solution remedies { name estimatedPrice amountNeeded availabilityLocation } generatedAt } }',
    { input: input, type: type }
  ).then(function (data) { return data.analyzeProblem; });
}

function addExpense(farmerId, category, amount, description) {
  return graphqlRequest(
    'mutation AddExpense($farmerId: ID!, $category: String!, $amount: Float!, $description: String) { addExpense(farmerId: $farmerId, category: $category, amount: $amount, description: $description) { id category amount description createdAt } }',
    { farmerId: farmerId, category: category, amount: amount, description: description }
  ).then(function (data) { return data.addExpense; });
}

function getExpenses(farmerId) {
  return graphqlRequest(
    'query GetExpenses($farmerId: ID!) { expenses(farmerId: $farmerId) { id category amount description createdAt } }',
    { farmerId: farmerId }
  ).then(function (data) { return data.expenses; });
}

function getInsights() {
  return graphqlRequest(
    'query GetInsights { latestTips { id content } marketInsights { id title content } cropSeasons { id crop season description } }'
  ).then(function (data) {
    return {
      tips: data.latestTips || [],
      market: data.marketInsights || [],
      seasons: data.cropSeasons || []
    };
  });
}
