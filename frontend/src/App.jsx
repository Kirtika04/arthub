import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import ProductDetails from './pages/ProductDetails';
import SellerDashboard from './pages/dashboards/SellerDashboard';
import AddProduct from './pages/dashboards/AddProduct'; 
import AdminDashboard from './pages/dashboards/AdminDashboard';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import Footer from './components/common/Footer';
import Checkout from './pages/Checkout';
import Account from './pages/Account';

function App() {
    return (
        <Router>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    
                    {/* Seller Routes */}
                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                    <Route path="/seller/add-product" element={<AddProduct />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/orders" element={<MyOrders />} />
		    <Route path="/order/:id" element={<OrderDetails />} />
		    <Route path="/wishlist" element={<Wishlist />} />
                    
                </Routes>
            </main>
            <Footer />
        </Router>
    );
}

export default App;
