import express from 'express';
import bodyParser from 'body-parser';
import { graphiqlExpress } from 'graphql-server';
import graphqlHTTP from 'express-graphql';
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
       graphqlHTTP({
                     schema: schema,
                     graphiql: process.env.NODE_ENV === 'development'
                 })
);

const PORT = process.env.port || 3002;

graphQLServer.use('/playground',
                  expressPlayground({
                                      endpoint: '/graphql',
                                      subscriptionEndpoint: `ws://localhost:${PORT}/subscriptions`
                                    })
                );
graphQLServer.use('/graphiql',
      graphiqlExpress({
          endpointURL: '/graphql',
          subscriptionsEndpoint: `ws://185.10.2.55:${PORT}/subscriptions`
      })
);

const websocketServer = createServer(graphQLServer);

websocketServer.listen(PORT, () => {
    console.log(`Websocket Server is listening on: ${PORT}`);

    // Set up the WebSocket for handling GraphQL subscriptions
    new SubscriptionServer({
      execute,
      subscribe,
      schema
    }, {
      server: websocketServer,
      path: '/subscriptions',
    });
  }
);
