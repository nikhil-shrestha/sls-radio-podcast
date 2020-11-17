import createError from 'http-errors';
import validator from '@middy/validator';

import dynamoDb from '../../common/dynamodb-lib';
import commonMiddleware from '../../common/middleware';
import createHistorySchema from '../schemas/createHistorySchema';

async function createHearted(event, context) {
  console.log(JSON.stringify(event.body));
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
      SK: `#HEARTED#RADIO#${stationid}`,
      stationuuid: stationid,
      name,
      favicon,
      url,
      url_resolved,
      countrycode,
      tags,
      ...rest,
    },
  };

  console.log(JSON.stringify(params));

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

export const handler = commonMiddleware(createHearted).use(
  validator({ inputSchema: createHistorySchema })
);
