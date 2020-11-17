import createError from 'http-errors';

import dynamoDb from '../../common/dynamodb-lib';
import commonMiddleware from '../../common/middleware';

async function listHistory(event, context) {
  const { uid } = event.pathParameters;

  const params = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: '#PK = :PK and begins_with(#SK, :SK)',
    ExpressionAttributeNames: {
      '#PK': 'PK',
      '#SK': 'SK',
    },
    ExpressionAttributeValues: {
      ':PK': `UID#${uid}`,
      ':SK': '#HISTORY#RADIO#',
    },
  };

  let history;

  try {
    const result = await dynamoDb.query(params);
    history = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(history),
  };
}

export const handler = commonMiddleware(listHistory);
