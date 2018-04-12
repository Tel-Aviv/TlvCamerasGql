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

    cars: Int
    bikes: Int
    motorcycles: Int
    beforeHours: Int
}

type Query {

    node(
      id: ID!
    ): Node

    camera: Camera

}

`;
