const schema = {
  properties: {
    body: {
      type: 'object',
      properties: {
        uid: {
          type: 'string',
        },
        stationid: {
          type: 'string',
        },
      },
      required: ['uid', 'stationid'],
    },
  },
  required: ['body'],
};

export default schema;
