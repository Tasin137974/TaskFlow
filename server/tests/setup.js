const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('../src/models/User');
require('../src/models/Task');

let mongod;

beforeAll(async () => {
  // By default an in-memory MongoDB is downloaded and started. Set TEST_MONGO_URI to use an existing server instead.
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // build unique indexes
});

afterEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
