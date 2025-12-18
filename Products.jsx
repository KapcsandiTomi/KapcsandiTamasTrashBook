import { useState, useEffect} from 'react'
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';


export default function Products({isLoggedIn}){
    const [products, setProducts] = useState([])

    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const fetchProducts = async () => {
        try {
            const response = await fetch("http://localhost:5000/products")
            const data = await response.json()
            if(response.ok){
                setSuccess("Sikeres lekérdezés!")
                setTimeout(() => {
                    setSuccess("")
                }, 4000);
                setProducts(data.data)
            } else {
                setError(data.message || "Hiba történt")
            }

        } catch (error) {
            console.log(error)
            setError(error.message)
        }
    }
    const addToCart = async (productId) => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/orders",{
                method : "POST",
                headers: {"Authorization" : `Bearer ${token}`,"Content-type" : "application/json"},
                body: JSON.stringify({ productId: productId , quantity: 1 })
            })
            const data = await response.json()

            if(response.ok){
                setSuccess("Sikeres rendelés")
                setTimeout(() => {
                    setSuccess("")
                }, 3000);
            } else {
                setError(data.message || "Hiba történt")
            }
        } catch (error) {
            console.log(error)
            setError(error.message)
        }
    }


    useEffect(() => {
        fetchProducts()
    },[])

    if(products.length === 0){
        return <h1>Nincsenek termékek feltöltve!</h1>
    }

    if(!isLoggedIn){
        return (
            <div className="products-container">
            {success && <p className="msg success">{success}</p>}
            {error && <p className="msg error">{error}</p>}
            {products.map((termek) => (
                <Card style={{ width: '18rem' }} key={termek.id} className="card-custom">
                <Card.Body>
                  <Card.Title>A termék neve: {termek.name}</Card.Title>
                  <Card.Text>
                    A termék leírása: {termek.description} <br />
                    A termék ára: {termek.price} <br />
                    A termék mennyisége: {termek.quantity}
                  </Card.Text>
                  <Button variant="primary" disabled>Kosárba tevéshez jelnetkezzen be!</Button>
                </Card.Body>
              </Card>
            ))}
            </div>
          );
    }

    return (
        <div className="products-container">
        {success && <p className="msg success">{success}</p>}
        {error && <p className="msg error">{error}</p>}
        {products.map((termek) => (
            <Card style={{ width: '18rem' }} key={termek.id} className="card-custom">
            <Card.Body>
              <Card.Title>A termék neve: {termek.name}</Card.Title>
              <Card.Text>
                A termék leírása: {termek.description} <br />
                A termék ára: {termek.price} <br />
                A termék mennyisége: {termek.quantity}
              </Card.Text>
              <Button variant="primary" disabled = {termek.quantity === 0} onClick={() => addToCart(termek.id)}>Kosárba teszem!</Button>
            </Card.Body>
          </Card>
        ))}
        </div>
      );
}