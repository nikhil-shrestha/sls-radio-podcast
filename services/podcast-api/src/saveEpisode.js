import url from 'url';
import _ from 'lodash';

import { httpGet } from '../lib/httpGet';
import dynamoDb from '../../common/dynamodb-lib';

// save tune-in radio
async function listShowsByGenre() {
  const params = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: '#PK = :PK and begins_with(#SK, :SK)',
    ExpressionAttributeNames: {
      '#PK': 'PK',
      '#SK': 'SK',
    },
    ExpressionAttributeValues: {
      ':PK': `PODCAST#Show`,
      ':SK': `#METADATA#`,
    },
  };

  let scanResults = [];
  let items;
  let count = 0;

  do {
    items = await dynamoDb.query(params);
    items.Items.forEach((itemdata) => {
      console.log('Item ::', ++count, JSON.stringify(itemdata));
      scanResults.push(itemdata);
    });

    if (count <= 500) {
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } else {
      items.LastEvaluatedKey = undefined;
    }
  } while (typeof items.LastEvaluatedKey != 'undefined');

  return scanResults;
}

// save tune-in radio
async function saveTopics(id) {
  let responses;
  try {
    responses = await httpGet({
      host: 'opml.radiotime.com',
      path: `/Tune.ashx?c=pbrowse&id=${id}&filter=p:topic&render=json`,
      method: 'GET',
    });
  } catch (error) {
    throw new Error(error);
  }
  console.log(JSON.stringify(responses));

  const itemsArray = [];
  if (responses.body.length) {
    const mainTopic = responses.body.filter((item) => item.key === 'topics')[0];

    const topicList = mainTopic.children.filter((val) => val.item === 'topic');
    console.log(JSON.stringify(topicList));

    for (const item of topicList) {
      const createdAt = new Date().toISOString();
      const obj = {
        PutRequest: {
          Item: {
            PK: `PODCAST#Topic`,
            SK: `#METADATA#${item['guide_id'] ?? item['now_playing_id']}`,
            filter: `#show#${id}`,
            id: item['guide_id'] ?? item['now_playing_id'],
            show_id: id,
            createdAt,
            ...item,
          },
        },
      };
      itemsArray.push(obj);
    }
  }

  console.log({ length: itemsArray.length });
  console.log(JSON.stringify(itemsArray));

  const batches = _.chunk(itemsArray, 20).map((batch) => {
    const params = {
      RequestItems: {
        [`${process.env.TABLE_NAME}`]: batch,
      },
    };

    return dynamoDb.batchWrite(params);
  });

  const finalrslt = await Promise.all(batches);
  console.log({ finalrslt });

  return true;
}

export const handler = async () => {
  const array = await listShowsByGenre();
  console.log({ length: array.length });

  const newArr = array.slice(0, 500);

  for (let item of newArr) {
    const episodeURL = item.URL;
    const queryObject = url.parse(episodeURL, true).query;
    console.log('queryObject>>>');
    await saveTopics(queryObject.id);
  }
};
