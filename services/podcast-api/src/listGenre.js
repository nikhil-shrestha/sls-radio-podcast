import createError from 'http-errors';

import dynamoDb from '../../common/libs/dynamodb-lib';

export const main = async () => {
  const params = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: '#PK = :PK and begins_with(#SK, :SK)',
    ExpressionAttributeNames: {
      '#PK': 'PK',
      '#SK': 'SK',
    },
    ExpressionAttributeValues: {
      ':PK': `PODCAST#Genre`,
      ':SK': `#METADATA#`,
    },
  };

  let genres;
  try {
    const result = await dynamoDb.query(params);
    genres = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(genres),
  };
};
