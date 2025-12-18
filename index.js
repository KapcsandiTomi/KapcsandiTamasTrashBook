import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const app = express();
app.use(express.json());
app.use(cors());

// Környezeti változók (átmenetileg itt definiálva)
const JWT_SECRET = "titkos_kulcs_nehez_string"; // Használj valós alkalmazásban környezeti változót
const JWT_EXPIRY = "7d";

// Adatbázis kapcsolat javítása
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "trashbook",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Köztes szoftver: Token ellenőrzés (át lett írva)
function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: "Hozzáférés megtagadva. Hiányzó token." });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Érvénytelen token." });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        res.status(500).json({ message: "Szerver hiba történt." });
    }
}

// ADMIN jogosultság ellenőrzés
function adminAuth(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin jogosultság szükséges." });
    }
    next();
}

// REGISZTRÁCIÓ - JAVÍTVA
app.post("/register", async (req, res) => {
    try {
        const { username, email, password, address, phone } = req.body;

        // Validáció
        if (!username || !email || !password || !address || !phone) {
            return res.status(400).json({ 
                message: "Minden mező kitöltése kötelező!" 
            });
        }

        if (typeof username !== "string" || username.length < 3) {
            return res.status(400).json({ 
                message: "A felhasználónév legalább 3 karakter hosszú legyen!" 
            });
        }

        if (typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({ 
                message: "Érvénytelen email cím!" 
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ 
                message: "A jelszó legalább 6 karakter hosszú legyen!" 
            });
        }

        if (typeof address !== "string" || address.trim().length === 0) {
            return res.status(400).json({ 
                message: "Érvénytelen cím!" 
            });
        }

        const phoneNum = Number(phone);
        if (isNaN(phoneNum) || phone.toString().length < 6) {
            return res.status(400).json({ 
                message: "Érvénytelen telefonszám!" 
            });
        }

        // Ellenőrizzük, hogy a felhasználónév vagy email már létezik-e
        const [existingUser] = await pool.query(
            "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ 
                message: "A felhasználónév vagy email cím már foglalt!" 
            });
        }

        // Jelszó hash-elése
        const hashedPassword = await bcrypt.hash(password, 12);

        // Felhasználó létrehozása (alapértelmezetten 'user' role)
        const [result] = await pool.query(
            "INSERT INTO users (username, email, password, address, phone, role) VALUES (?, ?, ?, ?, ?, 'user')",
            [username, email, hashedPassword, address, phoneNum]
        );

        if (result.affectedRows < 1) {
            throw new Error("Hiba történt a felhasználó létrehozásakor");
        }

        res.status(201).json({ 
            message: "Sikeres regisztráció! Most már bejelentkezhetsz." 
        });

    } catch (error) {
        console.error("Regisztrációs hiba:", error);
        
        // Adatbázis egyedi megsértés ellenőrzése
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                message: "A felhasználónév vagy email cím már létezik!" 
            });
        }
        
        res.status(500).json({ 
            message: "Szerver hiba történt a regisztráció során." 
        });
    }
});

// BEJELENTKEZÉS - JAVÍTVA
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validáció
        if (!username || !password) {
            return res.status(400).json({ 
                message: "Felhasználónév és jelszó megadása kötelező!" 
            });
        }

        if (typeof username !== "string" || typeof password !== "string") {
            return res.status(400).json({ 
                message: "Érvénytelen bemeneti adatok!" 
            });
        }

        // Felhasználó keresése
        const [users] = await pool.query(
            "SELECT * FROM users WHERE username = ? LIMIT 1",
            [username]
        );

        if (users.length !== 1) {
            return res.status(401).json({ 
                message: "Hibás felhasználónév vagy jelszó!" 
            });
        }

        const user = users[0];

        // Jelszó ellenőrzése
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: "Hibás felhasználónév vagy jelszó!" 
            });
        }

        // Token generálása
        const token = jwt.sign(
            { 
                _id: user.id, 
                username: user.username,
                email: user.email,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            message: "Sikeres bejelentkezés!",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("Bejelentkezési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt a bejelentkezés során." 
        });
    }
});

// JELSZÓ VÁLTOZTATÁS - JAVÍTVA
app.put("/password", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: "Email és új jelszó megadása kötelező!" 
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ 
                message: "A jelszó legalább 6 karakter hosszú legyen!" 
            });
        }

        // Ellenőrizzük, hogy létezik-e a felhasználó
        const [userCheck] = await pool.query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ 
                message: "Nincs regisztrálva felhasználó ezzel az email címmel." 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            "UPDATE users SET password = ? WHERE email = ?",
            [hashedPassword, email]
        );

        if (result.affectedRows < 1) {
            throw new Error("Hiba történt a jelszó frissítésekor");
        }

        res.json({ 
            message: "Sikeres jelszóváltoztatás! Most már bejelentkezhetsz az új jelszóval." 
        });

    } catch (error) {
        console.error("Jelszó változtatási hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// PROFIL BETÖLTÉSE - JAVÍTVA
app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;

        const [result] = await pool.query(
            "SELECT id, username, email, address, phone, role FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (result.length === 0) {
            return res.status(404).json({ 
                message: "Felhasználó nem található!" 
            });
        }

        res.json({
            message: "Sikeres lekérdezés",
            data: result[0]
        });

    } catch (error) {
        console.error("Profil lekérdezési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// PROFIL FRISSÍTÉSE - JAVÍTVA
app.put("/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { username, email, address, phone } = req.body;

        // Validáció
        if (!username || !email || !address || !phone) {
            return res.status(400).json({ 
                message: "Minden mező kitöltése kötelező!" 
            });
        }

        if (typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({ 
                message: "Érvénytelen email cím!" 
            });
        }

        const phoneNum = Number(phone);
        if (isNaN(phoneNum) || phone.toString().length < 6) {
            return res.status(400).json({ 
                message: "Érvénytelen telefonszám!" 
            });
        }

        // Ellenőrizzük, hogy az email már foglalt-e (más felhasználó által)
        const [emailCheck] = await pool.query(
            "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
            [email, userId]
        );

        if (emailCheck.length > 0) {
            return res.status(409).json({ 
                message: "Ez az email cím már foglalt!" 
            });
        }

        // Frissítés
        const [result] = await pool.query(
            "UPDATE users SET username = ?, email = ?, address = ?, phone = ? WHERE id = ?",
            [username, email, address, phoneNum, userId]
        );

        if (result.affectedRows < 1) {
            return res.status(404).json({ 
                message: "Felhasználó nem található!" 
            });
        }

        // Új token generálása az új adatokkal
        const newToken = jwt.sign(
            { 
                _id: userId, 
                username: username,
                email: email,
                role: req.user.role 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            message: "Sikeresen módosította a profilját!",
            token: newToken
        });

    } catch (error) {
        console.error("Profil frissítési hiba:", error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                message: "Ez az email cím már foglalt!" 
            });
        }
        
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// TERMÉKEK LISTÁZÁSA
app.get("/products", async (req, res) => {
    try {
        const [products] = await pool.query(
            "SELECT * FROM products WHERE quantity > 0 ORDER BY name"
        );
        
        res.json({
            message: "Sikeres lekérdezés",
            data: products,
            count: products.length
        });

    } catch (error) {
        console.error("Termékek lekérdezési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// RENDELÉS LEADÁSA - JAVÍTVA
app.post("/orders", authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ 
                message: "Termék ID megadása kötelező!" 
            });
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            return res.status(400).json({ 
                message: "Érvénytelen mennyiség!" 
            });
        }

        // Ellenőrizzük, hogy a termék létezik és van elég készleten
        const [productCheck] = await pool.query(
            "SELECT id, name, quantity, price FROM products WHERE id = ? LIMIT 1",
            [productId]
        );

        if (productCheck.length === 0) {
            return res.status(404).json({ 
                message: "Termék nem található!" 
            });
        }

        const product = productCheck[0];
        if (product.quantity < qty) {
            return res.status(400).json({ 
                message: `Nincs elég készleten! Csak ${product.quantity} db érhető el.` 
            });
        }

        // Tranzakció indítása a konzisztencia érdekében
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Rendelés létrehozása
            const [orderResult] = await connection.query(
                "INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)",
                [userId, productId, qty, product.price * qty]
            );

            if (orderResult.affectedRows < 1) {
                throw new Error("Hiba történt a rendelés létrehozásakor");
            }

            // Készlet frissítése
            await connection.query(
                "UPDATE products SET quantity = quantity - ? WHERE id = ?",
                [qty, productId]
            );

            await connection.commit();

            res.status(201).json({
                message: "Sikeres rendelés!",
                orderId: orderResult.insertId,
                product: product.name,
                quantity: qty,
                total: product.price * qty
            });

        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Rendelési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt a rendelés során." 
        });
    }
});

// RENDELÉSEK LISTÁZÁSA - JAVÍTVA
app.get("/orders", authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;

        const [orders] = await pool.query(
            `SELECT 
                o.id, 
                o.quantity, 
                o.total_price, 
                o.order_date,
                p.name, 
                p.description, 
                p.price
             FROM orders o
             JOIN products p ON o.product_id = p.id
             WHERE o.user_id = ?
             ORDER BY o.order_date DESC`,
            [userId]
        );

        res.json({
            message: "Sikeres lekérdezés",
            data: orders,
            count: orders.length
        });

    } catch (error) {
        console.error("Rendelések lekérdezési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// RENDELÉS TÖRLÉSE - JAVÍTVA
app.delete("/orders/:id", authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.id;

        if (!orderId) {
            return res.status(400).json({ 
                message: "Rendelés ID megadása kötelező!" 
            });
        }

        // Először lekérjük a rendelést a készlet visszaállításához
        const [orderCheck] = await pool.query(
            "SELECT product_id, quantity FROM orders WHERE id = ? AND user_id = ? LIMIT 1",
            [orderId, userId]
        );

        if (orderCheck.length === 0) {
            return res.status(404).json({ 
                message: "Rendelés nem található!" 
            });
        }

        const { product_id, quantity } = orderCheck[0];

        // Tranzakció indítása
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Rendelés törlése
            const [deleteResult] = await connection.query(
                "DELETE FROM orders WHERE id = ? AND user_id = ?",
                [orderId, userId]
            );

            if (deleteResult.affectedRows < 1) {
                throw new Error("Hiba történt a rendelés törlésekor");
            }

            // Készlet visszaállítása
            await connection.query(
                "UPDATE products SET quantity = quantity + ? WHERE id = ?",
                [quantity, product_id]
            );

            await connection.commit();

            res.json({
                message: "Sikeres törlés! A készlet visszaállítva.",
                orderId: orderId
            });

        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Rendelés törlési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt a törlés során." 
        });
    }
});

// ADMIN: TERMÉKEK KEZELÉSE
app.get("/admin/products", authenticateToken, adminAuth, async (req, res) => {
    try {
        const [products] = await pool.query(
            "SELECT * FROM products ORDER BY created_at DESC"
        );
        
        res.json({
            message: "Sikeres lekérdezés",
            data: products,
            count: products.length
        });

    } catch (error) {
        console.error("Admin termék lekérdezési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// ADMIN: TERMÉK HOZZÁADÁSA
app.post("/admin/products", authenticateToken, adminAuth, async (req, res) => {
    try {
        const { name, description, quantity, price } = req.body;

        if (!name || !price) {
            return res.status(400).json({ 
                message: "Név és ár megadása kötelező!" 
            });
        }

        const qty = parseInt(quantity) || 0;
        const productPrice = parseFloat(price);

        if (isNaN(productPrice) || productPrice <= 0) {
            return res.status(400).json({ 
                message: "Érvénytelen ár!" 
            });
        }

        const [result] = await pool.query(
            "INSERT INTO products (name, description, quantity, price) VALUES (?, ?, ?, ?)",
            [name, description || "", qty, productPrice]
        );

        if (result.affectedRows < 1) {
            throw new Error("Hiba történt a termék hozzáadásakor");
        }

        res.status(201).json({
            message: "Termék sikeresen hozzáadva!",
            productId: result.insertId
        });

    } catch (error) {
        console.error("Termék hozzáadási hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// ADMIN: FELHASZNÁLÓK LISTÁZÁSA
app.get("/admin/users", authenticateToken, adminAuth, async (req, res) => {
    try {
        const [users] = await pool.query(
            "SELECT id, username, email, address, phone, role, created_at FROM users ORDER BY created_at DESC"
        );

        res.json({
            message: "Sikeres lekérdezés",
            data: users,
            count: users.length
        });

    } catch (error) {
        console.error("Admin felhasználók lekérdezési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// ADMIN: FELHASZNÁLÓ TÖRLÉSE
app.delete("/admin/users/:id", authenticateToken, adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ 
                message: "Felhasználó ID megadása kötelező!" 
            });
        }

        // Admin törlésének megakadályozása
        const [userCheck] = await pool.query(
            "SELECT role FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ 
                message: "Felhasználó nem található!" 
            });
        }

        if (userCheck[0].role === "admin") {
            return res.status(403).json({ 
                message: "Admin felhasználó nem törölhető!" 
            });
        }

        // Felhasználó törlése (a rendelések CASCADE miatt törlődnek)
        const [result] = await pool.query(
            "DELETE FROM users WHERE id = ?",
            [userId]
        );

        if (result.affectedRows < 1) {
            throw new Error("Hiba történt a felhasználó törlésekor");
        }

        res.json({
            message: "Felhasználó sikeresen törölve!",
            userId: userId
        });

    } catch (error) {
        console.error("Felhasználó törlési hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// ADMIN: FELHASZNÁLÓ JOGOSULTSÁG MÓDOSÍTÁSA
app.put("/admin/users/:id/role", authenticateToken, adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ 
                message: "Felhasználó ID és jogosultság megadása kötelező!" 
            });
        }

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ 
                message: "Érvénytelen jogosultság! Csak 'user' vagy 'admin' lehet." 
            });
        }

        const [result] = await pool.query(
            "UPDATE users SET role = ? WHERE id = ?",
            [role, userId]
        );

        if (result.affectedRows < 1) {
            return res.status(404).json({ 
                message: "Felhasználó nem található!" 
            });
        }

        res.json({
            message: `Felhasználó jogosultsága sikeresen módosítva: ${role}`,
            userId: userId
        });

    } catch (error) {
        console.error("Jogosultság módosítási hiba:", error);
        res.status(500).json({ 
            message: "Szerver hiba történt." 
        });
    }
});

// EGÉSZSÉGÜGYI VÉGÉPPONT
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ 
            status: "OK", 
            timestamp: new Date().toISOString(),
            service: "TrashBook API"
        });
    } catch (error) {
        res.status(500).json({ 
            status: "ERROR", 
            message: "Database connection failed" 
        });
    }
});

// 404 HANDLER
app.use((req, res) => {
    res.status(404).json({ 
        message: "A keresett útvonal nem található." 
    });
});

// GLOBÁLIS HIBÁK KEZELÉSE
app.use((err, req, res, next) => {
    console.error("Globális hiba:", err);
    res.status(500).json({ 
        message: "Váratlan szerver hiba történt." 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ A szerver elindult a http://localhost:${PORT} címen!`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});