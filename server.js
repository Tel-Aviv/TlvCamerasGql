import express from 'express';
import path from 'path';
import cors from 'cors';

import { schema } from './schemas/schema';

const graphQLServer = express();

graphQLServer.use('*', cors({
                    credentials: true,
                    origin: '*'
                  })
       );

const PORT = process.env.port || 3002;

graphQLServer.use('/graphiql',
      graphiqlExpress({
          endpointURL: '/graphql',
          subscriptionsEndpoint: `ws://185.10.2.55:${PORT}/subscriptions`
      })
);

const websocketServer = createServer(graphQLServer);

websocketServer.listen(PORT, () => {
    console.log(`Websocket Server is listening on: ${PORT}`);
  }
