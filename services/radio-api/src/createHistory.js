import createError from 'http-errors';
import validator from '@middy/validator';

import dynamoDb from '../../common/dynamodb-lib';
import commonMiddleware from '../../common/middleware';
import createHistorySchema from '../schemas/createHistorySchema';

async function createHistory(event, context) {
  const {
    uid,
    stationid,
    name,
    url,
    url_resolved,
    countrycode,
    tags,
    favicon,
    ...rest
  } = event.body;

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      PK: `UID#${uid}`,
      SK: `#HISTORY#RADIO#${stationid}`,
      stationuuid: stationid,
      name,
      favicon,
      url,
      url_resolved,
      countrycode,
      tags,
      rest,
    },
  };

  try {
    await dynamoDb.put(params);
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 201,
    body: JSON.stringify(params.Item),
  };
}

export const handler = commonMiddleware(createHistory).use(
  validator({ inputSchema: createHistorySchema })
);
