import { useState} from 'react'

export default function Register(){
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")
    const [address, setAddress] = useState("")
    const [phone, setPhone] = useState("")

    const [loading, setLoading] = useState(false)

    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await fetch("http://localhost:5000/register",{
                method : "POST",
                headers: {"Content-type" : "application/json"},
                body: JSON.stringify({username, email, password, address, phone})
            })
            const data = await response.json()
            if(response.ok){
                setSuccess("Sikeres regisztráció!")
                setUsername("")
                setEmail("")
                setPass("")
                setAddress("")
                setPhone("")
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
                <form onSubmit={handleRegister} className="form-box">
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
                        <label>Jelszó</label>
                        <input type="password" value={password} onChange={(e) => setPass(e.target.value)} placeholder='Írja be a jelszavát!' required/>
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
                        {loading ? "Regisztráció..." : "Regisztráció"}
                    </button>
                    {error && <p className="msg error">{error}</p>}
                </form>
            </div>
        </>
    )    
}