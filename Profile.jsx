import { useState, useEffect } from 'react'

export default function Profile(){
    const [users, setUsers] = useState([])

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [phone, setPhone] = useState("")

    const [loading, setLoading] = useState(false)

    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(() =>{
        const loadProfile = async () => {
            try {
                const token = localStorage.getItem("token")
                const response = await fetch("http://localhost:5000/profile",{
                    headers : {"Authorization" : `Bearer ${token}`}
                })
                const data = await response.json()

                if(response.ok){
                    setSuccess("Sikeres lekérdezés!")

                    setTimeout(() => {
                       setSuccess("") 
                    }, 3000);

                    setUsername(data.data.username)
                    setEmail(data.data.email)
                    setAddress(data.data.address)
                    setPhone(data.data.phone)
                } else {
                    setError(data.messsage || "Hiba történt")
                }
            } catch (error) {
                console.log(error)
                setError(error.messsage)
            }
        }
        loadProfile()
    },[])

    const profileUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/profile",{
                method : "PUT",
                headers: {"Authorization" : `Bearer ${token}`,"Content-type" : "application/json"},
                body: JSON.stringify({username, email, address, phone})
            })
            const data = await response.json()
            if(response.ok){
                setSuccess("Sikeres profilmódosítás!")
            } else {
                setError(data.message || "Hiba történt!")
            }
        } catch (error) {
            console.log(error)
            setError(error.message)
        } finally{
            setLoading(false)
        }
    }

    return(
        <>
            <div className="form-container">
                <form onSubmit={profileUpdate} className="form-box">
                    {success && <p className="msg success">{success}</p>}
    
                    <div className="form-group">
                        <label>Felhasználónév</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Írja be a felhasználónevét!' required/>
                    </div>
    
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Írja be az email-címét!' required/>
                    </div>
    
                    <div className="form-group">
                        <label>Lakcím</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Írja be a lakcímét!' required/>
                    </div>
    
                    <div className="form-group">
                        <label>Telefonszám</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='Írja be a telefonszámát!' required/>
                    </div>
    
                    <button type='submit' disabled={loading} className="btn-submit">
                        {loading ? "Profil módosítás folyamatban..." : "Profilmódositás"}
                    </button>
                    {error && <p className="msg error">{error}</p>}
                </form>
            </div>
        </>
    )
}