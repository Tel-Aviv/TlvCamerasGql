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
    observation: Observation
}

type Observation implements Node {
  id: ID!

  cars: Int
  bikes: Int
  motorcyrcles: Int

  when_observed: Date
}

type Serie implements Node {
  id: ID!

  label: String!
  data: [Int!]!
  ruleId: Int!
}

type Series implements Node {
  id: ID!

  labels: [String!]!
  series: [Serie!]!
}

type Device implements Node {
  id: ID!

  name: String
  cameraId: Int!
  lat: Float
  lng: Float
}

type Query {

    node(
      id: ID!
    ): Node

    camera(cameraId: Int!, beforeHours: Int): Camera
    traffic(cameraId: Int!, beforeHours: Int): Series
    devices: [Device]
}

type Mutation {
  currentCamera(cameraId: Int): Int
}

type Subscription {
    newObservtion: Observation
}

`;

const logger = { log: (e) => console.log(e) }

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  logger
});
export { schema };
