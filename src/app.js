const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const { createDatabase } = require('./database');
const { createEmployeeRouter } = require('./employee/router');
const { createOrganizationUnitRouter } = require('./organization-unit/router');
const { createUserAccountRouter } = require('./user-account/router');
const { createSalaryCoefficientRouter } = require('./salary-coefficient/router');

function createApp(options = {}) {
  const dataDirectory = options.dataDirectory || path.resolve('data');
  const databasePath = options.databasePath || path.join(dataDirectory, 'hrm.sqlite');
  const uploadsDirectory = options.uploadsDirectory ||
    path.join(dataDirectory, 'employee-files');

  fs.mkdirSync(uploadsDirectory, { recursive: true });
  const database = options.database || createDatabase(databasePath);
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.get('/health', (request, response) => {
    response.json({ status: 'ok' });
  });
  app.use('/api/employees', createEmployeeRouter({ database, uploadsDirectory }));
  app.use('/api/organization-units', createOrganizationUnitRouter({ database }));
  app.use('/api/user-accounts', createUserAccountRouter({ database }));
  app.use('/api/salary-coefficients', createSalaryCoefficientRouter({ database }));
  app.use((error, request, response, next) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      const isPortrait = error.field === 'portrait';
      const message = tooLarge && isPortrait
        ? 'Dung lượng ảnh phải nhỏ hơn 5MB.'
        : tooLarge
          ? 'Dung lượng file phải nhỏ hơn 10MB.'
          : 'Không thể xử lý file tải lên.';
      response.status(400).json({
        message,
        errors: [{
          field: error.field || 'file',
          message
        }]
      });
      return;
    }
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      response.status(400).json({
        message: 'Dữ liệu JSON không hợp lệ.',
        errors: [{ field: 'body', message: 'Dữ liệu JSON không hợp lệ.' }]
      });
      return;
    }
    next(error);
  });
  app.use((error, request, response, next) => {
    console.error(error);
    response.status(500).json({ message: 'Lỗi hệ thống khi xử lý yêu cầu.' });
  });

  app.locals.database = database;
  return app;
}

module.exports = { createApp };
