const crypto = require('crypto');
const { db } = require('../db/database.cjs');
const logger = require('./loggingService.cjs');

function hashPassword(password) {
	return crypto.createHash('sha256').update(password).digest('hex');
}

const UserService = {
	createUser: (user, callback) => {
		const sql = `INSERT INTO users (name, login, hash, role, active) VALUES (?, ?, ?, ?, 1)`;
		const params = [user.name, user.login, hashPassword(user.password), user.role];
		db.run(sql, params, function(err) {
			if (err) {
				logger.error("Erreur lors de la création de l'utilisateur", { error: err.message, login: user.login });
				return callback(err);
			}
			logger.info("Nouvel utilisateur créé", { userId: this.lastID, login: user.login, role: user.role });
			callback(null);
		});
	},
	authenticate: (login, password, callback) => {
		const cleanLogin = (login || "").trim().toLowerCase();
		const cleanPassword = (password || "").trim();
		
		if (!cleanLogin || !cleanPassword) {
			return callback(null, { success: false, message: "Identifiant et clé d'accès requis." });
		}

		const sql = `SELECT * FROM users WHERE LOWER(login) = ?`;
		db.get(sql, [cleanLogin], (err, row) => {
			if (err) {
				logger.error("Erreur technique lors de l'authentification", { error: err.message, login: cleanLogin });
				return callback(err);
			}
			
			if (!row) {
				logger.warn("Tentative de connexion échouée: identifiant inconnu", { login: cleanLogin });
				return callback(null, { success: false, message: "Identifiant '" + cleanLogin + "' non reconnu." });
			}
			
			if (row.active === 0) {
				logger.warn("Tentative de connexion sur un compte désactivé", { login: cleanLogin });
				return callback(null, { success: false, message: "Ce compte a été désactivé. Contactez l'administrateur." });
			}

			const inputHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
			
			if (row.hash !== inputHash) {
				logger.warn("Tentative de connexion échouée: mot de passe incorrect", { login: cleanLogin });
				return callback(null, { success: false, message: "Clé d'accès incorrecte." });
			}
			
			logger.info("Utilisateur connecté avec succès", { userId: row.id, login: cleanLogin, role: row.role });
			callback(null, { 
				success: true, 
				user: { id: row.id, name: row.name, role: row.role } 
			});
		});
	},
	getAllUsers: (callback) => {
		db.all('SELECT id, name, login, role, active FROM users', [], callback);
	},
	deactivateUser: (id, callback) => {
		db.run('UPDATE users SET active = 0 WHERE id = ?', [id], function(err) {
			if (err) {
				logger.error("Erreur lors de la désactivation de l'utilisateur", { error: err.message, userId: id });
				return callback(err);
			}
			logger.warn("Utilisateur désactivé", { userId: id });
			callback(null);
		});
	},
	logAction: (user_id, action, callback) => {
		db.run('INSERT INTO user_logs (user_id, timestamp, action) VALUES (?, datetime("now"), ?)', [user_id, action], callback);
	}
};

module.exports = UserService;
