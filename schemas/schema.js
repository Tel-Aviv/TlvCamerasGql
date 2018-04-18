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
  motorcycles: Int
  pedestrians: Int

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
  streamUrl: String
  lat: Float
  lng: Float
}

type Devices implements Node {
  id: ID!
  list: [Device]
}

type Query {

    node(
      id: ID!
    ): Node

    camera(cameraId: Int!, beforeHours: Int): Camera
    traffic(cameraId: Int!, beforeHours: Int): Series
    #devices: [Device]

    devices: Devices
}

type Subscription {
    newObservation(cameraId: Int!): Observation
}

`;

const logger = { log: (e) => console.log(e) }

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  logger
});
export { schema };
