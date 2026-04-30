
const { ipcMain } = require('electron');
const UserService = require('../services/userService.cjs');

ipcMain.handle('user:create', async (event, user) => {
	return new Promise((resolve) => {
		UserService.createUser(user, (err) => {
			if (err) resolve({ success: false, message: err.message });
			else resolve({ success: true });
		});
	});
});

ipcMain.handle('user:login', async (event, login, password) => {
	return new Promise((resolve) => {
		UserService.authenticate(login, password, (err, result) => {
			if (err) resolve({ success: false, message: err.message });
			else resolve(result); // result est déjà au format { success, user, message }
		});
	});
});

ipcMain.handle('user:getAll', async () => {
	return new Promise((resolve) => {
		UserService.getAllUsers((err, rows) => {
			if (err) resolve({ success: false, message: err.message });
			else resolve({ success: true, data: rows });
		});
	});
});

ipcMain.handle('user:deactivate', async (event, id) => {
	return new Promise((resolve) => {
		UserService.deactivateUser(id, (err) => {
			if (err) resolve({ success: false, message: err.message });
			else resolve({ success: true });
		});
	});
});

ipcMain.handle('user:logAction', async (event, user_id, action) => {
	return new Promise((resolve) => {
		UserService.logAction(user_id, action, (err) => {
			if (err) resolve({ success: false, message: err.message });
			else resolve({ success: true });
		});
	});
});
