const schema = {
  properties: {
    pathParameters: {
      type: 'object',
      properties: {
        uid: {
          type: 'string',
        },
      },
    },
  },
  required: ['pathParameters'],
};

export default schema;
