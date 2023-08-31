import { Client } from 'pg';

const client = new Client({
    host: 'localhost',
    user: 'postgres',
    port: 3002,
    password: 'rootUser',
    database: 'brooklynpubliclibrary'
});

client.connect()
  .then(() => console.log('Database connected!'))
  .catch(err => console.log('Database connection error: ', err));

export default client;
