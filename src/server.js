const path = require('node:path');
const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);
const databasePath = process.env.DATABASE_PATH ||
  path.resolve('data', 'hrm.sqlite');
const uploadsDirectory = process.env.UPLOADS_DIRECTORY ||
  path.resolve('data', 'employee-files');
const app = createApp({ databasePath, uploadsDirectory });

const server = app.listen(port, () => {
  console.log(`HRM backend listening on port ${port}`);
});

function closeServer() {
  server.close(() => {
    app.locals.database.close();
  });
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
