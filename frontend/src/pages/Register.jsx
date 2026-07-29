import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { registerUser } from '../services/authService';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'buyer',
        phone: '',
        store_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await registerUser(formData);
            login(data.data.user, data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h3 className="card-title text-center mb-4">Create an Account</h3>
                            
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email address</label>
                                    <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Phone Number</label>
                                    <input type="text" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required minLength="6" />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">I want to register as a:</label>
                                    <select name="role" className="form-select" value={formData.role} onChange={handleChange}>
                                        <option value="buyer">Buyer (I want to buy art supplies)</option>
                                        <option value="seller">Seller (I want to sell art supplies)</option>
                                    </select>
                                </div>

                                {formData.role === 'seller' && (
                                    <div className="mb-4">
                                        <label className="form-label">Store Name <span className="text-danger">*</span></label>
                                        <input type="text" name="store_name" className="form-control" value={formData.store_name} onChange={handleChange} required={formData.role === 'seller'} />
                                    </div>
                                )}

                                <button type="submit" className="btn btn-dark w-100 mb-3" disabled={loading}>
                                    {loading ? 'Registering...' : 'Register'}
                                </button>
                                
                                <div className="text-center">
                                    Already have an account? <Link to="/login">Login here</Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
