import url from 'url';
import _ from 'lodash';

import { httpGet } from '../lib/httpGet';
import dynamoDb from '../../common/dynamodb-lib';

// save tune-in radio
async function getNextShows({
  id, // genre_id
  offset,
  filter,
  list,
}) {
  let responses;
  let hasMoreShow = false;
  try {
    responses = await httpGet({
      host: 'opml.radiotime.com',
      path: `/Browse.ashx?offset=${offset}&id=${id}&filter=${filter}&render=json`,
      method: 'GET',
    });
  } catch (error) {
    throw new Error(error);
  }

  console.log(JSON.stringify(responses));

  if (responses.body.length) {
    const mainShow = responses.body;

    const showList = mainShow.filter((val) => val.item === 'show');
    console.log('showList>>>');
    console.log(JSON.stringify(showList));

    const moreShow = mainShow.filter((val) => val.key === 'nextShows');
    console.log('moreShow>>>');
    console.log(JSON.stringify(moreShow));

    if (moreShow.length) {
      hasMoreShow = true;
    }

    for (const item of showList) {
      const createdAt = new Date().toISOString();
      const obj = {
        PutRequest: {
          Item: {
            PK: `PODCAST#Show`,
            SK: `#METADATA#${item['guide_id'] ?? item['preset_id']}`,
            filter: `#GENRE#${id}`,
            id: item['guide_id'] ?? item['preset_id'],
            createdAt,
            ...item,
          },
        },
      };
      list.push(obj);
    }

    if (hasMoreShow) {
      const showURL = moreShow[0].URL;
      const queryObject = url.parse(showURL, true).query;
      console.log('queryObject>>>');
      console.log(JSON.stringify(queryObject));

      if (+queryObject.offset <= 500) {
        await getNextShows({
          offset: queryObject.offset,
          id,
          filter: queryObject.filter,
          list,
        });
        return;
      }

      return;
    } else {
      return;
    }
  }

  return;
}

// save tune-in radio
async function getAllShows(id) {
  let responses;
  try {
    responses = await httpGet({
      host: 'opml.radiotime.com',
      path: `/Browse.ashx?id=${id}&filter=p:topic&render=json`,
      method: 'GET',
    });
  } catch (error) {
    throw new Error(error);
  }
  console.log(JSON.stringify(responses));

  const itemsArray = [];
  if (responses.body.length) {
    const mainShow = responses.body.filter((item) => item.key === 'shows')[0];

    const showList = mainShow.children.filter((val) => val.item === 'show');
    console.log(JSON.stringify(showList));

    const moreShow = mainShow.children.filter((val) => val.key === 'nextShows');
    console.log(JSON.stringify(moreShow));

    let hasMoreShow = false;
    if (moreShow.length) {
      hasMoreShow = true;
    }

    for (const item of showList) {
      const createdAt = new Date().toISOString();
      const obj = {
        PutRequest: {
          Item: {
            PK: `PODCAST#Show`,
            SK: `#METADATA#${item['guide_id'] ?? item['preset_id']}`,
            filter: `#GENRE#${id}`,
            id: item['guide_id'] ?? item['preset_id'],
            createdAt,
            ...item,
          },
        },
      };
      itemsArray.push(obj);
    }

    if (hasMoreShow) {
      const showURL = moreShow[0].URL;
      const queryObject = url.parse(showURL, true).query;
      console.log('queryObject>>>');
      console.log(JSON.stringify(queryObject));

      const moreShowList = await getNextShows({
        offset: queryObject.offset,
        id,
        filter: queryObject.filter,
        list: itemsArray,
      });
      console.log(JSON.stringify(moreShowList));
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
  await getAllShows('c100000655');
};
