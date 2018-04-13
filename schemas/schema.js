import {
  makeExecutableSchema,
} from 'graphql-tools';

import { resolvers } from './resolvers.js';

const typeDefs = `

scalar Date

interface Node {
  id: ID!
}

type Camera implements Node {
    id: ID!

    cameraId: Int!

    cars: Int
    bikes: Int
    motorcyrcles: Int
}

type Observation implements Node {
  id: ID!

  cars: Int
  bikes: Int
  motorcyrcles: Int
}

type Query {

    node(
      id: ID!
    ): Node

    camera(Id: Int!, beforeHours: Int): Camera
}

type Subscription {
    newObservtion(cameraId: Int): Observation
}

`;

const logger = { log: (e) => console.log(e) }

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  logger
});
export { schema };
