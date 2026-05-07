const bcrypt = require('bcryptjs');
const { db } = require('../db/database.cjs');
const logger = require('./loggingService.cjs');

async function hashPassword(password) {
	// Use bcryptjs with salt rounds = 10 for security
	return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
	return await bcrypt.compare(password, hash);
}

const UserService = {
	createUser: async (user, callback) => {
		try {
			const hashedPassword = await hashPassword(user.password);
			const sql = `INSERT INTO users (name, login, hash, role, active) VALUES (?, ?, ?, ?, 1)`;
			const params = [user.name, user.login, hashedPassword, user.role];
			db.run(sql, params, function (err) {
				if (err) {
					logger.error("Erreur lors de la création de l'utilisateur", { error: err.message, login: user.login });
					return callback(err);
				}
				logger.info("Nouvel utilisateur créé", { userId: this.lastID, login: user.login, role: user.role });
				callback(null);
			});
		} catch (err) {
			logger.error("Erreur hachage mot de passe", { error: err.message });
			callback(err);
		}
	},
	authenticate: async (login, password, callback) => {
		const cleanLogin = (login || "").trim().toLowerCase();
		const cleanPassword = (password || "").trim();

		if (!cleanLogin || !cleanPassword) {
			return callback(null, { success: false, message: "Identifiant et clé d'accès requis." });
		}

		const sql = `SELECT * FROM users WHERE LOWER(login) = ?`;
		db.get(sql, [cleanLogin], async (err, row) => {
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

			try {
				const passwordMatch = await comparePassword(cleanPassword, row.hash);

				if (!passwordMatch) {
					logger.warn("Tentative de connexion échouée: mot de passe incorrect", { login: cleanLogin });
					return callback(null, { success: false, message: "Clé d'accès incorrecte." });
				}

				logger.info("Utilisateur connecté avec succès", { userId: row.id, login: cleanLogin, role: row.role });
				callback(null, {
					success: true,
					user: { id: row.id, name: row.name, role: row.role }
				});
			} catch (hashErr) {
				logger.error("Erreur comparaison mot de passe", { error: hashErr.message });
				callback(hashErr);
			}
		});
	},
	getAllUsers: (callback) => {
		db.all('SELECT id, name, login, role, active FROM users', [], callback);
	},
	deactivateUser: (id, callback) => {
		db.run('UPDATE users SET active = 0 WHERE id = ?', [id], function (err) {
			if (err) {
				logger.error("Erreur lors de la désactivation de l'utilisateur", { error: err.message, userId: id });
				return callback(err);
			}
			logger.warn("Utilisateur désactivé", { userId: id });
			callback(null);
		});
	},
	updatePassword: async (userId, newPassword, callback) => {
		try {
			const hashedPassword = await hashPassword(newPassword);
			db.run('UPDATE users SET hash = ? WHERE id = ?', [hashedPassword, userId], function (err) {
				if (err) {
					logger.error("Erreur mise à jour mot de passe", { error: err.message, userId });
					return callback(err);
				}
				logger.info("Mot de passe mis à jour", { userId });
				callback(null);
			});
		} catch (err) {
			logger.error("Erreur hachage nouveau mot de passe", { error: err.message });
			callback(err);
		}
	},
	logAction: (user_id, action, callback) => {
		db.run('INSERT INTO user_logs (user_id, timestamp, action) VALUES (?, datetime("now"), ?)', [user_id, action], callback);
	}
};

module.exports = UserService;
