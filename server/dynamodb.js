const AWS = require('aws-sdk');
AWS.config.update({
  region: 'your-region', // e.g., 'us-east-1'
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const docClient = new AWS.DynamoDB.DocumentClient();
module.exports = docClient;
