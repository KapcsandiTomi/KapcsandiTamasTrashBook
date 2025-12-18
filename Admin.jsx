import { useState, useEffect } from "react";
import { 
    Card, 
    Button, 
    Table, 
    Form, 
    Container, 
    Row, 
    Col, 
    Alert, 
    Spinner,
    Badge,
    Modal
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Admin() {
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState({
        products: false,
        users: false,
        action: false
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState("user");

    const navigate = useNavigate();

    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        quantity: 0,
        price: 0
    });

    const token = localStorage.getItem("token");

    // Admin jogosultság ellenőrzése
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr || !token) {
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (!user || user.role !== "admin") {
                navigate("/");
                return;
            }
            
            // Ha admin, akkor betöltjük az adatokat
            fetchProducts();
            fetchUsers();
        } catch (err) {
            console.error("Hiba a felhasználó adatok olvasásakor:", err);
            navigate("/login");
        }
    }, [navigate]);

    // Általános fetch függvény
    const fetchWithAuth = async (url, options = {}) => {
        const defaultHeaders = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status} hiba`);
            }
            
            return data;
        } catch (error) {
            console.error("Fetch hiba:", error);
            throw error;
        }
    };

    // Termékek betöltése
    const fetchProducts = async () => {
        try {
            setLoading(prev => ({ ...prev, products: true }));
            setError("");
            
            const data = await fetchWithAuth("http://localhost:5000/admin/products");
            
            // A szerver { data: [], message: "", count: X } formátumban ad vissza
            if (data.data) {
                setProducts(data.data);
            } else if (Array.isArray(data)) {
                setProducts(data); // Ha közvetlen tömböt ad vissza
            } else {
                throw new Error("Érvénytelen válasz formátum");
            }
        } catch (err) {
            console.error("Termékek betöltési hiba:", err);
            setError(`Termékek betöltése sikertelen: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    };

    // Felhasználók betöltése
    const fetchUsers = async () => {
        try {
            setLoading(prev => ({ ...prev, users: true }));
            setError("");
            
            const data = await fetchWithAuth("http://localhost:5000/admin/users");
            
            // A szerver { data: [], message: "", count: X } formátumban ad vissza
            if (data.data) {
                setUsers(data.data);
            } else if (Array.isArray(data)) {
                setUsers(data); // Ha közvetlen tömböt ad vissza
            } else {
                throw new Error("Érvénytelen válasz formátum");
            }
        } catch (err) {
            console.error("Felhasználók betöltési hiba:", err);
            setError(`Felhasználók betöltése sikertelen: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    };

    // Új termék hozzáadása
    const addProduct = async (e) => {
        e.preventDefault();
        
        // Validáció
        if (!newProduct.name.trim()) {
            setError("A terméknév megadása kötelező!");
            return;
        }
        
        if (newProduct.price <= 0) {
            setError("Az ár nagyobb kell legyen, mint 0!");
            return;
        }

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError("");
            
            const data = await fetchWithAuth("http://localhost:5000/admin/products", {
                method: "POST",
                body: JSON.stringify({
                    name: newProduct.name,
                    description: newProduct.description || "",
                    quantity: parseInt(newProduct.quantity) || 0,
                    price: parseFloat(newProduct.price)
                })
            });

            setSuccess(data.message || "Termék sikeresen hozzáadva!");
            
            // Form reset
            setNewProduct({
                name: "",
                description: "",
                quantity: 0,
                price: 0
            });
            
            // Termékek újratöltése
            fetchProducts();
            
            // Üzenetek automatikus törlése
            setTimeout(() => {
                setSuccess("");
                setError("");
            }, 3000);
        } catch (err) {
            console.error("Termék hozzáadási hiba:", err);
            setError(`Termék hozzáadása sikertelen: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    // Termék törlése - HIÁNYZIK A SZERVERRŐL!
    const deleteProduct = async (id) => {
        if (!window.confirm("Biztosan törölni szeretnéd ezt a terméket?")) return;

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError("");
            
            // MEGJEGYZÉS: Ehhez létre kell hozni a /admin/products/:id DELETE végpontot!
            const data = await fetchWithAuth(`http://localhost:5000/admin/products/${id}`, {
                method: "DELETE"
            });

            setSuccess(data.message || "Termék sikeresen törölve!");
            setProducts(prev => prev.filter(p => p.id !== id));
            
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err) {
            console.error("Termék törlési hiba:", err);
            setError(`Termék törlése sikertelen: ${err.message || "A végpont nem létezik"}`);
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    // Felhasználó törlése
    const deleteUser = async (id) => {
        if (!window.confirm("Biztosan törölni szeretnéd ezt a felhasználót?")) return;

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError("");
            
            const data = await fetchWithAuth(`http://localhost:5000/admin/users/${id}`, {
                method: "DELETE"
            });

            setSuccess(data.message || "Felhasználó sikeresen törölve!");
            setUsers(prev => prev.filter(u => u.id !== id));
            
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err) {
            console.error("Felhasználó törlési hiba:", err);
            setError(`Felhasználó törlése sikertelen: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    // Jogosultság módosítása előkészítése
    const prepareRoleChange = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowUserModal(true);
    };

    // Jogosultság módosítása
    const changeUserRole = async () => {
        if (!selectedUser || !newRole) return;

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError("");
            
            const data = await fetchWithAuth(`http://localhost:5000/admin/users/${selectedUser.id}/role`, {
                method: "PUT",
                body: JSON.stringify({ role: newRole })
            });

            setSuccess(data.message || "Jogosultság sikeresen módosítva!");
            
            // Felhasználók listájának frissítése
            setUsers(prev => prev.map(u => 
                u.id === selectedUser.id ? { ...u, role: newRole } : u
            ));
            
            // Modal bezárása
            setShowUserModal(false);
            setSelectedUser(null);
            
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err) {
            console.error("Jogosultság módosítási hiba:", err);
            setError(`Jogosultság módosítása sikertelen: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    // Kijelentkezés
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // Navigáció a főoldalra
    const goToHome = () => {
        navigate("/");
    };

    return (
        <Container className="py-4">
            {/* Header */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h1>Tomy's Webshop Admin Panel</h1>
                </Col>
                <Col xs="auto" className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={goToHome}>
                        Vissza a webáruházba
                    </Button>
                    <Button variant="outline-danger" onClick={handleLogout}>
                        Kijelentkezés
                    </Button>
                </Col>
            </Row>

            {/* Üzenetek */}
            {error && (
                <Alert variant="danger" onClose={() => setError("")} dismissible className="mb-3">
                    {error}
                </Alert>
            )}
            {success && (
                <Alert variant="success" onClose={() => setSuccess("")} dismissible className="mb-3">
                    {success}
                </Alert>
            )}

            {/* Új termék hozzáadása */}
            <Card className="mb-4">
                <Card.Header>
                    <h3>Új termék hozzáadása</h3>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={addProduct}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Név *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={newProduct.name} 
                                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                        placeholder="Termék neve"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ár (Ft) *</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01"
                                        min="0.01"
                                        value={newProduct.price} 
                                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                                        placeholder="0.00"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Leírás</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={2}
                                        value={newProduct.description} 
                                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                                        placeholder="Termék leírása (opcionális)"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mennyiség (db)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        min="0"
                                        value={newProduct.quantity} 
                                        onChange={e => setNewProduct({...newProduct, quantity: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={loading.action || !newProduct.name.trim() || newProduct.price <= 0}
                        >
                            {loading.action ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Feldolgozás...
                                </>
                            ) : "Termék hozzáadása"}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {/* Termékek kezelése */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h3>Termékek kezelése ({products.length} termék)</h3>
                    <Button variant="outline-secondary" size="sm" onClick={fetchProducts} disabled={loading.products}>
                        {loading.products ? "Frissítés..." : "Frissítés"}
                    </Button>
                </Card.Header>
                <Card.Body>
                    {loading.products ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Termékek betöltése...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <Alert variant="info">Nincsenek termékek. Adj hozzá egy újat fent!</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Név</th>
                                        <th>Leírás</th>
                                        <th>Ár (Ft)</th>
                                        <th>Mennyiség</th>
                                        <th>Létrehozva</th>
                                        <th>Műveletek</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product.id}>
                                            <td>{product.id}</td>
                                            <td><strong>{product.name}</strong></td>
                                            <td>{product.description || "-"}</td>
                                            <td>{parseFloat(product.price).toFixed(2)} Ft</td>
                                            <td>
                                                <Badge bg={product.quantity > 0 ? "success" : "danger"}>
                                                    {product.quantity} db
                                                </Badge>
                                            </td>
                                            <td>
                                                {product.created_at ? 
                                                    new Date(product.created_at).toLocaleDateString('hu-HU') : 
                                                    "-"}
                                            </td>
                                            <td>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => deleteProduct(product.id)}
                                                    disabled={loading.action}
                                                >
                                                    Törlés
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Felhasználók kezelése */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h3>Felhasználók kezelése ({users.length} felhasználó)</h3>
                    <Button variant="outline-secondary" size="sm" onClick={fetchUsers} disabled={loading.users}>
                        {loading.users ? "Frissítés..." : "Frissítés"}
                    </Button>
                </Card.Header>
                <Card.Body>
                    {loading.users ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Felhasználók betöltése...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <Alert variant="info">Nincsenek felhasználók</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Address</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Regisztrálva</th>
                                        <th>Műveletek</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>{user.address || "-"}</td>
                                            <td>{user.phone || "-"}</td>
                                            <td>
                                                <Badge bg={user.role === 'admin' ? "danger" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td>
                                                {user.created_at ? 
                                                    new Date(user.created_at).toLocaleDateString('hu-HU') : 
                                                    "-"}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button 
                                                        variant="outline-warning" 
                                                        size="sm"
                                                        onClick={() => prepareRoleChange(user)}
                                                        disabled={loading.action}
                                                    >
                                                        Jogosultság
                                                    </Button>
                                                    {user.role !== "admin" && (
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm"
                                                            onClick={() => deleteUser(user.id)}
                                                            disabled={loading.action}
                                                        >
                                                            Törlés
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Jogosultság módosító modal */}
            <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Jogosultság módosítása</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <>
                            <p>
                                Felhasználó: <strong>{selectedUser.username}</strong> ({selectedUser.email})
                            </p>
                            <Form.Group>
                                <Form.Label>Új jogosultság</Form.Label>
                                <Form.Select 
                                    value={newRole} 
                                    onChange={(e) => setNewRole(e.target.value)}
                                >
                                    <option value="user">Felhasználó (user)</option>
                                    <option value="admin">Adminisztrátor (admin)</option>
                                </Form.Select>
                            </Form.Group>
                            <Alert variant="warning" className="mt-3">
                                <strong>Figyelem!</strong> Admin jogosultság adásával a felhasználó teljes hozzáférést kap az admin panelhez.
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                        Mégse
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={changeUserRole}
                        disabled={loading.action || !selectedUser || newRole === selectedUser.role}
                    >
                        {loading.action ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Módosítás...
                            </>
                        ) : "Módosítás"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Fejlesztés alatt álló részek */}
            <Card className="mb-4">
                <Card.Header>
                    <h3>Rendelések kezelése</h3>
                </Card.Header>
                <Card.Body>
                    <Alert variant="info">
                        <strong>Fejlesztés alatt</strong> - A rendelések kezelése hamarosan elérhető lesz.
                    </Alert>
                </Card.Body>
            </Card>
        </Container>
    );
}