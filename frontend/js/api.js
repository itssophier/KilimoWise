var API_URL = window.APP_CONFIG ? window.APP_CONFIG.GRAPHQL_URL : 'http://localhost:9090/graphql';

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

function login(phone, password) {
  return graphqlRequest(
    'mutation Login($input: LoginRequest!) { login(input: $input) { token farmerId name } }',
    { input: { phone: phone, password: password } }
  ).then(function (data) { return data.login; });
}

function registerFarmer(firstName, lastName, phoneNumber, dob, gender, location, password) {
  return graphqlRequest(
    'mutation Register($input: RegisterFarmerInput!) { registerFarmer(input: $input) { id firstName lastName phoneNumber dob age gender location } }',
    { input: { firstName: firstName, lastName: lastName, phoneNumber: phoneNumber, dob: dob, gender: gender, location: location, password: password } }
  ).then(function (data) { return data.registerFarmer; });
}

function analyzeProblem(farmerId, type, description) {
  return graphqlRequest(
    'query Analyze($input: AdvisoryInput!) { analyzeProblem(input: $input) { diagnosis confidence solution remedies { name estimatedPrice amountNeeded availabilityLocation } } }',
    { input: { farmerId: farmerId, type: type, description: description, imageBase64: null } }
  ).then(function (data) { return data.analyzeProblem; });
}

function addExpense(farmerId, category, amount, description) {
  return graphqlRequest(
    'mutation AddExpense($input: ExpensesInput!) { addExpense(input: $input) { id category amount description expenseDate } }',
    { input: { farmerId: farmerId, category: category, amount: amount, description: description, expenseDate: new Date().toISOString().split('T')[0] } }
  ).then(function (data) { return data.addExpense; });
}

function getExpenses(farmerId) {
  return graphqlRequest(
    'query GetExpenses($farmerId: ID!) { getExpense(farmerId: $farmerId) { id category amount description expenseDate } }',
    { farmerId: farmerId }
  ).then(function (data) { return data.getExpense; });
}
