import dynamoDb from '../../common/dynamodb-lib';

import data from './data.json';

// save podcast genre...
export const handler = async () => {
  const itemsArray = [];
  const responses = data.children;

  for (const obj of responses) {
    const createdAt = new Date().toISOString();
    const item = {
      PutRequest: {
        Item: {
          PK: `PODCAST#Genre`,
          SK: `#METADATA#${obj.id}`,
          id: obj.id,
          text: obj.title,
          createdAt,
        },
      },
    };
    if (item) {
      itemsArray.push(item);
    }
  }

  if (itemsArray.length) {
    const params = {
      RequestItems: {
        [`${process.env.TABLE_NAME}`]: itemsArray,
      },
    };
    await dynamoDb.batchWrite(params);
    console.log('Added ' + itemsArray.length + ' items to DynamoDB');
  }

  return true;
};
