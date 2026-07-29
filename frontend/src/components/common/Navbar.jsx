import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const navigate = useNavigate();
    const [logoutMessage, setLogoutMessage] = useState('');

    useEffect(() => {
        if (!logoutMessage) return undefined;
        const timer = window.setTimeout(() => setLogoutMessage(''), 3500);
        return () => window.clearTimeout(timer);
    }, [logoutMessage]);

    const handleLogout = () => {
        logout();
        setLogoutMessage('You have logged out successfully.');
        navigate('/');
    };

    return (
        <>
        {user?.role !== 'seller' && <div className="announcement-bar">Free shipping on orders over ₹1,499 <span>•</span> Crafted for curious minds</div>}
        <nav className="navbar navbar-expand-lg arthub-nav">
            <div className="container-fluid site-container">
                <Link className="navbar-brand brand" to={user?.role === 'seller' ? '/seller/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/'}><span className="brand-mark">A</span> ArtHub</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    {user?.role === 'seller' ? <ul className="navbar-nav me-auto">
                        <li className="nav-item"><NavLink className="nav-link" to="/seller/dashboard">Seller Dashboard</NavLink></li>
                    </ul> : <ul className="navbar-nav me-auto">
                        <li className="nav-item"><NavLink className="nav-link" to="/">Shop</NavLink></li>
                        <li className="nav-item"><a className="nav-link" href="/#collections">Collections</a></li>
                        <li className="nav-item"><a className="nav-link" href="/#journal">Journal</a></li>
                    </ul>}
                    <ul className="navbar-nav">
                        {(!user || user.role === 'buyer') && <li className="nav-item">
                            <Link className="nav-link cart-link" to="/cart"><span className="cart-icon">⌑</span> Cart <b>{cart.length}</b></Link>
                        </li>}
                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <li className="nav-item">
                                        <Link className="nav-link text-danger" to="/admin/dashboard">Admin Dashboard</Link>
                                    </li>
                                )}
                                {user.role === 'buyer' && <li className="nav-item">
                                    <Link className="nav-link" to="/orders">My Orders</Link>
                                </li>}
                                <li className="nav-item"><Link className="nav-link" to="/account">Account</Link></li>
                                {user.role === 'buyer' && <li className="nav-item">
                                    <Link className="nav-link" to="/wishlist">Wishlist</Link>
                                </li>}
                                <li className="nav-item">
                                    <span className="nav-link text-white">Welcome, {user.name}</span>
                                </li>
                                <li className="nav-item">
                                    <button className="btn btn-link nav-link" onClick={handleLogout}>Logout</button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
        {logoutMessage && <div className="alert alert-success text-center rounded-0 mb-0" role="status">{logoutMessage}</div>}
        </>
    );
};

export default Navbar;
