import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { ApolloEngine } from 'apollo-engine';

import { createServer } from 'http';
import path from 'path';
import cors from 'cors';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { expressPlayground } from 'graphql-playground-middleware';

import { schema } from './schemas/schema';

const graphQLServer = express();

graphQLServer.use('*', cors({
                    credentials: true,
                    origin: '*'
                  })
       );

graphQLServer.use('/graphql',
       bodyParser.json(),
       graphqlExpress({
                     schema: schema,
                     //tracing: true,
                     cacheControl: true,
                     graphiql: process.env.NODE_ENV === 'development'
                 })
);

const PORT = process.env.port || 3002;

graphQLServer.use('/graphiql',
      graphiqlExpress({
          endpointURL: '/graphql',
          subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
      })
);

graphQLServer.use('/playground',
                  expressPlayground({
                                      endpoint: '/graphql',
                                      subscriptionEndpoint: `ws://localhost:${PORT}/subscriptions`
                                    })
                );

const engine = new ApolloEngine({
  apiKey: 'service:oleg_kleiman_apollo:1DEVMvT-6k4twxu4spuKMA'
});

const websocketServer = createServer(graphQLServer);

engine.listen({
  port: PORT,
  //expressApp: graphQLServer,
  httpServer: websocketServer,
}, () => {
  console.log(`ApolloEngine is listening on port ${PORT}`);

      new SubscriptionServer({
        execute,
        subscribe,
        schema
      }, {
        server: websocketServer,
        path: '/subscriptions',
      });
});
