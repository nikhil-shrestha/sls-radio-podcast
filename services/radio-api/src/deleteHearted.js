import createError from 'http-errors';
import validator from '@middy/validator';

import dynamoDb from '../../common/dynamodb-lib';
import commonMiddleware from '../../common/middleware';
import deleteHistorySchema from '../schemas/deleteHistorySchema';

async function deleteHearted(event, context) {
  const { uid, stationid } = event.body;

  const params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      PK: `UID#${uid}`,
      SK: `#HEARTED#RADIO#${stationid}`,
    },
  };

  try {
    await dynamoDb.delete(params);
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      stationuuid: stationid,
    }),
  };
}

export const handler = commonMiddleware(deleteHearted).use(
  validator({ inputSchema: deleteHistorySchema })
);
