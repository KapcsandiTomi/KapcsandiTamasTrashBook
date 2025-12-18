import { useState, useEffect} from 'react'
import {Card, Button} from 'react-bootstrap';


export default function Orders(){
    const [orders, setOrders] = useState([])

    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/orders",{
                headers: {"Authorization" : `Bearer ${token}`}
            })
            const data = await response.json()
            if(response.ok){
                setOrders(data)
            } else {
                setError(data.message || "Hiba történt")
            }

        } catch (error) {
            console.log(error)
            setError(error.message)
        }
    }

    const deleteFromOrders = async (orderId) => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/orders", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ productId: orderId }) 
            })
            const data = await response.json()
    
            if(response.ok){
                alert("Sikeres törlés")
                setOrders(prev => prev.filter(order => order.id !== orderId)) 
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.message || "Hiba történt")
            }
        } catch (error) {
            console.log(error)
            setError(error.message)
        }
    }
    

    useEffect(() => {
        fetchOrders()
    },[])

    if(orders.length === 0){
        return <h1>Nincsenek rendelései!</h1>
    }

    return (
        <div className="products-container">
        {success && <p className="msg success">{success}</p>}
        {error && <p className="msg error">{error}</p>}
        {orders.map((order) => (
            <Card style={{ width: '18rem' }} key={order.id} className="card-custom">
            <Card.Body>
              <Card.Title>A termék neve: {order.name}</Card.Title>
              <Card.Text>
                A termék leírása: {order.description} <br />
                A termék ára: {order.price} <br />
                A termék mennyisége: {order.quantity} <br />
                összesen: {order.price * order.quantity}
              </Card.Text>
              <Button variant='danger' onClick={() => deleteFromOrders(order.id)}>Törlés</Button>
            </Card.Body>
          </Card>
        ))}
        </div>
      );
}